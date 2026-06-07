import { describe, it, expect } from 'vitest';
import { sendNudge } from '@/lib/nudges';
import { createMockSupabase } from '../../setup/supabase-mock';

describe('sendNudge', () => {
  it('returns not authenticated when user is null', async () => {
    const { supabase } = createMockSupabase();
    supabase.auth.getUser.mockResolvedValue({ data: { user: null }, error: null });

    const result = await sendNudge(supabase, 'target-user');
    expect(result.success).toBe(false);
    expect(result.error).toBe('Not authenticated');
  });

  it('returns rate limit error when nudge was recently sent', async () => {
    const { supabase, builder } = createMockSupabase();
    builder.mockReturnValue({ data: [{ id: 'recent-nudge' }], error: null });

    const result = await sendNudge(supabase, 'target-user');
    expect(result.success).toBe(false);
    expect(result.error).toContain('once per hour');
  });

  it('returns success when no recent nudge exists', async () => {
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

  it('returns failure when insert throws', async () => {
    const { supabase, builder } = createMockSupabase();
    builder.mockReturnValueSequence([
      { data: [], error: null },
      { data: null, error: { message: 'insert failed' } },
    ]);

    const result = await sendNudge(supabase, 'target-user');
    expect(result.success).toBe(false);
    expect(result.error).toBe('insert failed');
  });

  it('returns failure when auth rejects', async () => {
    const { supabase } = createMockSupabase();
    supabase.auth.getUser.mockRejectedValue(new Error('network error'));

    const result = await sendNudge(supabase, 'target-user');
    expect(result.success).toBe(false);
    expect(result.error).toBe('network error');
  });

  it('succeeds even when profile fetch returns null', async () => {
    const { supabase, builder } = createMockSupabase();
    builder.mockReturnValueSequence([
      { data: [], error: null },
      { data: null, error: null },
      { data: null, error: null },
      { data: null, error: null },
    ]);

    const result = await sendNudge(supabase, 'target-user');
    expect(result.success).toBe(true);
  });
});
