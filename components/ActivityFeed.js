'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { getGroupActivity, getAllActivity } from '@/lib/activity';
import ActivityItem from './ActivityItem';
import styles from './ActivityFeed.module.css';

const DEFAULT_PAGE_SIZE = 20;

export default function ActivityFeed({ groupId = null, pageSize = DEFAULT_PAGE_SIZE }) {
  const [activities, setActivities] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasMore, setHasMore] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const supabase = useMemo(() => createClient(), []);
  const sentinelRef = useRef(null);
  const feedRef = useRef(null);

  const loadActivities = useCallback(async () => {
    setIsLoading(true);
    try {
      let result;
      if (groupId) {
        result = await getGroupActivity(supabase, groupId, pageSize, 0);
      } else {
        result = await getAllActivity(supabase, pageSize);
      }

      setActivities(result.data || []);
      setHasMore((result.data?.length || 0) === pageSize);
    } catch (err) {
      console.error('Error loading activities:', err);
    } finally {
      setIsLoading(false);
    }
  }, [groupId, pageSize, supabase]);

  useEffect(() => {
    loadActivities();
  }, [loadActivities]);

  const loadMoreRef = useRef(null);

  const loadMore = useCallback(async () => {
    if (isLoadingMore || !hasMore) return;

    setIsLoadingMore(true);
    try {
      let result;
      if (groupId) {
        result = await getGroupActivity(supabase, groupId, pageSize, activities.length);
      } else {
        result = await getAllActivity(supabase, pageSize, activities.length);
      }
      const newActivities = result.data || [];

      setActivities(prev => [...prev, ...newActivities]);
      setHasMore(newActivities.length === pageSize);
    } catch (err) {
      console.error('Error loading more:', err);
    } finally {
      setIsLoadingMore(false);
    }
  }, [isLoadingMore, hasMore, groupId, pageSize, supabase, activities.length]);

  // Keep ref in sync so the observer always calls the latest loadMore
  useEffect(() => {
    loadMoreRef.current = loadMore;
  }, [loadMore]);

  // IntersectionObserver for infinite scroll
  useEffect(() => {
    const sentinel = sentinelRef.current;
    const scrollContainer = feedRef.current;
    if (!sentinel || !scrollContainer) return;

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

    observer.observe(sentinel);

    return () => observer.disconnect();
  }, []);

  if (isLoading) {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
            <path d="M12 6V12L16 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          <h3>Activity</h3>
        </div>
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
      <div className={styles.header}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
          <path d="M12 6V12L16 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        </svg>
        <h3>Activity</h3>
      </div>

      {activities.length === 0 ? (
        <div className={styles.empty}>
          <div className={styles.emptyIcon}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5"/>
              <path d="M12 6V12L16 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </div>
          <p>No activity yet</p>
          <span>{groupId ? 'Activity will appear here as your team works' : 'Your activity will appear here as you work'}</span>
        </div>
      ) : (
        <div className={styles.feed} ref={feedRef}>
          {activities.map((activity) => (
            <ActivityItem key={activity.id} activity={activity} />
          ))}

          {/* Sentinel element for infinite scroll */}
          <div ref={sentinelRef} className={styles.sentinel}>
            {isLoadingMore && (
              <div className={styles.loadingMore}>
                <div className={styles.feedSpinner}></div>
                <span>Loading more...</span>
              </div>
            )}
          </div>

          {!hasMore && activities.length > 0 && (
            <div className={styles.endOfFeed}>
              <div className={styles.endLine}></div>
              <span>You&apos;re all caught up</span>
              <div className={styles.endLine}></div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
