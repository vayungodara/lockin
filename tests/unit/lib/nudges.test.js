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

  it('sends a nudge successfully when no recent nudge exists', async () => {
    const { supabase, builder } = createMockSupabase();
    builder.mockReturnValueSequence([
      { data: [], error: null },
      { data: null, error: null },
      { data: { full_name: 'Alice' }, error: null },
    ]);

    const result = await sendNudge(supabase, 'to-user-id');
    expect(result.success).toBe(true);
  });

  it('returns failure when user is not authenticated', async () => {
    const { supabase } = createMockSupabase();
    supabase.auth.getUser.mockResolvedValue({ data: { user: null }, error: null });

    const result = await sendNudge(supabase, 'to-user-id');
    expect(result.success).toBe(false);
    expect(result.error).toBe('Not authenticated');
  });

  it('rate limits to one nudge per person per hour', async () => {
    const { supabase, builder } = createMockSupabase();
    builder.mockReturnValue({ data: [{ id: 'existing-nudge' }], error: null });

    const result = await sendNudge(supabase, 'to-user-id');
    expect(result.success).toBe(false);
    expect(result.error).toBe('You can only nudge this person once per hour');
  });

  it('returns failure on insert error', async () => {
    const { supabase, builder } = createMockSupabase();
    builder.mockReturnValueSequence([
      { data: [], error: null },
      { data: null, error: { message: 'Insert failed' } },
    ]);

    const result = await sendNudge(supabase, 'to-user-id');
    expect(result.success).toBe(false);
    expect(result.error).toBe('Insert failed');
  });
});
