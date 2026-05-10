import { describe, it, expect, vi } from 'vitest';
import {
  getOnboardingState,
  detectProgress,
  syncProgress,
  resetOnboarding,
} from '@/lib/onboarding';
import { createMockSupabase } from '../../setup/supabase-mock';

vi.mock('@/lib/gamification', () => ({
  awardXP: vi.fn().mockResolvedValue({ success: true }),
  XP_REWARDS: {
    ONBOARDING_PACT: 25,
    ONBOARDING_FOCUS: 25,
    ONBOARDING_GROUP: 25,
    ONBOARDING_MOMENTUM: 50,
  },
}));

describe('getOnboardingState', () => {
  it('returns null for null userId', async () => {
    const { supabase } = createMockSupabase();
    const result = await getOnboardingState(supabase, null);
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
    };
    builder.mockReturnValue({ data: state, error: null });

    const result = await getOnboardingState(supabase, 'u1');
    expect(result).toEqual(state);
  });

  it('creates new row when no existing state found', async () => {
    const { supabase, builder } = createMockSupabase();
    const newRow = { user_id: 'u1', has_created_pact: false };
    builder.mockReturnValueSequence([
      { data: null, error: null },
      { data: newRow, error: null },
    ]);

    const result = await getOnboardingState(supabase, 'u1');
    expect(result).toEqual(newRow);
  });

  it('returns null on fetch error', async () => {
    const { supabase, builder } = createMockSupabase();
    builder.mockReturnValue({ data: null, error: { message: 'DB error' } });

    const result = await getOnboardingState(supabase, 'u1');
    expect(result).toBeNull();
  });

  it('returns null on upsert error', async () => {
    const { supabase, builder } = createMockSupabase();
    builder.mockReturnValueSequence([
      { data: null, error: null },
      { data: null, error: { message: 'upsert failed' } },
    ]);

    const result = await getOnboardingState(supabase, 'u1');
    expect(result).toBeNull();
  });
});

describe('detectProgress', () => {
  it('returns null for null userId', async () => {
    const { supabase } = createMockSupabase();
    const result = await detectProgress(supabase, null);
    expect(result).toBeNull();
  });

  it('detects all steps as complete', async () => {
    const { supabase, builder } = createMockSupabase();
    builder.mockReturnValueSequence([
      { data: [{ id: 'p1' }], error: null },
      { data: [{ id: 's1' }], error: null },
      { data: [{ group_id: 'g1' }], error: null },
      { data: { current_streak: 3 }, error: null },
    ]);

    const result = await detectProgress(supabase, 'u1');
    expect(result).toEqual({
      has_created_pact: true,
      has_joined_group: true,
      has_used_focus_timer: true,
      has_built_momentum: true,
    });
  });

  it('detects all steps as incomplete', async () => {
    const { supabase, builder } = createMockSupabase();
    builder.mockReturnValueSequence([
      { data: [], error: null },
      { data: [], error: null },
      { data: [], error: null },
      { data: { current_streak: 0 }, error: null },
    ]);

    const result = await detectProgress(supabase, 'u1');
    expect(result).toEqual({
      has_created_pact: false,
      has_joined_group: false,
      has_used_focus_timer: false,
      has_built_momentum: false,
    });
  });

  it('returns null when a query errors', async () => {
    const { supabase, builder } = createMockSupabase();
    builder.mockReturnValue({ data: null, error: { message: 'DB error' } });

    const result = await detectProgress(supabase, 'u1');
    expect(result).toBeNull();
  });

  it('requires streak >= 2 for momentum', async () => {
    const { supabase, builder } = createMockSupabase();
    builder.mockReturnValueSequence([
      { data: [], error: null },
      { data: [], error: null },
      { data: [], error: null },
      { data: { current_streak: 1 }, error: null },
    ]);

    const result = await detectProgress(supabase, 'u1');
    expect(result.has_built_momentum).toBe(false);
  });
});

describe('syncProgress', () => {
  it('returns unchanged state when nothing is newly completed', async () => {
    const { supabase } = createMockSupabase();
    const dbState = { has_created_pact: true, has_joined_group: false };
    const detected = { has_created_pact: true, has_joined_group: false };

    const result = await syncProgress(supabase, 'u1', dbState, detected);
    expect(result.newlyCompleted).toEqual([]);
    expect(result.updatedState).toEqual(dbState);
  });

  it('returns null for null userId', async () => {
    const { supabase } = createMockSupabase();
    const result = await syncProgress(supabase, null, {}, {});
    expect(result).toBeNull();
  });

  it('updates newly completed steps and awards XP', async () => {
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
      has_used_focus_timer: false,
      has_built_momentum: false,
    };

    const result = await syncProgress(supabase, 'u1', dbState, detected);
    expect(result.newlyCompleted.length).toBe(1);
    expect(result.newlyCompleted[0].field).toBe('has_created_pact');
    expect(result.updatedState.has_created_pact).toBe(true);
  });

  it('returns null on update error', async () => {
    const { supabase, builder } = createMockSupabase();
    builder.mockReturnValue({ data: null, error: { message: 'update failed' } });

    const dbState = { has_created_pact: false };
    const detected = { has_created_pact: true };

    const result = await syncProgress(supabase, 'u1', dbState, detected);
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

    const result = await resetOnboarding(supabase, 'u1');
    expect(result).toBe(true);
  });

  it('returns false on update error', async () => {
    const { supabase, builder } = createMockSupabase();
    builder.mockReturnValue({ data: null, error: { message: 'update failed' } });

    const result = await resetOnboarding(supabase, 'u1');
    expect(result).toBe(false);
  });
});
