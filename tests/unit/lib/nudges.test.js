import { describe, it, expect } from 'vitest';
import { sendNudge } from '@/lib/nudges';
import { createMockSupabase } from '../../setup/supabase-mock';

describe('sendNudge', () => {
  it('returns failure when not authenticated', async () => {
    const { supabase } = createMockSupabase();
    supabase.auth.getUser.mockResolvedValue({ data: { user: null }, error: null });

    const result = await sendNudge(supabase, 'target-user');

    expect(result.success).toBe(false);
    expect(result.error).toBe('Not authenticated');
  });

  it('returns rate limit error when nudge sent within the hour', async () => {
    const { supabase, builder } = createMockSupabase();
    builder.mockReturnValue({ data: [{ id: 'recent-nudge' }], error: null });

    const result = await sendNudge(supabase, 'target-user');

    expect(result.success).toBe(false);
    expect(result.error).toBe('You can only nudge this person once per hour');
  });

  it('returns success when no recent nudge exists', async () => {
    const { supabase, builder } = createMockSupabase();
    builder.mockReturnValueSequence([
      { data: [], error: null },
      { data: null, error: null },
      { data: { full_name: 'Sender' }, error: null },
      { data: null, error: null },
    ]);

    const result = await sendNudge(supabase, 'target-user');

    expect(result.success).toBe(true);
  });

  it('returns failure on DB insert error', async () => {
    const { supabase, builder } = createMockSupabase();
    builder.mockReturnValueSequence([
      { data: [], error: null },
      { data: null, error: { message: 'Insert failed' } },
    ]);

    const result = await sendNudge(supabase, 'target-user');

    expect(result.success).toBe(false);
    expect(result.error).toBe('Insert failed');
  });
});
