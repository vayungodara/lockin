'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { motion } from 'framer-motion';
import { staggerContainer } from '@/lib/animations';
import { createClient } from '@/lib/supabase/client';
import { getGroupActivity, getAllActivity, HIDDEN_FEED_ACTIONS, TEST_DATA_PATTERNS } from '@/lib/activity';
import { Clock } from '@phosphor-icons/react';
import ActivityItem from './ActivityItem';
import styles from './ActivityFeed.module.css';

const DEFAULT_PAGE_SIZE = 20;

export default function ActivityFeed({ groupId = null, pageSize = DEFAULT_PAGE_SIZE, hideHeader = false, disableInfiniteScroll = false }) {
  const [activities, setActivities] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasMore, setHasMore] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const supabase = useMemo(() => createClient(), []);
  const sentinelRef = useRef(null);
  const feedRef = useRef(null);
  const observerRef = useRef(null);
  const hasMoreRef = useRef(hasMore);
  hasMoreRef.current = hasMore;
  const isLoadingMoreRef = useRef(isLoadingMore);
  isLoadingMoreRef.current = isLoadingMore;
  const groupIdRef = useRef(groupId);
  groupIdRef.current = groupId;
  const offsetRef = useRef(0);

  const loadActivities = useCallback(async () => {
    const requestGroupId = groupId;
    setIsLoading(true);
    try {
      let result;
      if (requestGroupId) {
        result = await getGroupActivity(supabase, requestGroupId, pageSize, 0);
      } else {
        result = await getAllActivity(supabase, pageSize);
      }

      // Guard against stale responses from a previous groupId
      if (groupIdRef.current !== requestGroupId) return;

      const items = result.data || [];
      setActivities(items);
      offsetRef.current = items.length;
      setHasMore(items.length === pageSize);
    } catch (err) {
      console.error('Error loading activities:', err);
    } finally {
      if (groupIdRef.current === requestGroupId) {
        setIsLoading(false);
      }
    }
  }, [groupId, pageSize, supabase]);

  useEffect(() => {
    loadActivities();
  }, [loadActivities]);

  // Real-time subscription for new activity
  useEffect(() => {
    const channelConfig = {
      event: 'INSERT',
      schema: 'public',
      table: 'activity_log',
    };
    if (groupId) {
      channelConfig.filter = 'group_id=eq.' + groupId;
    }

    const channelName = groupId
      ? `activity-feed-group-${groupId}`
      : 'activity-feed-global';

    // Use shared filter constants from lib/activity.js

    const channel = supabase
      .channel(channelName)
      .on('postgres_changes', channelConfig, async (payload) => {
        const newRow = payload.new;
        if (!newRow) return;

        // Skip hidden action types and test data in realtime updates
        if (!groupId && HIDDEN_FEED_ACTIONS.includes(newRow.action)) return;
        const title = newRow.metadata?.title || newRow.metadata?.name || '';
        if (TEST_DATA_PATTERNS.some(p => p.test(title))) return;

        try {
          // Fetch the profile for this user so we have full data
          const { data: profile } = await supabase
            .from('profiles')
            .select('id, full_name, avatar_url')
            .eq('id', newRow.user_id)
            .single();

          const enriched = {
            ...newRow,
            user: profile || { full_name: 'Unknown', avatar_url: null },
            reactions: { counts: {}, userReactions: [], total: 0 },
            comment_count: 0,
          };

          setActivities(prev => {
            // Final deduplicate check before prepending
            if (prev.some(a => a.id === enriched.id)) return prev;
            return [enriched, ...prev];
          });
        } catch (err) {
          console.error('Error enriching realtime activity:', err);
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, groupId]);

  const loadMoreRef = useRef(null);

  const loadMore = useCallback(async () => {
    if (isLoadingMoreRef.current || !hasMoreRef.current) return;

    setIsLoadingMore(true);
    try {
      const currentOffset = offsetRef.current;
      let result;
      if (groupId) {
        result = await getGroupActivity(supabase, groupId, pageSize, currentOffset);
      } else {
        result = await getAllActivity(supabase, pageSize, currentOffset);
      }
      const newActivities = result.data || [];

      offsetRef.current = currentOffset + newActivities.length;
      setActivities(prev => {
        const existingIds = new Set(prev.map(a => a.id));
        return [...prev, ...newActivities.filter(a => !existingIds.has(a.id))];
      });
      setHasMore(newActivities.length === pageSize);
    } catch (err) {
      console.error('Error loading more:', err);
    } finally {
      setIsLoadingMore(false);
    }
  }, [groupId, pageSize, supabase]);

  // Keep ref in sync so the observer always calls the latest loadMore
  useEffect(() => {
    loadMoreRef.current = loadMore;
  }, [loadMore]);

  // Callback ref for the sentinel element — sets up the IntersectionObserver
  // exactly when the sentinel mounts, without depending on isLoading or hasMore state.
  const sentinelCallbackRef = useCallback((node) => {
    // Disconnect any previous observer
    if (observerRef.current) {
      observerRef.current.disconnect();
      observerRef.current = null;
    }

    sentinelRef.current = node;
    if (!node) return;

    const scrollContainer = feedRef.current;
    if (!scrollContainer) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          loadMoreRef.current?.();
        }
      },
      {
        root: scrollContainer,
        rootMargin: '100px',
        threshold: 0,
      }
    );

    observer.observe(node);
    observerRef.current = observer;
  }, []);

  // Clean up observer on unmount
  useEffect(() => {
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, []);

  if (isLoading) {
    return (
      <div className={styles.container}>
        {!hideHeader && (
          <div className={styles.header}>
            <Clock size={18} weight="regular" />
            <h3>Activity</h3>
          </div>
        )}
        <div className={styles.loading}>
          <div className={styles.skeleton}></div>
          <div className={styles.skeleton}></div>
          <div className={styles.skeleton}></div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {!hideHeader && (
        <div className={styles.header}>
          <Clock size={18} weight="regular" />
          <h3>Activity</h3>
        </div>
      )}

      {activities.length === 0 ? (
        <div className={styles.empty}>
          <div className={styles.emptyIcon}>
            <Clock size={32} weight="light" />
          </div>
          <p>No activity yet</p>
          <span>{groupId ? 'Activity will appear here as your team works' : 'Your activity will appear here as you work'}</span>
        </div>
      ) : (
        <motion.div
          className={styles.feed}
          ref={feedRef}
          variants={staggerContainer}
          initial="initial"
          animate="animate"
        >
          {activities.map((activity) => (
            <ActivityItem key={activity.id} activity={activity} />
          ))}

          {/* Sentinel element for infinite scroll — or manual "Show more" button when disabled */}
          {disableInfiniteScroll ? (
            hasMore && (
              <button
                type="button"
                className={styles.showMoreBtn}
                onClick={loadMore}
                disabled={isLoadingMore}
              >
                {isLoadingMore ? 'Loading…' : `Show more activity`}
              </button>
            )
          ) : (
            <div ref={sentinelCallbackRef} className={styles.sentinel}>
              {isLoadingMore && (
                <div className={styles.loadingMore}>
                  <div className={styles.feedSpinner}></div>
                  <span>Loading more...</span>
                </div>
              )}
            </div>
          )}

          {!hasMore && activities.length > 0 && (
            <div className={styles.endOfFeed}>
              <div className={styles.endLine}></div>
              <span>You&apos;re all caught up</span>
              <div className={styles.endLine}></div>
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
}
