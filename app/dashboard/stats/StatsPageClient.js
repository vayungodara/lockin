'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import { createClient } from '@/lib/supabase/client';
import { fadeInUp } from '@/lib/animations';
import { calculateStreak } from '@/lib/streaks';
import MonthlyCalendar from '@/components/MonthlyCalendar';
import { SkeletonCard, SkeletonText } from '@/components/Skeleton';
import styles from './StatsPage.module.css';

export default function StatsPageClient({ user }) {
  const [streakData, setStreakData] = useState({ currentStreak: 0, longestStreak: 0, totalCompleted: 0 });
  const [pactStats, setPactStats] = useState({ total: 0, completed: 0, missed: 0, active: 0, thisWeek: 0, thisMonth: 0 });
  const [focusStats, setFocusStats] = useState({ totalMinutes: 0, sessionsCount: 0, avgDuration: 0 });
  const [recentSessions, setRecentSessions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const supabase = useMemo(() => createClient(), []);

  const fetchStats = useCallback(async () => {
    try {
      const now = new Date();
      const weekAgo = new Date(now);
      weekAgo.setDate(weekAgo.getDate() - 7);
      const monthAgo = new Date(now);
      monthAgo.setMonth(monthAgo.getMonth() - 1);

      // Detect the user's IANA timezone so streak calculations bucket
      // activity into their local day (matches DashboardLayout persistence).
      let timezone = 'UTC';
      try {
        timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
      } catch {
        // Intl API unavailable — fall back to UTC
      }

      // Fetch streak data using the shared calculation from lib/streaks
      const streak = await calculateStreak(supabase, user.id, timezone);
      setStreakData(streak);

      // Fetch pact stats
      const { data: pacts, error: pactsError } = await supabase
        .from('pacts')
        .select('status, completed_at, created_at')
        .eq('user_id', user.id);

      if (pactsError) throw pactsError;

      const completedCount = (pacts || []).filter(p => p.status === 'completed').length;
      const missedCount = (pacts || []).filter(p => p.status === 'missed').length;
      const activeCount = (pacts || []).filter(p => p.status === 'active').length;
      const thisWeekCompleted = (pacts || []).filter(p =>
        p.status === 'completed' && p.completed_at && new Date(p.completed_at) >= weekAgo
      ).length;
      const thisMonthCompleted = (pacts || []).filter(p =>
        p.status === 'completed' && p.completed_at && new Date(p.completed_at) >= monthAgo
      ).length;

      setPactStats({
        total: (pacts || []).length,
        completed: completedCount,
        missed: missedCount,
        active: activeCount,
        thisWeek: thisWeekCompleted,
        thisMonth: thisMonthCompleted,
        completionRate: completedCount + missedCount > 0
          ? Math.round((completedCount / (completedCount + missedCount)) * 100)
          : 0
      });

      // Fetch focus stats
      const { data: sessions, error: focusError } = await supabase
        .from('focus_sessions')
        .select('*')
        .eq('user_id', user.id)
        .order('started_at', { ascending: false });

      if (focusError) throw focusError;

      const totalMinutes = (sessions || []).reduce((acc, s) => acc + (s.duration_minutes || 0), 0);
      const sessionsCount = (sessions || []).length;

      setFocusStats({
        totalMinutes,
        sessionsCount,
        avgDuration: sessionsCount > 0 ? Math.round(totalMinutes / sessionsCount) : 0
      });

      // Get recent sessions (last 7 days, grouped by day)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      sevenDaysAgo.setHours(0, 0, 0, 0);

      const recentSessionsData = (sessions || [])
        .filter(s => new Date(s.started_at) >= sevenDaysAgo)
        .slice(0, 20);

      setRecentSessions(recentSessionsData);

    } catch (err) {
      console.error('Error fetching stats:', err);
      setError('Failed to load stats. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [supabase, user.id]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    }
    if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    }
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  };

  const formatTime = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  };

  const formatDuration = (minutes) => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  // Group sessions by date for display
  const groupedSessions = useMemo(() => {
    const groups = {};
    recentSessions.forEach(session => {
      const dateKey = new Date(session.started_at).toDateString();
      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(session);
    });
    return Object.entries(groups).map(([dateKey, sessions]) => ({
      date: dateKey,
      sessions
    }));
  }, [recentSessions]);

  if (isLoading) {
    return (
      <div className={styles.container}>
        <header className={styles.header}>
          <div>
            <SkeletonText width="160px" height="28px" />
            <SkeletonText width="240px" height="16px" />
          </div>
        </header>
        <div className={styles.content}>
          <SkeletonCard height="100px" />
          <SkeletonCard height="280px" />
          <div className={styles.analyticsGrid}>
            <SkeletonCard height="200px" />
            <SkeletonCard height="200px" />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>
          <p>{error}</p>
          <button className="btn btn-primary" onClick={fetchStats} style={{ marginTop: '1rem' }}>Try Again</button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div>
          <h1>Your Stats</h1>
          <p className={styles.subtitle}>Track your productivity and progress</p>
        </div>
      </header>

      <div className={styles.content}>
        {/* Top-level empty state when user has zero activity */}
        {pactStats.total === 0 && focusStats.sessionsCount === 0 && (
          <motion.div className={styles.emptyState} {...fadeInUp}>
            <motion.div
              className={styles.emptyIllustration}
              animate={{ y: [0, -6, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
            >
              <svg width="120" height="120" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
                <line x1="20" y1="90" x2="100" y2="90" stroke="currentColor" strokeWidth="1" opacity="0.1" />
                <line x1="20" y1="70" x2="100" y2="70" stroke="currentColor" strokeWidth="1" opacity="0.1" />
                <line x1="20" y1="50" x2="100" y2="50" stroke="currentColor" strokeWidth="1" opacity="0.1" />
                <path d="M25 80L45 65L60 70L75 45L95 30" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.4" />
                <circle cx="25" cy="80" r="3" fill="currentColor" opacity="0.3" />
                <circle cx="45" cy="65" r="3" fill="currentColor" opacity="0.35" />
                <circle cx="60" cy="70" r="3" fill="currentColor" opacity="0.4" />
                <circle cx="75" cy="45" r="3" fill="currentColor" opacity="0.45" />
                <circle cx="95" cy="30" r="4" fill="currentColor" opacity="0.6" />
                <path d="M90 28L95 30L93 35" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.5" />
              </svg>
            </motion.div>
            <h3 className={styles.emptyTitle}>Your story starts with day one.</h3>
            <p className={styles.emptySubtext}>Complete pacts and focus sessions to see your progress here.</p>
          </motion.div>
        )}

        {/* Streak Summary */}
        <div className={styles.streakCard}>
          <div className={styles.streakItem}>
            <span className={styles.streakIcon}>🔥</span>
            <div className={styles.streakInfo}>
              <span className={styles.streakValue}>{streakData.currentStreak}</span>
              <span className={styles.streakLabel}>Current Streak</span>
            </div>
          </div>
          <div className={styles.streakDivider} />
          <div className={styles.streakItem}>
            <span className={styles.streakIcon}>🏆</span>
            <div className={styles.streakInfo}>
              <span className={styles.streakValue}>{streakData.longestStreak}</span>
              <span className={styles.streakLabel}>Best Streak</span>
            </div>
          </div>
          <div className={styles.streakDivider} />
          <div className={styles.streakItem}>
            <span className={styles.streakIcon}>✓</span>
            <div className={styles.streakInfo}>
              <span className={styles.streakValue}>{streakData.totalCompleted}</span>
              <span className={styles.streakLabel}>Total Completed</span>
            </div>
          </div>
        </div>

        {/* Activity Calendar */}
        <MonthlyCalendar userId={user.id} />

        {/* Analytics Cards */}
        <div className={styles.analyticsGrid}>
          {/* Pact Analytics */}
          <div className={styles.analyticsCard}>
            <h3>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M9 11L12 14L22 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M21 12V19C21 19.5304 20.7893 20.0391 20.4142 20.4142C20.0391 20.7893 19.5304 21 19 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Pact Analytics
            </h3>
            <div className={styles.statsGrid}>
              <div className={styles.statBox}>
                <span className={styles.statValue}>{pactStats.completionRate}%</span>
                <span className={styles.statLabel}>Completion Rate</span>
              </div>
              <div className={styles.statBox}>
                <span className={styles.statValue}>{pactStats.thisWeek}</span>
                <span className={styles.statLabel}>This Week</span>
              </div>
              <div className={styles.statBox}>
                <span className={styles.statValue}>{pactStats.thisMonth}</span>
                <span className={styles.statLabel}>This Month</span>
              </div>
            </div>
            <div className={styles.breakdown}>
              <div className={styles.breakdownItem}>
                <span className={styles.breakdownDot} style={{ background: 'var(--success)' }} />
                <span className={styles.breakdownLabel}>Completed</span>
                <span className={styles.breakdownValue}>{pactStats.completed}</span>
              </div>
              <div className={styles.breakdownItem}>
                <span className={styles.breakdownDot} style={{ background: 'var(--accent-primary)' }} />
                <span className={styles.breakdownLabel}>Active</span>
                <span className={styles.breakdownValue}>{pactStats.active}</span>
              </div>
              <div className={styles.breakdownItem}>
                <span className={styles.breakdownDot} style={{ background: 'var(--danger)' }} />
                <span className={styles.breakdownLabel}>Missed</span>
                <span className={styles.breakdownValue}>{pactStats.missed}</span>
              </div>
            </div>
          </div>

          {/* Focus Analytics */}
          <div className={styles.analyticsCard}>
            <h3>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                <path d="M12 6V12L16 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
              Focus Analytics
            </h3>
            <div className={styles.statsGrid}>
              <div className={styles.statBox}>
                <span className={styles.statValue}>{formatDuration(focusStats.totalMinutes)}</span>
                <span className={styles.statLabel}>Total Time</span>
              </div>
              <div className={styles.statBox}>
                <span className={styles.statValue}>{focusStats.sessionsCount}</span>
                <span className={styles.statLabel}>Sessions</span>
              </div>
              <div className={styles.statBox}>
                <span className={styles.statValue}>{focusStats.avgDuration}m</span>
                <span className={styles.statLabel}>Avg Duration</span>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Focus Sessions */}
        <div className={styles.sessionsCard}>
          <h3>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 8V12L15 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2"/>
            </svg>
            Recent Focus Sessions
          </h3>
          {groupedSessions.length === 0 ? (
            <div className={styles.empty}>
              <span className={styles.emptyEmojiSmall}>{'\u23F3'}</span>
              <p>No focus sessions in the last 7 days.</p>
              <p className={styles.emptyHint}>The timer is waiting. Go lock in.</p>
            </div>
          ) : (
            <div className={styles.sessionsList}>
              {groupedSessions.map(({ date, sessions }) => (
                <div key={date} className={styles.dayGroup}>
                  <div className={styles.dayHeader}>{formatDate(date)}</div>
                  <div className={styles.daySessions}>
                    {sessions.map(session => (
                      <div key={session.id} className={styles.sessionItem}>
                        <div className={styles.sessionIcon}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                            <path d="M12 6V12L16 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                          </svg>
                        </div>
                        <span className={styles.sessionDuration}>{session.duration_minutes} min session</span>
                        <span className={styles.sessionTime}>at {formatTime(session.started_at)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
