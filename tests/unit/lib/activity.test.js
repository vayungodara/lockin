import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  formatRelativeTime,
  getActionInfo,
  logActivity,
  getGroupActivity,
  getAllActivity,
  getGroupStats,
  HIDDEN_FEED_ACTIONS,
  TEST_DATA_PATTERNS,
} from '@/lib/activity';
import { createMockSupabase } from '../../setup/supabase-mock';

describe('formatRelativeTime', () => {
  beforeEach(() => {
    // Fix "now" to a known time so tests are deterministic
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-06-15T12:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns "Just now" for timestamps less than a minute ago', () => {
    const thirtySecondsAgo = new Date('2024-06-15T11:59:35Z').toISOString();
    expect(formatRelativeTime(thirtySecondsAgo)).toBe('Just now');
  });

  it('returns minutes ago for timestamps within the last hour', () => {
    const fiveMinAgo = new Date('2024-06-15T11:55:00Z').toISOString();
    expect(formatRelativeTime(fiveMinAgo)).toBe('5m ago');
  });

  it('returns hours ago for timestamps within the last day', () => {
    const threeHoursAgo = new Date('2024-06-15T09:00:00Z').toISOString();
    expect(formatRelativeTime(threeHoursAgo)).toBe('3h ago');
  });

  it('returns days ago for timestamps within the last week', () => {
    const twoDaysAgo = new Date('2024-06-13T12:00:00Z').toISOString();
    expect(formatRelativeTime(twoDaysAgo)).toBe('2d ago');
  });

  it('returns formatted date for timestamps older than a week', () => {
    const twoWeeksAgo = new Date('2024-06-01T12:00:00Z').toISOString();
    const result = formatRelativeTime(twoWeeksAgo);
    // Should be something like "Jun 1"
    expect(result).toContain('Jun');
  });

  it('returns "1m ago" for exactly one minute', () => {
    const oneMinAgo = new Date('2024-06-15T11:59:00Z').toISOString();
    expect(formatRelativeTime(oneMinAgo)).toBe('1m ago');
  });

  it('returns "1h ago" for exactly one hour', () => {
    const oneHourAgo = new Date('2024-06-15T11:00:00Z').toISOString();
    expect(formatRelativeTime(oneHourAgo)).toBe('1h ago');
  });
});

describe('getActionInfo', () => {
  it('returns correct info for task_created', () => {
    const info = getActionInfo('task_created');
    expect(info.verb).toBe('created task');
    expect(info.color).toBe('purple');
    expect(info.icon).toBe('plus');
  });

  it('returns correct info for task_completed', () => {
    const info = getActionInfo('task_completed');
    expect(info.verb).toBe('completed');
    expect(info.color).toBe('green');
    expect(info.icon).toBe('check');
  });

  it('returns correct info for pact_completed', () => {
    const info = getActionInfo('pact_completed');
    expect(info.verb).toBe('kept their pact');
    expect(info.color).toBe('green');
  });

  it('returns correct info for pact_missed', () => {
    const info = getActionInfo('pact_missed');
    expect(info.verb).toBe('missed pact');
    expect(info.color).toBe('red');
  });

  it('returns correct info for member_joined', () => {
    const info = getActionInfo('member_joined');
    expect(info.verb).toBe('joined the group');
    expect(info.color).toBe('blue');
  });

  it('returns correct info for focus_session_completed', () => {
    const info = getActionInfo('focus_session_completed');
    expect(info.verb).toBe('finished a focus session');
    expect(info.color).toBe('green');
  });

  it('returns correct info for streak_broken', () => {
    const info = getActionInfo('streak_broken');
    expect(info.verb).toBe('lost their streak');
    expect(info.color).toBe('red');
  });

  it('returns correct info for streak_freeze_used', () => {
    const info = getActionInfo('streak_freeze_used');
    expect(info.verb).toBe('used a streak freeze');
    expect(info.color).toBe('blue');
  });

  it('returns fallback for unknown action types', () => {
    const info = getActionInfo('some_unknown_action');
    expect(info.verb).toBe('some_unknown_action');
    expect(info.color).toBe('gray');
    expect(info.icon).toBe('circle');
  });

  it('returns info for all defined action types', () => {
    const knownActions = [
      'task_created', 'task_completed', 'task_started', 'task_claimed',
      'task_deleted', 'pact_created', 'pact_completed', 'pact_missed',
      'member_joined', 'group_created', 'focus_session_started',
      'focus_session_completed', 'streak_broken', 'streak_milestone',
      'streak_freeze_used', 'nudge_sent', 'partner_request',
      'challenge_created', 'challenge_won',
    ];

    knownActions.forEach((action) => {
      const info = getActionInfo(action);
      expect(info.verb).toBeTruthy();
      expect(info.color).toBeTruthy();
      expect(info.icon).toBeTruthy();
      // Should NOT be the fallback
      expect(info.color).not.toBe('gray');
    });
  });
});

describe('HIDDEN_FEED_ACTIONS', () => {
  it('is an array', () => {
    expect(Array.isArray(HIDDEN_FEED_ACTIONS)).toBe(true);
  });

  it('includes task_deleted', () => {
    expect(HIDDEN_FEED_ACTIONS).toContain('task_deleted');
  });
});

describe('TEST_DATA_PATTERNS', () => {
  it('is an array of regexes', () => {
    expect(Array.isArray(TEST_DATA_PATTERNS)).toBe(true);
    TEST_DATA_PATTERNS.forEach((pattern) => {
      expect(pattern).toBeInstanceOf(RegExp);
    });
  });

  it('matches "Bulk Test" titles', () => {
    const matched = TEST_DATA_PATTERNS.some((p) => p.test('Bulk Test Pact'));
    expect(matched).toBe(true);
  });

  it('matches numbered "Test #N" titles', () => {
    const matched = TEST_DATA_PATTERNS.some((p) => p.test('Test #42'));
    expect(matched).toBe(true);
  });

  it('matches "[TEST] foo" titles', () => {
    const matched = TEST_DATA_PATTERNS.some((p) => p.test('[TEST] sample'));
    expect(matched).toBe(true);
  });

  it('does not match normal user-created titles', () => {
    const matched = TEST_DATA_PATTERNS.some((p) => p.test('Finish history essay'));
    expect(matched).toBe(false);
  });
});

describe('logActivity', () => {
  it('returns unauthenticated error when no user', async () => {
    const { supabase } = createMockSupabase();
    supabase.auth.getUser.mockResolvedValue({ data: { user: null }, error: null });

    const result = await logActivity(supabase, 'task_created', 'group-1', { title: 'Do work' });
    expect(result).toEqual({ success: false, error: 'Not authenticated' });
  });

  it('returns success on happy path', async () => {
    const { supabase, builder } = createMockSupabase();
    builder.mockReturnValue({ data: null, error: null });

    const result = await logActivity(supabase, 'task_created', 'group-1', { title: 'Do work' });
    expect(result).toEqual({ success: true });
  });

  it('returns failure with error on insert error', async () => {
    const { supabase, builder } = createMockSupabase();
    builder.mockReturnValue({ data: null, error: { message: 'insert failed' } });

    const result = await logActivity(supabase, 'task_created', 'group-1', { title: 'Do work' });
    expect(result.success).toBe(false);
    expect(result.error).toEqual({ message: 'insert failed' });
  });

  it('returns failure when auth.getUser returns an error', async () => {
    const { supabase } = createMockSupabase();
    // The lib turns `{ error }` into a thrown error via `if (authError) throw authError`.
    supabase.auth.getUser.mockResolvedValue({ data: null, error: { message: 'auth error' } });

    const result = await logActivity(supabase, 'task_created', null, {});
    expect(result.success).toBe(false);
    expect(result.error).toEqual({ message: 'auth error' });
  });

  it('returns failure when auth.getUser rejects (network/exception)', async () => {
    const { supabase } = createMockSupabase();
    supabase.auth.getUser.mockRejectedValue(new Error('network down'));

    const result = await logActivity(supabase, 'task_created', null, {});
    expect(result.success).toBe(false);
    expect(result.error?.message).toBe('network down');
  });

  it('accepts null groupId for personal pacts', async () => {
    const { supabase, builder } = createMockSupabase();
    builder.mockReturnValue({ data: null, error: null });

    const result = await logActivity(supabase, 'pact_created', null, { title: 'My pact' });
    expect(result).toEqual({ success: true });
  });

  it('resets non-object metadata to empty object', async () => {
    const { supabase, builder } = createMockSupabase();
    builder.mockReturnValue({ data: null, error: null });

    // passing a string as metadata — should log a warning and still succeed
    const result = await logActivity(supabase, 'pact_created', null, 'bad-metadata');
    expect(result).toEqual({ success: true });
    // Verify the lib actually reset metadata to {} before inserting
    // (otherwise this test would still pass even if the reset was removed)
    expect(builder.insert).toHaveBeenCalledTimes(1);
    const insertedRow = builder.insert.mock.calls[0][0];
    expect(insertedRow.metadata).toEqual({});
  });
});

describe('getGroupActivity', () => {
  it('returns empty data with no activities', async () => {
    const { supabase, builder } = createMockSupabase();
    builder.mockReturnValue({ data: [], error: null });

    const result = await getGroupActivity(supabase, 'group-1');
    expect(result.data).toEqual([]);
    expect(result.error).toBeNull();
  });

  it('returns empty data and error on DB failure', async () => {
    const { supabase, builder } = createMockSupabase();
    builder.mockReturnValue({ data: null, error: { message: 'DB error' } });

    const result = await getGroupActivity(supabase, 'group-1');
    expect(result.data).toEqual([]);
    expect(result.error).toBeTruthy();
  });

  it('uses default limit and offset when not provided', async () => {
    const { supabase, builder } = createMockSupabase();
    builder.mockReturnValue({ data: [], error: null });

    const result = await getGroupActivity(supabase, 'group-1');
    expect(result.data).toEqual([]);
  });

  it('attaches user profiles and reactions to activities', async () => {
    const { supabase, builder } = createMockSupabase();
    const activities = [
      { id: 'a-1', user_id: 'user-1', action: 'task_completed', created_at: '2024-06-15T12:00:00Z' },
      { id: 'a-2', user_id: 'user-2', action: 'pact_created', created_at: '2024-06-15T11:00:00Z' },
    ];
    const profiles = [
      { id: 'user-1', full_name: 'Alice', avatar_url: 'alice.png' },
      { id: 'user-2', full_name: 'Bob', avatar_url: null },
    ];
    const reactions = [
      { activity_id: 'a-1', user_id: 'user-2', reaction: 'fire' },
    ];

    builder.mockReturnValueSequence([
      { data: activities, error: null },
      { data: profiles, error: null },
      { data: reactions, error: null },
    ]);

    const result = await getGroupActivity(supabase, 'group-1');
    expect(result.error).toBeNull();
    expect(result.data).toHaveLength(2);
    expect(result.data[0].user.full_name).toBe('Alice');
    expect(result.data[1].user.full_name).toBe('Bob');
    expect(result.data[0].reactions).toBeDefined();
    expect(result.data[0].reactions.counts.fire).toBe(1);
  });

  it('uses fallback user info when profile is missing', async () => {
    const { supabase, builder } = createMockSupabase();
    const activities = [
      { id: 'a-1', user_id: 'unknown-user', action: 'task_created', created_at: '2024-06-15T12:00:00Z' },
    ];

    builder.mockReturnValueSequence([
      { data: activities, error: null },
      { data: [], error: null },
      { data: [], error: null },
    ]);

    const result = await getGroupActivity(supabase, 'group-1');
    expect(result.data[0].user.full_name).toBe('Unknown');
    expect(result.data[0].user.avatar_url).toBeNull();
  });
});

describe('getAllActivity', () => {
  it('returns empty data with no activities', async () => {
    const { supabase, builder } = createMockSupabase();
    builder.mockReturnValue({ data: [], error: null });

    const result = await getAllActivity(supabase);
    expect(result.data).toEqual([]);
    expect(result.error).toBeNull();
  });

  it('returns empty data and error on DB failure', async () => {
    const { supabase, builder } = createMockSupabase();
    builder.mockReturnValue({ data: null, error: { message: 'DB error' } });

    const result = await getAllActivity(supabase);
    expect(result.data).toEqual([]);
    expect(result.error).toBeTruthy();
  });

  it('filters out test/debug activities', async () => {
    const { supabase, builder } = createMockSupabase();
    const activities = [
      { id: 'a-1', user_id: 'user-1', action: 'pact_created', metadata: { title: 'Real pact' }, created_at: '2024-06-15T12:00:00Z' },
      { id: 'a-2', user_id: 'user-1', action: 'pact_created', metadata: { title: 'Bulk Test data' }, created_at: '2024-06-15T11:00:00Z' },
      { id: 'a-3', user_id: 'user-1', action: 'pact_created', metadata: { title: 'Test #42' }, created_at: '2024-06-15T10:00:00Z' },
      { id: 'a-4', user_id: 'user-1', action: 'pact_created', metadata: { title: '[TEST] sample' }, created_at: '2024-06-15T09:00:00Z' },
    ];
    const profiles = [{ id: 'user-1', full_name: 'Alice', avatar_url: null }];

    builder.mockReturnValueSequence([
      { data: activities, error: null },
      { data: profiles, error: null },
      { data: [], error: null },
    ]);

    const result = await getAllActivity(supabase);
    expect(result.data).toHaveLength(1);
    expect(result.data[0].id).toBe('a-1');
  });

  it('trims results to the requested limit after filtering', async () => {
    const { supabase, builder } = createMockSupabase();
    const activities = [
      { id: 'a-1', user_id: 'u1', action: 'pact_created', metadata: { title: 'Pact A' }, created_at: '2024-06-15T12:00:00Z' },
      { id: 'a-2', user_id: 'u1', action: 'pact_created', metadata: { title: 'Pact B' }, created_at: '2024-06-15T11:00:00Z' },
      { id: 'a-3', user_id: 'u1', action: 'pact_created', metadata: { title: 'Pact C' }, created_at: '2024-06-15T10:00:00Z' },
    ];

    builder.mockReturnValueSequence([
      { data: activities, error: null },
      { data: [{ id: 'u1', full_name: 'Alice', avatar_url: null }], error: null },
      { data: [], error: null },
    ]);

    const result = await getAllActivity(supabase, 2, 0);
    expect(result.data).toHaveLength(2);
  });

  it('handles activities with name metadata key for test detection', async () => {
    const { supabase, builder } = createMockSupabase();
    const activities = [
      { id: 'a-1', user_id: 'u1', action: 'pact_created', metadata: { name: 'Bulk Test run' }, created_at: '2024-06-15T12:00:00Z' },
      { id: 'a-2', user_id: 'u1', action: 'pact_created', metadata: {}, created_at: '2024-06-15T11:00:00Z' },
    ];

    builder.mockReturnValueSequence([
      { data: activities, error: null },
      { data: [{ id: 'u1', full_name: 'Alice', avatar_url: null }], error: null },
      { data: [], error: null },
    ]);

    const result = await getAllActivity(supabase);
    expect(result.data).toHaveLength(1);
    expect(result.data[0].id).toBe('a-2');
  });
});

describe('getGroupStats', () => {
  it('returns error state when initial query fails', async () => {
    const { supabase, builder } = createMockSupabase();
    builder.mockReturnValue({ data: null, error: { message: 'boom' } });

    const result = await getGroupStats(supabase, 'group-1');
    expect(result.stats).toEqual({});
    expect(result.leaderboard).toEqual([]);
    expect(result.error).toBeTruthy();
  });

  it('returns zero stats when group has no members or tasks', async () => {
    const { supabase, builder } = createMockSupabase();
    builder.mockReturnValue({ data: [], error: null });

    const result = await getGroupStats(supabase, 'group-1');
    expect(result.stats).toEqual({
      totalTasks: 0,
      completedTasks: 0,
      completionRate: 0,
      activeTasks: 0,
    });
    expect(result.leaderboard).toEqual([]);
    expect(result.error).toBeNull();
  });

  it('computes stats and leaderboard with members and tasks', async () => {
    const { supabase, builder } = createMockSupabase();
    const members = [{ user_id: 'u1' }, { user_id: 'u2' }];
    const recentActivity = [
      { user_id: 'u1' },
      { user_id: 'u1' },
      { user_id: 'u2' },
    ];
    const tasks = [
      { id: 't1', status: 'done', owner_id: 'u1' },
      { id: 't2', status: 'done', owner_id: 'u1' },
      { id: 't3', status: 'in_progress', owner_id: 'u2' },
      { id: 't4', status: 'todo', owner_id: 'u2' },
    ];
    const profiles = [
      { id: 'u1', full_name: 'Alice', avatar_url: 'alice.png' },
      { id: 'u2', full_name: 'Bob', avatar_url: null },
    ];

    builder.mockReturnValueSequence([
      { data: members, error: null },
      { data: recentActivity, error: null },
      { data: tasks, error: null },
      { data: profiles, error: null },
    ]);

    const result = await getGroupStats(supabase, 'group-1');

    expect(result.error).toBeNull();
    expect(result.stats.totalTasks).toBe(4);
    expect(result.stats.completedTasks).toBe(2);
    expect(result.stats.completionRate).toBe(50);
    expect(result.stats.activeTasks).toBe(2);

    expect(result.leaderboard).toHaveLength(2);
    expect(result.leaderboard[0].full_name).toBe('Alice');
    expect(result.leaderboard[0].completions).toBe(2);
    expect(result.leaderboard[1].full_name).toBe('Bob');
    expect(result.leaderboard[1].completions).toBe(1);
  });

  it('sorts leaderboard by completions descending', async () => {
    const { supabase, builder } = createMockSupabase();
    const members = [{ user_id: 'u1' }, { user_id: 'u2' }];
    const recentActivity = [
      { user_id: 'u2' },
      { user_id: 'u2' },
      { user_id: 'u2' },
      { user_id: 'u1' },
    ];

    builder.mockReturnValueSequence([
      { data: members, error: null },
      { data: recentActivity, error: null },
      { data: [], error: null },
      { data: [
        { id: 'u1', full_name: 'Alice', avatar_url: null },
        { id: 'u2', full_name: 'Bob', avatar_url: null },
      ], error: null },
    ]);

    const result = await getGroupStats(supabase, 'group-1');
    expect(result.leaderboard[0].user_id).toBe('u2');
    expect(result.leaderboard[0].completions).toBe(3);
    expect(result.leaderboard[1].user_id).toBe('u1');
    expect(result.leaderboard[1].completions).toBe(1);
  });

  it('uses "Unknown" for members without a profile', async () => {
    const { supabase, builder } = createMockSupabase();

    builder.mockReturnValueSequence([
      { data: [{ user_id: 'u1' }], error: null },
      { data: [], error: null },
      { data: [], error: null },
      { data: [], error: null },
    ]);

    const result = await getGroupStats(supabase, 'group-1');
    expect(result.leaderboard[0].full_name).toBe('Unknown');
    expect(result.leaderboard[0].completions).toBe(0);
  });
});
