'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import { calculateStreak } from '@/lib/streaks';
import MonthlyCalendar from '@/components/MonthlyCalendar';
import styles from './StatsPage.module.css';

export default function StatsPageClient({ user }) {
  const [streakData, setStreakData] = useState({ currentStreak: 0, longestStreak: 0, totalCompleted: 0 });
  const [pactStats, setPactStats] = useState({ total: 0, completed: 0, missed: 0, active: 0, thisWeek: 0, thisMonth: 0 });
  const [focusStats, setFocusStats] = useState({ totalMinutes: 0, sessionsCount: 0, avgDuration: 0 });
  const [recentSessions, setRecentSessions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const supabase = useMemo(() => createClient(), []);

  const fetchStats = useCallback(async () => {
    try {
      const now = new Date();
      const weekAgo = new Date(now);
      weekAgo.setDate(weekAgo.getDate() - 7);
      const monthAgo = new Date(now);
      monthAgo.setMonth(monthAgo.getMonth() - 1);

      // Fetch streak data
      const streak = await calculateStreak(supabase, user.id);
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
        <div className={styles.loading}>Loading stats...</div>
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
              <p>No focus sessions in the last 7 days.</p>
              <p className={styles.emptyHint}>Start a focus session to see your history here!</p>
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
