import { describe, it, expect, vi } from 'vitest';
import {
  getOnboardingState,
  syncProgress,
  resetOnboarding,
} from '@/lib/onboarding';
import { createMockSupabase } from '../../setup/supabase-mock';

vi.mock('@/lib/gamification', () => ({
  XP_REWARDS: {
    ONBOARDING_PACT: 10,
    ONBOARDING_FOCUS: 10,
    ONBOARDING_GROUP: 15,
    ONBOARDING_MOMENTUM: 25,
  },
  awardXP: vi.fn().mockResolvedValue({ success: true }),
}));

describe('getOnboardingState', () => {
  it('returns null for null userId', async () => {
    const { supabase } = createMockSupabase();
    const result = await getOnboardingState(supabase, null);
    expect(result).toBeNull();
  });

  it('returns null for undefined userId', async () => {
    const { supabase } = createMockSupabase();
    const result = await getOnboardingState(supabase, undefined);
    expect(result).toBeNull();
  });

  it('returns existing onboarding state', async () => {
    const { supabase, builder } = createMockSupabase();
    const state = {
      user_id: 'u1',
      has_created_pact: true,
      has_joined_group: false,
      has_used_focus_timer: false,
      has_built_momentum: false,
      onboarding_dismissed: false,
      onboarding_completed_at: null,
    };
    builder.mockReturnValue({ data: state, error: null });

    const result = await getOnboardingState(supabase, 'u1');
    expect(result).toEqual(state);
  });

  it('creates new row when no existing state', async () => {
    const { supabase, builder } = createMockSupabase();
    const newState = {
      user_id: 'u1',
      has_created_pact: false,
      has_joined_group: false,
      has_used_focus_timer: false,
      has_built_momentum: false,
    };
    builder.mockReturnValueSequence([
      { data: null, error: null },
      { data: newState, error: null },
    ]);

    const result = await getOnboardingState(supabase, 'u1');
    expect(result).toEqual(newState);
  });

  it('returns null on fetch error', async () => {
    const { supabase, builder } = createMockSupabase();
    builder.mockReturnValue({ data: null, error: { message: 'DB error' } });

    const result = await getOnboardingState(supabase, 'u1');
    expect(result).toBeNull();
  });

  it('returns null on insert error during creation', async () => {
    const { supabase, builder } = createMockSupabase();
    builder.mockReturnValueSequence([
      { data: null, error: null },
      { data: null, error: { message: 'insert failed' } },
    ]);

    const result = await getOnboardingState(supabase, 'u1');
    expect(result).toBeNull();
  });
});

describe('syncProgress', () => {
  it('returns unchanged state when nothing is newly completed', async () => {
    const { supabase } = createMockSupabase();
    const dbState = {
      has_created_pact: true,
      has_joined_group: false,
      has_used_focus_timer: false,
      has_built_momentum: false,
    };
    const detected = {
      has_created_pact: true,
      has_joined_group: false,
      has_used_focus_timer: false,
      has_built_momentum: false,
    };

    const result = await syncProgress(supabase, 'u1', dbState, detected);
    expect(result.newlyCompleted).toEqual([]);
    expect(result.updatedState).toEqual(dbState);
  });

  it('returns null for null userId', async () => {
    const { supabase } = createMockSupabase();
    const result = await syncProgress(supabase, null, {}, {});
    expect(result).toBeNull();
  });

  it('updates state and awards XP for newly completed steps', async () => {
    const { supabase, builder } = createMockSupabase();
    builder.mockReturnValue({ data: null, error: null });

    const dbState = {
      has_created_pact: false,
      has_joined_group: false,
      has_used_focus_timer: false,
      has_built_momentum: false,
    };
    const detected = {
      has_created_pact: true,
      has_joined_group: false,
      has_used_focus_timer: true,
      has_built_momentum: false,
    };

    const result = await syncProgress(supabase, 'u1', dbState, detected);
    expect(result.newlyCompleted).toHaveLength(2);
    expect(result.updatedState.has_created_pact).toBe(true);
    expect(result.updatedState.has_used_focus_timer).toBe(true);
  });

  it('sets onboarding_completed_at when all steps are complete', async () => {
    const { supabase, builder } = createMockSupabase();
    builder.mockReturnValue({ data: null, error: null });

    const dbState = {
      has_created_pact: true,
      has_joined_group: true,
      has_used_focus_timer: true,
      has_built_momentum: false,
    };
    const detected = {
      has_created_pact: true,
      has_joined_group: true,
      has_used_focus_timer: true,
      has_built_momentum: true,
    };

    const result = await syncProgress(supabase, 'u1', dbState, detected);
    expect(result.updatedState.onboarding_completed_at).toBeTruthy();
  });

  it('returns null on update error', async () => {
    const { supabase, builder } = createMockSupabase();
    builder.mockReturnValue({ data: null, error: { message: 'update failed' } });

    const dbState = { has_created_pact: false, has_joined_group: false, has_used_focus_timer: false, has_built_momentum: false };
    const detected = { has_created_pact: true, has_joined_group: false, has_used_focus_timer: false, has_built_momentum: false };

    const result = await syncProgress(supabase, 'u1', dbState, detected);
    expect(result).toBeNull();
  });
});

describe('resetOnboarding', () => {
  it('returns true on success', async () => {
    const { supabase, builder } = createMockSupabase();
    builder.mockReturnValue({ data: null, error: null });

    const result = await resetOnboarding(supabase, 'u1');
    expect(result).toBe(true);
  });

  it('returns false for null userId', async () => {
    const { supabase } = createMockSupabase();
    const result = await resetOnboarding(supabase, null);
    expect(result).toBe(false);
  });

  it('returns false on DB error', async () => {
    const { supabase, builder } = createMockSupabase();
    builder.mockReturnValue({ data: null, error: { message: 'update failed' } });

    const result = await resetOnboarding(supabase, 'u1');
    expect(result).toBe(false);
  });
});
