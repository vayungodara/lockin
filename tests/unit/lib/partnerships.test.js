import { describe, it, expect, vi } from 'vitest';
import {
  sendPartnerRequest,
  acceptPartnerRequest,
  declinePartnerRequest,
  removePartnership,
  getPartnerships,
} from '@/lib/partnerships';
import { createMockSupabase } from '../../setup/supabase-mock';

vi.mock('@/lib/notifications', () => ({
  createNotification: vi.fn().mockResolvedValue({ success: true }),
  NOTIFICATION_TYPES: {
    PARTNER_REQUEST: 'partner_request',
    PARTNER_ACCEPTED: 'partner_accepted',
  },
}));

describe('sendPartnerRequest', () => {
  it('returns error when not authenticated', async () => {
    const { supabase } = createMockSupabase();
    supabase.auth.getUser.mockResolvedValue({
      data: { user: null },
      error: { message: 'Not logged in' },
    });

    const result = await sendPartnerRequest(supabase, 'other-user');
    expect(result.success).toBe(false);
  });

  it('returns error when trying to partner with yourself', async () => {
    const { supabase } = createMockSupabase();

    const result = await sendPartnerRequest(supabase, 'test-user-id');
    expect(result.success).toBe(false);
    expect(result.error).toBe('Cannot partner with yourself');
  });

  it('returns error when partnership already active', async () => {
    const { supabase, builder } = createMockSupabase();
    builder.mockReturnValue({
      data: { id: 'p1', status: 'active' },
      error: null,
    });

    const result = await sendPartnerRequest(supabase, 'other-user');
    expect(result.success).toBe(false);
    expect(result.error).toBe('Already partners');
  });

  it('returns error when request already pending', async () => {
    const { supabase, builder } = createMockSupabase();
    builder.mockReturnValue({
      data: { id: 'p1', status: 'pending' },
      error: null,
    });

    const result = await sendPartnerRequest(supabase, 'other-user');
    expect(result.success).toBe(false);
    expect(result.error).toBe('Request already pending');
  });
});

describe('acceptPartnerRequest', () => {
  it('returns error when not authenticated', async () => {
    const { supabase } = createMockSupabase();
    supabase.auth.getUser.mockResolvedValue({
      data: { user: null },
      error: null,
    });

    const result = await acceptPartnerRequest(supabase, 'partnership-1');
    expect(result.success).toBe(false);
    expect(result.error).toBe('Not authenticated');
  });

  it('returns error on DB failure', async () => {
    const { supabase, builder } = createMockSupabase();
    builder.mockReturnValue({ data: null, error: { message: 'Update failed' } });

    const result = await acceptPartnerRequest(supabase, 'partnership-1');
    expect(result.success).toBe(false);
    expect(result.error).toBeTruthy();
  });
});

describe('declinePartnerRequest', () => {
  it('returns error when not authenticated', async () => {
    const { supabase } = createMockSupabase();
    supabase.auth.getUser.mockResolvedValue({
      data: { user: null },
      error: { message: 'Auth error' },
    });

    const result = await declinePartnerRequest(supabase, 'partnership-1');
    expect(result.success).toBe(false);
    expect(result.error).toBe('Not authenticated');
  });

  it('succeeds on valid decline', async () => {
    const { supabase, builder } = createMockSupabase();
    builder.mockReturnValue({ data: null, error: null });

    const result = await declinePartnerRequest(supabase, 'partnership-1');
    expect(result.success).toBe(true);
  });

  it('returns error on DB failure', async () => {
    const { supabase, builder } = createMockSupabase();
    builder.mockReturnValue({ data: null, error: { message: 'DB error' } });

    const result = await declinePartnerRequest(supabase, 'partnership-1');
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

    const result = await removePartnership(supabase, 'partnership-1');
    expect(result.success).toBe(false);
    expect(result.error).toBe('Not authenticated');
  });

  it('succeeds on valid removal', async () => {
    const { supabase, builder } = createMockSupabase();
    builder.mockReturnValue({ data: null, error: null });

    const result = await removePartnership(supabase, 'partnership-1');
    expect(result.success).toBe(true);
  });

  it('returns error on DB failure', async () => {
    const { supabase, builder } = createMockSupabase();
    builder.mockReturnValue({ data: null, error: { message: 'Delete failed' } });

    const result = await removePartnership(supabase, 'partnership-1');
    expect(result.success).toBe(false);
  });
});

describe('getPartnerships', () => {
  it('returns error when not authenticated', async () => {
    const { supabase } = createMockSupabase();
    supabase.auth.getUser.mockResolvedValue({
      data: { user: null },
      error: null,
    });

    const result = await getPartnerships(supabase);
    expect(result.data).toEqual([]);
    expect(result.error).toBe('Not authenticated');
  });

  it('returns empty array when no partnerships exist', async () => {
    const { supabase, builder } = createMockSupabase();
    builder.mockReturnValue({ data: [], error: null });

    const result = await getPartnerships(supabase);
    expect(result.data).toEqual([]);
    expect(result.error).toBeNull();
  });

  it('returns error on DB failure', async () => {
    const { supabase, builder } = createMockSupabase();
    builder.mockReturnValue({ data: null, error: { message: 'DB error' } });

    const result = await getPartnerships(supabase);
    expect(result.data).toEqual([]);
    expect(result.error).toBeTruthy();
  });
});
