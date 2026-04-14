import { describe, it, expect } from 'vitest';
import { REACTIONS, getReactions, getBatchReactions, toggleReaction } from '@/lib/reactions';
import { createMockSupabase } from '../../setup/supabase-mock';

describe('REACTIONS', () => {
  it('has 5 reactions', () => {
    expect(REACTIONS).toHaveLength(5);
  });

  it('each reaction has emoji, label, and key', () => {
    REACTIONS.forEach((r) => {
      expect(r).toHaveProperty('emoji');
      expect(r).toHaveProperty('label');
      expect(r).toHaveProperty('key');
      expect(typeof r.emoji).toBe('string');
      expect(typeof r.label).toBe('string');
      expect(typeof r.key).toBe('string');
    });
  });

  it('all reaction keys are unique', () => {
    const keys = REACTIONS.map((r) => r.key);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it('includes the expected reaction keys', () => {
    const keys = REACTIONS.map((r) => r.key);
    expect(keys).toEqual(expect.arrayContaining(['fire', 'clap', 'strong', 'yikes', 'love']));
  });
});

describe('getReactions', () => {
  it('returns zeros and empty structures when no reactions exist', async () => {
    const { supabase, builder } = createMockSupabase();
    builder.mockReturnValue({ data: [], error: null });

    const result = await getReactions(supabase, 'activity-1');
    expect(result.counts).toEqual({});
    expect(result.userReactions).toEqual([]);
    expect(result.total).toBe(0);
    expect(result.error).toBeNull();
  });

  it('returns safe defaults and error when DB call fails', async () => {
    const { supabase, builder } = createMockSupabase();
    builder.mockReturnValue({ data: null, error: { message: 'DB error' } });

    const result = await getReactions(supabase, 'activity-1');
    expect(result.counts).toEqual({});
    expect(result.userReactions).toEqual([]);
    expect(result.total).toBe(0);
    expect(result.error).toBeTruthy();
  });

  it('tallies reaction counts and flags the current user reactions', async () => {
    const { supabase, builder } = createMockSupabase();
    builder.mockReturnValue({
      data: [
        { activity_id: 'a1', user_id: 'test-user-id', reaction: 'fire' },
        { activity_id: 'a1', user_id: 'other-user', reaction: 'fire' },
        { activity_id: 'a1', user_id: 'other-user', reaction: 'clap' },
      ],
      error: null,
    });

    const result = await getReactions(supabase, 'a1');
    expect(result.counts).toEqual({ fire: 2, clap: 1 });
    expect(result.userReactions).toEqual(['fire']);
    expect(result.total).toBe(3);
    expect(result.error).toBeNull();
  });

  it('handles unauthenticated users gracefully (no userReactions)', async () => {
    const { supabase, builder } = createMockSupabase();
    supabase.auth.getUser.mockResolvedValue({ data: { user: null }, error: null });
    builder.mockReturnValue({
      data: [
        { activity_id: 'a1', user_id: 'other-user', reaction: 'fire' },
      ],
      error: null,
    });

    const result = await getReactions(supabase, 'a1');
    expect(result.counts).toEqual({ fire: 1 });
    expect(result.userReactions).toEqual([]);
    expect(result.total).toBe(1);
  });
});

describe('getBatchReactions', () => {
  it('returns empty map when activityIds is empty', async () => {
    const { supabase } = createMockSupabase();
    const result = await getBatchReactions(supabase, []);
    expect(result).toEqual({ reactionsMap: {}, error: null });
  });

  it('returns empty map when activityIds is null/undefined', async () => {
    const { supabase } = createMockSupabase();
    const result = await getBatchReactions(supabase, null);
    expect(result).toEqual({ reactionsMap: {}, error: null });
  });

  it('returns empty map and error on DB failure', async () => {
    const { supabase, builder } = createMockSupabase();
    builder.mockReturnValue({ data: null, error: { message: 'DB error' } });

    const result = await getBatchReactions(supabase, ['a1', 'a2']);
    expect(result.reactionsMap).toEqual({});
    expect(result.error).toBeTruthy();
  });

  it('initializes an entry for each activityId with no reactions', async () => {
    const { supabase, builder } = createMockSupabase();
    builder.mockReturnValue({ data: [], error: null });

    const result = await getBatchReactions(supabase, ['a1', 'a2']);
    expect(result.reactionsMap).toEqual({
      a1: { counts: {}, userReactions: [], total: 0 },
      a2: { counts: {}, userReactions: [], total: 0 },
    });
    expect(result.error).toBeNull();
  });

  it('groups reactions by activity_id and marks current user reactions', async () => {
    const { supabase, builder } = createMockSupabase();
    builder.mockReturnValue({
      data: [
        { activity_id: 'a1', user_id: 'test-user-id', reaction: 'fire' },
        { activity_id: 'a1', user_id: 'other-user', reaction: 'clap' },
        { activity_id: 'a2', user_id: 'test-user-id', reaction: 'love' },
      ],
      error: null,
    });

    const result = await getBatchReactions(supabase, ['a1', 'a2']);
    expect(result.reactionsMap.a1.counts).toEqual({ fire: 1, clap: 1 });
    expect(result.reactionsMap.a1.userReactions).toEqual(['fire']);
    expect(result.reactionsMap.a1.total).toBe(2);
    expect(result.reactionsMap.a2.counts).toEqual({ love: 1 });
    expect(result.reactionsMap.a2.userReactions).toEqual(['love']);
    expect(result.reactionsMap.a2.total).toBe(1);
    expect(result.error).toBeNull();
  });
});

describe('toggleReaction', () => {
  it('returns "Not authenticated" when no user is signed in', async () => {
    const { supabase } = createMockSupabase();
    supabase.auth.getUser.mockResolvedValue({ data: { user: null }, error: null });

    const result = await toggleReaction(supabase, 'a1', 'fire');
    expect(result).toEqual({ success: false, error: 'Not authenticated' });
  });

  it('adds the reaction when the user has not reacted yet', async () => {
    const { supabase, builder } = createMockSupabase();
    // Real Supabase returns { data: null, error: { code: 'PGRST116' } } for
    // .single() when no row matches — the lib explicitly treats PGRST116 as
    // "not found" (lib/reactions.js:102) and falls through to insert.
    builder.mockReturnValueSequence([
      { data: null, error: { code: 'PGRST116' } }, // existence check
      { data: null, error: null },                  // insert
    ]);

    const result = await toggleReaction(supabase, 'a1', 'fire');
    expect(result.success).toBe(true);
    expect(result.action).toBe('added');
    // Prove the insert path actually executed (not the remove path)
    expect(builder.insert).toHaveBeenCalledTimes(1);
    expect(builder.delete).not.toHaveBeenCalled();
  });

  it('removes the reaction when the user has already reacted', async () => {
    const { supabase, builder } = createMockSupabase();
    // Existing reaction: .single() returns a row, delete returns no error
    builder.mockReturnValueSequence([
      { data: { id: 'reaction-123' }, error: null }, // existence check
      { data: null, error: null },                    // delete
    ]);

    const result = await toggleReaction(supabase, 'a1', 'fire');
    expect(result.success).toBe(true);
    expect(result.action).toBe('removed');
    // Prove the remove path actually executed (not the insert path)
    expect(builder.delete).toHaveBeenCalledTimes(1);
    expect(builder.insert).not.toHaveBeenCalled();
  });

  it('returns failure when auth call errors', async () => {
    const { supabase } = createMockSupabase();
    supabase.auth.getUser.mockResolvedValue({ data: null, error: { message: 'auth broken' } });

    const result = await toggleReaction(supabase, 'a1', 'fire');
    expect(result.success).toBe(false);
    expect(result.error).toBeTruthy();
  });
});
