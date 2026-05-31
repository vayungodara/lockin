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
  createNotification: vi.fn().mockResolvedValue({ error: null }),
  NOTIFICATION_TYPES: {
    PARTNER_REQUEST: 'partner_request',
    PARTNER_ACCEPTED: 'partner_accepted',
    PARTNER_PACT_COMPLETED: 'partner_pact_completed',
    PARTNER_PACT_MISSED: 'partner_pact_missed',
  },
}));

const USER_ID = '00000000-0000-0000-0000-000000000001';
const TARGET_ID = '00000000-0000-0000-0000-000000000002';

function mockAuthAs(supabase, userId) {
  supabase.auth.getUser.mockResolvedValue({
    data: { user: { id: userId } },
    error: null,
  });
}

describe('sendPartnerRequest', () => {
  it('returns success on happy path', async () => {
    const { supabase, builder } = createMockSupabase();
    mockAuthAs(supabase, USER_ID);
    builder.mockReturnValueSequence([
      { data: null, error: null },
      { data: { id: 'p-1', user1_id: USER_ID, user2_id: TARGET_ID }, error: null },
      { data: { full_name: 'Test User' }, error: null },
    ]);

    const result = await sendPartnerRequest(supabase, TARGET_ID);
    expect(result.success).toBe(true);
    expect(result.data.id).toBe('p-1');
  });

  it('returns failure when not authenticated', async () => {
    const { supabase } = createMockSupabase();
    supabase.auth.getUser.mockResolvedValue({ data: { user: null }, error: null });

    const result = await sendPartnerRequest(supabase, TARGET_ID);
    expect(result.success).toBe(false);
    expect(result.error).toBe('Not authenticated');
  });

  it('returns failure when partnering with self', async () => {
    const { supabase } = createMockSupabase();
    mockAuthAs(supabase, USER_ID);

    const result = await sendPartnerRequest(supabase, USER_ID);
    expect(result.success).toBe(false);
    expect(result.error).toBe('Cannot partner with yourself');
  });

  it('returns failure when partnership already active', async () => {
    const { supabase, builder } = createMockSupabase();
    mockAuthAs(supabase, USER_ID);
    builder.mockReturnValue({ data: { id: 'p-existing', status: 'active' }, error: null });

    const result = await sendPartnerRequest(supabase, TARGET_ID);
    expect(result.success).toBe(false);
    expect(result.error).toBe('Already partners');
  });

  it('returns failure when request already pending', async () => {
    const { supabase, builder } = createMockSupabase();
    mockAuthAs(supabase, USER_ID);
    builder.mockReturnValue({ data: { id: 'p-existing', status: 'pending' }, error: null });

    const result = await sendPartnerRequest(supabase, TARGET_ID);
    expect(result.success).toBe(false);
    expect(result.error).toBe('Request already pending');
  });

  it('returns failure when target user ID is not a valid UUID', async () => {
    const { supabase } = createMockSupabase();
    mockAuthAs(supabase, USER_ID);

    const result = await sendPartnerRequest(supabase, 'not-a-uuid');
    expect(result.success).toBe(false);
    expect(result.error).toContain('not a UUID');
  });
});

describe('acceptPartnerRequest', () => {
  it('returns success on happy path', async () => {
    const { supabase, builder } = createMockSupabase();
    mockAuthAs(supabase, TARGET_ID);
    builder.mockReturnValueSequence([
      { data: { id: 'p-1', user1_id: USER_ID, user2_id: TARGET_ID, status: 'active' }, error: null },
      { data: { full_name: 'Acceptor' }, error: null },
    ]);

    const result = await acceptPartnerRequest(supabase, 'p-1');
    expect(result.success).toBe(true);
  });

  it('returns failure when not authenticated', async () => {
    const { supabase } = createMockSupabase();
    supabase.auth.getUser.mockResolvedValue({ data: { user: null }, error: null });

    const result = await acceptPartnerRequest(supabase, 'p-1');
    expect(result.success).toBe(false);
    expect(result.error).toBe('Not authenticated');
  });

  it('returns failure when request not found or not pending', async () => {
    const { supabase, builder } = createMockSupabase();
    mockAuthAs(supabase, TARGET_ID);
    builder.mockReturnValue({ data: null, error: null });

    const result = await acceptPartnerRequest(supabase, 'p-1');
    expect(result.success).toBe(false);
    expect(result.error).toBe('This request is no longer pending');
  });
});

describe('declinePartnerRequest', () => {
  it('returns success on happy path', async () => {
    const { supabase, builder } = createMockSupabase();
    mockAuthAs(supabase, USER_ID);
    builder.mockReturnValue({ data: null, error: null });

    const result = await declinePartnerRequest(supabase, 'p-1');
    expect(result.success).toBe(true);
  });

  it('returns failure when not authenticated', async () => {
    const { supabase } = createMockSupabase();
    supabase.auth.getUser.mockResolvedValue({ data: { user: null }, error: null });

    const result = await declinePartnerRequest(supabase, 'p-1');
    expect(result.success).toBe(false);
    expect(result.error).toBe('Not authenticated');
  });

  it('returns failure on DB error', async () => {
    const { supabase, builder } = createMockSupabase();
    mockAuthAs(supabase, USER_ID);
    builder.mockReturnValue({ data: null, error: { message: 'update failed' } });

    const result = await declinePartnerRequest(supabase, 'p-1');
    expect(result.success).toBe(false);
  });
});

describe('removePartnership', () => {
  it('returns success on happy path', async () => {
    const { supabase, builder } = createMockSupabase();
    mockAuthAs(supabase, USER_ID);
    builder.mockReturnValue({ data: null, error: null });

    const result = await removePartnership(supabase, 'p-1');
    expect(result.success).toBe(true);
  });

  it('returns failure when not authenticated', async () => {
    const { supabase } = createMockSupabase();
    supabase.auth.getUser.mockResolvedValue({ data: { user: null }, error: null });

    const result = await removePartnership(supabase, 'p-1');
    expect(result.success).toBe(false);
  });

  it('returns failure on DB error', async () => {
    const { supabase, builder } = createMockSupabase();
    mockAuthAs(supabase, USER_ID);
    builder.mockReturnValue({ data: null, error: { message: 'delete failed' } });

    const result = await removePartnership(supabase, 'p-1');
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

  it('returns empty array when no partnerships exist', async () => {
    const { supabase, builder } = createMockSupabase();
    mockAuthAs(supabase, USER_ID);
    builder.mockReturnValue({ data: [], error: null });

    const result = await getPartnerships(supabase);
    expect(result.data).toEqual([]);
    expect(result.error).toBeNull();
  });

  it('returns partnerships with partner profiles', async () => {
    const { supabase, builder } = createMockSupabase();
    mockAuthAs(supabase, USER_ID);
    builder.mockReturnValueSequence([
      {
        data: [{
          id: 'p-1',
          user1_id: USER_ID,
          user2_id: TARGET_ID,
          requested_by: USER_ID,
          status: 'active',
        }],
        error: null,
      },
      {
        data: [{ id: TARGET_ID, full_name: 'Partner Name', avatar_url: null }],
        error: null,
      },
    ]);

    const result = await getPartnerships(supabase);
    expect(result.data).toHaveLength(1);
    expect(result.data[0].partnerId).toBe(TARGET_ID);
    expect(result.data[0].partner.full_name).toBe('Partner Name');
    expect(result.data[0].isRequester).toBe(true);
    expect(result.error).toBeNull();
  });

  it('returns empty data and error on DB failure', async () => {
    const { supabase, builder } = createMockSupabase();
    mockAuthAs(supabase, USER_ID);
    builder.mockReturnValue({ data: null, error: { message: 'query failed' } });

    const result = await getPartnerships(supabase);
    expect(result.data).toEqual([]);
    expect(result.error).toBeTruthy();
  });
});

describe('notifyPartner', () => {
  it('does nothing when not authenticated', async () => {
    const { supabase } = createMockSupabase();
    supabase.auth.getUser.mockResolvedValue({ data: { user: null }, error: { message: 'auth error' } });

    const result = await notifyPartner(supabase, USER_ID, 'completed', 'Study math');
    expect(result).toBeUndefined();
  });

  it('does nothing when no active partnerships', async () => {
    const { supabase, builder } = createMockSupabase();
    mockAuthAs(supabase, USER_ID);
    builder.mockReturnValue({ data: [], error: null });

    const result = await notifyPartner(supabase, USER_ID, 'completed', 'Study');
    expect(result).toBeUndefined();
  });

  it('sends notification via RPC for active partnerships', async () => {
    const { supabase, builder } = createMockSupabase();
    mockAuthAs(supabase, USER_ID);
    builder.mockReturnValueSequence([
      { data: [{ user1_id: USER_ID, user2_id: TARGET_ID }], error: null },
      { data: { full_name: 'Alice' }, error: null },
    ]);
    supabase.rpc.mockResolvedValue({ data: null, error: null });

    await notifyPartner(supabase, USER_ID, 'completed', 'Study math');
    expect(supabase.rpc).toHaveBeenCalledWith('notify_partner', expect.objectContaining({
      p_recipients: [TARGET_ID],
    }));
  });
});
