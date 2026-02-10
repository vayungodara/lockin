/**
 * Nudge system for accountability
 */

/**
 * Send a nudge to a user
 */
export async function sendNudge(supabase, toUserId) {
  try {
    const { data: authData } = await supabase.auth.getUser();
    const fromUserId = authData?.user?.id;
    if (!fromUserId) return { success: false, error: 'Not authenticated' };

    // Check rate limit (1 nudge per person per hour)
    const { data: canNudge } = await supabase.rpc('can_nudge_user', {
      target_user_id: toUserId
    });

    if (!canNudge) {
      return { success: false, error: 'You can only nudge this person once per hour' };
    }

    const { error } = await supabase
      .from('nudges')
      .insert({ from_user_id: fromUserId, to_user_id: toUserId });

    if (error) throw error;

    // Get sender name for the notification
    const { data: fromProfile } = await supabase
      .from('user_profiles')
      .select('full_name')
      .eq('id', fromUserId)
      .single();

    const { createNotification, NOTIFICATION_TYPES } = await import('@/lib/notifications');
    await createNotification(
      supabase,
      toUserId,
      NOTIFICATION_TYPES.NUDGE_RECEIVED,
      'Someone nudged you!',
      `${fromProfile?.full_name || 'Someone'} nudged you to lock in!`,
      { fromUserId }
    );

    return { success: true };
  } catch (err) {
    console.error('Error sending nudge:', err);
    return { success: false, error: err.message || 'Failed to send nudge' };
  }
}
