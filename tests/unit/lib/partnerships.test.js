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

const VALID_UUID_1 = '11111111-1111-1111-1111-111111111111';
const VALID_UUID_2 = '22222222-2222-2222-2222-222222222222';

describe('sendPartnerRequest', () => {
  it('returns error when not authenticated', async () => {
    const { supabase } = createMockSupabase();
    supabase.auth.getUser.mockResolvedValue({ data: { user: null }, error: null });

    const result = await sendPartnerRequest(supabase, VALID_UUID_2);
    expect(result.success).toBe(false);
    expect(result.error).toContain('Not authenticated');
  });

  it('prevents partnering with yourself', async () => {
    const { supabase } = createMockSupabase();
    supabase.auth.getUser.mockResolvedValue({
      data: { user: { id: VALID_UUID_1 } },
      error: null,
    });

    const result = await sendPartnerRequest(supabase, VALID_UUID_1);
    expect(result.success).toBe(false);
    expect(result.error).toBe('Cannot partner with yourself');
  });

  it('returns error when partnership already active', async () => {
    const { supabase, builder } = createMockSupabase();
    supabase.auth.getUser.mockResolvedValue({
      data: { user: { id: VALID_UUID_1 } },
      error: null,
    });
    builder.mockReturnValue({
      data: { id: 'p1', status: 'active' },
      error: null,
    });

    const result = await sendPartnerRequest(supabase, VALID_UUID_2);
    expect(result.success).toBe(false);
    expect(result.error).toBe('Already partners');
  });

  it('returns error when request already pending', async () => {
    const { supabase, builder } = createMockSupabase();
    supabase.auth.getUser.mockResolvedValue({
      data: { user: { id: VALID_UUID_1 } },
      error: null,
    });
    builder.mockReturnValue({
      data: { id: 'p1', status: 'pending' },
      error: null,
    });

    const result = await sendPartnerRequest(supabase, VALID_UUID_2);
    expect(result.success).toBe(false);
    expect(result.error).toBe('Request already pending');
  });

  it('succeeds when no existing partnership', async () => {
    const { supabase, builder } = createMockSupabase();
    supabase.auth.getUser.mockResolvedValue({
      data: { user: { id: VALID_UUID_1 } },
      error: null,
    });
    builder.mockReturnValueSequence([
      { data: null, error: null },
      { data: { id: 'new-partnership' }, error: null },
      { data: { full_name: 'Alice' }, error: null },
    ]);

    const result = await sendPartnerRequest(supabase, VALID_UUID_2);
    expect(result.success).toBe(true);
    expect(result.data).toEqual({ id: 'new-partnership' });
  });
});

describe('acceptPartnerRequest', () => {
  it('returns error when not authenticated', async () => {
    const { supabase } = createMockSupabase();
    supabase.auth.getUser.mockResolvedValue({ data: { user: null }, error: null });

    const result = await acceptPartnerRequest(supabase, 'p1');
    expect(result.success).toBe(false);
    expect(result.error).toBe('Not authenticated');
  });

  it('returns error when request not found or not pending', async () => {
    const { supabase, builder } = createMockSupabase();
    builder.mockReturnValue({ data: null, error: null });

    const result = await acceptPartnerRequest(supabase, 'p1');
    expect(result.success).toBe(false);
    expect(result.error).toBe('This request is no longer pending');
  });

  it('succeeds and notifies requester', async () => {
    const { supabase, builder } = createMockSupabase();
    builder.mockReturnValueSequence([
      {
        data: {
          id: 'p1',
          user1_id: 'requester-id',
          user2_id: 'test-user-id',
          status: 'active',
        },
        error: null,
      },
      { data: { full_name: 'Bob' }, error: null },
    ]);

    const result = await acceptPartnerRequest(supabase, 'p1');
    expect(result.success).toBe(true);
  });

  it('returns error on DB failure', async () => {
    const { supabase, builder } = createMockSupabase();
    builder.mockReturnValue({ data: null, error: { message: 'Update failed' } });

    const result = await acceptPartnerRequest(supabase, 'p1');
    expect(result.success).toBe(false);
  });
});

describe('declinePartnerRequest', () => {
  it('returns error when not authenticated', async () => {
    const { supabase } = createMockSupabase();
    supabase.auth.getUser.mockResolvedValue({
      data: { user: null },
      error: { message: 'Auth error' },
    });

    const result = await declinePartnerRequest(supabase, 'p1');
    expect(result.success).toBe(false);
  });

  it('succeeds when partnership is declined', async () => {
    const { supabase, builder } = createMockSupabase();
    supabase.auth.getUser.mockResolvedValue({
      data: { user: { id: VALID_UUID_1 } },
      error: null,
    });
    builder.mockReturnValue({ data: null, error: null });

    const result = await declinePartnerRequest(supabase, 'p1');
    expect(result.success).toBe(true);
  });

  it('returns error on DB failure', async () => {
    const { supabase, builder } = createMockSupabase();
    supabase.auth.getUser.mockResolvedValue({
      data: { user: { id: VALID_UUID_1 } },
      error: null,
    });
    builder.mockReturnValue({ data: null, error: { message: 'Decline failed' } });

    const result = await declinePartnerRequest(supabase, 'p1');
    expect(result.success).toBe(false);
  });
});

describe('removePartnership', () => {
  it('returns error when not authenticated', async () => {
    const { supabase } = createMockSupabase();
    supabase.auth.getUser.mockResolvedValue({
      data: { user: null },
      error: { message: 'Auth error' },
    });

    const result = await removePartnership(supabase, 'p1');
    expect(result.success).toBe(false);
  });

  it('succeeds when partnership is removed', async () => {
    const { supabase, builder } = createMockSupabase();
    supabase.auth.getUser.mockResolvedValue({
      data: { user: { id: VALID_UUID_1 } },
      error: null,
    });
    builder.mockReturnValue({ data: null, error: null });

    const result = await removePartnership(supabase, 'p1');
    expect(result.success).toBe(true);
  });

  it('returns error on DB failure', async () => {
    const { supabase, builder } = createMockSupabase();
    supabase.auth.getUser.mockResolvedValue({
      data: { user: { id: VALID_UUID_1 } },
      error: null,
    });
    builder.mockReturnValue({ data: null, error: { message: 'Delete failed' } });

    const result = await removePartnership(supabase, 'p1');
    expect(result.success).toBe(false);
  });
});

describe('getPartnerships', () => {
  it('returns error when not authenticated', async () => {
    const { supabase } = createMockSupabase();
    supabase.auth.getUser.mockResolvedValue({ data: { user: null }, error: null });

    const result = await getPartnerships(supabase);
    expect(result.data).toEqual([]);
    expect(result.error).toBe('Not authenticated');
  });

  it('returns empty array when no partnerships exist', async () => {
    const { supabase, builder } = createMockSupabase();
    supabase.auth.getUser.mockResolvedValue({
      data: { user: { id: VALID_UUID_1 } },
      error: null,
    });
    builder.mockReturnValue({ data: [], error: null });

    const result = await getPartnerships(supabase);
    expect(result.data).toEqual([]);
    expect(result.error).toBeNull();
  });

  it('returns partnerships with partner profiles', async () => {
    const { supabase, builder } = createMockSupabase();
    supabase.auth.getUser.mockResolvedValue({
      data: { user: { id: VALID_UUID_1 } },
      error: null,
    });
    builder.mockReturnValueSequence([
      {
        data: [
          {
            id: 'p1',
            user1_id: VALID_UUID_1,
            user2_id: VALID_UUID_2,
            requested_by: VALID_UUID_1,
            status: 'active',
          },
        ],
        error: null,
      },
      {
        data: [{ id: VALID_UUID_2, full_name: 'Partner', avatar_url: 'avatar.png' }],
        error: null,
      },
    ]);

    const result = await getPartnerships(supabase);
    expect(result.data).toHaveLength(1);
    expect(result.data[0].partnerId).toBe(VALID_UUID_2);
    expect(result.data[0].partner.full_name).toBe('Partner');
    expect(result.data[0].isRequester).toBe(true);
  });

  it('returns error on DB failure', async () => {
    const { supabase, builder } = createMockSupabase();
    supabase.auth.getUser.mockResolvedValue({
      data: { user: { id: VALID_UUID_1 } },
      error: null,
    });
    builder.mockReturnValue({ data: null, error: { message: 'Fetch failed' } });

    const result = await getPartnerships(supabase);
    expect(result.data).toEqual([]);
    expect(result.error).toBeTruthy();
  });
});

describe('notifyPartner', () => {
  it('does nothing when user is not authenticated', async () => {
    const { supabase } = createMockSupabase();
    supabase.auth.getUser.mockResolvedValue({
      data: { user: null },
      error: { message: 'Not authenticated' },
    });

    const result = await notifyPartner(supabase, VALID_UUID_1, 'completed', 'Study math');
    expect(result).toBeUndefined();
  });

  it('does nothing when user has no active partnerships', async () => {
    const { supabase, builder } = createMockSupabase();
    builder.mockReturnValue({ data: [], error: null });

    const result = await notifyPartner(supabase, VALID_UUID_1, 'completed', 'Study math');
    expect(result).toBeUndefined();
  });

  it('calls rpc to notify partners for completed action', async () => {
    const { supabase, builder } = createMockSupabase();
    builder.mockReturnValueSequence([
      {
        data: [{ user1_id: VALID_UUID_1, user2_id: VALID_UUID_2 }],
        error: null,
      },
      { data: { full_name: 'Alice' }, error: null },
    ]);

    await notifyPartner(supabase, VALID_UUID_1, 'completed', 'Study math');
    expect(supabase.rpc).toHaveBeenCalledWith('notify_partner', expect.objectContaining({
      p_recipients: [VALID_UUID_2],
      p_title: 'Partner completed a pact',
      p_message: 'Alice completed: "Study math"',
    }));
  });

  it('calls rpc with missed verb for missed action', async () => {
    const { supabase, builder } = createMockSupabase();
    builder.mockReturnValueSequence([
      {
        data: [{ user1_id: VALID_UUID_2, user2_id: VALID_UUID_1 }],
        error: null,
      },
      { data: { full_name: 'Bob' }, error: null },
    ]);

    await notifyPartner(supabase, VALID_UUID_1, 'missed', 'Run 5k');
    expect(supabase.rpc).toHaveBeenCalledWith('notify_partner', expect.objectContaining({
      p_title: 'Partner missed a pact',
      p_message: 'Bob missed: "Run 5k"',
    }));
  });
});
