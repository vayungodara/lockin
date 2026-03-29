import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { formatUTCDate, formatDateInTimezone, getHourInTimezone, calculateStreak } from '@/lib/streaks';
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
});

describe('formatDateInTimezone', () => {
  it('formats a date in UTC', () => {
    const date = new Date('2024-06-15T23:00:00Z');
    expect(formatDateInTimezone(date, 'UTC')).toBe('2024-06-15');
  });

  it('converts to a different timezone', () => {
    // 11pm UTC on June 15 is still June 15 in UTC but June 16 in UTC+2
    const date = new Date('2024-06-15T23:00:00Z');
    const result = formatDateInTimezone(date, 'Europe/Helsinki'); // UTC+3 in summer
    expect(result).toBe('2024-06-16');
  });

  it('falls back to UTC for invalid timezone', () => {
    const date = new Date('2024-06-15T12:00:00Z');
    const result = formatDateInTimezone(date, 'Invalid/Timezone');
    expect(result).toBe('2024-06-15');
  });

  it('defaults to UTC when no timezone provided', () => {
    const date = new Date('2024-06-15T12:00:00Z');
    expect(formatDateInTimezone(date)).toBe('2024-06-15');
  });

  it('handles date near midnight correctly', () => {
    // 1am UTC on Jan 1 is still Dec 31 in US Pacific (UTC-8)
    const date = new Date('2024-01-01T01:00:00Z');
    const result = formatDateInTimezone(date, 'America/Los_Angeles');
    expect(result).toBe('2023-12-31');
  });
});

describe('getHourInTimezone', () => {
  it('returns UTC hour by default', () => {
    const date = new Date('2024-06-15T14:30:00Z');
    expect(getHourInTimezone(date)).toBe(14);
  });

  it('returns hour in specified timezone', () => {
    // 2pm UTC = 7am in US Pacific (PDT, UTC-7)
    const date = new Date('2024-06-15T14:00:00Z');
    expect(getHourInTimezone(date, 'America/Los_Angeles')).toBe(7);
  });

  it('falls back to UTC hours for invalid timezone', () => {
    const date = new Date('2024-06-15T14:00:00Z');
    expect(getHourInTimezone(date, 'Invalid/TZ')).toBe(14);
  });

  it('handles midnight correctly', () => {
    const date = new Date('2024-06-15T00:00:00Z');
    expect(getHourInTimezone(date, 'UTC')).toBe(0);
  });

  it('handles 11pm correctly', () => {
    const date = new Date('2024-06-15T23:00:00Z');
    expect(getHourInTimezone(date, 'UTC')).toBe(23);
  });
});
