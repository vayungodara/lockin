/**
 * Comment management for activity feed
 */

/**
 * Get comments for an activity, with user profiles
 */
export async function getComments(supabase, activityId) {
  try {
    const { data, error } = await supabase
      .from('activity_comments')
      .select('*')
      .eq('activity_id', activityId)
      .order('created_at', { ascending: true });

    if (error) throw error;

    const userIds = [...new Set((data || []).map(c => c.user_id))];
    let profilesMap = {};

    if (userIds.length > 0) {
      const { data: profiles } = await supabase
        .from('user_profiles')
        .select('id, full_name, avatar_url')
        .in('id', userIds);

      if (profiles) {
        profiles.forEach(p => { profilesMap[p.id] = p; });
      }
    }

    const commentsWithUsers = (data || []).map(comment => ({
      ...comment,
      user: profilesMap[comment.user_id] || { full_name: 'Unknown', avatar_url: null }
    }));

    return { data: commentsWithUsers, error: null };
  } catch (err) {
    console.error('Error fetching comments:', err);
    return { data: [], error: err };
  }
}

/**
 * Get comment counts for multiple activities (batch)
 */
export async function getBatchCommentCounts(supabase, activityIds) {
  try {
    if (!activityIds.length) return {};

    const { data, error } = await supabase
      .from('activity_comments')
      .select('activity_id')
      .in('activity_id', activityIds);

    if (error) throw error;

    const counts = {};
    (data || []).forEach(c => {
      counts[c.activity_id] = (counts[c.activity_id] || 0) + 1;
    });

    return counts;
  } catch (err) {
    console.error('Error fetching comment counts:', err);
    return {};
  }
}

/**
 * Post a comment on an activity
 */
export async function postComment(supabase, activityId, commentText) {
  try {
    const { data: authData } = await supabase.auth.getUser();
    const userId = authData?.user?.id;
    if (!userId) return { success: false, error: 'Not authenticated' };

    const { data, error } = await supabase
      .from('activity_comments')
      .insert({
        activity_id: activityId,
        user_id: userId,
        comment_text: commentText
      })
      .select()
      .single();

    if (error) throw error;

    // Notify the activity author (if not self)
    const { data: activity } = await supabase
      .from('activity_log')
      .select('user_id')
      .eq('id', activityId)
      .single();

    if (activity && activity.user_id !== userId) {
      const { createNotification, NOTIFICATION_TYPES } = await import('@/lib/notifications');
      await createNotification(
        supabase,
        activity.user_id,
        NOTIFICATION_TYPES.COMMENT_ON_ACTIVITY,
        'New Comment',
        commentText.length > 60 ? commentText.substring(0, 60) + '...' : commentText,
        { activityId }
      );
    }

    return { success: true, data };
  } catch (err) {
    console.error('Error posting comment:', err);
    return { success: false, error: err };
  }
}

/**
 * Delete own comment
 */
export async function deleteComment(supabase, commentId) {
  try {
    const { error } = await supabase
      .from('activity_comments')
      .delete()
      .eq('id', commentId);

    if (error) throw error;
    return { success: true };
  } catch (err) {
    console.error('Error deleting comment:', err);
    return { success: false, error: err };
  }
}
