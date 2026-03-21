import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createMockSupabase } from '../../setup/supabase-mock';
import { checkStreakAtRisk, getStreakFreezeStatus, useStreakFreeze } from '@/lib/streaks-advanced';
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
    vi.setSystemTime(new Date('2024-06-15T14:00:00'));

    const { supabase } = createMockSupabase();
    const result = await checkStreakAtRisk(supabase, 'user-1');

    expect(result.atRisk).toBe(false);
  });

  it('returns not at risk when no profile exists', async () => {
    vi.setSystemTime(new Date('2024-06-15T19:00:00'));

    const { supabase, builder } = createMockSupabase();
    builder.mockReturnValue({ data: null, error: null });

    const result = await checkStreakAtRisk(supabase, 'user-1');
    expect(result.atRisk).toBe(false);
    expect(result.streak).toBe(0);
  });

  it('returns not at risk when user has no streak', async () => {
    vi.setSystemTime(new Date('2024-06-15T19:00:00'));

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
    const now = new Date('2024-06-15T19:00:00');
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
    const now = new Date('2024-06-15T19:00:00');
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
    const now = new Date('2024-06-15T19:00:00');
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
  it('returns available when freeze has not been used this week', async () => {
    const { supabase, builder } = createMockSupabase();
    builder.mockReturnValue({
      data: {
        streak_freeze_used_this_week: false,
        streak_freeze_last_reset: new Date().toISOString(),
      },
      error: null,
    });

    const result = await getStreakFreezeStatus(supabase, 'user-1');
    expect(result.available).toBe(true);
  });

  it('returns not available when freeze was used recently', async () => {
    const { supabase, builder } = createMockSupabase();
    builder.mockReturnValue({
      data: {
        streak_freeze_used_this_week: true,
        streak_freeze_last_reset: new Date().toISOString(),
      },
      error: null,
    });

    const result = await getStreakFreezeStatus(supabase, 'user-1');
    expect(result.available).toBe(false);
  });

  it('returns available when freeze was used but 7+ days passed (cooldown reset)', async () => {
    const { supabase, builder } = createMockSupabase();
    const tenDaysAgo = new Date();
    tenDaysAgo.setDate(tenDaysAgo.getDate() - 10);

    builder.mockReturnValue({
      data: {
        streak_freeze_used_this_week: true,
        streak_freeze_last_reset: tenDaysAgo.toISOString(),
      },
      error: null,
    });

    const result = await getStreakFreezeStatus(supabase, 'user-1');
    expect(result.available).toBe(true);
  });

  it('returns not available when profile is missing', async () => {
    const { supabase, builder } = createMockSupabase();
    builder.mockReturnValue({ data: null, error: null });

    const result = await getStreakFreezeStatus(supabase, 'user-1');
    expect(result.available).toBe(false);
  });
});

describe('useStreakFreeze', () => {
  it('returns error when not authenticated', async () => {
    const { supabase } = createMockSupabase();
    supabase.auth.getUser.mockResolvedValue({ data: { user: null }, error: null });

    const result = await useStreakFreeze(supabase);
    expect(result.success).toBe(false);
    expect(result.error).toBe('Not authenticated');
  });

  it('returns error when profile is not found', async () => {
    const { supabase, builder } = createMockSupabase();
    builder.mockReturnValue({ data: null, error: null });

    const result = await useStreakFreeze(supabase);
    expect(result.success).toBe(false);
    expect(result.error).toBe('Profile not found');
  });

  it('returns error when freeze already used this week', async () => {
    const { supabase, builder } = createMockSupabase();
    builder.mockReturnValue({
      data: {
        streak_freeze_used_this_week: true,
        streak_freeze_last_reset: new Date().toISOString(),
        current_streak: 5,
      },
      error: null,
    });

    const result = await useStreakFreeze(supabase);
    expect(result.success).toBe(false);
    expect(result.error).toBe('Streak freeze already used this week');
  });

  it('returns error when no active streak', async () => {
    const { supabase, builder } = createMockSupabase();
    builder.mockReturnValue({
      data: {
        streak_freeze_used_this_week: false,
        streak_freeze_last_reset: new Date().toISOString(),
        current_streak: 0,
      },
      error: null,
    });

    const result = await useStreakFreeze(supabase);
    expect(result.success).toBe(false);
    expect(result.error).toBe('No active streak to freeze');
  });

  it('succeeds when freeze is available and streak exists', async () => {
    const { supabase, builder } = createMockSupabase();
    builder.mockReturnValue({
      data: {
        streak_freeze_used_this_week: false,
        streak_freeze_last_reset: new Date().toISOString(),
        current_streak: 5,
      },
      error: null,
    });

    const result = await useStreakFreeze(supabase);
    expect(result.success).toBe(true);
  });

  it('succeeds when freeze was used but cooldown has passed', async () => {
    const { supabase, builder } = createMockSupabase();
    const tenDaysAgo = new Date();
    tenDaysAgo.setDate(tenDaysAgo.getDate() - 10);

    builder.mockReturnValue({
      data: {
        streak_freeze_used_this_week: true,
        streak_freeze_last_reset: tenDaysAgo.toISOString(),
        current_streak: 3,
      },
      error: null,
    });

    const result = await useStreakFreeze(supabase);
    expect(result.success).toBe(true);
  });
});
