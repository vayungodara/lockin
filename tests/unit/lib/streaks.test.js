import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { formatUTCDate, formatDateInTimezone, getHourInTimezone, calculateStreak, getActivityHeatmap } from '@/lib/streaks';
import { createMockSupabase, createTableMock } from '../../setup/supabase-mock';

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
});

describe('formatDateInTimezone', () => {
  it('returns YYYY-MM-DD in the given timezone', () => {
    const date = new Date('2024-06-16T00:30:00Z');
    expect(formatDateInTimezone(date, 'America/Los_Angeles')).toBe('2024-06-15');
  });

  it('defaults to UTC when no timezone provided', () => {
    const date = new Date('2024-06-16T00:30:00Z');
    expect(formatDateInTimezone(date)).toBe('2024-06-16');
  });

  it('falls back to UTC for invalid timezone', () => {
    const date = new Date('2024-06-15T12:00:00Z');
    expect(formatDateInTimezone(date, 'Invalid/Zone')).toBe('2024-06-15');
  });

  it('handles timezone that crosses date boundary forward', () => {
    const date = new Date('2024-06-15T23:30:00Z');
    expect(formatDateInTimezone(date, 'Asia/Tokyo')).toBe('2024-06-16');
  });
});

describe('getHourInTimezone', () => {
  it('returns the hour in the given timezone', () => {
    const date = new Date('2024-06-15T12:00:00Z');
    expect(getHourInTimezone(date, 'America/Los_Angeles')).toBe(5);
  });

  it('defaults to UTC', () => {
    const date = new Date('2024-06-15T14:30:00Z');
    expect(getHourInTimezone(date)).toBe(14);
  });

  it('falls back to UTC hours for invalid timezone', () => {
    const date = new Date('2024-06-15T14:30:00Z');
    expect(getHourInTimezone(date, 'Invalid/Zone')).toBe(14);
  });

  it('handles midnight correctly', () => {
    const date = new Date('2024-06-15T00:00:00Z');
    expect(getHourInTimezone(date, 'UTC')).toBe(0);
  });

  it('handles hour 23 correctly', () => {
    const date = new Date('2024-06-15T23:59:00Z');
    expect(getHourInTimezone(date, 'UTC')).toBe(23);
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

  it('returns heatmap data with correct activity levels', async () => {
    const { supabase } = createTableMock();
    supabase.from('pacts').resolveWith({
      data: [
        { completed_at: '2024-06-15T10:00:00Z', status: 'completed' },
        { completed_at: '2024-06-14T10:00:00Z', status: 'completed' },
      ],
      error: null,
    });
    supabase.from('focus_sessions').resolveWith({
      data: [
        { started_at: '2024-06-15T09:00:00Z', duration_minutes: 25 },
      ],
      error: null,
    });

    const result = await getActivityHeatmap(supabase, 'user-1', 3);

    expect(result.error).toBeNull();
    expect(result.data).toHaveLength(3);
    expect(result.data[0]).toMatchObject({ date: '2024-06-13', count: 0, level: 0 });
    expect(result.data[1]).toMatchObject({ date: '2024-06-14', pactCount: 1, focusCount: 0, level: 2 });
    expect(result.data[2]).toMatchObject({ date: '2024-06-15', pactCount: 1, focusCount: 1, level: 2 });
  });

  it('returns all-zero heatmap when no activity exists', async () => {
    const { supabase } = createTableMock();
    supabase.from('pacts').resolveWith({ data: [], error: null });
    supabase.from('focus_sessions').resolveWith({ data: [], error: null });

    const result = await getActivityHeatmap(supabase, 'user-1', 3);

    expect(result.error).toBeNull();
    expect(result.data).toHaveLength(3);
    expect(result.data.every(d => d.count === 0 && d.level === 0)).toBe(true);
  });

  it('returns empty data array on pacts query error', async () => {
    const { supabase } = createTableMock();
    supabase.from('pacts').resolveWith({ data: null, error: { message: 'DB error' } });

    const result = await getActivityHeatmap(supabase, 'user-1', 3);

    expect(result.data).toEqual([]);
    expect(result.error).toBeTruthy();
  });

  it('returns empty data array on focus_sessions query error', async () => {
    const { supabase } = createTableMock();
    supabase.from('pacts').resolveWith({ data: [], error: null });
    supabase.from('focus_sessions').resolveWith({ data: null, error: { message: 'Focus error' } });

    const result = await getActivityHeatmap(supabase, 'user-1', 3);

    expect(result.data).toEqual([]);
    expect(result.error).toBeTruthy();
  });

  it('assigns correct activity levels based on weighted score', async () => {
    const { supabase } = createTableMock();
    supabase.from('pacts').resolveWith({
      data: [
        { completed_at: '2024-06-15T01:00:00Z', status: 'completed' },
        { completed_at: '2024-06-15T02:00:00Z', status: 'completed' },
        { completed_at: '2024-06-15T03:00:00Z', status: 'completed' },
      ],
      error: null,
    });
    supabase.from('focus_sessions').resolveWith({ data: [], error: null });

    const result = await getActivityHeatmap(supabase, 'user-1', 1);

    expect(result.data).toHaveLength(1);
    expect(result.data[0].pactCount).toBe(3);
    expect(result.data[0].level).toBe(4);
  });

  it('handles null pact completed_at gracefully', async () => {
    const { supabase } = createTableMock();
    supabase.from('pacts').resolveWith({
      data: [
        { completed_at: null, status: 'completed' },
        { completed_at: '2024-06-15T10:00:00Z', status: 'completed' },
      ],
      error: null,
    });
    supabase.from('focus_sessions').resolveWith({ data: [], error: null });

    const result = await getActivityHeatmap(supabase, 'user-1', 1);

    expect(result.data[0].pactCount).toBe(1);
  });
});
