import { describe, it, expect, vi } from 'vitest';
import { sendNudge } from '@/lib/nudges';

vi.mock('@/lib/notifications', () => ({
  createNotification: vi.fn().mockResolvedValue({ success: true }),
  NOTIFICATION_TYPES: { NUDGE_RECEIVED: 'nudge_received' },
}));

function createTableMock() {
  function makeBuilder() {
    const chainMethods = [
      'select', 'eq', 'neq', 'in', 'not', 'gte', 'order', 'range',
      'single', 'maybeSingle', 'insert', 'update', 'delete', 'limit',
    ];
    const b = {
      resolveWith(value) {
        b.then = (resolve) => resolve(value);
      },
    };
    chainMethods.forEach((m) => {
      b[m] = vi.fn(() => b);
    });
    b.resolveWith({ data: null, error: null });
    return b;
  }

  const builders = {};
  const supabase = {
    from: vi.fn((table) => {
      if (!builders[table]) builders[table] = makeBuilder();
      return builders[table];
    }),
    rpc: vi.fn().mockResolvedValue({ data: null, error: null }),
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: { id: 'test-user-id' } },
        error: null,
      }),
    },
  };
  return { supabase, builders };
}

describe('sendNudge', () => {
  it('returns not authenticated when user is null', async () => {
    const { supabase } = createTableMock();
    supabase.auth.getUser.mockResolvedValue({ data: { user: null }, error: null });

    const result = await sendNudge(supabase, 'target-user');
    expect(result.success).toBe(false);
    expect(result.error).toBe('Not authenticated');
  });

  it('returns rate limit error when nudge was sent within the last hour', async () => {
    const { supabase, builders } = createTableMock();
    builders.nudges = builders.nudges || supabase.from('nudges');
    supabase.from('nudges').resolveWith({
      data: [{ id: 'recent-nudge' }],
      error: null,
    });

    const result = await sendNudge(supabase, 'target-user');
    expect(result.success).toBe(false);
    expect(result.error).toBe('You can only nudge this person once per hour');
  });

  it('returns success on happy path', async () => {
    const { supabase } = createTableMock();
    supabase.from('nudges').resolveWith({ data: [], error: null });
    supabase.from('profiles').resolveWith({
      data: { full_name: 'Test User' },
      error: null,
    });

    const result = await sendNudge(supabase, 'target-user');
    expect(result.success).toBe(true);
  });

  it('returns failure on insert error', async () => {
    const { supabase } = createTableMock();
    supabase.from('nudges').resolveWith({
      data: null,
      error: { message: 'insert failed' },
    });

    const result = await sendNudge(supabase, 'target-user');
    expect(result.success).toBe(false);
    expect(result.error).toBe('insert failed');
  });

  it('returns failure when auth.getUser rejects', async () => {
    const { supabase } = createTableMock();
    supabase.auth.getUser.mockRejectedValue(new Error('network error'));

    const result = await sendNudge(supabase, 'target-user');
    expect(result.success).toBe(false);
    expect(result.error).toBe('network error');
  });
});
