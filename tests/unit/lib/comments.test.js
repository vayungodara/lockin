import { describe, it, expect } from 'vitest';
import { getComments, getBatchCommentCounts, postComment, deleteComment } from '@/lib/comments';
import { createMockSupabase } from '../../setup/supabase-mock';

describe('getComments', () => {
  it('returns empty array when no comments exist', async () => {
    const { supabase, builder } = createMockSupabase();
    builder.mockReturnValue({ data: [], error: null });

    const result = await getComments(supabase, 'activity-1');
    expect(result.data).toEqual([]);
    expect(result.error).toBeNull();
  });

  it('enriches comments with user profiles', async () => {
    const { supabase, builder } = createMockSupabase();
    builder.mockReturnValueSequence([
      {
        data: [
          { id: 'c1', user_id: 'u1', comment_text: 'Great job!', activity_id: 'a1' },
          { id: 'c2', user_id: 'u2', comment_text: 'Thanks!', activity_id: 'a1' },
        ],
        error: null,
      },
      {
        data: [
          { id: 'u1', full_name: 'Alice', avatar_url: 'https://example.com/alice.png' },
          { id: 'u2', full_name: 'Bob', avatar_url: null },
        ],
        error: null,
      },
    ]);

    const result = await getComments(supabase, 'a1');
    expect(result.data).toHaveLength(2);
    expect(result.data[0].user.full_name).toBe('Alice');
    expect(result.data[1].user.full_name).toBe('Bob');
    expect(result.error).toBeNull();
  });

  it('assigns Unknown user when profile lookup returns null', async () => {
    const { supabase, builder } = createMockSupabase();
    builder.mockReturnValueSequence([
      { data: [{ id: 'c1', user_id: 'u1', comment_text: 'hi', activity_id: 'a1' }], error: null },
      { data: null, error: null },
    ]);

    const result = await getComments(supabase, 'a1');
    expect(result.data[0].user.full_name).toBe('Unknown');
    expect(result.data[0].user.avatar_url).toBeNull();
  });

  it('returns empty data and error on DB failure', async () => {
    const { supabase, builder } = createMockSupabase();
    builder.mockReturnValue({ data: null, error: { message: 'DB error' } });

    const result = await getComments(supabase, 'a1');
    expect(result.data).toEqual([]);
    expect(result.error).toBeTruthy();
  });

  it('skips profile fetch when no comments have user_ids', async () => {
    const { supabase, builder } = createMockSupabase();
    builder.mockReturnValue({ data: [], error: null });

    const result = await getComments(supabase, 'a1');
    expect(result.data).toEqual([]);
    expect(supabase.from).toHaveBeenCalledTimes(1);
  });
});

describe('getBatchCommentCounts', () => {
  it('returns empty object for empty activityIds array', async () => {
    const { supabase } = createMockSupabase();
    const result = await getBatchCommentCounts(supabase, []);
    expect(result).toEqual({});
  });

  it('counts comments grouped by activity_id', async () => {
    const { supabase, builder } = createMockSupabase();
    builder.mockReturnValue({
      data: [
        { activity_id: 'a1' },
        { activity_id: 'a1' },
        { activity_id: 'a2' },
        { activity_id: 'a1' },
      ],
      error: null,
    });

    const result = await getBatchCommentCounts(supabase, ['a1', 'a2']);
    expect(result).toEqual({ a1: 3, a2: 1 });
  });

  it('returns empty object on DB error', async () => {
    const { supabase, builder } = createMockSupabase();
    builder.mockReturnValue({ data: null, error: { message: 'DB error' } });

    const result = await getBatchCommentCounts(supabase, ['a1']);
    expect(result).toEqual({});
  });

  it('returns zero counts for activities with no comments', async () => {
    const { supabase, builder } = createMockSupabase();
    builder.mockReturnValue({ data: [], error: null });

    const result = await getBatchCommentCounts(supabase, ['a1', 'a2']);
    expect(result).toEqual({});
  });
});

describe('postComment', () => {
  it('returns not authenticated when user is null', async () => {
    const { supabase } = createMockSupabase();
    supabase.auth.getUser.mockResolvedValue({ data: { user: null }, error: null });

    const result = await postComment(supabase, 'act-1', 'hello');
    expect(result.success).toBe(false);
    expect(result.error).toBe('Not authenticated');
  });

  it('returns success on happy path', async () => {
    const { supabase, builder } = createMockSupabase();
    builder.mockReturnValueSequence([
      { data: { id: 'comment-1', user_id: 'test-user-id', comment_text: 'hello' }, error: null },
      { data: { user_id: 'test-user-id' }, error: null },
    ]);

    const result = await postComment(supabase, 'act-1', 'hello');
    expect(result.success).toBe(true);
    expect(result.data).toHaveProperty('id', 'comment-1');
  });

  it('returns failure on insert error', async () => {
    const { supabase, builder } = createMockSupabase();
    builder.mockReturnValue({ data: null, error: { message: 'insert failed' } });

    const result = await postComment(supabase, 'act-1', 'hello');
    expect(result.success).toBe(false);
  });

  it('returns failure when auth.getUser rejects', async () => {
    const { supabase } = createMockSupabase();
    supabase.auth.getUser.mockRejectedValue(new Error('network error'));

    const result = await postComment(supabase, 'act-1', 'hello');
    expect(result.success).toBe(false);
  });
});

describe('deleteComment', () => {
  it('returns not authenticated when user is null', async () => {
    const { supabase } = createMockSupabase();
    supabase.auth.getUser.mockResolvedValue({ data: { user: null }, error: null });

    const result = await deleteComment(supabase, 'comment-1');
    expect(result.success).toBe(false);
    expect(result.error).toBe('Not authenticated');
  });

  it('returns success on happy path', async () => {
    const { supabase, builder } = createMockSupabase();
    builder.mockReturnValue({ data: null, error: null });

    const result = await deleteComment(supabase, 'comment-1');
    expect(result.success).toBe(true);
  });

  it('returns failure on delete error', async () => {
    const { supabase, builder } = createMockSupabase();
    builder.mockReturnValue({ data: null, error: { message: 'delete error' } });

    const result = await deleteComment(supabase, 'comment-1');
    expect(result.success).toBe(false);
    expect(result.error).toBeTruthy();
  });
});
