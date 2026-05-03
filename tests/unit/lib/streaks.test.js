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

  it('counts a streak ending yesterday as current', async () => {
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
    });

    const result = await calculateStreak(supabase, 'user-1');
    expect(result.currentStreak).toBe(2);
    expect(result.longestStreak).toBe(2);
  });

  it('finds longest streak when current streak is shorter', async () => {
    const { supabase, builder } = createMockSupabase();

    const today = new Date();
    // Current streak: just today (1 day)
    // Old streak: 3 consecutive days, 10 days ago
    const dates = [
      { completed_at: today.toISOString(), status: 'completed' },
    ];
    for (let i = 10; i <= 12; i++) {
      const d = new Date(today);
      d.setUTCDate(d.getUTCDate() - i);
      dates.push({ completed_at: d.toISOString(), status: 'completed' });
    }

    builder.mockReturnValue({ data: dates, error: null });

    const result = await calculateStreak(supabase, 'user-1');
    expect(result.currentStreak).toBe(1);
    expect(result.longestStreak).toBe(3);
  });
});

describe('formatDateInTimezone', () => {
  it('returns YYYY-MM-DD in UTC by default', () => {
    const date = new Date('2024-06-15T23:30:00Z');
    expect(formatDateInTimezone(date)).toBe('2024-06-15');
  });

  it('converts to a timezone ahead of UTC', () => {
    // 11:30pm UTC on June 15 → 5:00am June 16 in Asia/Kolkata (UTC+5:30)
    const date = new Date('2024-06-15T23:30:00Z');
    expect(formatDateInTimezone(date, 'Asia/Kolkata')).toBe('2024-06-16');
  });

  it('converts to a timezone behind UTC', () => {
    // 3:00am UTC on June 15 → 8:00pm June 14 in America/New_York (UTC-4 in summer)
    const date = new Date('2024-06-15T03:00:00Z');
    expect(formatDateInTimezone(date, 'America/New_York')).toBe('2024-06-14');
  });

  it('falls back to UTC for invalid timezone', () => {
    const date = new Date('2024-06-15T12:00:00Z');
    expect(formatDateInTimezone(date, 'Invalid/Timezone')).toBe('2024-06-15');
  });

  it('handles explicit UTC timezone', () => {
    const date = new Date('2024-06-15T12:00:00Z');
    expect(formatDateInTimezone(date, 'UTC')).toBe('2024-06-15');
  });
});

describe('getHourInTimezone', () => {
  it('returns UTC hour by default', () => {
    const date = new Date('2024-06-15T14:30:00Z');
    expect(getHourInTimezone(date)).toBe(14);
  });

  it('returns hour in timezone ahead of UTC', () => {
    // 2pm UTC → 7:30pm in Asia/Kolkata (UTC+5:30)
    const date = new Date('2024-06-15T14:00:00Z');
    expect(getHourInTimezone(date, 'Asia/Kolkata')).toBe(19);
  });

  it('returns hour in timezone behind UTC', () => {
    // 2pm UTC → 10am in America/New_York (UTC-4 in summer)
    const date = new Date('2024-06-15T14:00:00Z');
    expect(getHourInTimezone(date, 'America/New_York')).toBe(10);
  });

  it('falls back to UTC hours for invalid timezone', () => {
    const date = new Date('2024-06-15T14:00:00Z');
    expect(getHourInTimezone(date, 'Invalid/Timezone')).toBe(14);
  });

  it('handles midnight correctly', () => {
    const date = new Date('2024-06-15T00:00:00Z');
    const hour = getHourInTimezone(date, 'UTC');
    // toLocaleString with hour12:false may return 0 or 24 for midnight depending on ICU version
    expect(hour === 0 || hour === 24).toBe(true);
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
    builder.mockReturnValueSequence([
      { data: [], error: null },
      { data: [], error: null },
    ]);

    const result = await getActivityHeatmap(supabase, 'user-1', 30);
    expect(result.error).toBeNull();
    expect(result.data).toHaveLength(30);
  });

  it('returns all zero levels when no activity exists', async () => {
    const { supabase, builder } = createMockSupabase();
    builder.mockReturnValueSequence([
      { data: [], error: null },
      { data: [], error: null },
    ]);

    const result = await getActivityHeatmap(supabase, 'user-1', 7);
    expect(result.error).toBeNull();
    result.data.forEach((d) => {
      expect(d.level).toBe(0);
      expect(d.count).toBe(0);
      expect(d.pactCount).toBe(0);
      expect(d.focusCount).toBe(0);
    });
  });

  it('counts pact completions in the heatmap', async () => {
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

    const result = await getActivityHeatmap(supabase, 'user-1', 365);
    expect(result.error).toBeNull();
    const totalPacts = result.data.reduce((sum, d) => sum + d.pactCount, 0);
    expect(totalPacts).toBe(2);
  });

  it('counts focus sessions in the heatmap', async () => {
    const { supabase, builder } = createMockSupabase();
    builder.mockReturnValueSequence([
      { data: [], error: null },
      {
        data: [
          { started_at: '2024-06-14T08:00:00Z', duration_minutes: 25 },
          { started_at: '2024-06-13T09:00:00Z', duration_minutes: 50 },
        ],
        error: null,
      },
    ]);

    const result = await getActivityHeatmap(supabase, 'user-1', 365);
    expect(result.error).toBeNull();
    const totalFocus = result.data.reduce((sum, d) => sum + d.focusCount, 0);
    expect(totalFocus).toBe(2);
  });

  it('assigns correct activity levels based on weighted score', async () => {
    const { supabase, builder } = createMockSupabase();
    // 3 pacts on same day → weighted = 3*2 + 0 = 6 → level 4
    builder.mockReturnValueSequence([
      {
        data: [
          { completed_at: '2024-06-15T08:00:00Z', status: 'completed' },
          { completed_at: '2024-06-15T09:00:00Z', status: 'completed' },
          { completed_at: '2024-06-15T10:00:00Z', status: 'completed' },
        ],
        error: null,
      },
      { data: [], error: null },
    ]);

    const result = await getActivityHeatmap(supabase, 'user-1', 365);
    const highDay = result.data.find((d) => d.pactCount === 3);
    expect(highDay).toBeDefined();
    expect(highDay.level).toBe(4);
  });

  it('returns empty data and error on DB failure', async () => {
    const { supabase, builder } = createMockSupabase();
    builder.mockReturnValue({ data: null, error: { message: 'DB error' } });

    const result = await getActivityHeatmap(supabase, 'user-1');
    expect(result.data).toEqual([]);
    expect(result.error).toBeTruthy();
  });

  it('each entry has expected shape', async () => {
    const { supabase, builder } = createMockSupabase();
    builder.mockReturnValueSequence([
      { data: [], error: null },
      { data: [], error: null },
    ]);

    const result = await getActivityHeatmap(supabase, 'user-1', 7);
    result.data.forEach((entry) => {
      expect(entry).toHaveProperty('date');
      expect(entry).toHaveProperty('count');
      expect(entry).toHaveProperty('pactCount');
      expect(entry).toHaveProperty('focusCount');
      expect(entry).toHaveProperty('level');
      expect(typeof entry.date).toBe('string');
      expect(typeof entry.count).toBe('number');
    });
  });
});
