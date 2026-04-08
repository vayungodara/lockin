'use client';

import { useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/client';
import { getComments, postComment, deleteComment } from '@/lib/comments';
import { formatRelativeTime } from '@/lib/activity';
import { ChatCircle } from '@phosphor-icons/react';
import { useToast } from '@/components/Toast';
import styles from './ActivityComments.module.css';

export default function ActivityComments({ activityId, initialCount = 0 }) {
  const [comments, setComments] = useState([]);
  const [showComments, setShowComments] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [commentCount, setCommentCount] = useState(initialCount);
  const supabase = useMemo(() => createClient(), []);
  const toast = useToast();

  const fetchComments = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await getComments(supabase, activityId);
      if (result.error) {
        console.warn('Failed to load comments:', result.error);
        toast.error('Failed to load comments');
      } else {
        setComments(result.data);
        setCommentCount(result.data.length);
      }
    } finally {
      setIsLoading(false);
    }
  }, [supabase, activityId, toast]);

  const toggleComments = () => {
    const next = !showComments;
    setShowComments(next);
    if (next) fetchComments();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newComment.trim() || isSubmitting) return;

    setIsSubmitting(true);
    const result = await postComment(supabase, activityId, newComment.trim());

    if (result.success) {
      setNewComment('');
      await fetchComments();
    } else {
      console.warn('Failed to post comment:', result.error);
      toast.error('Failed to post comment');
    }
    setIsSubmitting(false);
  };

  const handleDelete = async (commentId) => {
    const result = await deleteComment(supabase, commentId);
    if (result.success) {
      await fetchComments();
    } else {
      console.warn('Failed to delete comment:', result.error);
      toast.error('Failed to delete comment');
    }
  };

  return (
    <div className={styles.container}>
      <button
        className={styles.toggleButton}
        onClick={toggleComments}
      >
        <ChatCircle size={14} weight="regular" />
        {commentCount > 0 ? commentCount : ''} {showComments ? 'Hide' : commentCount > 0 ? '' : 'Comment'}
      </button>

      <AnimatePresence>
        {showComments && (
          <motion.div
            className={styles.panel}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            {isLoading ? (
              <div className={styles.loading}>Loading...</div>
            ) : (
              <div className={styles.list}>
                {comments.map(comment => (
                  <div key={comment.id} className={styles.comment}>
                    <div className={styles.commentAvatar}>
                      {comment.user?.avatar_url ? (
                        <Image
                          src={comment.user.avatar_url}
                          alt={comment.user?.full_name || 'User'}
                          width={20}
                          height={20}
                          className={styles.commentAvatarImg}
                        />
                      ) : (
                        <span>{(comment.user?.full_name || 'U').charAt(0)}</span>
                      )}
                    </div>
                    <div className={styles.commentBody}>
                      <div className={styles.commentMeta}>
                        <span className={styles.commentAuthor}>{comment.user?.full_name || 'Unknown'}</span>
                        <span className={styles.commentTime}>{formatRelativeTime(comment.created_at)}</span>
                      </div>
                      <p className={styles.commentText}>{comment.comment_text}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <form className={styles.form} onSubmit={handleSubmit}>
              <input
                type="text"
                placeholder="Add a comment..."
                aria-label="Add a comment"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                maxLength={500}
                className={styles.input}
              />
              <button
                type="submit"
                disabled={!newComment.trim() || isSubmitting}
                className={styles.submitBtn}
              >
                Post
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
