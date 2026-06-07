import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  getOnboardingState,
  detectProgress,
  syncProgress,
  resetOnboarding,
} from '@/lib/onboarding';
import { createMockSupabase } from '../../setup/supabase-mock';

/**
 * Per-table mock — each supabase.from(table) returns a distinct builder
 * so Promise.all queries on different tables get independent responses.
 */
function createTableMock() {
  function makeBuilder() {
    const chainMethods = [
      'select', 'eq', 'neq', 'in', 'not', 'gte', 'order', 'range',
      'single', 'maybeSingle', 'insert', 'update', 'upsert', 'delete', 'limit',
    ];
    const b = {
      resolveWith(value) {
        b.then = (resolve) => resolve(value);
      },
    };
    chainMethods.forEach((m) => {
      b[m] = vi.fn(() => b);
    });
    b.resolveWith({ data: null, error: null });
    return b;
  }

  const builders = {};
  const supabase = {
    from: vi.fn((table) => {
      if (!builders[table]) builders[table] = makeBuilder();
      return builders[table];
    }),
    rpc: vi.fn().mockResolvedValue({ data: null, error: null }),
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: { id: 'test-user-id' } },
        error: null,
      }),
    },
  };
  return { supabase, builders };
}

describe('getOnboardingState', () => {
  it('returns null when no userId', async () => {
    const { supabase } = createMockSupabase();
    const result = await getOnboardingState(supabase, null);
    expect(result).toBeNull();
  });

  it('returns null for undefined userId', async () => {
    const { supabase } = createMockSupabase();
    const result = await getOnboardingState(supabase, undefined);
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

  it('creates new row via upsert when no existing row', async () => {
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

  it('returns null when upsert fails', async () => {
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
  it('returns null when no userId', async () => {
    const { supabase } = createMockSupabase();
    const result = await detectProgress(supabase, null);
    expect(result).toBeNull();
  });

  it('detects all steps as incomplete when tables are empty', async () => {
    const { supabase, builders } = createTableMock();

    builders.pacts = supabase.from('pacts');
    builders.pacts.resolveWith({ data: [], error: null });

    builders.focus_sessions = supabase.from('focus_sessions');
    builders.focus_sessions.resolveWith({ data: [], error: null });

    builders.group_members = supabase.from('group_members');
    builders.group_members.resolveWith({ data: [], error: null });

    builders.profiles = supabase.from('profiles');
    builders.profiles.resolveWith({ data: { current_streak: 0 }, error: null });

    const result = await detectProgress(supabase, 'u1');
    expect(result).toEqual({
      has_created_pact: false,
      has_joined_group: false,
      has_used_focus_timer: false,
      has_built_momentum: false,
    });
  });

  it('detects completed steps from real data', async () => {
    const { supabase, builders } = createTableMock();

    builders.pacts = supabase.from('pacts');
    builders.pacts.resolveWith({ data: [{ id: 'p1' }], error: null });

    builders.focus_sessions = supabase.from('focus_sessions');
    builders.focus_sessions.resolveWith({ data: [{ id: 'f1' }], error: null });

    builders.group_members = supabase.from('group_members');
    builders.group_members.resolveWith({ data: [], error: null });

    builders.profiles = supabase.from('profiles');
    builders.profiles.resolveWith({ data: { current_streak: 5 }, error: null });

    const result = await detectProgress(supabase, 'u1');
    expect(result).toEqual({
      has_created_pact: true,
      has_joined_group: false,
      has_used_focus_timer: true,
      has_built_momentum: true,
    });
  });

  it('requires streak >= 2 for has_built_momentum', async () => {
    const { supabase, builders } = createTableMock();

    builders.pacts = supabase.from('pacts');
    builders.pacts.resolveWith({ data: [], error: null });

    builders.focus_sessions = supabase.from('focus_sessions');
    builders.focus_sessions.resolveWith({ data: [], error: null });

    builders.group_members = supabase.from('group_members');
    builders.group_members.resolveWith({ data: [], error: null });

    builders.profiles = supabase.from('profiles');
    builders.profiles.resolveWith({ data: { current_streak: 1 }, error: null });

    const result = await detectProgress(supabase, 'u1');
    expect(result.has_built_momentum).toBe(false);
  });

  it('returns null when any query errors', async () => {
    const { supabase, builders } = createTableMock();

    builders.pacts = supabase.from('pacts');
    builders.pacts.resolveWith({ data: null, error: { message: 'fail' } });

    builders.focus_sessions = supabase.from('focus_sessions');
    builders.focus_sessions.resolveWith({ data: [], error: null });

    builders.group_members = supabase.from('group_members');
    builders.group_members.resolveWith({ data: [], error: null });

    builders.profiles = supabase.from('profiles');
    builders.profiles.resolveWith({ data: { current_streak: 0 }, error: null });

    const result = await detectProgress(supabase, 'u1');
    expect(result).toBeNull();
  });
});

describe('syncProgress', () => {
  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns null when no userId', async () => {
    const { supabase } = createMockSupabase();
    const result = await syncProgress(supabase, null, {}, {});
    expect(result).toBeNull();
  });

  it('returns unchanged state when no new steps completed', async () => {
    const { supabase } = createMockSupabase();
    const dbState = { has_created_pact: true, has_joined_group: false };
    const detected = { has_created_pact: true, has_joined_group: false };

    const result = await syncProgress(supabase, 'u1', dbState, detected);
    expect(result.updatedState).toEqual(dbState);
    expect(result.newlyCompleted).toHaveLength(0);
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
    expect(result.newlyCompleted).toHaveLength(1);
    expect(result.newlyCompleted[0].field).toBe('has_created_pact');
    expect(result.updatedState.has_created_pact).toBe(true);
  });

  it('returns null when update fails', async () => {
    const { supabase, builder } = createMockSupabase();
    builder.mockReturnValue({ data: null, error: { message: 'update failed' } });

    const dbState = { has_created_pact: false };
    const detected = { has_created_pact: true };

    const result = await syncProgress(supabase, 'u1', dbState, detected);
    expect(result).toBeNull();
  });

  it('sets onboarding_completed_at when all steps complete', async () => {
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
});

describe('resetOnboarding', () => {
  it('returns false when no userId', async () => {
    const { supabase } = createMockSupabase();
    const result = await resetOnboarding(supabase, null);
    expect(result).toBe(false);
  });

  it('returns true on success', async () => {
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
