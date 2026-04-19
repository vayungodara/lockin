import { describe, it, expect, vi } from 'vitest';
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

import {
  sendPartnerRequest,
  acceptPartnerRequest,
  declinePartnerRequest,
  removePartnership,
  getPartnerships,
  notifyPartner,
} from '@/lib/partnerships';

const VALID_UUID = '550e8400-e29b-41d4-a716-446655440000';
const VALID_UUID_2 = '660e8400-e29b-41d4-a716-446655440001';

describe('sendPartnerRequest', () => {
  it('returns error when not authenticated', async () => {
    const { supabase } = createMockSupabase();
    supabase.auth.getUser.mockResolvedValue({ data: { user: null }, error: null });

    const result = await sendPartnerRequest(supabase, VALID_UUID);
    expect(result.success).toBe(false);
    expect(result.error).toContain('Not authenticated');
  });

  it('returns error when trying to partner with yourself', async () => {
    const { supabase } = createMockSupabase();
    supabase.auth.getUser.mockResolvedValue({
      data: { user: { id: VALID_UUID } },
      error: null,
    });

    const result = await sendPartnerRequest(supabase, VALID_UUID);
    expect(result.success).toBe(false);
    expect(result.error).toBe('Cannot partner with yourself');
  });

  it('returns error when partnership already active', async () => {
    const { supabase, builder } = createMockSupabase();
    supabase.auth.getUser.mockResolvedValue({
      data: { user: { id: VALID_UUID } },
      error: null,
    });
    builder.mockReturnValue({
      data: { id: 'existing', status: 'active' },
      error: null,
    });

    const result = await sendPartnerRequest(supabase, VALID_UUID_2);
    expect(result.success).toBe(false);
    expect(result.error).toBe('Already partners');
  });

  it('returns error when request already pending', async () => {
    const { supabase, builder } = createMockSupabase();
    supabase.auth.getUser.mockResolvedValue({
      data: { user: { id: VALID_UUID } },
      error: null,
    });
    builder.mockReturnValue({
      data: { id: 'existing', status: 'pending' },
      error: null,
    });

    const result = await sendPartnerRequest(supabase, VALID_UUID_2);
    expect(result.success).toBe(false);
    expect(result.error).toBe('Request already pending');
  });

  it('creates partnership and returns success', async () => {
    const { supabase, builder } = createMockSupabase();
    supabase.auth.getUser.mockResolvedValue({
      data: { user: { id: VALID_UUID } },
      error: null,
    });
    builder.mockReturnValueSequence([
      { data: null, error: null },
      { data: { id: 'new-p-id' }, error: null },
      { data: { full_name: 'Alice' }, error: null },
    ]);

    const result = await sendPartnerRequest(supabase, VALID_UUID_2);
    expect(result.success).toBe(true);
    expect(result.data).toEqual({ id: 'new-p-id' });
  });

  it('returns error on auth error', async () => {
    const { supabase } = createMockSupabase();
    supabase.auth.getUser.mockResolvedValue({
      data: { user: null },
      error: { message: 'Auth failed' },
    });

    const result = await sendPartnerRequest(supabase, VALID_UUID);
    expect(result.success).toBe(false);
    expect(result.error).toBe('Auth failed');
  });

  it('returns error when target userId is not a valid UUID', async () => {
    const { supabase, builder } = createMockSupabase();
    supabase.auth.getUser.mockResolvedValue({
      data: { user: { id: VALID_UUID } },
      error: null,
    });
    builder.mockReturnValue({ data: null, error: null });

    const result = await sendPartnerRequest(supabase, 'not-a-uuid');
    expect(result.success).toBe(false);
    expect(result.error).toContain('not a UUID');
  });
});

describe('acceptPartnerRequest', () => {
  it('returns error when not authenticated', async () => {
    const { supabase } = createMockSupabase();
    supabase.auth.getUser.mockResolvedValue({ data: { user: null }, error: null });

    const result = await acceptPartnerRequest(supabase, 'p-id');
    expect(result.success).toBe(false);
    expect(result.error).toBe('Not authenticated');
  });

  it('returns error when request is no longer pending', async () => {
    const { supabase, builder } = createMockSupabase();
    builder.mockReturnValue({ data: null, error: null });

    const result = await acceptPartnerRequest(supabase, 'p-id');
    expect(result.success).toBe(false);
    expect(result.error).toBe('This request is no longer pending');
  });

  it('accepts and notifies the requester', async () => {
    const { supabase, builder } = createMockSupabase();
    builder.mockReturnValueSequence([
      {
        data: {
          id: 'p-id',
          user1_id: 'requester-id',
          user2_id: 'test-user-id',
          status: 'active',
        },
        error: null,
      },
      { data: { full_name: 'Acceptor' }, error: null },
    ]);

    const result = await acceptPartnerRequest(supabase, 'p-id');
    expect(result.success).toBe(true);
    expect(result.data.status).toBe('active');
  });

  it('returns error on DB failure', async () => {
    const { supabase, builder } = createMockSupabase();
    builder.mockReturnValue({ data: null, error: { message: 'Update failed' } });

    const result = await acceptPartnerRequest(supabase, 'p-id');
    expect(result.success).toBe(false);
    expect(result.error).toBe('Update failed');
  });
});

describe('declinePartnerRequest', () => {
  it('returns error when not authenticated', async () => {
    const { supabase } = createMockSupabase();
    supabase.auth.getUser.mockResolvedValue({
      data: { user: null },
      error: { message: 'Auth error' },
    });

    const result = await declinePartnerRequest(supabase, 'p-id');
    expect(result.success).toBe(false);
    expect(result.error).toBe('Not authenticated');
  });

  it('declines successfully', async () => {
    const { supabase, builder } = createMockSupabase();
    supabase.auth.getUser.mockResolvedValue({
      data: { user: { id: VALID_UUID } },
      error: null,
    });
    builder.mockReturnValue({ data: null, error: null });

    const result = await declinePartnerRequest(supabase, 'p-id');
    expect(result.success).toBe(true);
  });

  it('returns error on DB failure', async () => {
    const { supabase, builder } = createMockSupabase();
    supabase.auth.getUser.mockResolvedValue({
      data: { user: { id: VALID_UUID } },
      error: null,
    });
    builder.mockReturnValue({ data: null, error: { message: 'Decline failed' } });

    const result = await declinePartnerRequest(supabase, 'p-id');
    expect(result.success).toBe(false);
    expect(result.error).toBe('Decline failed');
  });
});

describe('removePartnership', () => {
  it('returns error when not authenticated', async () => {
    const { supabase } = createMockSupabase();
    supabase.auth.getUser.mockResolvedValue({
      data: { user: null },
      error: { message: 'Auth error' },
    });

    const result = await removePartnership(supabase, 'p-id');
    expect(result.success).toBe(false);
    expect(result.error).toBe('Not authenticated');
  });

  it('removes successfully', async () => {
    const { supabase, builder } = createMockSupabase();
    supabase.auth.getUser.mockResolvedValue({
      data: { user: { id: VALID_UUID } },
      error: null,
    });
    builder.mockReturnValue({ data: null, error: null });

    const result = await removePartnership(supabase, 'p-id');
    expect(result.success).toBe(true);
  });

  it('returns error on DB failure', async () => {
    const { supabase, builder } = createMockSupabase();
    supabase.auth.getUser.mockResolvedValue({
      data: { user: { id: VALID_UUID } },
      error: null,
    });
    builder.mockReturnValue({ data: null, error: { message: 'Delete failed' } });

    const result = await removePartnership(supabase, 'p-id');
    expect(result.success).toBe(false);
    expect(result.error).toBe('Delete failed');
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

  it('returns partnerships with partner profiles', async () => {
    const { supabase, builder } = createMockSupabase();
    supabase.auth.getUser.mockResolvedValue({
      data: { user: { id: VALID_UUID } },
      error: null,
    });
    builder.mockReturnValueSequence([
      {
        data: [
          {
            id: 'p1',
            user1_id: VALID_UUID,
            user2_id: VALID_UUID_2,
            requested_by: VALID_UUID,
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
    expect(result.error).toBeNull();
    expect(result.data).toHaveLength(1);
    expect(result.data[0].partnerId).toBe(VALID_UUID_2);
    expect(result.data[0].partner.full_name).toBe('Partner');
    expect(result.data[0].isRequester).toBe(true);
  });

  it('returns empty array when no partnerships exist', async () => {
    const { supabase, builder } = createMockSupabase();
    supabase.auth.getUser.mockResolvedValue({
      data: { user: { id: VALID_UUID } },
      error: null,
    });
    builder.mockReturnValue({ data: [], error: null });

    const result = await getPartnerships(supabase);
    expect(result.data).toEqual([]);
    expect(result.error).toBeNull();
  });

  it('returns empty array on DB error', async () => {
    const { supabase, builder } = createMockSupabase();
    supabase.auth.getUser.mockResolvedValue({
      data: { user: { id: VALID_UUID } },
      error: null,
    });
    builder.mockReturnValue({ data: null, error: { message: 'Query failed' } });

    const result = await getPartnerships(supabase);
    expect(result.data).toEqual([]);
    expect(result.error).toBeTruthy();
  });

  it('assigns Unknown profile for partners without profile data', async () => {
    const { supabase, builder } = createMockSupabase();
    supabase.auth.getUser.mockResolvedValue({
      data: { user: { id: VALID_UUID } },
      error: null,
    });
    builder.mockReturnValueSequence([
      {
        data: [{
          id: 'p1',
          user1_id: VALID_UUID,
          user2_id: VALID_UUID_2,
          requested_by: VALID_UUID_2,
          status: 'active',
        }],
        error: null,
      },
      { data: [], error: null },
    ]);

    const result = await getPartnerships(supabase);
    expect(result.data[0].partner).toEqual({ full_name: 'Unknown', avatar_url: null });
    expect(result.data[0].isRequester).toBe(false);
  });
});

describe('notifyPartner', () => {
  it('does nothing when not authenticated', async () => {
    const { supabase } = createMockSupabase();
    supabase.auth.getUser.mockResolvedValue({
      data: { user: null },
      error: { message: 'Not auth' },
    });

    const result = await notifyPartner(supabase, VALID_UUID, 'completed', 'Test Pact');
    expect(result).toBeUndefined();
  });

  it('does nothing when no active partnerships exist', async () => {
    const { supabase, builder } = createMockSupabase();
    supabase.auth.getUser.mockResolvedValue({
      data: { user: { id: VALID_UUID } },
      error: null,
    });
    builder.mockReturnValue({ data: [], error: null });

    const result = await notifyPartner(supabase, VALID_UUID, 'completed', 'Test Pact');
    expect(result).toBeUndefined();
  });

  it('sends notification via RPC for completed action', async () => {
    const { supabase, builder } = createMockSupabase();
    supabase.auth.getUser.mockResolvedValue({
      data: { user: { id: VALID_UUID } },
      error: null,
    });
    builder.mockReturnValueSequence([
      {
        data: [{ user1_id: VALID_UUID, user2_id: VALID_UUID_2 }],
        error: null,
      },
      { data: { full_name: 'Alice' }, error: null },
    ]);

    await notifyPartner(supabase, VALID_UUID, 'completed', 'Study Math');

    expect(supabase.rpc).toHaveBeenCalledWith('notify_partner', expect.objectContaining({
      p_recipients: [VALID_UUID_2],
      p_title: 'Partner completed a pact',
      p_message: expect.stringContaining('Study Math'),
    }));
  });

  it('uses missed verb for non-completed action', async () => {
    const { supabase, builder } = createMockSupabase();
    supabase.auth.getUser.mockResolvedValue({
      data: { user: { id: VALID_UUID } },
      error: null,
    });
    builder.mockReturnValueSequence([
      {
        data: [{ user1_id: VALID_UUID_2, user2_id: VALID_UUID }],
        error: null,
      },
      { data: { full_name: 'Bob' }, error: null },
    ]);

    await notifyPartner(supabase, VALID_UUID, 'missed', 'Exercise');

    expect(supabase.rpc).toHaveBeenCalledWith('notify_partner', expect.objectContaining({
      p_title: 'Partner missed a pact',
      p_message: expect.stringContaining('missed'),
    }));
  });
});
