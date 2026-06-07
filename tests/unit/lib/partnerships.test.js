import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  sendPartnerRequest,
  acceptPartnerRequest,
  declinePartnerRequest,
  removePartnership,
  getPartnerships,
  notifyPartner,
} from '@/lib/partnerships';
import { createMockSupabase } from '../../setup/supabase-mock';

const USER_UUID = '00000000-0000-0000-0000-000000000001';
const TARGET_UUID = '00000000-0000-0000-0000-000000000002';

beforeEach(() => {
  vi.spyOn(console, 'error').mockImplementation(() => {});
  vi.spyOn(console, 'warn').mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('sendPartnerRequest', () => {
  it('returns not authenticated when user is null', async () => {
    const { supabase } = createMockSupabase();
    supabase.auth.getUser.mockResolvedValue({ data: { user: null }, error: null });

    const result = await sendPartnerRequest(supabase, TARGET_UUID);
    expect(result.success).toBe(false);
    expect(result.error).toBe('Not authenticated');
  });

  it('returns error when auth returns error', async () => {
    const { supabase } = createMockSupabase();
    supabase.auth.getUser.mockResolvedValue({
      data: { user: null },
      error: { message: 'auth failed' },
    });

    const result = await sendPartnerRequest(supabase, TARGET_UUID);
    expect(result.success).toBe(false);
    expect(result.error).toBe('auth failed');
  });

  it('returns error when trying to partner with yourself', async () => {
    const { supabase } = createMockSupabase();
    supabase.auth.getUser.mockResolvedValue({
      data: { user: { id: USER_UUID } },
      error: null,
    });

    const result = await sendPartnerRequest(supabase, USER_UUID);
    expect(result.success).toBe(false);
    expect(result.error).toBe('Cannot partner with yourself');
  });

  it('returns error when partnership already active', async () => {
    const { supabase, builder } = createMockSupabase();
    supabase.auth.getUser.mockResolvedValue({
      data: { user: { id: USER_UUID } },
      error: null,
    });
    builder.mockReturnValue({ data: { id: 'p1', status: 'active' }, error: null });

    const result = await sendPartnerRequest(supabase, TARGET_UUID);
    expect(result.success).toBe(false);
    expect(result.error).toBe('Already partners');
  });

  it('returns error when request already pending', async () => {
    const { supabase, builder } = createMockSupabase();
    supabase.auth.getUser.mockResolvedValue({
      data: { user: { id: USER_UUID } },
      error: null,
    });
    builder.mockReturnValue({ data: { id: 'p1', status: 'pending' }, error: null });

    const result = await sendPartnerRequest(supabase, TARGET_UUID);
    expect(result.success).toBe(false);
    expect(result.error).toBe('Request already pending');
  });

  it('succeeds when no existing partnership', async () => {
    const { supabase, builder } = createMockSupabase();
    supabase.auth.getUser.mockResolvedValue({
      data: { user: { id: USER_UUID } },
      error: null,
    });
    builder.mockReturnValueSequence([
      { data: null, error: null },
      { data: { id: 'new-p1', user1_id: USER_UUID, user2_id: TARGET_UUID }, error: null },
      { data: { full_name: 'Alice' }, error: null },
      { data: null, error: null },
    ]);

    const result = await sendPartnerRequest(supabase, TARGET_UUID);
    expect(result.success).toBe(true);
    expect(result.data).toHaveProperty('id', 'new-p1');
  });

  it('returns error for non-UUID targetUserId', async () => {
    const { supabase } = createMockSupabase();
    supabase.auth.getUser.mockResolvedValue({
      data: { user: { id: USER_UUID } },
      error: null,
    });

    const result = await sendPartnerRequest(supabase, 'not-a-uuid');
    expect(result.success).toBe(false);
    expect(result.error).toContain('not a UUID');
  });
});

describe('acceptPartnerRequest', () => {
  it('returns not authenticated when user is null', async () => {
    const { supabase } = createMockSupabase();
    supabase.auth.getUser.mockResolvedValue({ data: { user: null }, error: null });

    const result = await acceptPartnerRequest(supabase, 'p1');
    expect(result.success).toBe(false);
    expect(result.error).toBe('Not authenticated');
  });

  it('returns error when no matching pending request', async () => {
    const { supabase, builder } = createMockSupabase();
    builder.mockReturnValue({ data: null, error: null });

    const result = await acceptPartnerRequest(supabase, 'p1');
    expect(result.success).toBe(false);
    expect(result.error).toContain('no longer pending');
  });

  it('succeeds and notifies requester', async () => {
    const { supabase, builder } = createMockSupabase();
    builder.mockReturnValueSequence([
      {
        data: {
          id: 'p1',
          user1_id: TARGET_UUID,
          user2_id: 'test-user-id',
          requested_by: TARGET_UUID,
        },
        error: null,
      },
      { data: { full_name: 'Me' }, error: null },
      { data: null, error: null },
    ]);

    const result = await acceptPartnerRequest(supabase, 'p1');
    expect(result.success).toBe(true);
    expect(result.data).toHaveProperty('id', 'p1');
  });

  it('returns failure on DB error', async () => {
    const { supabase, builder } = createMockSupabase();
    builder.mockReturnValue({ data: null, error: { message: 'update failed' } });

    const result = await acceptPartnerRequest(supabase, 'p1');
    expect(result.success).toBe(false);
    expect(result.error).toBe('update failed');
  });
});

describe('declinePartnerRequest', () => {
  it('returns not authenticated when user is null', async () => {
    const { supabase } = createMockSupabase();
    supabase.auth.getUser.mockResolvedValue({ data: { user: null }, error: null });

    const result = await declinePartnerRequest(supabase, 'p1');
    expect(result.success).toBe(false);
    expect(result.error).toBe('Not authenticated');
  });

  it('returns success on happy path', async () => {
    const { supabase, builder } = createMockSupabase();
    supabase.auth.getUser.mockResolvedValue({
      data: { user: { id: USER_UUID } },
      error: null,
    });
    builder.mockReturnValue({ data: null, error: null });

    const result = await declinePartnerRequest(supabase, 'p1');
    expect(result.success).toBe(true);
  });

  it('returns failure on DB error', async () => {
    const { supabase, builder } = createMockSupabase();
    supabase.auth.getUser.mockResolvedValue({
      data: { user: { id: USER_UUID } },
      error: null,
    });
    builder.mockReturnValue({ data: null, error: { message: 'decline failed' } });

    const result = await declinePartnerRequest(supabase, 'p1');
    expect(result.success).toBe(false);
    expect(result.error).toBe('decline failed');
  });

  it('rejects non-UUID userId from auth', async () => {
    const { supabase } = createMockSupabase();
    const result = await declinePartnerRequest(supabase, 'p1');
    expect(result.success).toBe(false);
    expect(result.error).toContain('not a UUID');
  });
});

describe('removePartnership', () => {
  it('returns not authenticated when user is null', async () => {
    const { supabase } = createMockSupabase();
    supabase.auth.getUser.mockResolvedValue({ data: { user: null }, error: null });

    const result = await removePartnership(supabase, 'p1');
    expect(result.success).toBe(false);
    expect(result.error).toBe('Not authenticated');
  });

  it('returns success on happy path', async () => {
    const { supabase, builder } = createMockSupabase();
    supabase.auth.getUser.mockResolvedValue({
      data: { user: { id: USER_UUID } },
      error: null,
    });
    builder.mockReturnValue({ data: null, error: null });

    const result = await removePartnership(supabase, 'p1');
    expect(result.success).toBe(true);
  });

  it('returns failure on DB error', async () => {
    const { supabase, builder } = createMockSupabase();
    supabase.auth.getUser.mockResolvedValue({
      data: { user: { id: USER_UUID } },
      error: null,
    });
    builder.mockReturnValue({ data: null, error: { message: 'delete failed' } });

    const result = await removePartnership(supabase, 'p1');
    expect(result.success).toBe(false);
    expect(result.error).toBe('delete failed');
  });
});

describe('getPartnerships', () => {
  it('returns empty array when user is not authenticated', async () => {
    const { supabase } = createMockSupabase();
    supabase.auth.getUser.mockResolvedValue({ data: { user: null }, error: null });

    const result = await getPartnerships(supabase);
    expect(result.data).toEqual([]);
    expect(result.error).toBe('Not authenticated');
  });

  it('returns empty array when no partnerships exist', async () => {
    const { supabase, builder } = createMockSupabase();
    supabase.auth.getUser.mockResolvedValue({
      data: { user: { id: USER_UUID } },
      error: null,
    });
    builder.mockReturnValue({ data: [], error: null });

    const result = await getPartnerships(supabase);
    expect(result.data).toEqual([]);
    expect(result.error).toBeNull();
  });

  it('enriches partnerships with partner profiles', async () => {
    const { supabase, builder } = createMockSupabase();
    supabase.auth.getUser.mockResolvedValue({
      data: { user: { id: USER_UUID } },
      error: null,
    });
    builder.mockReturnValueSequence([
      {
        data: [
          {
            id: 'p1',
            user1_id: USER_UUID,
            user2_id: TARGET_UUID,
            requested_by: USER_UUID,
            status: 'active',
          },
        ],
        error: null,
      },
      {
        data: [{ id: TARGET_UUID, full_name: 'Bob', avatar_url: null }],
        error: null,
      },
    ]);

    const result = await getPartnerships(supabase);
    expect(result.data).toHaveLength(1);
    expect(result.data[0].partnerId).toBe(TARGET_UUID);
    expect(result.data[0].partner.full_name).toBe('Bob');
    expect(result.data[0].isRequester).toBe(true);
    expect(result.error).toBeNull();
  });

  it('returns empty data and error on DB failure', async () => {
    const { supabase, builder } = createMockSupabase();
    supabase.auth.getUser.mockResolvedValue({
      data: { user: { id: USER_UUID } },
      error: null,
    });
    builder.mockReturnValue({ data: null, error: { message: 'DB error' } });

    const result = await getPartnerships(supabase);
    expect(result.data).toEqual([]);
    expect(result.error).toBeTruthy();
  });
});

describe('notifyPartner', () => {
  it('returns early when not authenticated', async () => {
    const { supabase } = createMockSupabase();
    supabase.auth.getUser.mockResolvedValue({
      data: { user: null },
      error: { message: 'unauth' },
    });

    const result = await notifyPartner(supabase, USER_UUID, 'completed', 'Test pact');
    expect(result).toBeUndefined();
  });

  it('returns early when no active partnerships', async () => {
    const { supabase, builder } = createMockSupabase();
    builder.mockReturnValue({ data: [], error: null });

    const result = await notifyPartner(supabase, USER_UUID, 'completed', 'Test pact');
    expect(result).toBeUndefined();
  });

  it('calls notify_partner rpc when partnerships exist', async () => {
    const { supabase, builder } = createMockSupabase();
    builder.mockReturnValueSequence([
      {
        data: [{ user1_id: USER_UUID, user2_id: TARGET_UUID }],
        error: null,
      },
      { data: { full_name: 'Alice' }, error: null },
    ]);

    await notifyPartner(supabase, USER_UUID, 'completed', 'Study math');
    expect(supabase.rpc).toHaveBeenCalledWith('notify_partner', expect.objectContaining({
      p_recipients: [TARGET_UUID],
      p_title: 'Partner completed a pact',
    }));
  });

  it('uses "missed" verb for missed action', async () => {
    const { supabase, builder } = createMockSupabase();
    builder.mockReturnValueSequence([
      {
        data: [{ user1_id: USER_UUID, user2_id: TARGET_UUID }],
        error: null,
      },
      { data: { full_name: 'Alice' }, error: null },
    ]);

    await notifyPartner(supabase, USER_UUID, 'missed', 'Study math');
    expect(supabase.rpc).toHaveBeenCalledWith('notify_partner', expect.objectContaining({
      p_title: 'Partner missed a pact',
    }));
  });

  it('handles rpc error gracefully', async () => {
    const { supabase, builder } = createMockSupabase();
    builder.mockReturnValueSequence([
      { data: [{ user1_id: USER_UUID, user2_id: TARGET_UUID }], error: null },
      { data: { full_name: 'Test' }, error: null },
    ]);
    supabase.rpc.mockResolvedValue({ data: null, error: { message: 'rpc failed' } });

    await notifyPartner(supabase, USER_UUID, 'completed', 'Pact');
    expect(console.warn).toHaveBeenCalled();
  });
});
