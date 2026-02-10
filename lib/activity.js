/**
 * Activity Logging Helper
 * Logs user actions for the activity feed
 */

/**
 * Log an activity to the activity_log table
 * @param {object} supabase - Supabase client
 * @param {string} action - Action type (task_created, task_completed, etc.)
 * @param {string|null} groupId - Group ID (null for personal pacts)
 * @param {object} metadata - Additional data about the action
 * @returns {Promise<{success: boolean, error?: any}>}
 */
import { getBatchReactions } from '@/lib/reactions';

export async function logActivity(supabase, action, groupId, metadata = {}) {
  try {
    const { data, error: authError } = await supabase.auth.getUser();
    if (authError) throw authError;
    const user = data?.user;
    
    if (!user) {
      return { success: false, error: 'Not authenticated' };
    }

    const { error } = await supabase
      .from('activity_log')
      .insert({
        user_id: user.id,
        group_id: groupId || null,
        action,
        metadata
      });

    if (error) {
      console.error('Error logging activity:', error.message || error.code || JSON.stringify(error));
      return { success: false, error };
    }

    return { success: true };
  } catch (err) {
    console.error('Error logging activity:', err.message || err);
    return { success: false, error: err };
  }
}

/**
 * Get activity feed for a group
 * @param {object} supabase - Supabase client
 * @param {string} groupId - Group ID
 * @param {number} limit - Number of items to fetch
 * @param {number} offset - Offset for pagination
 * @returns {Promise<{data: array, error?: any}>}
 */
export async function getGroupActivity(supabase, groupId, limit = 15, offset = 0) {
  try {
    const { data, error } = await supabase
      .from('activity_log')
      .select('*')
      .eq('group_id', groupId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    // Fetch user profiles for the activities
    const userIds = [...new Set((data || []).map(a => a.user_id))];
    
    let profilesMap = {};
    if (userIds.length > 0) {
      const { data: profiles, error: profilesError } = await supabase
        .from('user_profiles')
        .select('id, full_name, avatar_url')
        .in('id', userIds);

      if (profilesError) throw profilesError;
      if (profiles) {
        profiles.forEach(p => {
          profilesMap[p.id] = p;
        });
      }
    }

    // Attach user info to activities
    const activitiesWithUsers = (data || []).map(activity => ({
      ...activity,
      user: profilesMap[activity.user_id] || { full_name: 'Unknown', avatar_url: null }
    }));

    const activityIds = activitiesWithUsers.map(a => a.id);
    const { reactionsMap } = await getBatchReactions(supabase, activityIds);

    const activitiesWithReactions = activitiesWithUsers.map(activity => ({
      ...activity,
      reactions: reactionsMap[activity.id] || { counts: {}, userReactions: [], total: 0 }
    }));

    return { data: activitiesWithReactions, error: null };
  } catch (err) {
    console.error('Error fetching activity:', err);
    return { data: [], error: err };
  }
}

/**
 * Get aggregated activity across all user's groups
 * @param {object} supabase - Supabase client  
 * @param {number} limit - Number of items to fetch
 * @param {number} offset - Offset for pagination
 * @returns {Promise<{data: array, error?: any}>}
 */
export async function getAllActivity(supabase, limit = 20, offset = 0) {
  try {
    const { data, error } = await supabase
      .from('activity_log')
      .select('*')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    // Fetch user profiles
    const userIds = [...new Set((data || []).map(a => a.user_id))];
    
    let profilesMap = {};
    if (userIds.length > 0) {
      const { data: profiles, error: profilesError } = await supabase
        .from('user_profiles')
        .select('id, full_name, avatar_url')
        .in('id', userIds);

      if (profilesError) throw profilesError;
      if (profiles) {
        profiles.forEach(p => {
          profilesMap[p.id] = p;
        });
      }
    }

    const activitiesWithUsers = (data || []).map(activity => ({
      ...activity,
      user: profilesMap[activity.user_id] || { full_name: 'Unknown', avatar_url: null }
    }));

    const activityIds = activitiesWithUsers.map(a => a.id);
    const { reactionsMap } = await getBatchReactions(supabase, activityIds);

    const activitiesWithReactions = activitiesWithUsers.map(activity => ({
      ...activity,
      reactions: reactionsMap[activity.id] || { counts: {}, userReactions: [], total: 0 }
    }));

    return { data: activitiesWithReactions, error: null };
  } catch (err) {
    console.error('Error fetching activity:', err);
    return { data: [], error: err };
  }
}

/**
 * Get group statistics
 * @param {object} supabase - Supabase client
 * @param {string} groupId - Group ID
 * @returns {Promise<{stats: object, leaderboard: array, error?: any}>}
 */
export async function getGroupStats(supabase, groupId) {
  try {
    // Get all members
    const { data: members, error: membersError } = await supabase
      .from('group_members')
      .select('user_id')
      .eq('group_id', groupId);

    if (membersError) throw membersError;

    const memberIds = members?.map(m => m.user_id) || [];

    // Get task completion stats for the last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const { data: recentActivity, error: activityError } = await supabase
      .from('activity_log')
      .select('*')
      .eq('group_id', groupId)
      .eq('action', 'task_completed')
      .gte('created_at', sevenDaysAgo.toISOString());

    if (activityError) throw activityError;

    // Get all tasks for the group
    const { data: allTasks, error: tasksError } = await supabase
      .from('tasks')
      .select('id, status, owner_id')
      .eq('group_id', groupId);

    if (tasksError) throw tasksError;

    const totalTasks = allTasks?.length || 0;
    const completedTasks = allTasks?.filter(t => t.status === 'done').length || 0;
    const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    // Build leaderboard
    const completionsByUser = {};
    (recentActivity || []).forEach(a => {
      completionsByUser[a.user_id] = (completionsByUser[a.user_id] || 0) + 1;
    });

    // Get user profiles for leaderboard
    let profilesMap = {};
    if (memberIds.length > 0) {
      const { data: profiles, error: profilesError } = await supabase
        .from('user_profiles')
        .select('id, full_name, avatar_url')
        .in('id', memberIds);

      if (profilesError) throw profilesError;
      if (profiles) {
        profiles.forEach(p => {
          profilesMap[p.id] = p;
        });
      }
    }

    const leaderboard = memberIds
      .map(userId => ({
        user_id: userId,
        full_name: profilesMap[userId]?.full_name || 'Unknown',
        avatar_url: profilesMap[userId]?.avatar_url,
        completions: completionsByUser[userId] || 0
      }))
      .sort((a, b) => b.completions - a.completions);

    return {
      stats: {
        totalTasks,
        completedTasks,
        completionRate,
        activeTasks: totalTasks - completedTasks
      },
      leaderboard,
      error: null
    };
  } catch (err) {
    console.error('Error fetching stats:', err);
    return { stats: {}, leaderboard: [], error: err };
  }
}

/**
 * Format relative time (e.g., "2 hours ago")
 * @param {string} timestamp - ISO timestamp
 * @returns {string} Formatted relative time
 */
export function formatRelativeTime(timestamp) {
  const now = new Date();
  const then = new Date(timestamp);
  const diffMs = now - then;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  
  return then.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

/**
 * Get action display info (label, icon, color)
 * @param {string} action - Action type
 * @returns {object} Display info
 */
export function getActionInfo(action) {
  const actions = {
    task_created: { 
      verb: 'created task', 
      color: 'purple',
      icon: 'plus'
    },
    task_completed: { 
      verb: 'completed', 
      color: 'green',
      icon: 'check'
    },
    task_started: { 
      verb: 'started working on', 
      color: 'yellow',
      icon: 'play'
    },
    task_claimed: { 
      verb: 'claimed', 
      color: 'blue',
      icon: 'hand'
    },
    task_deleted: { 
      verb: 'deleted task', 
      color: 'red',
      icon: 'trash'
    },
    pact_created: { 
      verb: 'made a pact', 
      color: 'purple',
      icon: 'plus'
    },
    pact_completed: { 
      verb: 'kept their pact', 
      color: 'green',
      icon: 'check'
    },
    pact_missed: { 
      verb: 'missed pact', 
      color: 'red',
      icon: 'x'
    },
    member_joined: { 
      verb: 'joined the group', 
      color: 'blue',
      icon: 'user-plus'
    },
    group_created: { 
      verb: 'created the group', 
      color: 'purple',
      icon: 'users'
    },
    focus_session_started: {
      verb: 'locked in',
      color: 'blue',
      icon: 'play'
    },
    focus_session_completed: {
      verb: 'finished a focus session',
      color: 'green',
      icon: 'check'
    },
    streak_broken: {
      verb: 'lost their streak',
      color: 'red',
      icon: 'x'
    },
    streak_milestone: {
      verb: 'hit a streak milestone',
      color: 'yellow',
      icon: 'fire'
    },
    streak_freeze_used: {
      verb: 'used a streak freeze',
      color: 'blue',
      icon: 'snowflake'
    },
    nudge_sent: {
      verb: 'nudged someone to lock in',
      color: 'purple',
      icon: 'hand'
    },
    partner_request: {
      verb: 'sent a partner request',
      color: 'blue',
      icon: 'user-plus'
    },
    challenge_created: {
      verb: 'created a challenge',
      color: 'yellow',
      icon: 'trophy'
    },
    challenge_won: {
      verb: 'won a challenge',
      color: 'green',
      icon: 'trophy'
    }
  };

  return actions[action] || { verb: action, color: 'gray', icon: 'circle' };
}
