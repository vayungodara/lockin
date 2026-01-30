'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import { getGroupActivity, getAllActivity } from '@/lib/activity';
import ActivityItem from './ActivityItem';
import styles from './ActivityFeed.module.css';

export default function ActivityFeed({ groupId = null, limit = 15 }) {
  const [activities, setActivities] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasMore, setHasMore] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const supabase = useMemo(() => createClient(), []);

  const loadActivities = useCallback(async () => {
    setIsLoading(true);
    try {
      let result;
      if (groupId) {
        result = await getGroupActivity(supabase, groupId, limit, 0);
      } else {
        result = await getAllActivity(supabase, limit);
      }
      
      setActivities(result.data || []);
      setHasMore(result.data?.length === limit);
    } catch (err) {
      console.error('Error loading activities:', err);
    } finally {
      setIsLoading(false);
    }
  }, [groupId, limit, supabase]);

  useEffect(() => {
    loadActivities();
  }, [loadActivities]);

  const loadMore = async () => {
    if (isLoadingMore || !hasMore) return;
    
    setIsLoadingMore(true);
    try {
      let result;
      if (groupId) {
        result = await getGroupActivity(supabase, groupId, limit, activities.length);
      } else {
        result = await getAllActivity(supabase, limit, activities.length);
      }
      const newActivities = result.data || [];
      
      setActivities([...activities, ...newActivities]);
      setHasMore(newActivities.length === limit);
    } catch (err) {
      console.error('Error loading more:', err);
    } finally {
      setIsLoadingMore(false);
    }
  };

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
        <>
          <div className={styles.feed}>
            {activities.map((activity) => (
              <ActivityItem key={activity.id} activity={activity} />
            ))}
          </div>

          {hasMore && (
            <button 
              className={styles.loadMoreBtn}
              onClick={loadMore}
              disabled={isLoadingMore}
            >
              {isLoadingMore ? (
                <>
                  <div className={styles.btnSpinner}></div>
                  Loading...
                </>
              ) : (
                <>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 5V19M5 12L12 19L19 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  <span>Load more</span>
                </>
              )}
            </button>
          )}
        </>
      )}
    </div>
  );
}
