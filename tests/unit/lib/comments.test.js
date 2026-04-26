import { describe, it, expect } from 'vitest';
import { getComments, getBatchCommentCounts, postComment, deleteComment } from '@/lib/comments';
import { createMockSupabase } from '../../setup/supabase-mock';

describe('getComments', () => {
  it('returns comments with user profiles attached', async () => {
    const { supabase, builder } = createMockSupabase();
    builder.mockReturnValueSequence([
      {
        data: [
          { id: 'c1', user_id: 'u1', activity_id: 'a1', comment_text: 'hello', created_at: '2024-06-15T12:00:00Z' },
        ],
        error: null,
      },
      {
        data: [{ id: 'u1', full_name: 'Alice', avatar_url: 'pic.jpg' }],
        error: null,
      },
    ]);

    const result = await getComments(supabase, 'a1');

    expect(result.error).toBeNull();
    expect(result.data).toHaveLength(1);
    expect(result.data[0].comment_text).toBe('hello');
    expect(result.data[0].user).toEqual({ id: 'u1', full_name: 'Alice', avatar_url: 'pic.jpg' });
  });

  it('returns empty array when no comments exist', async () => {
    const { supabase, builder } = createMockSupabase();
    builder.mockReturnValue({ data: [], error: null });

    const result = await getComments(supabase, 'a1');

    expect(result.data).toEqual([]);
    expect(result.error).toBeNull();
  });

  it('falls back to Unknown user when profile not found', async () => {
    const { supabase, builder } = createMockSupabase();
    builder.mockReturnValueSequence([
      {
        data: [{ id: 'c1', user_id: 'u-missing', activity_id: 'a1', comment_text: 'hi', created_at: '2024-06-15' }],
        error: null,
      },
      { data: [], error: null },
    ]);

    const result = await getComments(supabase, 'a1');

    expect(result.data[0].user).toEqual({ full_name: 'Unknown', avatar_url: null });
  });

  it('returns empty data on DB error', async () => {
    const { supabase, builder } = createMockSupabase();
    builder.mockReturnValue({ data: null, error: { message: 'DB error' } });

    const result = await getComments(supabase, 'a1');

    expect(result.data).toEqual([]);
    expect(result.error).toBeTruthy();
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

  it('returns empty object on DB error', async () => {
    const { supabase, builder } = createMockSupabase();
    builder.mockReturnValue({ data: null, error: { message: 'DB error' } });

    const result = await getBatchCommentCounts(supabase, ['a1']);

    expect(result).toEqual({});
  });
});

describe('postComment', () => {
  it('returns success when commenting on own activity (no notification)', async () => {
    const { supabase, builder } = createMockSupabase();
    builder.mockReturnValueSequence([
      { data: { id: 'c1', activity_id: 'a1', user_id: 'test-user-id', comment_text: 'nice' }, error: null },
      { data: { user_id: 'test-user-id' }, error: null },
    ]);

    const result = await postComment(supabase, 'a1', 'nice');

    expect(result.success).toBe(true);
    expect(result.data.id).toBe('c1');
  });

  it('returns failure when not authenticated', async () => {
    const { supabase } = createMockSupabase();
    supabase.auth.getUser.mockResolvedValue({ data: { user: null }, error: null });

    const result = await postComment(supabase, 'a1', 'hi');

    expect(result.success).toBe(false);
    expect(result.error).toBe('Not authenticated');
  });

  it('returns failure on DB insert error', async () => {
    const { supabase, builder } = createMockSupabase();
    builder.mockReturnValue({ data: null, error: { message: 'Insert failed' } });

    const result = await postComment(supabase, 'a1', 'hi');

    expect(result.success).toBe(false);
    expect(result.error).toBeTruthy();
  });
});

describe('deleteComment', () => {
  it('returns success on delete', async () => {
    const { supabase, builder } = createMockSupabase();
    builder.mockReturnValue({ data: null, error: null });

    const result = await deleteComment(supabase, 'c1');

    expect(result.success).toBe(true);
  });

  it('returns failure when not authenticated', async () => {
    const { supabase } = createMockSupabase();
    supabase.auth.getUser.mockResolvedValue({ data: { user: null }, error: null });

    const result = await deleteComment(supabase, 'c1');

    expect(result.success).toBe(false);
    expect(result.error).toBe('Not authenticated');
  });

  it('returns failure on DB error', async () => {
    const { supabase, builder } = createMockSupabase();
    builder.mockReturnValue({ data: null, error: { message: 'Delete failed' } });

    const result = await deleteComment(supabase, 'c1');

    expect(result.success).toBe(false);
    expect(result.error).toBeTruthy();
  });
});
