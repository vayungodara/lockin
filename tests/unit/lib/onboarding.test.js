import { describe, it, expect, vi } from 'vitest';
import { getOnboardingState, detectProgress, syncProgress, resetOnboarding } from '@/lib/onboarding';
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

  it('returns existing onboarding row', async () => {
    const { supabase, builder } = createMockSupabase();
    const existingRow = {
      user_id: 'u1',
      has_created_pact: true,
      has_joined_group: false,
      has_used_focus_timer: false,
      has_built_momentum: false,
      onboarding_dismissed: false,
      onboarding_completed_at: null,
    };
    builder.mockReturnValue({ data: existingRow, error: null });

    const result = await getOnboardingState(supabase, 'u1');
    expect(result).toEqual(existingRow);
  });

  it('creates new row when none exists', async () => {
    const { supabase, builder } = createMockSupabase();
    const newRow = {
      user_id: 'u1',
      has_created_pact: false,
      has_joined_group: false,
      has_used_focus_timer: false,
      has_built_momentum: false,
    };
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

  it('returns null on insert error', async () => {
    const { supabase, builder } = createMockSupabase();
    builder.mockReturnValueSequence([
      { data: null, error: null },
      { data: null, error: { message: 'Insert error' } },
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

  it('detects all progress as false when nothing exists', async () => {
    const { supabase, builder } = createMockSupabase();
    builder.mockReturnValue({ data: [], error: null });

    const result = await detectProgress(supabase, 'u1');
    expect(result).toEqual({
      has_created_pact: false,
      has_joined_group: false,
      has_used_focus_timer: false,
      has_built_momentum: false,
    });
  });

  it('detects progress as true when data exists', async () => {
    const { supabase, builder } = createMockSupabase();
    builder.mockReturnValue({ data: [{ id: 'item-1' }], error: null, current_streak: 3 });

    const result = await detectProgress(supabase, 'u1');
    expect(result.has_created_pact).toBe(true);
    expect(result.has_joined_group).toBe(true);
    expect(result.has_used_focus_timer).toBe(true);
  });

  it('returns null on query error', async () => {
    const { supabase, builder } = createMockSupabase();
    builder.mockReturnValue({ data: null, error: { message: 'Query failed' } });

    const result = await detectProgress(supabase, 'u1');
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
    expect(result.newlyCompleted).toHaveLength(0);
    expect(result.updatedState).toEqual(dbState);
  });

  it('updates state when new steps are detected', async () => {
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

  it('returns null on update error', async () => {
    const { supabase, builder } = createMockSupabase();
    builder.mockReturnValue({ data: null, error: { message: 'Update failed' } });

    const dbState = { has_created_pact: false, has_joined_group: false, has_used_focus_timer: false, has_built_momentum: false };
    const detected = { has_created_pact: true, has_joined_group: false, has_used_focus_timer: false, has_built_momentum: false };

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
    builder.mockReturnValue({ data: null, error: { message: 'Reset failed' } });

    const result = await resetOnboarding(supabase, 'u1');
    expect(result).toBe(false);
  });
});
