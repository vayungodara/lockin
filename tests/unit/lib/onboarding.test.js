import { describe, it, expect } from 'vitest';
import { getOnboardingState, detectProgress, syncProgress, resetOnboarding } from '@/lib/onboarding';
import { createMockSupabase, createTableMock } from '../../setup/supabase-mock';

describe('getOnboardingState', () => {
  it('returns null for null userId', async () => {
    const { supabase } = createMockSupabase();

    const result = await getOnboardingState(supabase, null);

    expect(result).toBeNull();
  });

  it('returns existing row when found', async () => {
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

  it('creates a new row via upsert when no existing row', async () => {
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

  it('returns null on DB error', async () => {
    const { supabase, builder } = createMockSupabase();
    builder.mockReturnValue({ data: null, error: { message: 'DB error' } });

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

  it('detects all progress from real data', async () => {
    const { supabase } = createTableMock();
    supabase.from('pacts').resolveWith({ data: [{ id: 'p1' }], error: null });
    supabase.from('focus_sessions').resolveWith({ data: [{ id: 'f1' }], error: null });
    supabase.from('group_members').resolveWith({ data: [{ group_id: 'g1' }], error: null });
    supabase.from('profiles').resolveWith({ data: { current_streak: 3 }, error: null });

    const result = await detectProgress(supabase, 'u1');

    expect(result).toEqual({
      has_created_pact: true,
      has_joined_group: true,
      has_used_focus_timer: true,
      has_built_momentum: true,
    });
  });

  it('detects no progress when no activity exists', async () => {
    const { supabase } = createTableMock();
    supabase.from('pacts').resolveWith({ data: [], error: null });
    supabase.from('focus_sessions').resolveWith({ data: [], error: null });
    supabase.from('group_members').resolveWith({ data: [], error: null });
    supabase.from('profiles').resolveWith({ data: { current_streak: 0 }, error: null });

    const result = await detectProgress(supabase, 'u1');

    expect(result).toEqual({
      has_created_pact: false,
      has_joined_group: false,
      has_used_focus_timer: false,
      has_built_momentum: false,
    });
  });

  it('returns null when a query errors', async () => {
    const { supabase } = createTableMock();
    supabase.from('pacts').resolveWith({ data: null, error: { message: 'fail' } });
    supabase.from('focus_sessions').resolveWith({ data: [], error: null });
    supabase.from('group_members').resolveWith({ data: [], error: null });
    supabase.from('profiles').resolveWith({ data: { current_streak: 0 }, error: null });

    const result = await detectProgress(supabase, 'u1');

    expect(result).toBeNull();
  });

  it('requires streak >= 2 for has_built_momentum', async () => {
    const { supabase } = createTableMock();
    supabase.from('pacts').resolveWith({ data: [], error: null });
    supabase.from('focus_sessions').resolveWith({ data: [], error: null });
    supabase.from('group_members').resolveWith({ data: [], error: null });
    supabase.from('profiles').resolveWith({ data: { current_streak: 1 }, error: null });

    const result = await detectProgress(supabase, 'u1');

    expect(result.has_built_momentum).toBe(false);
  });
});

describe('syncProgress', () => {
  it('returns null for null userId', async () => {
    const { supabase } = createMockSupabase();
    const result = await syncProgress(supabase, null, {}, {});
    expect(result).toBeNull();
  });

  it('returns unchanged state when no new steps detected', async () => {
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

    const result = await syncProgress(supabase, 'u1', dbState, detected);

    expect(result.newlyCompleted).toEqual([]);
    expect(result.updatedState).toEqual(dbState);
  });

  it('updates DB and awards XP for newly completed steps', async () => {
    const { supabase, builder } = createMockSupabase();
    builder.mockReturnValue({ data: null, error: null });
    supabase.rpc.mockResolvedValue({ data: null, error: null });

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

    const result = await syncProgress(supabase, 'u1', dbState, detected);

    expect(result.newlyCompleted).toHaveLength(1);
    expect(result.newlyCompleted[0].field).toBe('has_created_pact');
    expect(result.updatedState.has_created_pact).toBe(true);
  });

  it('returns null on DB update error', async () => {
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

  it('returns false on DB error', async () => {
    const { supabase, builder } = createMockSupabase();
    builder.mockReturnValue({ data: null, error: { message: 'Reset failed' } });

    const result = await resetOnboarding(supabase, 'u1');

    expect(result).toBe(false);
  });
});
