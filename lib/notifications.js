/**
 * Notification helper functions for LockIn app
 */

/**
 * Get notifications for the current user
 * @param {Object} supabase - Supabase client
 * @param {number} limit - Maximum number of notifications to fetch
 * @returns {Promise<{data: Array, error: Error|null}>}
 */
export async function getNotifications(supabase, limit = 20) {
  try {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return { data: data || [], error: null };
  } catch (err) {
    console.error('Error fetching notifications:', err);
    return { data: [], error: err };
  }
}

/**
 * Get unread notification count for the current user
 * @param {Object} supabase - Supabase client
 * @returns {Promise<{count: number, error: Error|null}>}
 */
export async function getUnreadCount(supabase) {
  try {
    const { count, error } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('is_read', false);

    if (error) throw error;
    return { count: count || 0, error: null };
  } catch (err) {
    console.error('Error fetching unread count:', err);
    return { count: 0, error: err };
  }
}

/**
 * Mark a notification as read
 * @param {Object} supabase - Supabase client
 * @param {string} notificationId - Notification ID
 * @returns {Promise<{success: boolean, error: Error|null}>}
 */
export async function markAsRead(supabase, notificationId) {
  try {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', notificationId);

    if (error) throw error;
    return { success: true, error: null };
  } catch (err) {
    console.error('Error marking notification as read:', err);
    return { success: false, error: err };
  }
}

/**
 * Mark all notifications as read for the current user
 * @param {Object} supabase - Supabase client
 * @returns {Promise<{success: boolean, error: Error|null}>}
 */
export async function markAllAsRead(supabase) {
  try {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('is_read', false);

    if (error) throw error;
    return { success: true, error: null };
  } catch (err) {
    console.error('Error marking all notifications as read:', err);
    return { success: false, error: err };
  }
}

/**
 * Create a notification
 * @param {Object} supabase - Supabase client
 * @param {string} userId - User ID to notify
 * @param {string} type - Notification type
 * @param {string} title - Notification title
 * @param {string} message - Notification message
 * @param {Object} metadata - Additional metadata
 * @returns {Promise<{data: Object|null, error: Error|null}>}
 */
export async function createNotification(supabase, userId, type, title, message, metadata = {}) {
  try {
    const { data, error } = await supabase
      .from('notifications')
      .insert({
        user_id: userId,
        type,
        title,
        message,
        metadata
      })
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (err) {
    console.error('Error creating notification:', err);
    return { data: null, error: err };
  }
}

/**
 * Notification types
 */
export const NOTIFICATION_TYPES = {
  PACT_COMPLETED_IN_GROUP: 'pact_completed_in_group',
  GROUP_MEMBER_JOINED: 'group_member_joined',
  REACTION_RECEIVED: 'reaction_received',
  PACT_REMINDER: 'pact_reminder',
};

/**
 * Get icon for notification type
 * @param {string} type - Notification type
 * @returns {string} - Emoji icon
 */
export function getNotificationIcon(type) {
  switch (type) {
    case NOTIFICATION_TYPES.PACT_COMPLETED_IN_GROUP:
      return '✓';
    case NOTIFICATION_TYPES.GROUP_MEMBER_JOINED:
      return '👋';
    case NOTIFICATION_TYPES.REACTION_RECEIVED:
      return '❤️';
    case NOTIFICATION_TYPES.PACT_REMINDER:
      return '⏰';
    default:
      return '🔔';
  }
}
