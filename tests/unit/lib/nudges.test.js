import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { sendNudge } from '@/lib/nudges';
import { createMockSupabase } from '../../setup/supabase-mock';

describe('sendNudge', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-06-15T12:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns not authenticated when no user', async () => {
    const { supabase } = createMockSupabase();
    supabase.auth.getUser.mockResolvedValue({ data: { user: null }, error: null });

    const result = await sendNudge(supabase, 'target-user');
    expect(result).toEqual({ success: false, error: 'Not authenticated' });
  });

  it('returns rate limit error when nudged recently', async () => {
    const { supabase, builder } = createMockSupabase();
    builder.mockReturnValue({ data: [{ id: 'existing-nudge' }], error: null });

    const result = await sendNudge(supabase, 'target-user');
    expect(result.success).toBe(false);
    expect(result.error).toContain('once per hour');
  });

  it('returns success on happy path', async () => {
    const { supabase, builder } = createMockSupabase();
    builder.mockReturnValueSequence([
      { data: [], error: null },
      { data: null, error: null },
      { data: { full_name: 'Alice' }, error: null },
      { data: null, error: null },
    ]);

    const result = await sendNudge(supabase, 'target-user');
    expect(result.success).toBe(true);
  });

  it('returns failure on insert error', async () => {
    const { supabase, builder } = createMockSupabase();
    builder.mockReturnValueSequence([
      { data: [], error: null },
      { data: null, error: { message: 'insert failed' } },
    ]);

    const result = await sendNudge(supabase, 'target-user');
    expect(result.success).toBe(false);
    expect(result.error).toBe('insert failed');
  });

  it('uses "Someone" when sender profile is missing', async () => {
    const { supabase, builder } = createMockSupabase();
    builder.mockReturnValueSequence([
      { data: [], error: null },
      { data: null, error: null },
      { data: null, error: null },
      { data: null, error: null },
    ]);

    const result = await sendNudge(supabase, 'target-user');
    expect(result.success).toBe(true);
    const notificationInsert = builder.insert.mock.calls[1]?.[0];
    expect(notificationInsert.message).toContain('Someone nudged you');
  });
});
