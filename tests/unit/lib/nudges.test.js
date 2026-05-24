import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { sendNudge } from '@/lib/nudges';
import { createMockSupabase } from '../../setup/supabase-mock';

vi.mock('@/lib/notifications', () => ({
  createNotification: vi.fn().mockResolvedValue({ data: null, error: null }),
  NOTIFICATION_TYPES: { NUDGE_RECEIVED: 'nudge_received' },
}));

describe('sendNudge', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-06-15T12:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns not authenticated when user is null', async () => {
    const { supabase } = createMockSupabase();
    supabase.auth.getUser.mockResolvedValue({ data: { user: null }, error: null });

    const result = await sendNudge(supabase, 'target-user');
    expect(result).toEqual({ success: false, error: 'Not authenticated' });
  });

  it('returns rate limit error when nudged recently', async () => {
    const { supabase, builder } = createMockSupabase();
    builder.mockReturnValue({
      data: [{ id: 'existing-nudge' }],
      error: null,
    });

    const result = await sendNudge(supabase, 'target-user');
    expect(result.success).toBe(false);
    expect(result.error).toBe('You can only nudge this person once per hour');
  });

  it('sends nudge successfully when no recent nudge exists', async () => {
    const { supabase, builder } = createMockSupabase();
    builder.mockReturnValueSequence([
      { data: [], error: null },
      { data: null, error: null },
      { data: { full_name: 'Sender' }, error: null },
    ]);

    const result = await sendNudge(supabase, 'target-user');
    expect(result).toEqual({ success: true });
  });

  it('returns failure on insert error', async () => {
    const { supabase, builder } = createMockSupabase();
    builder.mockReturnValueSequence([
      { data: [], error: null },
      { data: null, error: { message: 'Insert failed' } },
    ]);

    const result = await sendNudge(supabase, 'target-user');
    expect(result.success).toBe(false);
    expect(result.error).toBe('Insert failed');
  });

  it('handles null recent nudge data gracefully', async () => {
    const { supabase, builder } = createMockSupabase();
    builder.mockReturnValueSequence([
      { data: null, error: null },
      { data: null, error: null },
      { data: { full_name: 'Sender' }, error: null },
    ]);

    const result = await sendNudge(supabase, 'target-user');
    expect(result).toEqual({ success: true });
  });
});
