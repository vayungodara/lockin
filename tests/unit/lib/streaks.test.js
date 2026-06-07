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

  it('returns UTC for undefined timezone', () => {
    const date = new Date(Date.UTC(2024, 0, 1));
    expect(formatDateInTimezone(date, undefined)).toBe('2024-01-01');
  });

  it('falls back to formatUTCDate for invalid timezone', () => {
    const date = new Date(Date.UTC(2024, 5, 15));
    const result = formatDateInTimezone(date, 'Invalid/Timezone');
    expect(result).toBe('2024-06-15');
  });

  it('handles explicit UTC timezone string', () => {
    const date = new Date('2024-12-31T23:59:59Z');
    expect(formatDateInTimezone(date, 'UTC')).toBe('2024-12-31');
  });
});

describe('getHourInTimezone', () => {
  it('returns UTC hour by default', () => {
    const date = new Date('2024-06-15T14:30:00Z');
    expect(getHourInTimezone(date)).toBe(14);
  });

  it('returns UTC hour for explicit UTC timezone at midnight', () => {
    const date = new Date('2024-06-15T00:00:00Z');
    const hour = getHourInTimezone(date, 'UTC');
    // toLocaleString with hour12:false may return 24 for midnight in some ICU versions
    expect(hour === 0 || hour === 24).toBe(true);
  });

  it('returns midnight correctly', () => {
    const date = new Date('2024-06-15T00:00:00Z');
    const hour = getHourInTimezone(date);
    expect(hour === 0 || hour === 24).toBe(true);
  });

  it('returns 23 for end of day', () => {
    const date = new Date('2024-06-15T23:59:59Z');
    expect(getHourInTimezone(date, 'UTC')).toBe(23);
  });

  it('falls back to UTC hours for invalid timezone', () => {
    const date = new Date('2024-06-15T14:30:00Z');
    expect(getHourInTimezone(date, 'Invalid/TZ')).toBe(14);
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

  it('tracks longest streak across a gap', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-06-15T12:00:00Z'));

    const { supabase, builder } = createMockSupabase();

    const dates = [
      { completed_at: '2024-06-15T10:00:00Z', status: 'completed' },
      { completed_at: '2024-06-14T10:00:00Z', status: 'completed' },
      { completed_at: '2024-06-12T10:00:00Z', status: 'completed' },
      { completed_at: '2024-06-11T10:00:00Z', status: 'completed' },
      { completed_at: '2024-06-10T10:00:00Z', status: 'completed' },
      { completed_at: '2024-06-09T10:00:00Z', status: 'completed' },
    ];

    builder.mockReturnValue({ data: dates, error: null });

    const result = await calculateStreak(supabase, 'user-1');
    expect(result.currentStreak).toBe(2);
    expect(result.longestStreak).toBe(4);

    vi.useRealTimers();
  });

  it('counts streak starting from yesterday', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-06-15T12:00:00Z'));

    const { supabase, builder } = createMockSupabase();

    const dates = [
      { completed_at: '2024-06-14T10:00:00Z', status: 'completed' },
      { completed_at: '2024-06-13T10:00:00Z', status: 'completed' },
      { completed_at: '2024-06-12T10:00:00Z', status: 'completed' },
    ];

    builder.mockReturnValue({ data: dates, error: null });

    const result = await calculateStreak(supabase, 'user-1');
    expect(result.currentStreak).toBe(3);

    vi.useRealTimers();
  });

  it('deduplicates multiple completions on the same day', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-06-15T12:00:00Z'));

    const { supabase, builder } = createMockSupabase();

    const dates = [
      { completed_at: '2024-06-15T08:00:00Z', status: 'completed' },
      { completed_at: '2024-06-15T14:00:00Z', status: 'completed' },
      { completed_at: '2024-06-14T10:00:00Z', status: 'completed' },
    ];

    builder.mockReturnValue({ data: dates, error: null });

    const result = await calculateStreak(supabase, 'user-1');
    expect(result.currentStreak).toBe(2);
    expect(result.longestStreak).toBe(2);

    vi.useRealTimers();
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

  it('returns heatmap with correct number of days', async () => {
    const { supabase, builder } = createMockSupabase();
    builder.mockReturnValue({ data: [], error: null });

    const result = await getActivityHeatmap(supabase, 'user-1', 7);
    expect(result.error).toBeNull();
    expect(result.data).toHaveLength(7);
  });

  it('all days have level 0 when no activity', async () => {
    const { supabase, builder } = createMockSupabase();
    builder.mockReturnValue({ data: [], error: null });

    const result = await getActivityHeatmap(supabase, 'user-1', 7);
    result.data.forEach((day) => {
      expect(day.count).toBe(0);
      expect(day.level).toBe(0);
      expect(day.pactCount).toBe(0);
      expect(day.focusCount).toBe(0);
    });
  });

  it('counts pact completions in heatmap', async () => {
    const { supabase, builder } = createMockSupabase();
    builder.mockReturnValueSequence([
      {
        data: [
          { completed_at: '2024-06-15T10:00:00Z', status: 'completed' },
          { completed_at: '2024-06-15T14:00:00Z', status: 'completed' },
        ],
        error: null,
      },
      { data: [], error: null },
    ]);

    const result = await getActivityHeatmap(supabase, 'user-1', 7);
    expect(result.error).toBeNull();

    const today = result.data.find((d) => d.date === '2024-06-15');
    expect(today.pactCount).toBe(2);
    expect(today.focusCount).toBe(0);
    expect(today.count).toBe(2);
    expect(today.level).toBeGreaterThan(0);
  });

  it('counts focus sessions in heatmap', async () => {
    const { supabase, builder } = createMockSupabase();
    builder.mockReturnValueSequence([
      { data: [], error: null },
      {
        data: [
          { started_at: '2024-06-14T09:00:00Z', duration_minutes: 25 },
        ],
        error: null,
      },
    ]);

    const result = await getActivityHeatmap(supabase, 'user-1', 7);
    const yesterday = result.data.find((d) => d.date === '2024-06-14');
    expect(yesterday.focusCount).toBe(1);
  });

  it('returns empty data and error on pacts query failure', async () => {
    const { supabase, builder } = createMockSupabase();
    builder.mockReturnValue({ data: null, error: { message: 'DB error' } });

    const result = await getActivityHeatmap(supabase, 'user-1');
    expect(result.data).toEqual([]);
    expect(result.error).toBeTruthy();
  });

  it('returns empty data and error on focus_sessions query failure', async () => {
    const { supabase, builder } = createMockSupabase();
    builder.mockReturnValueSequence([
      { data: [], error: null },
      { data: null, error: { message: 'focus error' } },
    ]);

    const result = await getActivityHeatmap(supabase, 'user-1');
    expect(result.data).toEqual([]);
    expect(result.error).toBeTruthy();
  });

  it('skips entries with null completed_at or started_at', async () => {
    const { supabase, builder } = createMockSupabase();
    builder.mockReturnValueSequence([
      { data: [{ completed_at: null, status: 'pending' }], error: null },
      { data: [{ started_at: null, duration_minutes: 25 }], error: null },
    ]);

    const result = await getActivityHeatmap(supabase, 'user-1', 7);
    result.data.forEach((day) => {
      expect(day.count).toBe(0);
    });
  });

  it('each day has a date string and required shape', async () => {
    const { supabase, builder } = createMockSupabase();
    builder.mockReturnValue({ data: [], error: null });

    const result = await getActivityHeatmap(supabase, 'user-1', 3);
    expect(result.data).toHaveLength(3);
    result.data.forEach((day) => {
      expect(day).toHaveProperty('date');
      expect(day).toHaveProperty('count');
      expect(day).toHaveProperty('pactCount');
      expect(day).toHaveProperty('focusCount');
      expect(day).toHaveProperty('level');
    });
  });
});
