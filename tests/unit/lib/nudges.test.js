import { describe, it, expect, vi } from 'vitest';
import { createMockSupabase } from '../../setup/supabase-mock';

vi.mock('@/lib/notifications', () => ({
  createNotification: vi.fn().mockResolvedValue({ error: null }),
  NOTIFICATION_TYPES: {
    NUDGE_RECEIVED: 'nudge_received',
  },
}));

import { sendNudge } from '@/lib/nudges';

describe('sendNudge', () => {
  it('sends a nudge successfully when no recent nudge exists', async () => {
    const { supabase, builder } = createMockSupabase();
    builder.mockReturnValueSequence([
      { data: [], error: null },
      { data: null, error: null },
      { data: { full_name: 'Alice' }, error: null },
    ]);

    const result = await sendNudge(supabase, 'target-user-id');
    expect(result.success).toBe(true);
  });

  it('rejects when a nudge was sent within the last hour', async () => {
    const { supabase, builder } = createMockSupabase();
    builder.mockReturnValue({ data: [{ id: 'recent-nudge' }], error: null });

    const result = await sendNudge(supabase, 'target-user-id');
    expect(result.success).toBe(false);
    expect(result.error).toContain('once per hour');
  });

  it('returns error when not authenticated', async () => {
    const { supabase } = createMockSupabase();
    supabase.auth.getUser.mockResolvedValue({ data: { user: null }, error: null });

    const result = await sendNudge(supabase, 'target-user-id');
    expect(result.success).toBe(false);
    expect(result.error).toBe('Not authenticated');
  });

  it('returns error on insert failure', async () => {
    const { supabase, builder } = createMockSupabase();
    builder.mockReturnValueSequence([
      { data: [], error: null },
      { data: null, error: { message: 'Insert failed' } },
    ]);

    const result = await sendNudge(supabase, 'target-user-id');
    expect(result.success).toBe(false);
    expect(result.error).toBe('Insert failed');
  });

  it('handles null from profile fetch gracefully', async () => {
    const { supabase, builder } = createMockSupabase();
    builder.mockReturnValueSequence([
      { data: [], error: null },
      { data: null, error: null },
      { data: null, error: null },
    ]);

    const result = await sendNudge(supabase, 'target-user-id');
    expect(result.success).toBe(true);
  });
});
