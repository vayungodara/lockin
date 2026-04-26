import { describe, it, expect } from 'vitest';
import {
  sendPartnerRequest,
  acceptPartnerRequest,
  declinePartnerRequest,
  removePartnership,
  getPartnerships,
  notifyPartner,
} from '@/lib/partnerships';
import { createMockSupabase } from '../../setup/supabase-mock';

const USER_UUID = '11111111-1111-1111-1111-111111111111';
const TARGET_UUID = '22222222-2222-2222-2222-222222222222';
const PARTNERSHIP_ID = '33333333-3333-3333-3333-333333333333';

function authAs(supabase, userId) {
  supabase.auth.getUser.mockResolvedValue({
    data: { user: { id: userId } },
    error: null,
  });
}

describe('sendPartnerRequest', () => {
  it('returns failure when not authenticated', async () => {
    const { supabase } = createMockSupabase();
    supabase.auth.getUser.mockResolvedValue({ data: { user: null }, error: null });

    const result = await sendPartnerRequest(supabase, TARGET_UUID);

    expect(result.success).toBe(false);
    expect(result.error).toBe('Not authenticated');
  });

  it('returns failure when trying to partner with yourself', async () => {
    const { supabase } = createMockSupabase();
    authAs(supabase, USER_UUID);

    const result = await sendPartnerRequest(supabase, USER_UUID);

    expect(result.success).toBe(false);
    expect(result.error).toBe('Cannot partner with yourself');
  });

  it('returns failure for invalid UUID target', async () => {
    const { supabase } = createMockSupabase();
    authAs(supabase, USER_UUID);

    const result = await sendPartnerRequest(supabase, 'not-a-uuid');

    expect(result.success).toBe(false);
    expect(result.error).toContain('not a UUID');
  });

  it('returns failure when partnership already exists (active)', async () => {
    const { supabase, builder } = createMockSupabase();
    authAs(supabase, USER_UUID);
    builder.mockReturnValue({ data: { id: 'p1', status: 'active' }, error: null });

    const result = await sendPartnerRequest(supabase, TARGET_UUID);

    expect(result.success).toBe(false);
    expect(result.error).toBe('Already partners');
  });

  it('returns failure when request is already pending', async () => {
    const { supabase, builder } = createMockSupabase();
    authAs(supabase, USER_UUID);
    builder.mockReturnValue({ data: { id: 'p1', status: 'pending' }, error: null });

    const result = await sendPartnerRequest(supabase, TARGET_UUID);

    expect(result.success).toBe(false);
    expect(result.error).toBe('Request already pending');
  });

  it('returns success on new partner request', async () => {
    const { supabase, builder } = createMockSupabase();
    authAs(supabase, USER_UUID);
    builder.mockReturnValueSequence([
      { data: null, error: null },
      { data: { id: PARTNERSHIP_ID, user1_id: USER_UUID, user2_id: TARGET_UUID }, error: null },
      { data: { full_name: 'TestUser' }, error: null },
      { data: null, error: null },
    ]);

    const result = await sendPartnerRequest(supabase, TARGET_UUID);

    expect(result.success).toBe(true);
    expect(result.data.id).toBe(PARTNERSHIP_ID);
  });
});

describe('acceptPartnerRequest', () => {
  it('returns failure when not authenticated', async () => {
    const { supabase } = createMockSupabase();
    supabase.auth.getUser.mockResolvedValue({ data: { user: null }, error: null });

    const result = await acceptPartnerRequest(supabase, PARTNERSHIP_ID);

    expect(result.success).toBe(false);
    expect(result.error).toBe('Not authenticated');
  });

  it('returns failure when request is no longer pending', async () => {
    const { supabase, builder } = createMockSupabase();
    authAs(supabase, USER_UUID);
    builder.mockReturnValue({ data: null, error: null });

    const result = await acceptPartnerRequest(supabase, PARTNERSHIP_ID);

    expect(result.success).toBe(false);
    expect(result.error).toBe('This request is no longer pending');
  });

  it('returns success when accepting a valid request', async () => {
    const { supabase, builder } = createMockSupabase();
    authAs(supabase, USER_UUID);
    builder.mockReturnValueSequence([
      { data: { id: PARTNERSHIP_ID, user1_id: TARGET_UUID, user2_id: USER_UUID, status: 'active' }, error: null },
      { data: { full_name: 'Accepter' }, error: null },
      { data: null, error: null },
    ]);

    const result = await acceptPartnerRequest(supabase, PARTNERSHIP_ID);

    expect(result.success).toBe(true);
    expect(result.data.status).toBe('active');
  });
});

describe('declinePartnerRequest', () => {
  it('returns failure when not authenticated', async () => {
    const { supabase } = createMockSupabase();
    supabase.auth.getUser.mockResolvedValue({ data: { user: null }, error: null });

    const result = await declinePartnerRequest(supabase, PARTNERSHIP_ID);

    expect(result.success).toBe(false);
    expect(result.error).toBe('Not authenticated');
  });

  it('returns success on decline', async () => {
    const { supabase, builder } = createMockSupabase();
    authAs(supabase, USER_UUID);
    builder.mockReturnValue({ data: null, error: null });

    const result = await declinePartnerRequest(supabase, PARTNERSHIP_ID);

    expect(result.success).toBe(true);
  });

  it('returns failure on DB error', async () => {
    const { supabase, builder } = createMockSupabase();
    authAs(supabase, USER_UUID);
    builder.mockReturnValue({ data: null, error: { message: 'DB error' } });

    const result = await declinePartnerRequest(supabase, PARTNERSHIP_ID);

    expect(result.success).toBe(false);
  });
});

describe('removePartnership', () => {
  it('returns failure when not authenticated', async () => {
    const { supabase } = createMockSupabase();
    supabase.auth.getUser.mockResolvedValue({ data: { user: null }, error: null });

    const result = await removePartnership(supabase, PARTNERSHIP_ID);

    expect(result.success).toBe(false);
  });

  it('returns success on remove', async () => {
    const { supabase, builder } = createMockSupabase();
    authAs(supabase, USER_UUID);
    builder.mockReturnValue({ data: null, error: null });

    const result = await removePartnership(supabase, PARTNERSHIP_ID);

    expect(result.success).toBe(true);
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
    authAs(supabase, USER_UUID);
    builder.mockReturnValue({ data: [], error: null });

    const result = await getPartnerships(supabase);

    expect(result.data).toEqual([]);
    expect(result.error).toBeNull();
  });

  it('returns partnerships with partner profiles', async () => {
    const { supabase, builder } = createMockSupabase();
    authAs(supabase, USER_UUID);
    builder.mockReturnValueSequence([
      {
        data: [{
          id: PARTNERSHIP_ID,
          user1_id: USER_UUID,
          user2_id: TARGET_UUID,
          status: 'active',
          requested_by: USER_UUID,
          created_at: '2024-06-15',
        }],
        error: null,
      },
      {
        data: [{ id: TARGET_UUID, full_name: 'Partner', avatar_url: null }],
        error: null,
      },
    ]);

    const result = await getPartnerships(supabase);

    expect(result.error).toBeNull();
    expect(result.data).toHaveLength(1);
    expect(result.data[0].partnerId).toBe(TARGET_UUID);
    expect(result.data[0].partner.full_name).toBe('Partner');
    expect(result.data[0].isRequester).toBe(true);
  });
});

describe('notifyPartner', () => {
  it('returns early when not authenticated', async () => {
    const { supabase } = createMockSupabase();
    supabase.auth.getUser.mockResolvedValue({ data: { user: null }, error: { message: 'Auth error' } });

    const result = await notifyPartner(supabase, USER_UUID, 'completed', 'Test Pact');

    expect(result).toBeUndefined();
  });

  it('returns early when no active partnerships', async () => {
    const { supabase, builder } = createMockSupabase();
    authAs(supabase, USER_UUID);
    builder.mockReturnValue({ data: [], error: null });

    const result = await notifyPartner(supabase, USER_UUID, 'completed', 'Test Pact');

    expect(result).toBeUndefined();
  });

  it('calls rpc to notify partners on pact completion', async () => {
    const { supabase, builder } = createMockSupabase();
    authAs(supabase, USER_UUID);
    builder.mockReturnValueSequence([
      { data: [{ user1_id: USER_UUID, user2_id: TARGET_UUID }], error: null },
      { data: { full_name: 'Sender' }, error: null },
    ]);
    supabase.rpc.mockResolvedValue({ data: null, error: null });

    await notifyPartner(supabase, USER_UUID, 'completed', 'Study Math');

    expect(supabase.rpc).toHaveBeenCalledWith('notify_partner', expect.objectContaining({
      p_recipients: [TARGET_UUID],
      p_title: 'Partner completed a pact',
      p_message: 'Sender completed: "Study Math"',
    }));
  });
});
