'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/client';
import { getGroupStats } from '@/lib/activity';
import styles from './GroupStats.module.css';

export default function GroupStats({ groupId }) {
  const [stats, setStats] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const supabase = useMemo(() => createClient(), []);

  const loadStats = useCallback(async () => {
    try {
      const result = await getGroupStats(supabase, groupId);
      setStats(result.stats);
      setLeaderboard(result.leaderboard || []);
    } catch (err) {
      console.error('Error loading stats:', err);
    } finally {
      setIsLoading(false);
    }
  }, [supabase, groupId]);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  if (isLoading) {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M18 20V10M12 20V4M6 20V14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <h3>Stats</h3>
        </div>
        <div className={styles.loading}>
          <div className={styles.skeleton}></div>
          <div className={styles.skeleton}></div>
        </div>
      </div>
    );
  }

  const completionRate = stats?.completionRate || 0;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M18 20V10M12 20V4M6 20V14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        <h3>Stats</h3>
      </div>

      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statValue}>{stats?.totalTasks || 0}</div>
          <div className={styles.statLabel}>Total Tasks</div>
        </div>
        <div className={styles.statCard}>
          <div className={`${styles.statValue} ${styles.valueGreen}`}>{stats?.completedTasks || 0}</div>
          <div className={styles.statLabel}>Completed</div>
        </div>
        <div className={styles.statCard}>
          <div className={`${styles.statValue} ${styles.valueYellow}`}>{stats?.activeTasks || 0}</div>
          <div className={styles.statLabel}>Active</div>
        </div>
      </div>

      <div className={styles.progressSection}>
        <div className={styles.progressHeader}>
          <span>Completion Rate</span>
          <span className={styles.progressValue}>{completionRate}%</span>
        </div>
        <div className={styles.progressBar}>
          <div 
            className={styles.progressFill} 
            style={{ width: `${completionRate}%` }}
          ></div>
        </div>
      </div>

      {leaderboard.length > 0 && (
        <div className={styles.leaderboard}>
          <div className={styles.leaderboardHeader}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 15C15.866 15 19 11.866 19 8V3H5V8C5 11.866 8.13401 15 12 15Z" stroke="currentColor" strokeWidth="2"/>
              <path d="M5 3H3V6C3 7.65685 4.34315 9 6 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              <path d="M19 3H21V6C21 7.65685 19.6569 9 18 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              <path d="M12 15V18M8 21H16M12 18C10 18 8 19 8 21M12 18C14 18 16 19 16 21" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            <span>7-Day Leaderboard</span>
          </div>
          <div className={styles.leaderboardList}>
            {leaderboard.slice(0, 5).map((member, index) => (
              <div key={member.user_id} className={styles.leaderboardItem}>
                <div className={styles.rank}>
                  {index === 0 && <span className={styles.gold}>🥇</span>}
                  {index === 1 && <span className={styles.silver}>🥈</span>}
                  {index === 2 && <span className={styles.bronze}>🥉</span>}
                  {index > 2 && <span className={styles.number}>{index + 1}</span>}
                </div>
                <div className={styles.memberInfo}>
                  {member.avatar_url ? (
                    <Image
                      src={member.avatar_url}
                      alt={member.full_name || 'Member'}
                      className={styles.avatar}
                      width={24}
                      height={24}
                    />
                  ) : (
                    <div className={styles.avatarPlaceholder}>
                      {(member.full_name || 'U').charAt(0).toUpperCase()}
                    </div>
                  )}
                  <span className={styles.memberName}>{member.full_name || 'Unknown'}</span>
                </div>
                <div className={styles.score}>
                  <span className={styles.scoreValue}>{member.completions}</span>
                  <span className={styles.scoreLabel}>done</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
