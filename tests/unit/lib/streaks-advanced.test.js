import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createMockSupabase } from '../../setup/supabase-mock';
import {
  checkStreakAtRisk,
  getStreakFreezeStatus,
  applyStreakFreeze,
  updateStreakOnCompletion,
} from '@/lib/streaks-advanced';
import { formatUTCDate } from '@/lib/streaks';

describe('checkStreakAtRisk', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns not at risk before 6pm', async () => {
    // Set time to 2pm
    vi.setSystemTime(new Date('2024-06-15T14:00:00Z'));

    const { supabase } = createMockSupabase();
    const result = await checkStreakAtRisk(supabase, 'user-1');

    expect(result.atRisk).toBe(false);
  });

  it('returns not at risk when no profile exists', async () => {
    vi.setSystemTime(new Date('2024-06-15T19:00:00Z'));

    const { supabase, builder } = createMockSupabase();
    builder.mockReturnValue({ data: null, error: null });

    const result = await checkStreakAtRisk(supabase, 'user-1');
    expect(result.atRisk).toBe(false);
    expect(result.streak).toBe(0);
  });

  it('returns not at risk when user has no streak', async () => {
    vi.setSystemTime(new Date('2024-06-15T19:00:00Z'));

    const { supabase, builder } = createMockSupabase();
    builder.mockReturnValue({
      data: { current_streak: 0, last_activity_date: '2024-06-10' },
      error: null,
    });

    const result = await checkStreakAtRisk(supabase, 'user-1');
    expect(result.atRisk).toBe(false);
    expect(result.streak).toBe(0);
  });

  it('returns not at risk when active today', async () => {
    const now = new Date('2024-06-15T19:00:00Z');
    vi.setSystemTime(now);
    const todayStr = formatUTCDate(now);

    const { supabase, builder } = createMockSupabase();
    builder.mockReturnValue({
      data: { current_streak: 5, last_activity_date: todayStr },
      error: null,
    });

    const result = await checkStreakAtRisk(supabase, 'user-1');
    expect(result.atRisk).toBe(false);
    expect(result.streak).toBe(5);
  });

  it('returns at risk when last activity was yesterday and it is after 6pm', async () => {
    const now = new Date('2024-06-15T19:00:00Z');
    vi.setSystemTime(now);
    const yesterday = new Date(now);
    yesterday.setUTCDate(yesterday.getUTCDate() - 1);
    const yesterdayStr = formatUTCDate(yesterday);

    const { supabase, builder } = createMockSupabase();
    builder.mockReturnValue({
      data: { current_streak: 10, last_activity_date: yesterdayStr },
      error: null,
    });

    const result = await checkStreakAtRisk(supabase, 'user-1');
    expect(result.atRisk).toBe(true);
    expect(result.streak).toBe(10);
  });

  it('returns streak 0 when last activity was 2+ days ago (broken)', async () => {
    const now = new Date('2024-06-15T19:00:00Z');
    vi.setSystemTime(now);

    const { supabase, builder } = createMockSupabase();
    builder.mockReturnValue({
      data: { current_streak: 10, last_activity_date: '2024-06-10' },
      error: null,
    });

    const result = await checkStreakAtRisk(supabase, 'user-1');
    expect(result.atRisk).toBe(false);
    expect(result.streak).toBe(0);
  });
});

describe('getStreakFreezeStatus', () => {
  it('returns available when freezes remaining and no cooldown', async () => {
    const { supabase, builder } = createMockSupabase();
    builder.mockReturnValue({
      data: {
        streak_freezes_remaining: 2,
        streak_freeze_last_used: null,
        current_streak: 5,
      },
      error: null,
    });

    const result = await getStreakFreezeStatus(supabase, 'user-1');
    expect(result.available).toBe(true);
    expect(result.freezesRemaining).toBe(2);
  });

  it('returns not available when on cooldown', async () => {
    const { supabase, builder } = createMockSupabase();
    builder.mockReturnValue({
      data: {
        streak_freezes_remaining: 1,
        streak_freeze_last_used: new Date().toISOString(),
        current_streak: 5,
      },
      error: null,
    });

    const result = await getStreakFreezeStatus(supabase, 'user-1');
    expect(result.available).toBe(false);
    expect(result.cooldownEnds).not.toBeNull();
  });

  it('returns available when cooldown has expired (3+ days)', async () => {
    const { supabase, builder } = createMockSupabase();
    const fourDaysAgo = new Date();
    fourDaysAgo.setDate(fourDaysAgo.getDate() - 4);

    builder.mockReturnValue({
      data: {
        streak_freezes_remaining: 1,
        streak_freeze_last_used: fourDaysAgo.toISOString(),
        current_streak: 5,
      },
      error: null,
    });

    const result = await getStreakFreezeStatus(supabase, 'user-1');
    expect(result.available).toBe(true);
  });

  it('returns not available when no freezes remaining', async () => {
    const { supabase, builder } = createMockSupabase();
    builder.mockReturnValue({
      data: {
        streak_freezes_remaining: 0,
        streak_freeze_last_used: null,
        current_streak: 5,
      },
      error: null,
    });

    const result = await getStreakFreezeStatus(supabase, 'user-1');
    expect(result.available).toBe(false);
    expect(result.freezesRemaining).toBe(0);
  });

  it('returns not available when profile is missing', async () => {
    const { supabase, builder } = createMockSupabase();
    builder.mockReturnValue({ data: null, error: null });

    const result = await getStreakFreezeStatus(supabase, 'user-1');
    expect(result.available).toBe(false);
  });
});

describe('applyStreakFreeze', () => {
  it('returns error when not authenticated', async () => {
    const { supabase } = createMockSupabase();
    supabase.auth.getUser.mockResolvedValue({ data: { user: null }, error: null });

    const result = await applyStreakFreeze(supabase);
    expect(result.success).toBe(false);
    expect(result.error).toBe('Not authenticated');
  });

  it('returns error when profile is not found', async () => {
    const { supabase, builder } = createMockSupabase();
    builder.mockReturnValue({ data: null, error: null });

    const result = await applyStreakFreeze(supabase);
    expect(result.success).toBe(false);
    expect(result.error).toBe('Profile not found');
  });

  it('returns error when no freezes remaining', async () => {
    const { supabase, builder } = createMockSupabase();
    builder.mockReturnValue({
      data: {
        streak_freezes_remaining: 0,
        streak_freeze_last_used: null,
        current_streak: 5,
      },
      error: null,
    });

    const result = await applyStreakFreeze(supabase);
    expect(result.success).toBe(false);
    expect(result.error).toContain('No freezes remaining');
  });

  it('returns error when on cooldown', async () => {
    const { supabase, builder } = createMockSupabase();
    builder.mockReturnValue({
      data: {
        streak_freezes_remaining: 2,
        streak_freeze_last_used: new Date().toISOString(),
        current_streak: 5,
      },
      error: null,
    });

    const result = await applyStreakFreeze(supabase);
    expect(result.success).toBe(false);
    expect(result.error).toContain('Cooldown');
  });

  it('returns error when no active streak', async () => {
    const { supabase, builder } = createMockSupabase();
    builder.mockReturnValue({
      data: {
        streak_freezes_remaining: 2,
        streak_freeze_last_used: null,
        current_streak: 0,
      },
      error: null,
    });

    const result = await applyStreakFreeze(supabase);
    expect(result.success).toBe(false);
    expect(result.error).toBe('No active streak to freeze');
  });

  it('succeeds when freeze is available and streak exists', async () => {
    const { supabase, builder } = createMockSupabase();
    builder.mockReturnValue({
      data: {
        streak_freezes_remaining: 2,
        streak_freeze_last_used: null,
        current_streak: 5,
      },
      error: null,
    });

    const result = await applyStreakFreeze(supabase);
    expect(result.success).toBe(true);
    expect(result.freezesRemaining).toBe(1);
  });

  it('succeeds when cooldown has expired (3+ days)', async () => {
    const { supabase, builder } = createMockSupabase();
    const fourDaysAgo = new Date();
    fourDaysAgo.setDate(fourDaysAgo.getDate() - 4);

    builder.mockReturnValue({
      data: {
        streak_freezes_remaining: 3,
        streak_freeze_last_used: fourDaysAgo.toISOString(),
        current_streak: 10,
      },
      error: null,
    });

    const result = await applyStreakFreeze(supabase);
    expect(result.success).toBe(true);
    expect(result.freezesRemaining).toBe(2);
  });
});

/**
 * Helper: build a Supabase mock where each `from(table)` call returns a
 * per-table builder. Use this when the function-under-test reads from
 * multiple tables and we want distinct responses per table.
 *
 * Each builder is thenable — set its resolved value with `.resolveWith(v)`.
 */
function createTableMock() {
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
    // Default: null data, null error
    b.resolveWith({ data: null, error: null });
    return b;
  }

  const builders = {};
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

describe('updateStreakOnCompletion — milestone freeze idempotency', () => {
  beforeEach(() => {
    // Silence the dynamic-import notification call in checkStreakMilestone
    // and awardStreakFreeze — neither exists in the mock module graph, so
    // the try/catch around them will swallow the failure. That's fine for
    // these tests; we're only asserting on the RPC/insert pathways.
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('awards a freeze when no prior marker exists at milestone 7', async () => {
    const { supabase } = createTableMock();

    // profiles.select() — shared across updateStreakOnCompletion (reads longest_streak)
    // AND awardStreakFreeze (reads streak_freezes_remaining). Prime it once.
    const profilesBuilder = supabase.from('profiles');
    profilesBuilder.resolveWith({
      data: { longest_streak: 5, streak_freezes_remaining: 2 },
      error: null,
    });

    // xp_events read — no prior marker
    const xpEventsBuilder = supabase.from('xp_events');
    xpEventsBuilder.resolveWith({ data: null, error: null });

    // All RPCs succeed
    supabase.rpc.mockResolvedValue({ data: { freezesRemaining: 3 }, error: null });

    const result = await updateStreakOnCompletion(supabase, 'user-1', 7, 7);

    expect(result.success).toBe(true);

    const rpcCalls = supabase.rpc.mock.calls;
    const rpcNames = rpcCalls.map((c) => c[0]);

    // update_streak_activity RPC was called
    expect(rpcNames).toContain('update_streak_activity');
    // award_streak_freeze RPC was called (no marker existed)
    expect(rpcNames).toContain('award_streak_freeze');
    // The marker was written via awardXP → `award_xp` RPC (routes through
    // SECURITY DEFINER to bypass the xp_events INSERT RLS policy).
    expect(rpcNames).toContain('award_xp');

    // Verify the award_xp call contained the milestone-specific event_type
    const awardXpCall = rpcCalls.find((c) => c[0] === 'award_xp');
    expect(awardXpCall).toBeDefined();
    expect(awardXpCall[1].p_event_type).toBe('streak_freeze_milestone_7');
    expect(awardXpCall[1].p_user_id).toBe('user-1');
    // Marker rows carry xp_amount 0 — the reward is a freeze, not XP
    expect(awardXpCall[1].p_xp_amount).toBe(0);
  });

  it('does NOT award a freeze when a marker already exists at milestone 7', async () => {
    const { supabase } = createTableMock();

    // profiles read — same shape; also covers the awardStreakFreeze profile read
    // (but awardStreakFreeze should never be invoked in this test)
    const profilesBuilder = supabase.from('profiles');
    profilesBuilder.resolveWith({
      data: { longest_streak: 5, streak_freezes_remaining: 2 },
      error: null,
    });

    // xp_events read — marker EXISTS
    const xpEventsBuilder = supabase.from('xp_events');
    xpEventsBuilder.resolveWith({
      data: { id: 'existing-marker-id' },
      error: null,
    });

    supabase.rpc.mockResolvedValue({ data: null, error: null });

    const result = await updateStreakOnCompletion(supabase, 'user-1', 7, 7);

    expect(result.success).toBe(true);

    const rpcNames = supabase.rpc.mock.calls.map((c) => c[0]);
    // update_streak_activity still ran
    expect(rpcNames).toContain('update_streak_activity');
    // award_streak_freeze was NOT called — idempotent skip
    expect(rpcNames).not.toContain('award_streak_freeze');
    // No marker write either — award_xp with the milestone event_type
    // should NOT have fired.
    const awardXpCall = supabase.rpc.mock.calls.find(
      (c) => c[0] === 'award_xp' && c[1]?.p_event_type === 'streak_freeze_milestone_7'
    );
    expect(awardXpCall).toBeUndefined();
  });

  it('skips freeze award when streak is not on a reward milestone (e.g. day 5)', async () => {
    const { supabase } = createTableMock();

    const profilesBuilder = supabase.from('profiles');
    profilesBuilder.resolveWith({ data: { longest_streak: 4 }, error: null });

    supabase.rpc.mockResolvedValue({ data: null, error: null });

    const result = await updateStreakOnCompletion(supabase, 'user-1', 5, 5);

    expect(result.success).toBe(true);
    // No idempotency lookup, no award, no marker
    expect(supabase.from).not.toHaveBeenCalledWith('xp_events');
    const rpcNames = supabase.rpc.mock.calls.map((c) => c[0]);
    expect(rpcNames).not.toContain('award_streak_freeze');
    expect(rpcNames).not.toContain('award_xp');
  });
});
