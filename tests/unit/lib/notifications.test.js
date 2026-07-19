import { describe, it, expect } from 'vitest';
import {
  NOTIFICATION_TYPES,
  getNotificationIcon,
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  createNotification,
} from '@/lib/notifications';
import { createMockSupabase } from '../../setup/supabase-mock';

describe('getNotifications', () => {
  it('returns notifications on success', async () => {
    const { supabase, builder } = createMockSupabase();
    const notifications = [
      { id: 'n-1', type: 'pact_reminder', title: 'Reminder', message: 'Do it', is_read: false, created_at: '2024-06-15T10:00:00Z' },
      { id: 'n-2', type: 'streak_milestone', title: '7 days!', message: 'Keep going', is_read: true, created_at: '2024-06-14T10:00:00Z' },
    ];
    builder.mockReturnValue({ data: notifications, error: null });

    const result = await getNotifications(supabase);
    expect(result.data).toEqual(notifications);
    expect(result.error).toBeNull();
  });

  it('returns empty array when data is null', async () => {
    const { supabase, builder } = createMockSupabase();
    builder.mockReturnValue({ data: null, error: null });

    const result = await getNotifications(supabase);
    expect(result.data).toEqual([]);
    expect(result.error).toBeNull();
  });

  it('returns empty array and error on DB failure', async () => {
    const { supabase, builder } = createMockSupabase();
    builder.mockReturnValue({ data: null, error: { message: 'DB connection lost' } });

    const result = await getNotifications(supabase);
    expect(result.data).toEqual([]);
    expect(result.error).toBeTruthy();
  });

  it('respects custom limit parameter', async () => {
    const { supabase, builder } = createMockSupabase();
    builder.mockReturnValue({ data: [], error: null });

    await getNotifications(supabase, 5);
    expect(builder.limit).toHaveBeenCalledWith(5);
  });

  it('uses default limit of 20 when not specified', async () => {
    const { supabase, builder } = createMockSupabase();
    builder.mockReturnValue({ data: [], error: null });

    await getNotifications(supabase);
    expect(builder.limit).toHaveBeenCalledWith(20);
  });
});

describe('NOTIFICATION_TYPES', () => {
  it('is an object with string values', () => {
    expect(typeof NOTIFICATION_TYPES).toBe('object');
    Object.values(NOTIFICATION_TYPES).forEach((value) => {
      expect(typeof value).toBe('string');
      expect(value.length).toBeGreaterThan(0);
    });
  });

  it('includes core notification types', () => {
    expect(NOTIFICATION_TYPES).toHaveProperty('PACT_COMPLETED_IN_GROUP');
    expect(NOTIFICATION_TYPES).toHaveProperty('GROUP_MEMBER_JOINED');
    expect(NOTIFICATION_TYPES).toHaveProperty('REACTION_RECEIVED');
    expect(NOTIFICATION_TYPES).toHaveProperty('PACT_REMINDER');
  });

  it('includes advanced notification types', () => {
    expect(NOTIFICATION_TYPES).toHaveProperty('ACHIEVEMENT_UNLOCKED');
    expect(NOTIFICATION_TYPES).toHaveProperty('LEVEL_UP');
    expect(NOTIFICATION_TYPES).toHaveProperty('STREAK_MILESTONE');
    expect(NOTIFICATION_TYPES).toHaveProperty('PARTNER_REQUEST');
  });

  it('all notification-type values are unique', () => {
    const values = Object.values(NOTIFICATION_TYPES);
    expect(new Set(values).size).toBe(values.length);
  });
});

describe('getNotificationIcon', () => {
  it('returns the check icon for pact_completed_in_group', () => {
    expect(getNotificationIcon(NOTIFICATION_TYPES.PACT_COMPLETED_IN_GROUP)).toBe('✓');
  });

  it('returns the wave icon for group_member_joined', () => {
    expect(getNotificationIcon(NOTIFICATION_TYPES.GROUP_MEMBER_JOINED)).toBe('👋');
  });

  it('returns the heart icon for reaction_received', () => {
    expect(getNotificationIcon(NOTIFICATION_TYPES.REACTION_RECEIVED)).toBe('❤️');
  });

  it('returns the fire icon for streak_milestone', () => {
    expect(getNotificationIcon(NOTIFICATION_TYPES.STREAK_MILESTONE)).toBe('🔥');
  });

  it('returns the medal icon for achievement_unlocked', () => {
    expect(getNotificationIcon(NOTIFICATION_TYPES.ACHIEVEMENT_UNLOCKED)).toBe('🏅');
  });

  it('returns the default bell icon for unknown types', () => {
    expect(getNotificationIcon('unknown_type')).toBe('🔔');
  });

  it('returns the default bell icon for null/undefined', () => {
    expect(getNotificationIcon(null)).toBe('🔔');
    expect(getNotificationIcon(undefined)).toBe('🔔');
  });

  it('returns the clock icon for pact_reminder', () => {
    expect(getNotificationIcon(NOTIFICATION_TYPES.PACT_REMINDER)).toBe('⏰');
  });

  it('returns the fist icon for nudge_received', () => {
    expect(getNotificationIcon(NOTIFICATION_TYPES.NUDGE_RECEIVED)).toBe('👊');
  });

  it('returns the broken heart icon for streak_broken', () => {
    expect(getNotificationIcon(NOTIFICATION_TYPES.STREAK_BROKEN)).toBe('💔');
  });

  it('returns the warning icon for streak_at_risk', () => {
    expect(getNotificationIcon(NOTIFICATION_TYPES.STREAK_AT_RISK)).toBe('⚠️');
  });

  it('returns the handshake icon for partner_request', () => {
    expect(getNotificationIcon(NOTIFICATION_TYPES.PARTNER_REQUEST)).toBe('🤝');
  });

  it('returns the party icon for partner_accepted', () => {
    expect(getNotificationIcon(NOTIFICATION_TYPES.PARTNER_ACCEPTED)).toBe('🎉');
  });

  it('returns the check icon for partner_pact_completed', () => {
    expect(getNotificationIcon(NOTIFICATION_TYPES.PARTNER_PACT_COMPLETED)).toBe('✅');
  });

  it('returns the grimace icon for partner_pact_missed', () => {
    expect(getNotificationIcon(NOTIFICATION_TYPES.PARTNER_PACT_MISSED)).toBe('😬');
  });

  it('returns the speech bubble icon for comment_on_activity', () => {
    expect(getNotificationIcon(NOTIFICATION_TYPES.COMMENT_ON_ACTIVITY)).toBe('💬');
  });

  it('returns the up arrow icon for level_up', () => {
    expect(getNotificationIcon(NOTIFICATION_TYPES.LEVEL_UP)).toBe('⬆️');
  });

  it('returns the trophy icon for challenge_created', () => {
    expect(getNotificationIcon(NOTIFICATION_TYPES.CHALLENGE_CREATED)).toBe('🏆');
  });

  it('returns the party icon for challenge_ended', () => {
    expect(getNotificationIcon(NOTIFICATION_TYPES.CHALLENGE_ENDED)).toBe('🎉');
  });

  it('returns a non-empty string icon for every defined type', () => {
    Object.values(NOTIFICATION_TYPES).forEach((type) => {
      const icon = getNotificationIcon(type);
      expect(typeof icon).toBe('string');
      expect(icon.length).toBeGreaterThan(0);
    });
  });
});

describe('getUnreadCount', () => {
  it('returns the count from Supabase on success', async () => {
    const { supabase, builder } = createMockSupabase();
    builder.mockReturnValue({ count: 7, error: null });

    const result = await getUnreadCount(supabase);
    expect(result).toEqual({ count: 7, error: null });
  });

  it('returns zero when count is null/undefined', async () => {
    const { supabase, builder } = createMockSupabase();
    builder.mockReturnValue({ count: null, error: null });

    const result = await getUnreadCount(supabase);
    expect(result).toEqual({ count: 0, error: null });
  });

  it('returns zero and the error on DB failure', async () => {
    const { supabase, builder } = createMockSupabase();
    builder.mockReturnValue({ count: null, error: { message: 'DB down' } });

    const result = await getUnreadCount(supabase);
    expect(result.count).toBe(0);
    expect(result.error).toBeTruthy();
  });
});

describe('markAsRead', () => {
  it('returns success when update succeeds', async () => {
    const { supabase, builder } = createMockSupabase();
    builder.mockReturnValue({ data: null, error: null });

    const result = await markAsRead(supabase, 'notif-1');
    expect(result).toEqual({ success: true, error: null });
  });

  it('returns failure when DB returns error', async () => {
    const { supabase, builder } = createMockSupabase();
    builder.mockReturnValue({ data: null, error: { message: 'update failed' } });

    const result = await markAsRead(supabase, 'notif-1');
    expect(result.success).toBe(false);
    expect(result.error).toBeTruthy();
  });
});

describe('markAllAsRead', () => {
  it('returns success when update succeeds', async () => {
    const { supabase, builder } = createMockSupabase();
    builder.mockReturnValue({ data: null, error: null });

    const result = await markAllAsRead(supabase);
    expect(result).toEqual({ success: true, error: null });
  });

  it('returns failure when DB returns error', async () => {
    const { supabase, builder } = createMockSupabase();
    builder.mockReturnValue({ data: null, error: { message: 'update failed' } });

    const result = await markAllAsRead(supabase);
    expect(result.success).toBe(false);
    expect(result.error).toBeTruthy();
  });
});

describe('createNotification', () => {
  it('returns the inserted row on success', async () => {
    const { supabase, builder } = createMockSupabase();
    const row = {
      id: 'n-1',
      user_id: 'user-1',
      type: NOTIFICATION_TYPES.STREAK_MILESTONE,
      title: 'Milestone!',
      message: '7 days',
    };
    builder.mockReturnValue({ data: row, error: null });

    const result = await createNotification(
      supabase,
      'user-1',
      NOTIFICATION_TYPES.STREAK_MILESTONE,
      'Milestone!',
      '7 days',
      { streak: 7 }
    );
    expect(result).toEqual({ data: row, error: null });
  });

  it('returns null data and error on DB failure', async () => {
    const { supabase, builder } = createMockSupabase();
    builder.mockReturnValue({ data: null, error: { message: 'insert failed' } });

    const result = await createNotification(
      supabase,
      'user-1',
      NOTIFICATION_TYPES.PACT_REMINDER,
      'Reminder',
      'Do it'
    );
    expect(result.data).toBeNull();
    expect(result.error).toBeTruthy();
  });

  it('defaults metadata to an empty object when not provided', async () => {
    const { supabase, builder } = createMockSupabase();
    builder.mockReturnValue({ data: { id: 'n-2' }, error: null });

    const result = await createNotification(
      supabase,
      'user-1',
      NOTIFICATION_TYPES.LEVEL_UP,
      'Level up',
      'You reached level 2'
      // metadata intentionally omitted
    );
    expect(result.data).toEqual({ id: 'n-2' });
    expect(result.error).toBeNull();
    // Verify the default param actually applied — the inserted row has
    // metadata: {} (otherwise removing the default would still pass).
    expect(builder.insert).toHaveBeenCalledTimes(1);
    const insertedRow = builder.insert.mock.calls[0][0];
    expect(insertedRow.metadata).toEqual({});
  });
});
