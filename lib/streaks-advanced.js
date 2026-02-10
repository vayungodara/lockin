/**
 * Advanced streak management — freezes, milestones, risk detection
 */

const STREAK_MILESTONES = [7, 14, 30, 60, 90, 180, 365];

/**
 * Check if the user's streak is at risk (no activity today, past 6pm)
 */
export async function checkStreakAtRisk(supabase, userId) {
  try {
    const now = new Date();
    if (now.getHours() < 18) return { atRisk: false, streak: 0 };

    const { data: profile } = await supabase
      .from('profiles')
      .select('current_streak, last_activity_date')
      .eq('id', userId)
      .single();

    if (!profile || !profile.current_streak) return { atRisk: false, streak: 0 };

    const today = new Date().toISOString().split('T')[0];
    const atRisk = profile.last_activity_date !== today;

    return { atRisk, streak: profile.current_streak };
  } catch (err) {
    console.error('Error checking streak risk:', err);
    return { atRisk: false, streak: 0 };
  }
}

/**
 * Use a streak freeze (1 free per week)
 */
export async function useStreakFreeze(supabase) {
  try {
    const { data: authData } = await supabase.auth.getUser();
    const userId = authData?.user?.id;
    if (!userId) return { success: false, error: 'Not authenticated' };

    const { data: profile } = await supabase
      .from('profiles')
      .select('streak_freeze_used_this_week, streak_freeze_last_reset, current_streak')
      .eq('id', userId)
      .single();

    if (!profile) return { success: false, error: 'Profile not found' };

    // Reset freeze if it's been 7+ days
    const now = new Date();
    const lastReset = new Date(profile.streak_freeze_last_reset);
    const daysSinceReset = Math.floor((now - lastReset) / (1000 * 60 * 60 * 24));
    let freezeUsed = profile.streak_freeze_used_this_week;

    if (daysSinceReset >= 7) {
      freezeUsed = false;
    }

    if (freezeUsed) {
      return { success: false, error: 'Streak freeze already used this week' };
    }

    if (!profile.current_streak || profile.current_streak === 0) {
      return { success: false, error: 'No active streak to freeze' };
    }

    const { error } = await supabase
      .from('profiles')
      .update({
        streak_freeze_used_this_week: true,
        streak_freeze_last_reset: now.toISOString(),
        last_activity_date: now.toISOString().split('T')[0]
      })
      .eq('id', userId);

    if (error) throw error;
    return { success: true };
  } catch (err) {
    console.error('Error using streak freeze:', err);
    return { success: false, error: err.message };
  }
}

/**
 * Update profile streak data after pact completion
 */
export async function updateStreakOnCompletion(supabase, userId, currentStreak) {
  try {
    const today = new Date().toISOString().split('T')[0];

    const { data: profile } = await supabase
      .from('profiles')
      .select('longest_streak')
      .eq('id', userId)
      .single();

    const longestStreak = Math.max(profile?.longest_streak || 0, currentStreak);

    const { error } = await supabase
      .from('profiles')
      .update({
        current_streak: currentStreak,
        longest_streak: longestStreak,
        last_activity_date: today
      })
      .eq('id', userId);

    if (error) throw error;

    // Check milestone notifications
    await checkStreakMilestone(supabase, userId, currentStreak);

    return { success: true };
  } catch (err) {
    console.error('Error updating streak:', err);
    return { success: false, error: err };
  }
}

/**
 * Send milestone notification if streak hits a milestone number
 */
async function checkStreakMilestone(supabase, userId, streak) {
  if (!STREAK_MILESTONES.includes(streak)) return;

  try {
    const { createNotification, NOTIFICATION_TYPES } = await import('@/lib/notifications');
    await createNotification(
      supabase,
      userId,
      NOTIFICATION_TYPES.STREAK_MILESTONE,
      `${streak}-Day Streak!`,
      `You've maintained a ${streak}-day streak. Keep going!`,
      { streak }
    );
  } catch (err) {
    console.error('Error sending milestone notification:', err);
  }
}

/**
 * Check if streak freeze is available
 */
export async function getStreakFreezeStatus(supabase, userId) {
  try {
    const { data: profile } = await supabase
      .from('profiles')
      .select('streak_freeze_used_this_week, streak_freeze_last_reset')
      .eq('id', userId)
      .single();

    if (!profile) return { available: false };

    const now = new Date();
    const lastReset = new Date(profile.streak_freeze_last_reset);
    const daysSinceReset = Math.floor((now - lastReset) / (1000 * 60 * 60 * 24));

    const available = daysSinceReset >= 7 || !profile.streak_freeze_used_this_week;
    return { available };
  } catch (err) {
    console.error('Error getting freeze status:', err);
    return { available: false };
  }
}
