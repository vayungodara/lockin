import { describe, it, expect, vi } from 'vitest';
import { getComments, getBatchCommentCounts, postComment, deleteComment } from '@/lib/comments';
import { createMockSupabase } from '../../setup/supabase-mock';

vi.mock('@/lib/notifications', () => ({
  createNotification: vi.fn().mockResolvedValue({ data: null, error: null }),
  NOTIFICATION_TYPES: { COMMENT_ON_ACTIVITY: 'comment_on_activity' },
}));

describe('getComments', () => {
  it('returns comments with user profiles attached', async () => {
    const { supabase, builder } = createMockSupabase();
    builder.mockReturnValueSequence([
      {
        data: [
          { id: 'c1', activity_id: 'a1', user_id: 'u1', comment_text: 'Nice!', created_at: '2024-06-01T00:00:00Z' },
          { id: 'c2', activity_id: 'a1', user_id: 'u2', comment_text: 'Thanks!', created_at: '2024-06-01T01:00:00Z' },
        ],
        error: null,
      },
      {
        data: [
          { id: 'u1', full_name: 'Alice', avatar_url: 'alice.png' },
          { id: 'u2', full_name: 'Bob', avatar_url: null },
        ],
        error: null,
      },
    ]);

    const result = await getComments(supabase, 'a1');
    expect(result.error).toBeNull();
    expect(result.data).toHaveLength(2);
    expect(result.data[0].user.full_name).toBe('Alice');
    expect(result.data[1].user.full_name).toBe('Bob');
  });

  it('returns empty array when no comments exist', async () => {
    const { supabase, builder } = createMockSupabase();
    builder.mockReturnValue({ data: [], error: null });

    const result = await getComments(supabase, 'a1');
    expect(result.data).toEqual([]);
    expect(result.error).toBeNull();
  });

  it('assigns "Unknown" when profile is missing', async () => {
    const { supabase, builder } = createMockSupabase();
    builder.mockReturnValueSequence([
      {
        data: [{ id: 'c1', activity_id: 'a1', user_id: 'u-missing', comment_text: 'Hi' }],
        error: null,
      },
      { data: [], error: null },
    ]);

    const result = await getComments(supabase, 'a1');
    expect(result.data[0].user.full_name).toBe('Unknown');
    expect(result.data[0].user.avatar_url).toBeNull();
  });

  it('returns empty array and error on DB failure', async () => {
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

  it('returns empty object for empty activity IDs', async () => {
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

  it('handles null data gracefully', async () => {
    const { supabase, builder } = createMockSupabase();
    builder.mockReturnValue({ data: null, error: null });

    const result = await getBatchCommentCounts(supabase, ['a1']);
    expect(result).toEqual({});
  });
});

describe('postComment', () => {
  it('returns not authenticated when user is null', async () => {
    const { supabase } = createMockSupabase();
    supabase.auth.getUser.mockResolvedValue({ data: { user: null }, error: null });

    const result = await postComment(supabase, 'a1', 'hello');
    expect(result).toEqual({ success: false, error: 'Not authenticated' });
  });

  it('returns success with data on successful post', async () => {
    const { supabase, builder } = createMockSupabase();
    const insertedComment = { id: 'c1', activity_id: 'a1', user_id: 'test-user-id', comment_text: 'hello' };
    builder.mockReturnValueSequence([
      { data: insertedComment, error: null },
      { data: { user_id: 'other-user-id' }, error: null },
    ]);

    const result = await postComment(supabase, 'a1', 'hello');
    expect(result.success).toBe(true);
    expect(result.data).toEqual(insertedComment);
  });

  it('returns failure on insert error', async () => {
    const { supabase, builder } = createMockSupabase();
    builder.mockReturnValue({ data: null, error: { message: 'Insert failed' } });

    const result = await postComment(supabase, 'a1', 'hello');
    expect(result.success).toBe(false);
    expect(result.error).toBeTruthy();
  });
});

describe('deleteComment', () => {
  it('returns not authenticated when user is null', async () => {
    const { supabase } = createMockSupabase();
    supabase.auth.getUser.mockResolvedValue({ data: { user: null }, error: null });

    const result = await deleteComment(supabase, 'c1');
    expect(result).toEqual({ success: false, error: 'Not authenticated' });
  });

  it('returns success on successful delete', async () => {
    const { supabase, builder } = createMockSupabase();
    builder.mockReturnValue({ data: null, error: null });

    const result = await deleteComment(supabase, 'c1');
    expect(result).toEqual({ success: true });
  });

  it('returns failure on delete error', async () => {
    const { supabase, builder } = createMockSupabase();
    builder.mockReturnValue({ data: null, error: { message: 'Delete failed' } });

    const result = await deleteComment(supabase, 'c1');
    expect(result.success).toBe(false);
    expect(result.error).toBeTruthy();
  });
});
