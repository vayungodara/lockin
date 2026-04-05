import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  formatRelativeTime,
  getActionInfo,
  logActivity,
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
  it('is an array containing task_deleted', () => {
    expect(Array.isArray(HIDDEN_FEED_ACTIONS)).toBe(true);
    expect(HIDDEN_FEED_ACTIONS).toContain('task_deleted');
  });
});

describe('TEST_DATA_PATTERNS', () => {
  it('is an array of RegExp patterns', () => {
    expect(Array.isArray(TEST_DATA_PATTERNS)).toBe(true);
    TEST_DATA_PATTERNS.forEach((pattern) => {
      expect(pattern).toBeInstanceOf(RegExp);
    });
  });

  it('matches "Bulk Test" titles', () => {
    const matches = TEST_DATA_PATTERNS.some((p) => p.test('Bulk Test items'));
    expect(matches).toBe(true);
  });

  it('matches "Test #123" titles', () => {
    const matches = TEST_DATA_PATTERNS.some((p) => p.test('Test #42'));
    expect(matches).toBe(true);
  });

  it('matches "[TEST]" titles', () => {
    const matches = TEST_DATA_PATTERNS.some((p) => p.test('[TEST] my pact'));
    expect(matches).toBe(true);
  });

  it('does not match normal titles', () => {
    const matches = TEST_DATA_PATTERNS.some((p) => p.test('Study for exam'));
    expect(matches).toBe(false);
  });
});

describe('logActivity', () => {
  it('returns success when insert succeeds', async () => {
    const { supabase, builder } = createMockSupabase();
    builder.mockReturnValue({ data: null, error: null });

    const result = await logActivity(supabase, 'pact_created', null, { title: 'Test' });
    expect(result).toEqual({ success: true });
  });

  it('returns failure when user is not authenticated', async () => {
    const { supabase, builder } = createMockSupabase();
    supabase.auth.getUser.mockResolvedValue({
      data: { user: null },
      error: null,
    });
    builder.mockReturnValue({ data: null, error: null });

    const result = await logActivity(supabase, 'pact_created', null);
    expect(result.success).toBe(false);
    expect(result.error).toBe('Not authenticated');
  });

  it('returns failure when auth throws an error', async () => {
    const { supabase, builder } = createMockSupabase();
    supabase.auth.getUser.mockResolvedValue({
      data: { user: null },
      error: { message: 'Auth failed' },
    });
    builder.mockReturnValue({ data: null, error: null });

    const result = await logActivity(supabase, 'pact_created', null);
    expect(result.success).toBe(false);
  });

  it('returns failure when insert returns an error', async () => {
    const { supabase, builder } = createMockSupabase();
    builder.mockReturnValue({ data: null, error: { message: 'Insert failed' } });

    const result = await logActivity(supabase, 'pact_created', null, { title: 'Test' });
    expect(result.success).toBe(false);
    expect(result.error).toEqual({ message: 'Insert failed' });
  });

  it('handles non-object metadata gracefully', async () => {
    const { supabase, builder } = createMockSupabase();
    builder.mockReturnValue({ data: null, error: null });

    const result = await logActivity(supabase, 'pact_created', null, 'not-an-object');
    expect(result.success).toBe(true);
  });
});
