import { describe, it, expect, vi } from 'vitest';
import {
  sendPartnerRequest,
  acceptPartnerRequest,
  declinePartnerRequest,
  removePartnership,
  getPartnerships,
} from '@/lib/partnerships';
import { createMockSupabase } from '../../setup/supabase-mock';

// Mock the dynamic import of notifications used by partnerships.js
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
  it('returns failure when user is not authenticated', async () => {
    const { supabase, builder } = createMockSupabase();
    supabase.auth.getUser.mockResolvedValue({
      data: { user: null },
      error: { message: 'Not authenticated' },
    });
    builder.mockReturnValue({ data: null, error: null });

    const result = await sendPartnerRequest(supabase, 'target-user');
    expect(result.success).toBe(false);
    expect(result.error).toBeTruthy();
  });

  it('returns failure when trying to partner with yourself', async () => {
    const { supabase, builder } = createMockSupabase();
    supabase.auth.getUser.mockResolvedValue({
      data: { user: { id: 'test-user-id' } },
      error: null,
    });
    builder.mockReturnValue({ data: null, error: null });

    const result = await sendPartnerRequest(supabase, 'test-user-id');
    expect(result.success).toBe(false);
    expect(result.error).toBe('Cannot partner with yourself');
  });
});

describe('acceptPartnerRequest', () => {
  it('returns failure when user is not authenticated', async () => {
    const { supabase, builder } = createMockSupabase();
    supabase.auth.getUser.mockResolvedValue({
      data: { user: null },
      error: null,
    });
    builder.mockReturnValue({ data: null, error: null });

    const result = await acceptPartnerRequest(supabase, 'partnership-1');
    expect(result.success).toBe(false);
    expect(result.error).toBe('Not authenticated');
  });
});

describe('declinePartnerRequest', () => {
  it('returns failure when user is not authenticated', async () => {
    const { supabase, builder } = createMockSupabase();
    supabase.auth.getUser.mockResolvedValue({
      data: { user: null },
      error: { message: 'Not auth' },
    });
    builder.mockReturnValue({ data: null, error: null });

    const result = await declinePartnerRequest(supabase, 'partnership-1');
    expect(result.success).toBe(false);
    expect(result.error).toBe('Not authenticated');
  });

  it('returns success when decline succeeds', async () => {
    const { supabase, builder } = createMockSupabase();
    builder.mockReturnValue({ data: null, error: null });

    const result = await declinePartnerRequest(supabase, 'partnership-1');
    expect(result.success).toBe(true);
  });

  it('returns failure on DB error', async () => {
    const { supabase, builder } = createMockSupabase();
    builder.mockReturnValue({ data: null, error: { message: 'DB error' } });

    const result = await declinePartnerRequest(supabase, 'partnership-1');
    expect(result.success).toBe(false);
    expect(result.error).toBe('DB error');
  });
});

describe('removePartnership', () => {
  it('returns failure when user is not authenticated', async () => {
    const { supabase, builder } = createMockSupabase();
    supabase.auth.getUser.mockResolvedValue({
      data: { user: null },
      error: { message: 'Not auth' },
    });
    builder.mockReturnValue({ data: null, error: null });

    const result = await removePartnership(supabase, 'partnership-1');
    expect(result.success).toBe(false);
    expect(result.error).toBe('Not authenticated');
  });

  it('returns success when removal succeeds', async () => {
    const { supabase, builder } = createMockSupabase();
    builder.mockReturnValue({ data: null, error: null });

    const result = await removePartnership(supabase, 'partnership-1');
    expect(result.success).toBe(true);
  });

  it('returns failure on DB error', async () => {
    const { supabase, builder } = createMockSupabase();
    builder.mockReturnValue({ data: null, error: { message: 'Delete failed' } });

    const result = await removePartnership(supabase, 'partnership-1');
    expect(result.success).toBe(false);
    expect(result.error).toBe('Delete failed');
  });
});

describe('getPartnerships', () => {
  it('returns empty data when user is not authenticated', async () => {
    const { supabase, builder } = createMockSupabase();
    supabase.auth.getUser.mockResolvedValue({
      data: { user: null },
      error: null,
    });
    builder.mockReturnValue({ data: null, error: null });

    const result = await getPartnerships(supabase);
    expect(result.data).toEqual([]);
    expect(result.error).toBe('Not authenticated');
  });

  it('returns enriched partnerships on success', async () => {
    const { supabase, builder } = createMockSupabase();
    builder.mockReturnValue({
      data: [
        {
          id: 'p1',
          user1_id: 'test-user-id',
          user2_id: 'partner-1',
          requested_by: 'test-user-id',
          status: 'active',
          created_at: '2024-06-15T00:00:00Z',
        },
      ],
      error: null,
    });

    const result = await getPartnerships(supabase);
    expect(result.error).toBeNull();
    expect(result.data).toHaveLength(1);
    expect(result.data[0].partnerId).toBe('partner-1');
    expect(result.data[0].isRequester).toBe(true);
    expect(result.data[0].partner).toBeDefined();
  });

  it('returns empty data on DB error', async () => {
    const { supabase, builder } = createMockSupabase();
    builder.mockReturnValue({ data: null, error: { message: 'DB error' } });

    const result = await getPartnerships(supabase);
    expect(result.data).toEqual([]);
    expect(result.error).toBeTruthy();
  });
});
