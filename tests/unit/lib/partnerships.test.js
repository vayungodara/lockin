import { describe, it, expect, vi } from 'vitest';
import {
  sendPartnerRequest,
  acceptPartnerRequest,
  declinePartnerRequest,
  removePartnership,
  getPartnerships,
  notifyPartner,
} from '@/lib/partnerships';
import { createMockSupabase } from '../../setup/supabase-mock';

vi.mock('@/lib/notifications', () => ({
  createNotification: vi.fn().mockResolvedValue({ success: true }),
  NOTIFICATION_TYPES: {
    PARTNER_REQUEST: 'partner_request',
    PARTNER_ACCEPTED: 'partner_accepted',
    PARTNER_PACT_COMPLETED: 'partner_pact_completed',
    PARTNER_PACT_MISSED: 'partner_pact_missed',
  },
}));

describe('sendPartnerRequest', () => {
  it('returns failure when not authenticated', async () => {
    const { supabase } = createMockSupabase();
    supabase.auth.getUser.mockResolvedValue({ data: { user: null }, error: null });

    const result = await sendPartnerRequest(supabase, 'target-id');
    expect(result.success).toBe(false);
  });

  it('returns failure when trying to partner with yourself', async () => {
    const { supabase } = createMockSupabase();
    supabase.auth.getUser.mockResolvedValue({
      data: { user: { id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa' } },
      error: null,
    });

    const result = await sendPartnerRequest(supabase, 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa');
    expect(result.success).toBe(false);
    expect(result.error).toBe('Cannot partner with yourself');
  });

  it('returns failure when partnership already active', async () => {
    const { supabase, builder } = createMockSupabase();
    supabase.auth.getUser.mockResolvedValue({
      data: { user: { id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa' } },
      error: null,
    });
    builder.mockReturnValue({
      data: { id: 'p1', status: 'active' },
      error: null,
    });

    const result = await sendPartnerRequest(supabase, 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb');
    expect(result.success).toBe(false);
    expect(result.error).toBe('Already partners');
  });

  it('returns failure when request already pending', async () => {
    const { supabase, builder } = createMockSupabase();
    supabase.auth.getUser.mockResolvedValue({
      data: { user: { id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa' } },
      error: null,
    });
    builder.mockReturnValue({
      data: { id: 'p1', status: 'pending' },
      error: null,
    });

    const result = await sendPartnerRequest(supabase, 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb');
    expect(result.success).toBe(false);
    expect(result.error).toBe('Request already pending');
  });

  it('creates partnership and returns success', async () => {
    const { supabase, builder } = createMockSupabase();
    supabase.auth.getUser.mockResolvedValue({
      data: { user: { id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa' } },
      error: null,
    });
    builder.mockReturnValueSequence([
      { data: null, error: null },
      { data: { id: 'p1' }, error: null },
      { data: { full_name: 'Alice' }, error: null },
    ]);

    const result = await sendPartnerRequest(supabase, 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb');
    expect(result.success).toBe(true);
    expect(result.data).toEqual({ id: 'p1' });
  });

  it('returns failure on auth error', async () => {
    const { supabase } = createMockSupabase();
    supabase.auth.getUser.mockResolvedValue({
      data: null,
      error: { message: 'auth failed' },
    });

    const result = await sendPartnerRequest(supabase, 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb');
    expect(result.success).toBe(false);
  });
});

describe('acceptPartnerRequest', () => {
  it('returns failure when not authenticated', async () => {
    const { supabase } = createMockSupabase();
    supabase.auth.getUser.mockResolvedValue({ data: { user: null }, error: null });

    const result = await acceptPartnerRequest(supabase, 'p1');
    expect(result.success).toBe(false);
    expect(result.error).toBe('Not authenticated');
  });

  it('returns failure when request is no longer pending', async () => {
    const { supabase, builder } = createMockSupabase();
    builder.mockReturnValue({ data: null, error: null });

    const result = await acceptPartnerRequest(supabase, 'p1');
    expect(result.success).toBe(false);
    expect(result.error).toBe('This request is no longer pending');
  });

  it('accepts partnership and returns success', async () => {
    const { supabase, builder } = createMockSupabase();
    builder.mockReturnValueSequence([
      { data: { id: 'p1', user1_id: 'u1', user2_id: 'test-user-id' }, error: null },
      { data: { full_name: 'Me' }, error: null },
    ]);

    const result = await acceptPartnerRequest(supabase, 'p1');
    expect(result.success).toBe(true);
  });

  it('returns failure on DB error', async () => {
    const { supabase, builder } = createMockSupabase();
    builder.mockReturnValue({ data: null, error: { message: 'update failed' } });

    const result = await acceptPartnerRequest(supabase, 'p1');
    expect(result.success).toBe(false);
  });
});

describe('declinePartnerRequest', () => {
  it('returns failure when not authenticated', async () => {
    const { supabase } = createMockSupabase();
    supabase.auth.getUser.mockResolvedValue({ data: { user: null }, error: null });

    const result = await declinePartnerRequest(supabase, 'p1');
    expect(result.success).toBe(false);
  });

  it('returns success when declined', async () => {
    const { supabase, builder } = createMockSupabase();
    supabase.auth.getUser.mockResolvedValue({
      data: { user: { id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa' } },
      error: null,
    });
    builder.mockReturnValue({ data: null, error: null });

    const result = await declinePartnerRequest(supabase, 'p1');
    expect(result.success).toBe(true);
  });

  it('returns failure on DB error', async () => {
    const { supabase, builder } = createMockSupabase();
    supabase.auth.getUser.mockResolvedValue({
      data: { user: { id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa' } },
      error: null,
    });
    builder.mockReturnValue({ data: null, error: { message: 'decline failed' } });

    const result = await declinePartnerRequest(supabase, 'p1');
    expect(result.success).toBe(false);
  });
});

describe('removePartnership', () => {
  it('returns failure when not authenticated', async () => {
    const { supabase } = createMockSupabase();
    supabase.auth.getUser.mockResolvedValue({ data: { user: null }, error: null });

    const result = await removePartnership(supabase, 'p1');
    expect(result.success).toBe(false);
  });

  it('returns success when removed', async () => {
    const { supabase, builder } = createMockSupabase();
    supabase.auth.getUser.mockResolvedValue({
      data: { user: { id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa' } },
      error: null,
    });
    builder.mockReturnValue({ data: null, error: null });

    const result = await removePartnership(supabase, 'p1');
    expect(result.success).toBe(true);
  });

  it('returns failure on DB error', async () => {
    const { supabase, builder } = createMockSupabase();
    supabase.auth.getUser.mockResolvedValue({
      data: { user: { id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa' } },
      error: null,
    });
    builder.mockReturnValue({ data: null, error: { message: 'delete failed' } });

    const result = await removePartnership(supabase, 'p1');
    expect(result.success).toBe(false);
  });
});

describe('getPartnerships', () => {
  it('returns empty array when not authenticated', async () => {
    const { supabase } = createMockSupabase();
    supabase.auth.getUser.mockResolvedValue({ data: { user: null }, error: null });

    const result = await getPartnerships(supabase);
    expect(result.data).toEqual([]);
    expect(result.error).toBe('Not authenticated');
  });

  it('returns partnerships with partner profiles', async () => {
    const { supabase, builder } = createMockSupabase();
    supabase.auth.getUser.mockResolvedValue({
      data: { user: { id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa' } },
      error: null,
    });
    builder.mockReturnValueSequence([
      {
        data: [{
          id: 'p1',
          user1_id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
          user2_id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
          requested_by: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
          status: 'active',
        }],
        error: null,
      },
      {
        data: [{ id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', full_name: 'Bob', avatar_url: 'bob.png' }],
        error: null,
      },
    ]);

    const result = await getPartnerships(supabase);
    expect(result.error).toBeNull();
    expect(result.data).toHaveLength(1);
    expect(result.data[0].partnerId).toBe('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb');
    expect(result.data[0].partner.full_name).toBe('Bob');
    expect(result.data[0].isRequester).toBe(true);
  });

  it('returns empty data on DB error', async () => {
    const { supabase, builder } = createMockSupabase();
    supabase.auth.getUser.mockResolvedValue({
      data: { user: { id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa' } },
      error: null,
    });
    builder.mockReturnValue({ data: null, error: { message: 'DB error' } });

    const result = await getPartnerships(supabase);
    expect(result.data).toEqual([]);
    expect(result.error).toBeTruthy();
  });

  it('returns empty array when no partnerships exist', async () => {
    const { supabase, builder } = createMockSupabase();
    supabase.auth.getUser.mockResolvedValue({
      data: { user: { id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa' } },
      error: null,
    });
    builder.mockReturnValue({ data: [], error: null });

    const result = await getPartnerships(supabase);
    expect(result.data).toEqual([]);
    expect(result.error).toBeNull();
  });
});

describe('notifyPartner', () => {
  it('does nothing when not authenticated', async () => {
    const { supabase } = createMockSupabase();
    supabase.auth.getUser.mockResolvedValue({ data: { user: null }, error: { message: 'no auth' } });

    const result = await notifyPartner(supabase, 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'completed', 'My pact');
    expect(result).toBeUndefined();
  });

  it('does nothing when no active partnerships exist', async () => {
    const { supabase, builder } = createMockSupabase();
    supabase.auth.getUser.mockResolvedValue({
      data: { user: { id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa' } },
      error: null,
    });
    builder.mockReturnValue({ data: [], error: null });

    const result = await notifyPartner(supabase, 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'completed', 'My pact');
    expect(result).toBeUndefined();
  });

  it('calls rpc to notify partner on completed pact', async () => {
    const { supabase, builder } = createMockSupabase();
    supabase.auth.getUser.mockResolvedValue({
      data: { user: { id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa' } },
      error: null,
    });
    builder.mockReturnValueSequence([
      {
        data: [{
          user1_id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
          user2_id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
        }],
        error: null,
      },
      { data: { full_name: 'Alice' }, error: null },
    ]);

    await notifyPartner(supabase, 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'completed', 'My pact');
    expect(supabase.rpc).toHaveBeenCalledWith('notify_partner', expect.objectContaining({
      p_recipients: ['bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'],
      p_type: 'partner_pact_completed',
    }));
  });
});
