import { describe, it, expect, vi } from 'vitest';
import { sendNudge } from '@/lib/nudges';
import { createMockSupabase } from '../../setup/supabase-mock';

vi.mock('@/lib/notifications', () => ({
  createNotification: vi.fn().mockResolvedValue({ success: true }),
  NOTIFICATION_TYPES: { NUDGE_RECEIVED: 'nudge_received' },
}));

describe('sendNudge', () => {
  it('returns success when nudge is sent', async () => {
    const { supabase, builder } = createMockSupabase();
    builder.mockReturnValueSequence([
      { data: [], error: null },
      { data: null, error: null },
      { data: { full_name: 'Alice' }, error: null },
    ]);

    const result = await sendNudge(supabase, 'target-user-id');
    expect(result.success).toBe(true);
  });

  it('returns failure when not authenticated', async () => {
    const { supabase } = createMockSupabase();
    supabase.auth.getUser.mockResolvedValue({ data: { user: null }, error: null });

    const result = await sendNudge(supabase, 'target-user-id');
    expect(result.success).toBe(false);
    expect(result.error).toBe('Not authenticated');
  });

  it('returns rate limit error when nudged recently', async () => {
    const { supabase, builder } = createMockSupabase();
    builder.mockReturnValue({
      data: [{ id: 'existing-nudge' }],
      error: null,
    });

    const result = await sendNudge(supabase, 'target-user-id');
    expect(result.success).toBe(false);
    expect(result.error).toBe('You can only nudge this person once per hour');
  });

  it('returns failure on insert error', async () => {
    const { supabase, builder } = createMockSupabase();
    builder.mockReturnValueSequence([
      { data: [], error: null },
      { data: null, error: { message: 'Insert failed' } },
    ]);

    const result = await sendNudge(supabase, 'target-user-id');
    expect(result.success).toBe(false);
  });
});
