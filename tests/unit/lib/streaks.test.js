import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { formatUTCDate, formatDateInTimezone, getHourInTimezone, calculateStreak, getActivityHeatmap } from '@/lib/streaks';
import { createMockSupabase } from '../../setup/supabase-mock';

describe('formatUTCDate', () => {
  it('formats a standard date correctly', () => {
    const date = new Date(Date.UTC(2024, 5, 15, 12, 0, 0));
    expect(formatUTCDate(date)).toBe('2024-06-15');
  });

  it('pads single-digit month and day', () => {
    const date = new Date(Date.UTC(2024, 0, 5));
    expect(formatUTCDate(date)).toBe('2024-01-05');
  });

  it('handles month boundary (end of December)', () => {
    const date = new Date(Date.UTC(2024, 11, 31));
    expect(formatUTCDate(date)).toBe('2024-12-31');
  });

  it('handles year boundary (Jan 1)', () => {
    const date = new Date(Date.UTC(2025, 0, 1));
    expect(formatUTCDate(date)).toBe('2025-01-01');
  });

  it('handles leap day', () => {
    const date = new Date(Date.UTC(2024, 1, 29));
    expect(formatUTCDate(date)).toBe('2024-02-29');
  });

  it('handles end of February in non-leap year', () => {
    const date = new Date(Date.UTC(2023, 1, 28));
    expect(formatUTCDate(date)).toBe('2023-02-28');
  });

  it('formats double-digit month and day correctly', () => {
    const date = new Date(Date.UTC(2024, 10, 25));
    expect(formatUTCDate(date)).toBe('2024-11-25');
  });
});

describe('formatDateInTimezone', () => {
  it('formats a date in UTC by default', () => {
    const date = new Date(Date.UTC(2024, 5, 15, 23, 30, 0));
    expect(formatDateInTimezone(date)).toBe('2024-06-15');
  });

  it('formats a date in a specific timezone', () => {
    // 11pm UTC on June 15 = June 15 in UTC, but June 16 in UTC+2
    const date = new Date(Date.UTC(2024, 5, 15, 23, 30, 0));
    const result = formatDateInTimezone(date, 'Europe/Helsinki');
    // Helsinki is UTC+3 in summer, so 23:30 UTC = June 16 02:30 local
    expect(result).toBe('2024-06-16');
  });

  it('falls back to UTC for invalid timezone', () => {
    const date = new Date(Date.UTC(2024, 5, 15, 12, 0, 0));
    const result = formatDateInTimezone(date, 'Invalid/Timezone');
    expect(result).toBe('2024-06-15');
  });

  it('handles US Pacific timezone (late night stays same day)', () => {
    // 6am UTC on June 15 = June 14 at 11pm PT (UTC-7 summer)
    const date = new Date(Date.UTC(2024, 5, 15, 6, 0, 0));
    const result = formatDateInTimezone(date, 'America/Los_Angeles');
    expect(result).toBe('2024-06-14');
  });
});

describe('getHourInTimezone', () => {
  it('returns UTC hour by default', () => {
    const date = new Date(Date.UTC(2024, 5, 15, 14, 30, 0));
    expect(getHourInTimezone(date)).toBe(14);
  });

  it('returns hour in specified timezone', () => {
    // 14:00 UTC = 7:00 AM in America/Los_Angeles (UTC-7 summer)
    const date = new Date(Date.UTC(2024, 5, 15, 14, 0, 0));
    expect(getHourInTimezone(date, 'America/Los_Angeles')).toBe(7);
  });

  it('falls back to UTC hours for invalid timezone', () => {
    const date = new Date(Date.UTC(2024, 5, 15, 14, 0, 0));
    expect(getHourInTimezone(date, 'Invalid/Zone')).toBe(14);
  });

  it('handles midnight boundary', () => {
    const date = new Date(Date.UTC(2024, 5, 15, 0, 0, 0));
    expect(getHourInTimezone(date, 'UTC')).toBe(0);
  });

  it('handles hour 23', () => {
    const date = new Date(Date.UTC(2024, 5, 15, 23, 59, 0));
    expect(getHourInTimezone(date, 'UTC')).toBe(23);
  });
});

describe('calculateStreak', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-06-15T12:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns zeros when no pacts exist', async () => {
    const { supabase, builder } = createMockSupabase();
    builder.mockReturnValue({ data: [], error: null });

    const result = await calculateStreak(supabase, 'user-1');
    expect(result).toEqual({ currentStreak: 0, longestStreak: 0, totalCompleted: 0 });
  });

  it('returns zeros on error', async () => {
    const { supabase, builder } = createMockSupabase();
    builder.mockReturnValue({ data: null, error: { message: 'DB error' } });

    const result = await calculateStreak(supabase, 'user-1');
    expect(result).toEqual({ currentStreak: 0, longestStreak: 0, totalCompleted: 0 });
  });

  it('counts a streak of consecutive days ending today', async () => {
    const { supabase, builder } = createMockSupabase();

    const today = new Date();
    const dates = [];
    for (let i = 0; i < 3; i++) {
      const d = new Date(today);
      d.setUTCDate(d.getUTCDate() - i);
      dates.push({ completed_at: d.toISOString(), status: 'completed' });
    }

    builder.mockReturnValue({ data: dates, error: null });

    const result = await calculateStreak(supabase, 'user-1');
    expect(result.currentStreak).toBe(3);
    expect(result.longestStreak).toBe(3);
    expect(result.totalCompleted).toBe(3);
  });

  it('counts totalCompleted even when streak is broken', async () => {
    const { supabase, builder } = createMockSupabase();

    const old1 = new Date();
    old1.setUTCDate(old1.getUTCDate() - 30);
    const old2 = new Date();
    old2.setUTCDate(old2.getUTCDate() - 60);

    builder.mockReturnValue({
      data: [
        { completed_at: old1.toISOString(), status: 'completed' },
        { completed_at: old2.toISOString(), status: 'completed' },
      ],
      error: null,
    });

    const result = await calculateStreak(supabase, 'user-1');
    expect(result.currentStreak).toBe(0);
    expect(result.totalCompleted).toBe(2);
  });

  it('counts yesterday as continuing the streak', async () => {
    const { supabase, builder } = createMockSupabase();

    // Streak ended yesterday (not today) — should still count
    const yesterday = new Date();
    yesterday.setUTCDate(yesterday.getUTCDate() - 1);
    const dayBefore = new Date();
    dayBefore.setUTCDate(dayBefore.getUTCDate() - 2);

    builder.mockReturnValue({
      data: [
        { completed_at: yesterday.toISOString(), status: 'completed' },
        { completed_at: dayBefore.toISOString(), status: 'completed' },
      ],
      error: null,
    });

    const result = await calculateStreak(supabase, 'user-1');
    expect(result.currentStreak).toBe(2);
    expect(result.longestStreak).toBe(2);
  });

  it('returns longest streak greater than current when there was a gap', async () => {
    const { supabase, builder } = createMockSupabase();

    // Today + yesterday = current streak of 2
    // But 10 days ago had a 4-day streak
    const today = new Date();
    const dates = [
      { completed_at: today.toISOString(), status: 'completed' },
      { completed_at: new Date(today.getTime() - 1 * 86400000).toISOString(), status: 'completed' },
      // Gap
      { completed_at: new Date(today.getTime() - 10 * 86400000).toISOString(), status: 'completed' },
      { completed_at: new Date(today.getTime() - 11 * 86400000).toISOString(), status: 'completed' },
      { completed_at: new Date(today.getTime() - 12 * 86400000).toISOString(), status: 'completed' },
      { completed_at: new Date(today.getTime() - 13 * 86400000).toISOString(), status: 'completed' },
    ];

    builder.mockReturnValue({ data: dates, error: null });

    const result = await calculateStreak(supabase, 'user-1');
    expect(result.currentStreak).toBe(2);
    expect(result.longestStreak).toBe(4);
  });

  it('deduplicates multiple completions on the same day', async () => {
    const { supabase, builder } = createMockSupabase();

    const today = new Date();
    // Two completions on the same day should count as one day
    builder.mockReturnValue({
      data: [
        { completed_at: today.toISOString(), status: 'completed' },
        { completed_at: new Date(today.getTime() - 3600000).toISOString(), status: 'completed' },
      ],
      error: null,
    });

    const result = await calculateStreak(supabase, 'user-1');
    expect(result.currentStreak).toBe(1);
  });

  it('accepts a timezone parameter for date bucketing', async () => {
    const { supabase, builder } = createMockSupabase();

    const today = new Date();
    builder.mockReturnValue({
      data: [
        { completed_at: today.toISOString(), status: 'completed' },
      ],
      error: null,
    });

    const result = await calculateStreak(supabase, 'user-1', 'America/New_York');
    expect(result.currentStreak).toBe(1);
  });
});

describe('getActivityHeatmap', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-06-15T12:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns empty data array on error', async () => {
    const { supabase, builder } = createMockSupabase();
    builder.mockReturnValue({ data: null, error: { message: 'DB error' } });

    const result = await getActivityHeatmap(supabase, 'user-1');
    expect(result.data).toEqual([]);
    expect(result.error).toBeTruthy();
  });

  it('returns heatmap data with correct shape', async () => {
    const { supabase, builder } = createMockSupabase();
    builder.mockReturnValue({ data: [], error: null });

    const result = await getActivityHeatmap(supabase, 'user-1', 7);
    expect(result.error).toBeNull();
    expect(result.data).toHaveLength(7);
    expect(result.data[0]).toHaveProperty('date');
    expect(result.data[0]).toHaveProperty('count');
    expect(result.data[0]).toHaveProperty('pactCount');
    expect(result.data[0]).toHaveProperty('focusCount');
    expect(result.data[0]).toHaveProperty('level');
  });

  it('assigns correct activity levels based on weighted score', async () => {
    const { supabase, builder } = createMockSupabase();

    // One pact completed today (weighted score = 2)
    const today = new Date();
    builder.mockReturnValueSequence([
      { data: [{ completed_at: today.toISOString(), status: 'completed' }], error: null },
      { data: [], error: null },
    ]);

    const result = await getActivityHeatmap(supabase, 'user-1', 1);
    expect(result.error).toBeNull();
    expect(result.data[0].pactCount).toBe(1);
    expect(result.data[0].level).toBe(2);
  });

  it('counts focus sessions in heatmap', async () => {
    const { supabase, builder } = createMockSupabase();

    const today = new Date();
    builder.mockReturnValueSequence([
      { data: [], error: null },
      { data: [{ started_at: today.toISOString(), duration_minutes: 25 }], error: null },
    ]);

    const result = await getActivityHeatmap(supabase, 'user-1', 1);
    expect(result.error).toBeNull();
    expect(result.data[0].focusCount).toBe(1);
    expect(result.data[0].level).toBe(1);
  });

  it('defaults to 365 days of data', async () => {
    const { supabase, builder } = createMockSupabase();
    builder.mockReturnValue({ data: [], error: null });

    const result = await getActivityHeatmap(supabase, 'user-1');
    expect(result.data).toHaveLength(365);
  });
});
