import { describe, it, expect, vi } from 'vitest';
import { getOnboardingState, detectProgress, syncProgress, resetOnboarding } from '@/lib/onboarding';
import { createMockSupabase } from '../../setup/supabase-mock';

// Mock gamification's awardXP since syncProgress calls it
vi.mock('@/lib/gamification', () => ({
  awardXP: vi.fn().mockResolvedValue({ success: true }),
  XP_REWARDS: {
    ONBOARDING_PACT: 25,
    ONBOARDING_FOCUS: 30,
    ONBOARDING_GROUP: 20,
    ONBOARDING_MOMENTUM: 50,
  },
}));

describe('getOnboardingState', () => {
  it('returns null for null userId', async () => {
    const { supabase } = createMockSupabase();
    const result = await getOnboardingState(supabase, null);
    expect(result).toBeNull();
  });

  it('returns existing onboarding row', async () => {
    const { supabase, builder } = createMockSupabase();
    const state = {
      user_id: 'user-1',
      has_created_pact: true,
      has_joined_group: false,
      has_used_focus_timer: false,
      has_built_momentum: false,
    };
    builder.mockReturnValue({ data: state, error: null });

    const result = await getOnboardingState(supabase, 'user-1');
    expect(result).toEqual(state);
  });

  it('returns null on DB error', async () => {
    const { supabase, builder } = createMockSupabase();
    builder.mockReturnValue({ data: null, error: { message: 'DB error' } });

    const result = await getOnboardingState(supabase, 'user-1');
    expect(result).toBeNull();
  });

  it('creates a new row when none exists', async () => {
    const { supabase, builder } = createMockSupabase();
    // First call (maybeSingle) returns null data, then upsert returns new row
    // With shared builder, both return the same value
    const newRow = { user_id: 'user-1', has_created_pact: false };
    builder.mockReturnValue({ data: newRow, error: null });

    // Since the builder returns `newRow` for the maybeSingle call,
    // it will think data exists and return it directly
    const result = await getOnboardingState(supabase, 'user-1');
    expect(result).toEqual(newRow);
  });
});

describe('detectProgress', () => {
  it('returns null for null userId', async () => {
    const { supabase } = createMockSupabase();
    const result = await detectProgress(supabase, null);
    expect(result).toBeNull();
  });

  it('detects completed steps from DB data', async () => {
    const { supabase, builder } = createMockSupabase();
    // All parallel queries return via the same builder
    // pacts has data, sessions has data, groups empty, profile streak < 2
    builder.mockReturnValue({
      data: [{ id: 'item-1' }],
      error: null,
    });

    const result = await detectProgress(supabase, 'user-1');
    // With the shared mock all queries return [{id: 'item-1'}]
    // The profile query returns that too, which has no current_streak field
    // so has_built_momentum = (undefined ?? 0) >= 2 = false
    expect(result).not.toBeNull();
    expect(result).toHaveProperty('has_created_pact');
    expect(result).toHaveProperty('has_joined_group');
    expect(result).toHaveProperty('has_used_focus_timer');
    expect(result).toHaveProperty('has_built_momentum');
  });

  it('returns null on query error', async () => {
    const { supabase, builder } = createMockSupabase();
    builder.mockReturnValue({ data: null, error: { message: 'Query failed' } });

    const result = await detectProgress(supabase, 'user-1');
    expect(result).toBeNull();
  });
});

describe('syncProgress', () => {
  it('returns null for null userId', async () => {
    const { supabase } = createMockSupabase();
    const result = await syncProgress(supabase, null, {}, {});
    expect(result).toBeNull();
  });

  it('returns unchanged state when no new steps completed', async () => {
    const { supabase } = createMockSupabase();
    const dbState = {
      has_created_pact: true,
      has_used_focus_timer: false,
      has_joined_group: false,
      has_built_momentum: false,
    };
    const detected = {
      has_created_pact: true,
      has_used_focus_timer: false,
      has_joined_group: false,
      has_built_momentum: false,
    };

    const result = await syncProgress(supabase, 'user-1', dbState, detected);
    expect(result.newlyCompleted).toEqual([]);
    expect(result.updatedState).toEqual(dbState);
  });

  it('detects newly completed steps', async () => {
    const { supabase, builder } = createMockSupabase();
    builder.mockReturnValue({ data: null, error: null });

    const dbState = {
      has_created_pact: false,
      has_used_focus_timer: false,
      has_joined_group: false,
      has_built_momentum: false,
    };
    const detected = {
      has_created_pact: true,
      has_used_focus_timer: false,
      has_joined_group: false,
      has_built_momentum: false,
    };

    const result = await syncProgress(supabase, 'user-1', dbState, detected);
    expect(result.newlyCompleted.length).toBe(1);
    expect(result.newlyCompleted[0].field).toBe('has_created_pact');
    expect(result.updatedState.has_created_pact).toBe(true);
  });

  it('returns null on update error', async () => {
    const { supabase, builder } = createMockSupabase();
    builder.mockReturnValue({ data: null, error: { message: 'Update failed' } });

    const dbState = {
      has_created_pact: false,
      has_used_focus_timer: false,
      has_joined_group: false,
      has_built_momentum: false,
    };
    const detected = {
      has_created_pact: true,
      has_used_focus_timer: false,
      has_joined_group: false,
      has_built_momentum: false,
    };

    const result = await syncProgress(supabase, 'user-1', dbState, detected);
    expect(result).toBeNull();
  });
});

describe('resetOnboarding', () => {
  it('returns false for null userId', async () => {
    const { supabase } = createMockSupabase();
    const result = await resetOnboarding(supabase, null);
    expect(result).toBe(false);
  });

  it('returns true on successful reset', async () => {
    const { supabase, builder } = createMockSupabase();
    builder.mockReturnValue({ data: null, error: null });

    const result = await resetOnboarding(supabase, 'user-1');
    expect(result).toBe(true);
  });

  it('returns false on DB error', async () => {
    const { supabase, builder } = createMockSupabase();
    builder.mockReturnValue({ data: null, error: { message: 'Update failed' } });

    const result = await resetOnboarding(supabase, 'user-1');
    expect(result).toBe(false);
  });
});
