import { describe, it, expect } from 'vitest';
import { getComments, getBatchCommentCounts, postComment, deleteComment } from '@/lib/comments';
import { createMockSupabase } from '../../setup/supabase-mock';

describe('getComments', () => {
  it('returns comments with user profiles attached', async () => {
    const { supabase, builder } = createMockSupabase();
    builder.mockReturnValueSequence([
      {
        data: [
          { id: 'c1', activity_id: 'a1', user_id: 'u1', comment_text: 'Nice!', created_at: '2024-06-15T10:00:00Z' },
        ],
        error: null,
      },
      {
        data: [{ id: 'u1', full_name: 'Alice', avatar_url: 'https://example.com/alice.png' }],
        error: null,
      },
    ]);

    const result = await getComments(supabase, 'a1');
    expect(result.error).toBeNull();
    expect(result.data).toHaveLength(1);
    expect(result.data[0].user).toEqual({ id: 'u1', full_name: 'Alice', avatar_url: 'https://example.com/alice.png' });
  });

  it('returns empty array when no comments exist', async () => {
    const { supabase, builder } = createMockSupabase();
    builder.mockReturnValue({ data: [], error: null });

    const result = await getComments(supabase, 'a1');
    expect(result.error).toBeNull();
    expect(result.data).toEqual([]);
  });

  it('returns empty array on database error', async () => {
    const { supabase, builder } = createMockSupabase();
    builder.mockReturnValue({ data: null, error: { message: 'DB error' } });

    const result = await getComments(supabase, 'a1');
    expect(result.data).toEqual([]);
    expect(result.error).toBeTruthy();
  });

  it('assigns Unknown user when profile is not found', async () => {
    const { supabase, builder } = createMockSupabase();
    builder.mockReturnValueSequence([
      {
        data: [{ id: 'c1', activity_id: 'a1', user_id: 'u-missing', comment_text: 'Hello', created_at: '2024-06-15T10:00:00Z' }],
        error: null,
      },
      { data: [], error: null },
    ]);

    const result = await getComments(supabase, 'a1');
    expect(result.data[0].user).toEqual({ full_name: 'Unknown', avatar_url: null });
  });
});

describe('getBatchCommentCounts', () => {
  it('returns counts grouped by activity_id', async () => {
    const { supabase, builder } = createMockSupabase();
    builder.mockReturnValue({
      data: [
        { activity_id: 'a1' },
        { activity_id: 'a1' },
        { activity_id: 'a2' },
      ],
      error: null,
    });

    const result = await getBatchCommentCounts(supabase, ['a1', 'a2']);
    expect(result).toEqual({ a1: 2, a2: 1 });
  });

  it('returns empty object for empty activityIds array', async () => {
    const { supabase } = createMockSupabase();
    const result = await getBatchCommentCounts(supabase, []);
    expect(result).toEqual({});
  });

  it('returns empty object on database error', async () => {
    const { supabase, builder } = createMockSupabase();
    builder.mockReturnValue({ data: null, error: { message: 'DB error' } });

    const result = await getBatchCommentCounts(supabase, ['a1']);
    expect(result).toEqual({});
  });

  it('returns empty object when no comments found', async () => {
    const { supabase, builder } = createMockSupabase();
    builder.mockReturnValue({ data: [], error: null });

    const result = await getBatchCommentCounts(supabase, ['a1', 'a2']);
    expect(result).toEqual({});
  });
});

describe('postComment', () => {
  it('posts a comment and returns success', async () => {
    const { supabase, builder } = createMockSupabase();
    builder.mockReturnValueSequence([
      { data: { id: 'c-new', activity_id: 'a1', user_id: 'test-user-id', comment_text: 'Great work!' }, error: null },
      { data: { user_id: 'other-user' }, error: null },
    ]);

    const result = await postComment(supabase, 'a1', 'Great work!');
    expect(result.success).toBe(true);
    expect(result.data).toHaveProperty('id', 'c-new');
  });

  it('returns failure when user is not authenticated', async () => {
    const { supabase, builder } = createMockSupabase();
    supabase.auth.getUser.mockResolvedValue({ data: { user: null }, error: null });

    const result = await postComment(supabase, 'a1', 'Hello');
    expect(result.success).toBe(false);
    expect(result.error).toBe('Not authenticated');
  });

  it('returns failure on database error', async () => {
    const { supabase, builder } = createMockSupabase();
    builder.mockReturnValue({ data: null, error: { message: 'Insert failed' } });

    const result = await postComment(supabase, 'a1', 'Hello');
    expect(result.success).toBe(false);
    expect(result.error).toBeTruthy();
  });
});

describe('deleteComment', () => {
  it('deletes own comment and returns success', async () => {
    const { supabase, builder } = createMockSupabase();
    builder.mockReturnValue({ data: null, error: null });

    const result = await deleteComment(supabase, 'c1');
    expect(result.success).toBe(true);
  });

  it('returns failure when user is not authenticated', async () => {
    const { supabase } = createMockSupabase();
    supabase.auth.getUser.mockResolvedValue({ data: { user: null }, error: null });

    const result = await deleteComment(supabase, 'c1');
    expect(result.success).toBe(false);
    expect(result.error).toBe('Not authenticated');
  });

  it('returns failure on database error', async () => {
    const { supabase, builder } = createMockSupabase();
    builder.mockReturnValue({ data: null, error: { message: 'Delete failed' } });

    const result = await deleteComment(supabase, 'c1');
    expect(result.success).toBe(false);
    expect(result.error).toBeTruthy();
  });
});
