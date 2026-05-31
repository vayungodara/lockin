import { describe, it, expect, vi } from 'vitest';
import { getComments, getBatchCommentCounts, postComment, deleteComment } from '@/lib/comments';
import { createMockSupabase } from '../../setup/supabase-mock';

vi.mock('@/lib/notifications', () => ({
  createNotification: vi.fn().mockResolvedValue({ error: null }),
  NOTIFICATION_TYPES: { COMMENT_ON_ACTIVITY: 'comment_on_activity' },
}));

describe('getComments', () => {
  it('returns empty array when no comments exist', async () => {
    const { supabase, builder } = createMockSupabase();
    builder.mockReturnValue({ data: [], error: null });

    const result = await getComments(supabase, 'activity-1');
    expect(result.data).toEqual([]);
    expect(result.error).toBeNull();
  });

  it('returns comments with user profiles attached', async () => {
    const { supabase, builder } = createMockSupabase();
    builder.mockReturnValueSequence([
      {
        data: [
          { id: 'c1', user_id: 'u1', comment_text: 'Great work!' },
          { id: 'c2', user_id: 'u2', comment_text: 'Keep it up!' },
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

    const result = await getComments(supabase, 'activity-1');
    expect(result.data).toHaveLength(2);
    expect(result.data[0].user.full_name).toBe('Alice');
    expect(result.data[1].user.full_name).toBe('Bob');
    expect(result.error).toBeNull();
  });

  it('falls back to Unknown when profile is not found', async () => {
    const { supabase, builder } = createMockSupabase();
    builder.mockReturnValueSequence([
      { data: [{ id: 'c1', user_id: 'u-missing', comment_text: 'Hello' }], error: null },
      { data: [], error: null },
    ]);

    const result = await getComments(supabase, 'activity-1');
    expect(result.data[0].user.full_name).toBe('Unknown');
    expect(result.data[0].user.avatar_url).toBeNull();
  });

  it('returns empty data and error on DB failure', async () => {
    const { supabase, builder } = createMockSupabase();
    builder.mockReturnValue({ data: null, error: { message: 'DB error' } });

    const result = await getComments(supabase, 'activity-1');
    expect(result.data).toEqual([]);
    expect(result.error).toBeTruthy();
  });

  it('handles null profiles response gracefully', async () => {
    const { supabase, builder } = createMockSupabase();
    builder.mockReturnValueSequence([
      { data: [{ id: 'c1', user_id: 'u1', comment_text: 'Hi' }], error: null },
      { data: null, error: null },
    ]);

    const result = await getComments(supabase, 'activity-1');
    expect(result.data[0].user.full_name).toBe('Unknown');
  });
});

describe('getBatchCommentCounts', () => {
  it('returns empty object for empty input array', async () => {
    const { supabase } = createMockSupabase();
    const result = await getBatchCommentCounts(supabase, []);
    expect(result).toEqual({});
  });

  it('counts comments per activity correctly', async () => {
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

  it('handles activities with zero comments', async () => {
    const { supabase, builder } = createMockSupabase();
    builder.mockReturnValue({ data: [], error: null });

    const result = await getBatchCommentCounts(supabase, ['a1', 'a2']);
    expect(result).toEqual({});
  });
});

describe('postComment', () => {
  it('returns success on happy path', async () => {
    const { supabase, builder } = createMockSupabase();
    builder.mockReturnValueSequence([
      { data: { id: 'c1', activity_id: 'a1', comment_text: 'Nice!' }, error: null },
      { data: { user_id: 'other-user-id' }, error: null },
    ]);

    const result = await postComment(supabase, 'a1', 'Nice!');
    expect(result.success).toBe(true);
    expect(result.data.id).toBe('c1');
  });

  it('returns failure when not authenticated', async () => {
    const { supabase } = createMockSupabase();
    supabase.auth.getUser.mockResolvedValue({ data: { user: null }, error: null });

    const result = await postComment(supabase, 'a1', 'Hello');
    expect(result.success).toBe(false);
    expect(result.error).toBe('Not authenticated');
  });

  it('returns failure on insert error', async () => {
    const { supabase, builder } = createMockSupabase();
    builder.mockReturnValue({ data: null, error: { message: 'insert failed' } });

    const result = await postComment(supabase, 'a1', 'Hello');
    expect(result.success).toBe(false);
    expect(result.error).toBeTruthy();
  });

  it('does not notify when commenter is the activity author', async () => {
    const { supabase, builder } = createMockSupabase();
    builder.mockReturnValueSequence([
      { data: { id: 'c1', activity_id: 'a1', comment_text: 'Self-comment' }, error: null },
      { data: { user_id: 'test-user-id' }, error: null },
    ]);

    const result = await postComment(supabase, 'a1', 'Self-comment');
    expect(result.success).toBe(true);
  });
});

describe('deleteComment', () => {
  it('returns success on happy path', async () => {
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
    builder.mockReturnValue({ data: null, error: { message: 'delete failed' } });

    const result = await deleteComment(supabase, 'c1');
    expect(result.success).toBe(false);
    expect(result.error).toBeTruthy();
  });
});
