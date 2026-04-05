import { describe, it, expect } from 'vitest';
import {
  REACTIONS,
  getReactions,
  getBatchReactions,
  toggleReaction,
} from '@/lib/reactions';
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

  it('all keys are unique', () => {
    const keys = REACTIONS.map((r) => r.key);
    expect(new Set(keys).size).toBe(keys.length);
  });
});

describe('getReactions', () => {
  it('returns aggregated counts and user reactions on success', async () => {
    const { supabase, builder } = createMockSupabase();
    builder.mockReturnValue({
      data: [
        { reaction: 'fire', user_id: 'test-user-id' },
        { reaction: 'fire', user_id: 'other-user' },
        { reaction: 'clap', user_id: 'other-user' },
      ],
      error: null,
    });

    const result = await getReactions(supabase, 'activity-1');
    expect(result.counts).toEqual({ fire: 2, clap: 1 });
    expect(result.userReactions).toContain('fire');
    expect(result.userReactions).not.toContain('clap');
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
  });

  it('returns safe defaults on DB error', async () => {
    const { supabase, builder } = createMockSupabase();
    builder.mockReturnValue({ data: null, error: { message: 'DB error' } });

    const result = await getReactions(supabase, 'activity-1');
    expect(result.counts).toEqual({});
    expect(result.userReactions).toEqual([]);
    expect(result.total).toBe(0);
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

  it('returns initialized map with counts on success', async () => {
    const { supabase, builder } = createMockSupabase();
    builder.mockReturnValue({
      data: [
        { activity_id: 'a1', reaction: 'fire', user_id: 'test-user-id' },
        { activity_id: 'a1', reaction: 'fire', user_id: 'other' },
        { activity_id: 'a2', reaction: 'clap', user_id: 'other' },
      ],
      error: null,
    });

    const result = await getBatchReactions(supabase, ['a1', 'a2']);
    expect(result.error).toBeNull();
    expect(result.reactionsMap['a1'].counts).toEqual({ fire: 2 });
    expect(result.reactionsMap['a1'].total).toBe(2);
    expect(result.reactionsMap['a1'].userReactions).toContain('fire');
    expect(result.reactionsMap['a2'].counts).toEqual({ clap: 1 });
    expect(result.reactionsMap['a2'].total).toBe(1);
  });

  it('returns empty map on DB error', async () => {
    const { supabase, builder } = createMockSupabase();
    builder.mockReturnValue({ data: null, error: { message: 'DB error' } });

    const result = await getBatchReactions(supabase, ['a1']);
    expect(result.reactionsMap).toEqual({});
    expect(result.error).toBeTruthy();
  });
});

describe('toggleReaction', () => {
  it('returns failure when user is not authenticated', async () => {
    const { supabase, builder } = createMockSupabase();
    supabase.auth.getUser.mockResolvedValue({
      data: { user: null },
      error: null,
    });
    builder.mockReturnValue({ data: null, error: null });

    const result = await toggleReaction(supabase, 'activity-1', 'fire');
    expect(result.success).toBe(false);
    expect(result.error).toBe('Not authenticated');
  });

  it('returns failure on auth error', async () => {
    const { supabase, builder } = createMockSupabase();
    supabase.auth.getUser.mockResolvedValue({
      data: { user: null },
      error: { message: 'Auth failed' },
    });
    builder.mockReturnValue({ data: null, error: null });

    const result = await toggleReaction(supabase, 'activity-1', 'fire');
    expect(result.success).toBe(false);
  });
});
