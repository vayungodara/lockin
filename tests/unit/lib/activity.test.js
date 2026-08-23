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

  it('computes stats and leaderboard from real data', async () => {
    const { supabase, builders } = createActivityTableMock(['group_members', 'activity_log', 'tasks', 'profiles']);

    builders['group_members'].resolveWith({
      data: [{ user_id: 'u1' }, { user_id: 'u2' }],
      error: null,
    });

    builders['activity_log'].resolveWith({
      data: [
        { user_id: 'u1' },
        { user_id: 'u1' },
        { user_id: 'u2' },
      ],
      error: null,
    });

    builders['tasks'].resolveWith({
      data: [
        { id: 't1', status: 'done', owner_id: 'u1' },
        { id: 't2', status: 'done', owner_id: 'u2' },
        { id: 't3', status: 'in_progress', owner_id: 'u1' },
        { id: 't4', status: 'todo', owner_id: 'u2' },
      ],
      error: null,
    });

    builders['profiles'].resolveWith({
      data: [
        { id: 'u1', full_name: 'Alice', avatar_url: null },
        { id: 'u2', full_name: 'Bob', avatar_url: null },
      ],
      error: null,
    });

    const result = await getGroupStats(supabase, 'group-1');

    expect(result.error).toBeNull();
    expect(result.stats).toEqual({
      totalTasks: 4,
      completedTasks: 2,
      completionRate: 50,
      activeTasks: 2,
    });
    expect(result.leaderboard).toHaveLength(2);
    expect(result.leaderboard[0].full_name).toBe('Alice');
    expect(result.leaderboard[0].completions).toBe(2);
    expect(result.leaderboard[1].full_name).toBe('Bob');
    expect(result.leaderboard[1].completions).toBe(1);
  });
});

/**
 * Multi-table mock: each from(table) call returns a distinct builder so
 * sequential queries against different tables resolve independently.
 */
function createActivityTableMock(tables) {
  function makeBuilder() {
    const chainMethods = [
      'select', 'eq', 'neq', 'in', 'not', 'gte', 'order', 'range',
      'single', 'maybeSingle', 'insert', 'update', 'delete', 'limit',
    ];
    const b = {
      resolveWith(value) {
        b.then = (resolve) => resolve(value);
      },
    };
    chainMethods.forEach((m) => {
      b[m] = vi.fn(() => b);
    });
    b.resolveWith({ data: null, error: null });
    return b;
  }

  const builders = {};
  (tables || []).forEach((t) => { builders[t] = makeBuilder(); });

  const supabase = {
    from: vi.fn((table) => {
      if (!builders[table]) builders[table] = makeBuilder();
      return builders[table];
    }),
    rpc: vi.fn().mockResolvedValue({ data: null, error: null }),
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: { id: 'test-user-id' } },
        error: null,
      }),
    },
  };
  return { supabase, builders };
}

describe('getGroupActivity — happy path', () => {
  it('attaches user profiles and reactions to activities', async () => {
    const { supabase, builders } = createActivityTableMock(['activity_log', 'profiles', 'activity_reactions']);

    builders['activity_log'].resolveWith({
      data: [
        { id: 'act-1', user_id: 'u1', action: 'task_completed', group_id: 'g1', metadata: {} },
        { id: 'act-2', user_id: 'u2', action: 'pact_created', group_id: 'g1', metadata: {} },
      ],
      error: null,
    });

    builders['profiles'].resolveWith({
      data: [
        { id: 'u1', full_name: 'Alice', avatar_url: 'https://example.com/a.png' },
        { id: 'u2', full_name: 'Bob', avatar_url: null },
      ],
      error: null,
    });

    builders['activity_reactions'].resolveWith({
      data: [
        { activity_id: 'act-1', user_id: 'test-user-id', reaction: 'fire' },
      ],
      error: null,
    });

    const result = await getGroupActivity(supabase, 'g1');

    expect(result.error).toBeNull();
    expect(result.data).toHaveLength(2);
    expect(result.data[0].user.full_name).toBe('Alice');
    expect(result.data[0].reactions.counts).toEqual({ fire: 1 });
    expect(result.data[0].reactions.userReactions).toEqual(['fire']);
    expect(result.data[1].user.full_name).toBe('Bob');
    expect(result.data[1].reactions.total).toBe(0);
  });

  it('falls back to Unknown for missing profiles', async () => {
    const { supabase, builders } = createActivityTableMock(['activity_log', 'profiles', 'activity_reactions']);

    builders['activity_log'].resolveWith({
      data: [{ id: 'act-1', user_id: 'deleted-user', action: 'task_completed', group_id: 'g1', metadata: {} }],
      error: null,
    });

    builders['profiles'].resolveWith({ data: [], error: null });
    builders['activity_reactions'].resolveWith({ data: [], error: null });

    const result = await getGroupActivity(supabase, 'g1');

    expect(result.data[0].user.full_name).toBe('Unknown');
    expect(result.data[0].user.avatar_url).toBeNull();
  });
});

describe('getAllActivity — happy path', () => {
  it('filters out test-data entries and respects the limit', async () => {
    const { supabase, builders } = createActivityTableMock(['activity_log', 'profiles', 'activity_reactions']);

    builders['activity_log'].resolveWith({
      data: [
        { id: 'a1', user_id: 'u1', action: 'pact_completed', metadata: { title: 'Study math' } },
        { id: 'a2', user_id: 'u1', action: 'pact_created', metadata: { title: 'Bulk Test Pact' } },
        { id: 'a3', user_id: 'u1', action: 'task_completed', metadata: { title: '[TEST] ignore me' } },
        { id: 'a4', user_id: 'u1', action: 'pact_completed', metadata: { title: 'Read chapter 5' } },
      ],
      error: null,
    });

    builders['profiles'].resolveWith({
      data: [{ id: 'u1', full_name: 'Alice', avatar_url: null }],
      error: null,
    });

    builders['activity_reactions'].resolveWith({ data: [], error: null });

    const result = await getAllActivity(supabase, 2);

    expect(result.error).toBeNull();
    const titles = result.data.map((a) => a.metadata.title);
    expect(titles).not.toContain('Bulk Test Pact');
    expect(titles).not.toContain('[TEST] ignore me');
    expect(result.data.length).toBeLessThanOrEqual(2);
  });

  it('attaches user profiles and default reactions', async () => {
    const { supabase, builders } = createActivityTableMock(['activity_log', 'profiles', 'activity_reactions']);

    builders['activity_log'].resolveWith({
      data: [{ id: 'a1', user_id: 'u1', action: 'pact_completed', metadata: { title: 'Run 5k' } }],
      error: null,
    });

    builders['profiles'].resolveWith({
      data: [{ id: 'u1', full_name: 'Alice', avatar_url: null }],
      error: null,
    });

    builders['activity_reactions'].resolveWith({ data: [], error: null });

    const result = await getAllActivity(supabase);

    expect(result.data[0].user.full_name).toBe('Alice');
    expect(result.data[0].reactions).toEqual({ counts: {}, userReactions: [], total: 0 });
  });
});
