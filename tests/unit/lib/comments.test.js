import { describe, it, expect, vi } from 'vitest';
import {
  getComments,
  getBatchCommentCounts,
  postComment,
  deleteComment,
} from '@/lib/comments';
import { createMockSupabase } from '../../setup/supabase-mock';

vi.mock('@/lib/notifications', () => ({
  createNotification: vi.fn().mockResolvedValue({ success: true }),
  NOTIFICATION_TYPES: { COMMENT_ON_ACTIVITY: 'comment_on_activity' },
}));

describe('getComments', () => {
  it('returns comments with user profiles attached', async () => {
    const { supabase, builder } = createMockSupabase();
    builder.mockReturnValueSequence([
      {
        data: [
          { id: 'c1', activity_id: 'a1', user_id: 'u1', comment_text: 'Nice work!' },
          { id: 'c2', activity_id: 'a1', user_id: 'u2', comment_text: 'Thanks!' },
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
    expect(result.error).toBeNull();
    expect(result.data).toHaveLength(2);
    expect(result.data[0].user.full_name).toBe('Alice');
    expect(result.data[1].user.full_name).toBe('Bob');
    expect(result.data[0].comment_text).toBe('Nice work!');
  });

  it('returns empty array when no comments exist', async () => {
    const { supabase, builder } = createMockSupabase();
    builder.mockReturnValue({ data: [], error: null });

    const result = await getComments(supabase, 'a1');
    expect(result.error).toBeNull();
    expect(result.data).toEqual([]);
  });

  it('returns empty array and error on DB failure', async () => {
    const { supabase, builder } = createMockSupabase();
    builder.mockReturnValue({ data: null, error: { message: 'DB error' } });

    const result = await getComments(supabase, 'a1');
    expect(result.data).toEqual([]);
    expect(result.error).toBeTruthy();
  });

  it('assigns Unknown user when profile is missing', async () => {
    const { supabase, builder } = createMockSupabase();
    builder.mockReturnValueSequence([
      {
        data: [{ id: 'c1', activity_id: 'a1', user_id: 'u-missing', comment_text: 'Hello' }],
        error: null,
      },
      { data: [], error: null },
    ]);

    const result = await getComments(supabase, 'a1');
    expect(result.data[0].user.full_name).toBe('Unknown');
    expect(result.data[0].user.avatar_url).toBeNull();
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

    const counts = await getBatchCommentCounts(supabase, ['a1', 'a2']);
    expect(counts).toEqual({ a1: 2, a2: 1 });
  });

  it('returns empty object for empty activity IDs array', async () => {
    const { supabase } = createMockSupabase();
    const counts = await getBatchCommentCounts(supabase, []);
    expect(counts).toEqual({});
  });

  it('returns empty object on DB error', async () => {
    const { supabase, builder } = createMockSupabase();
    builder.mockReturnValue({ data: null, error: { message: 'DB error' } });

    const counts = await getBatchCommentCounts(supabase, ['a1']);
    expect(counts).toEqual({});
  });

  it('handles null data gracefully', async () => {
    const { supabase, builder } = createMockSupabase();
    builder.mockReturnValue({ data: null, error: null });

    const counts = await getBatchCommentCounts(supabase, ['a1']);
    expect(counts).toEqual({});
  });
});

describe('postComment', () => {
  it('returns not authenticated when user is null', async () => {
    const { supabase } = createMockSupabase();
    supabase.auth.getUser.mockResolvedValue({ data: { user: null }, error: null });

    const result = await postComment(supabase, 'a1', 'Hello');
    expect(result.success).toBe(false);
    expect(result.error).toBe('Not authenticated');
  });

  it('returns success on happy path', async () => {
    const { supabase, builder } = createMockSupabase();
    builder.mockReturnValueSequence([
      { data: { id: 'c1', comment_text: 'Great!' }, error: null },
      { data: { user_id: 'other-user' }, error: null },
    ]);

    const result = await postComment(supabase, 'a1', 'Great!');
    expect(result.success).toBe(true);
    expect(result.data).toEqual({ id: 'c1', comment_text: 'Great!' });
  });

  it('returns failure on insert error', async () => {
    const { supabase, builder } = createMockSupabase();
    builder.mockReturnValue({ data: null, error: { message: 'insert failed' } });

    const result = await postComment(supabase, 'a1', 'Hello');
    expect(result.success).toBe(false);
    expect(result.error).toBeTruthy();
  });

  it('skips notification when commenter is the activity author', async () => {
    const { createNotification } = await import('@/lib/notifications');
    createNotification.mockClear();

    const { supabase, builder } = createMockSupabase();
    builder.mockReturnValueSequence([
      { data: { id: 'c1', comment_text: 'Self-comment' }, error: null },
      { data: { user_id: 'test-user-id' }, error: null },
    ]);

    const result = await postComment(supabase, 'a1', 'Self-comment');
    expect(result.success).toBe(true);
    expect(createNotification).not.toHaveBeenCalled();
  });
});

describe('deleteComment', () => {
  it('returns not authenticated when user is null', async () => {
    const { supabase } = createMockSupabase();
    supabase.auth.getUser.mockResolvedValue({ data: { user: null }, error: null });

    const result = await deleteComment(supabase, 'c1');
    expect(result.success).toBe(false);
    expect(result.error).toBe('Not authenticated');
  });

  it('returns success on happy path', async () => {
    const { supabase, builder } = createMockSupabase();
    builder.mockReturnValue({ data: null, error: null });

    const result = await deleteComment(supabase, 'c1');
    expect(result.success).toBe(true);
  });

  it('returns failure on delete error', async () => {
    const { supabase, builder } = createMockSupabase();
    builder.mockReturnValue({ data: null, error: { message: 'delete failed' } });

    const result = await deleteComment(supabase, 'c1');
    expect(result.success).toBe(false);
    expect(result.error).toBeTruthy();
  });
});
