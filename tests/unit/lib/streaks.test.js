import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  formatUTCDate,
  formatDateInTimezone,
  getHourInTimezone,
  calculateStreak,
  getActivityHeatmap,
} from '@/lib/streaks';
import { createMockSupabase } from '../../setup/supabase-mock';

describe('formatUTCDate', () => {
  it('formats a standard date correctly', () => {
    // 2024-06-15 in UTC
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
  it('formats date in UTC by default', () => {
    const date = new Date('2024-06-15T23:30:00Z');
    expect(formatDateInTimezone(date)).toBe('2024-06-15');
  });

  it('formats date in a specific timezone', () => {
    const date = new Date('2024-06-15T23:30:00Z');
    const result = formatDateInTimezone(date, 'America/New_York');
    expect(result).toBe('2024-06-15');
  });

  it('handles timezone where date rolls over', () => {
    const date = new Date('2024-06-16T03:00:00Z');
    const result = formatDateInTimezone(date, 'America/Los_Angeles');
    expect(result).toBe('2024-06-15');
  });

  it('falls back to UTC on invalid timezone', () => {
    const date = new Date('2024-06-15T12:00:00Z');
    const result = formatDateInTimezone(date, 'Invalid/Timezone');
    expect(result).toBe('2024-06-15');
  });
});

describe('getHourInTimezone', () => {
  it('returns UTC hour by default', () => {
    const date = new Date('2024-06-15T14:30:00Z');
    expect(getHourInTimezone(date)).toBe(14);
  });

  it('returns hour in specific timezone', () => {
    const date = new Date('2024-06-15T14:00:00Z');
    const hour = getHourInTimezone(date, 'America/New_York');
    expect(hour).toBe(10);
  });

  it('falls back to UTC hours on invalid timezone', () => {
    const date = new Date('2024-06-15T14:30:00Z');
    const hour = getHourInTimezone(date, 'Invalid/Timezone');
    expect(hour).toBe(14);
  });

  it('handles midnight crossing', () => {
    const date = new Date('2024-06-16T02:00:00Z');
    const hour = getHourInTimezone(date, 'America/Los_Angeles');
    expect(hour).toBe(19);
  });
});

describe('calculateStreak', () => {
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

    // Two completions far apart — no active streak
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

  it('counts streak starting from yesterday', async () => {
    const { supabase, builder } = createMockSupabase();

    const yesterday = new Date();
    yesterday.setUTCDate(yesterday.getUTCDate() - 1);
    const twoDaysAgo = new Date();
    twoDaysAgo.setUTCDate(twoDaysAgo.getUTCDate() - 2);

    builder.mockReturnValue({
      data: [
        { completed_at: yesterday.toISOString(), status: 'completed' },
        { completed_at: twoDaysAgo.toISOString(), status: 'completed' },
      ],
      error: null,
      count: 2,
    });

    const result = await calculateStreak(supabase, 'user-1');
    expect(result.currentStreak).toBe(2);
  });

  it('detects longest streak is longer than current', async () => {
    const { supabase, builder } = createMockSupabase();

    const today = new Date();
    const dates = [];
    dates.push({ completed_at: today.toISOString(), status: 'completed' });

    for (let i = 10; i < 15; i++) {
      const d = new Date(today);
      d.setUTCDate(d.getUTCDate() - i);
      dates.push({ completed_at: d.toISOString(), status: 'completed' });
    }

    builder.mockReturnValue({
      data: dates,
      error: null,
      count: dates.length,
    });

    const result = await calculateStreak(supabase, 'user-1');
    expect(result.currentStreak).toBe(1);
    expect(result.longestStreak).toBeGreaterThanOrEqual(result.currentStreak);
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

  it('returns heatmap data for 365 days', async () => {
    const { supabase, builder } = createMockSupabase();
    builder.mockReturnValueSequence([
      { data: [], error: null },
      { data: [], error: null },
    ]);

    const result = await getActivityHeatmap(supabase, 'user-1');
    expect(result.error).toBeNull();
    expect(result.data).toHaveLength(365);
    expect(result.data[0].count).toBe(0);
    expect(result.data[0].level).toBe(0);
  });

  it('counts pact completions and focus sessions', async () => {
    const { supabase, builder } = createMockSupabase();
    builder.mockReturnValueSequence([
      {
        data: [
          { completed_at: '2024-06-15T10:00:00Z', status: 'completed' },
          { completed_at: '2024-06-15T14:00:00Z', status: 'completed' },
        ],
        error: null,
      },
      {
        data: [
          { started_at: '2024-06-15T09:00:00Z', duration_minutes: 25 },
        ],
        error: null,
      },
    ]);

    const result = await getActivityHeatmap(supabase, 'user-1');
    expect(result.error).toBeNull();
    const today = result.data[result.data.length - 1];
    expect(today.pactCount).toBe(2);
    expect(today.focusCount).toBe(1);
    expect(today.count).toBe(3);
  });

  it('assigns correct activity levels', async () => {
    const { supabase, builder } = createMockSupabase();
    builder.mockReturnValueSequence([
      { data: [], error: null },
      { data: [], error: null },
    ]);

    const result = await getActivityHeatmap(supabase, 'user-1');
    expect(result.data[0].level).toBe(0);
  });

  it('returns empty array on pacts DB error', async () => {
    const { supabase, builder } = createMockSupabase();
    builder.mockReturnValue({ data: null, error: { message: 'DB error' } });

    const result = await getActivityHeatmap(supabase, 'user-1');
    expect(result.data).toEqual([]);
    expect(result.error).toBeTruthy();
  });

  it('returns empty array on focus sessions DB error', async () => {
    const { supabase, builder } = createMockSupabase();
    builder.mockReturnValueSequence([
      { data: [], error: null },
      { data: null, error: { message: 'Focus error' } },
    ]);

    const result = await getActivityHeatmap(supabase, 'user-1');
    expect(result.data).toEqual([]);
    expect(result.error).toBeTruthy();
  });

  it('handles custom day range', async () => {
    const { supabase, builder } = createMockSupabase();
    builder.mockReturnValueSequence([
      { data: [], error: null },
      { data: [], error: null },
    ]);

    const result = await getActivityHeatmap(supabase, 'user-1', 30);
    expect(result.data).toHaveLength(30);
  });
});
