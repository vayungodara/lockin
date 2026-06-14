import { describe, it, expect } from 'vitest';
import {
  getComments,
  getBatchCommentCounts,
  postComment,
  deleteComment,
} from '@/lib/comments';
import { createMockSupabase } from '../../setup/supabase-mock';

describe('getComments', () => {
  it('returns comments with user profiles attached', async () => {
    const { supabase, builder } = createMockSupabase();
    builder.mockReturnValueSequence([
      {
        data: [
          { id: 'c1', activity_id: 'a1', user_id: 'u1', comment_text: 'Nice!', created_at: '2024-06-15T12:00:00Z' },
        ],
        error: null,
      },
      {
        data: [{ id: 'u1', full_name: 'Alice', avatar_url: 'alice.png' }],
        error: null,
      },
    ]);

    const result = await getComments(supabase, 'a1');
    expect(result.error).toBeNull();
    expect(result.data).toHaveLength(1);
    expect(result.data[0].comment_text).toBe('Nice!');
    expect(result.data[0].user.full_name).toBe('Alice');
  });

  it('returns empty array when no comments exist', async () => {
    const { supabase, builder } = createMockSupabase();
    builder.mockReturnValue({ data: [], error: null });

    const result = await getComments(supabase, 'a1');
    expect(result.data).toEqual([]);
    expect(result.error).toBeNull();
  });

  it('returns empty array and error on DB failure', async () => {
    const { supabase, builder } = createMockSupabase();
    builder.mockReturnValue({ data: null, error: { message: 'DB error' } });

    const result = await getComments(supabase, 'a1');
    expect(result.data).toEqual([]);
    expect(result.error).toBeTruthy();
  });

  it('uses "Unknown" for missing profiles', async () => {
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
});

describe('getBatchCommentCounts', () => {
  it('returns counts per activity', async () => {
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

  it('returns empty object for empty activityIds', async () => {
    const { supabase } = createMockSupabase();
    const result = await getBatchCommentCounts(supabase, []);
    expect(result).toEqual({});
  });

  it('returns empty object on DB error', async () => {
    const { supabase, builder } = createMockSupabase();
    builder.mockReturnValue({ data: null, error: { message: 'error' } });

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
  it('returns not authenticated when no user', async () => {
    const { supabase } = createMockSupabase();
    supabase.auth.getUser.mockResolvedValue({ data: { user: null }, error: null });

    const result = await postComment(supabase, 'a1', 'Hello');
    expect(result).toEqual({ success: false, error: 'Not authenticated' });
  });

  it('returns success on happy path', async () => {
    const { supabase, builder } = createMockSupabase();
    builder.mockReturnValueSequence([
      { data: { id: 'c1', comment_text: 'Hello' }, error: null },
      { data: { user_id: 'other-user' }, error: null },
      { data: null, error: null },
    ]);

    const result = await postComment(supabase, 'a1', 'Hello');
    expect(result.success).toBe(true);
    expect(result.data).toBeTruthy();
  });

  it('returns failure on insert error', async () => {
    const { supabase, builder } = createMockSupabase();
    builder.mockReturnValue({ data: null, error: { message: 'insert failed' } });

    const result = await postComment(supabase, 'a1', 'Hello');
    expect(result.success).toBe(false);
    expect(result.error).toBeTruthy();
  });

  it('truncates long comments in notification', async () => {
    const { supabase, builder } = createMockSupabase();
    const longText = 'A'.repeat(100);
    builder.mockReturnValueSequence([
      { data: { id: 'c1', comment_text: longText }, error: null },
      { data: { user_id: 'other-user' }, error: null },
      { data: null, error: null },
    ]);

    const result = await postComment(supabase, 'a1', longText);
    expect(result.success).toBe(true);
    const notificationInsert = builder.insert.mock.calls[1]?.[0];
    expect(notificationInsert.message).toBe('A'.repeat(60) + '...');
  });
});

describe('deleteComment', () => {
  it('returns not authenticated when no user', async () => {
    const { supabase } = createMockSupabase();
    supabase.auth.getUser.mockResolvedValue({ data: { user: null }, error: null });

    const result = await deleteComment(supabase, 'c1');
    expect(result).toEqual({ success: false, error: 'Not authenticated' });
  });

  it('returns success on happy path', async () => {
    const { supabase, builder } = createMockSupabase();
    builder.mockReturnValue({ data: null, error: null });

    const result = await deleteComment(supabase, 'c1');
    expect(result).toEqual({ success: true });
  });

  it('returns failure on delete error', async () => {
    const { supabase, builder } = createMockSupabase();
    builder.mockReturnValue({ data: null, error: { message: 'delete failed' } });

    const result = await deleteComment(supabase, 'c1');
    expect(result.success).toBe(false);
    expect(result.error).toBeTruthy();
  });
});
