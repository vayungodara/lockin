import { describe, it, expect, vi } from 'vitest';
import { createMockSupabase } from '../../setup/supabase-mock';

vi.mock('@/lib/notifications', () => ({
  createNotification: vi.fn().mockResolvedValue({ error: null }),
  NOTIFICATION_TYPES: {
    COMMENT_ON_ACTIVITY: 'comment_on_activity',
  },
}));

import {
  getComments,
  getBatchCommentCounts,
  postComment,
  deleteComment,
} from '@/lib/comments';

describe('getComments', () => {
  it('returns comments with user profiles attached', async () => {
    const { supabase, builder } = createMockSupabase();
    builder.mockReturnValueSequence([
      {
        data: [
          { id: 'c1', activity_id: 'a1', user_id: 'u1', comment_text: 'Nice!' },
          { id: 'c2', activity_id: 'a1', user_id: 'u2', comment_text: 'Great work' },
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

  it('returns empty array and error on DB failure', async () => {
    const { supabase, builder } = createMockSupabase();
    builder.mockReturnValue({ data: null, error: { message: 'DB error' } });

    const result = await getComments(supabase, 'a1');
    expect(result.data).toEqual([]);
    expect(result.error).toBeTruthy();
  });

  it('assigns Unknown profile when user not found', async () => {
    const { supabase, builder } = createMockSupabase();
    builder.mockReturnValueSequence([
      {
        data: [{ id: 'c1', activity_id: 'a1', user_id: 'u-missing', comment_text: 'Hi' }],
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

    const counts = await getBatchCommentCounts(supabase, ['a1', 'a2']);
    expect(counts).toEqual({ a1: 2, a2: 1 });
  });

  it('returns empty object for empty input', async () => {
    const { supabase } = createMockSupabase();
    const counts = await getBatchCommentCounts(supabase, []);
    expect(counts).toEqual({});
  });

  it('returns empty object on error', async () => {
    const { supabase, builder } = createMockSupabase();
    builder.mockReturnValue({ data: null, error: { message: 'DB error' } });

    const counts = await getBatchCommentCounts(supabase, ['a1']);
    expect(counts).toEqual({});
  });
});

describe('postComment', () => {
  it('posts a comment and notifies the activity author', async () => {
    const { supabase, builder } = createMockSupabase();
    builder.mockReturnValueSequence([
      { data: { id: 'c1', comment_text: 'Hello' }, error: null },
      { data: { user_id: 'other-user-id' }, error: null },
    ]);

    const result = await postComment(supabase, 'a1', 'Hello');
    expect(result.success).toBe(true);
    expect(result.data).toEqual({ id: 'c1', comment_text: 'Hello' });
  });

  it('does not notify when commenting on own activity', async () => {
    const { supabase, builder } = createMockSupabase();
    builder.mockReturnValueSequence([
      { data: { id: 'c1', comment_text: 'Self' }, error: null },
      { data: { user_id: 'test-user-id' }, error: null },
    ]);

    const result = await postComment(supabase, 'a1', 'Self');
    expect(result.success).toBe(true);
  });

  it('returns error when not authenticated', async () => {
    const { supabase } = createMockSupabase();
    supabase.auth.getUser.mockResolvedValue({ data: { user: null }, error: null });

    const result = await postComment(supabase, 'a1', 'Hello');
    expect(result.success).toBe(false);
    expect(result.error).toBe('Not authenticated');
  });

  it('returns error on DB failure', async () => {
    const { supabase, builder } = createMockSupabase();
    builder.mockReturnValue({ data: null, error: { message: 'Insert failed' } });

    const result = await postComment(supabase, 'a1', 'Hello');
    expect(result.success).toBe(false);
    expect(result.error).toBeTruthy();
  });
});

describe('deleteComment', () => {
  it('deletes own comment successfully', async () => {
    const { supabase, builder } = createMockSupabase();
    builder.mockReturnValue({ data: null, error: null });

    const result = await deleteComment(supabase, 'c1');
    expect(result.success).toBe(true);
  });

  it('returns error when not authenticated', async () => {
    const { supabase } = createMockSupabase();
    supabase.auth.getUser.mockResolvedValue({ data: { user: null }, error: null });

    const result = await deleteComment(supabase, 'c1');
    expect(result.success).toBe(false);
    expect(result.error).toBe('Not authenticated');
  });

  it('returns error on DB failure', async () => {
    const { supabase, builder } = createMockSupabase();
    builder.mockReturnValue({ data: null, error: { message: 'Delete failed' } });

    const result = await deleteComment(supabase, 'c1');
    expect(result.success).toBe(false);
    expect(result.error).toBeTruthy();
  });
});
