import { describe, it, expect } from 'vitest';
import { REACTIONS, getReactions, getBatchReactions, toggleReaction } from '@/lib/reactions';
import { createMockSupabase } from '../../setup/supabase-mock';

describe('REACTIONS', () => {
  it('has 5 reaction types', () => {
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

  it('includes fire, clap, strong, yikes, love', () => {
    const keys = REACTIONS.map((r) => r.key);
    expect(keys).toEqual(['fire', 'clap', 'strong', 'yikes', 'love']);
  });
});

describe('getReactions', () => {
  it('returns reaction counts and user reactions for an activity', async () => {
    const { supabase, builder } = createMockSupabase();
    builder.mockReturnValue({
      data: [
        { reaction: 'fire', user_id: 'test-user-id' },
        { reaction: 'fire', user_id: 'other-user' },
        { reaction: 'clap', user_id: 'test-user-id' },
      ],
      error: null,
    });

    const result = await getReactions(supabase, 'activity-1');
    expect(result.counts).toEqual({ fire: 2, clap: 1 });
    expect(result.userReactions).toContain('fire');
    expect(result.userReactions).toContain('clap');
    expect(result.total).toBe(3);
    expect(result.error).toBeNull();
  });

  it('returns empty results when no reactions exist', async () => {
    const { supabase, builder } = createMockSupabase();
    builder.mockReturnValue({ data: [], error: null });

    const result = await getReactions(supabase, 'activity-1');
    expect(result.counts).toEqual({});
    expect(result.userReactions).toEqual([]);
    expect(result.total).toBe(0);
    expect(result.error).toBeNull();
  });

  it('returns safe default on DB error', async () => {
    const { supabase, builder } = createMockSupabase();
    builder.mockReturnValue({ data: null, error: { message: 'DB error' } });

    const result = await getReactions(supabase, 'activity-1');
    expect(result.counts).toEqual({});
    expect(result.userReactions).toEqual([]);
    expect(result.total).toBe(0);
    expect(result.error).toBeTruthy();
  });

  it('returns safe default on auth error', async () => {
    const { supabase, builder } = createMockSupabase();
    builder.mockReturnValue({ data: [], error: null });
    supabase.auth.getUser.mockResolvedValue({
      data: { user: null },
      error: { message: 'Auth error' },
    });

    const result = await getReactions(supabase, 'activity-1');
    expect(result.counts).toEqual({});
    expect(result.userReactions).toEqual([]);
    expect(result.error).toBeTruthy();
  });
});

describe('getBatchReactions', () => {
  it('returns empty map for empty activityIds', async () => {
    const { supabase } = createMockSupabase();

    const result = await getBatchReactions(supabase, []);
    expect(result).toEqual({ reactionsMap: {}, error: null });
  });

  it('returns empty map for null activityIds', async () => {
    const { supabase } = createMockSupabase();

    const result = await getBatchReactions(supabase, null);
    expect(result).toEqual({ reactionsMap: {}, error: null });
  });

  it('groups reactions by activity ID', async () => {
    const { supabase, builder } = createMockSupabase();
    builder.mockReturnValue({
      data: [
        { activity_id: 'a1', reaction: 'fire', user_id: 'test-user-id' },
        { activity_id: 'a1', reaction: 'clap', user_id: 'other-user' },
        { activity_id: 'a2', reaction: 'love', user_id: 'test-user-id' },
      ],
      error: null,
    });

    const result = await getBatchReactions(supabase, ['a1', 'a2']);
    expect(result.error).toBeNull();
    expect(result.reactionsMap.a1.counts).toEqual({ fire: 1, clap: 1 });
    expect(result.reactionsMap.a1.total).toBe(2);
    expect(result.reactionsMap.a1.userReactions).toContain('fire');
    expect(result.reactionsMap.a2.counts).toEqual({ love: 1 });
    expect(result.reactionsMap.a2.total).toBe(1);
  });

  it('returns safe default on DB error', async () => {
    const { supabase, builder } = createMockSupabase();
    builder.mockReturnValue({ data: null, error: { message: 'DB error' } });

    const result = await getBatchReactions(supabase, ['a1']);
    expect(result.reactionsMap).toEqual({});
    expect(result.error).toBeTruthy();
  });

  it('initializes empty entries for all requested IDs', async () => {
    const { supabase, builder } = createMockSupabase();
    builder.mockReturnValue({ data: [], error: null });

    const result = await getBatchReactions(supabase, ['a1', 'a2', 'a3']);
    expect(result.error).toBeNull();
    expect(Object.keys(result.reactionsMap)).toHaveLength(3);
    ['a1', 'a2', 'a3'].forEach((id) => {
      expect(result.reactionsMap[id]).toEqual({ counts: {}, userReactions: [], total: 0 });
    });
  });
});

describe('toggleReaction', () => {
  it('returns error when not authenticated', async () => {
    const { supabase } = createMockSupabase();
    supabase.auth.getUser.mockResolvedValue({
      data: { user: null },
      error: null,
    });

    const result = await toggleReaction(supabase, 'activity-1', 'fire');
    expect(result.success).toBe(false);
    expect(result.error).toBe('Not authenticated');
  });

  it('returns error on auth failure', async () => {
    const { supabase } = createMockSupabase();
    supabase.auth.getUser.mockResolvedValue({
      data: { user: null },
      error: { message: 'Auth failed' },
    });

    const result = await toggleReaction(supabase, 'activity-1', 'fire');
    expect(result.success).toBe(false);
    expect(result.error).toBeTruthy();
  });

  it('removes existing reaction', async () => {
    const { supabase, builder } = createMockSupabase();
    builder.mockReturnValue({ data: { id: 'reaction-1' }, error: null });

    const result = await toggleReaction(supabase, 'activity-1', 'fire');
    expect(result.success).toBe(true);
    expect(result.action).toBe('removed');
  });

  it('adds new reaction when none exists', async () => {
    const { supabase, builder } = createMockSupabase();
    // When no existing reaction, single() returns PGRST116 error and null data
    // Then insert succeeds — but with shared builder, both return same value
    // The code treats PGRST116 as "not found" and proceeds to insert
    // Since builder returns { data: null, error: null } after we set it:
    builder.mockReturnValue({ data: null, error: null });

    const result = await toggleReaction(supabase, 'activity-1', 'fire');
    // With null data from single() and no error, existing is null → insert path
    expect(result.success).toBe(true);
    expect(result.action).toBe('added');
  });
});
