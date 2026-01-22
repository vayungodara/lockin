'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import styles from './FocusPage.module.css';
import FocusTimer from '@/components/FocusTimer';

export default function FocusPageClient({ user }) {
  const [sessions, setSessions] = useState([]);
  const [stats, setStats] = useState({ today: 0, week: 0, total: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const supabase = useMemo(() => createClient(), []);

  const fetchSessions = useCallback(async () => {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);

      const { data, error } = await supabase
        .from('focus_sessions')
        .select('*')
        .order('started_at', { ascending: false })
        .limit(10);

      if (error) throw error;

      setSessions(data || []);

      const todaySessions = (data || []).filter(s => new Date(s.started_at) >= today);
      const weekSessions = (data || []).filter(s => new Date(s.started_at) >= weekAgo);

      setStats({
        today: todaySessions.reduce((acc, s) => acc + (s.duration_minutes || 0), 0),
        week: weekSessions.reduce((acc, s) => acc + (s.duration_minutes || 0), 0),
        total: (data || []).reduce((acc, s) => acc + (s.duration_minutes || 0), 0)
      });
    } catch (err) {
      console.error('Error fetching sessions:', err);
    } finally {
      setIsLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div>
          <h1>Focus Timer</h1>
          <p className={styles.subtitle}>Pomodoro-style deep work sessions</p>
        </div>
      </header>

      <div className={styles.content}>
        <div className={styles.timerColumn}>
          <FocusTimer />
        </div>

        <div className={styles.statsColumn}>
          <div className={styles.statsCard}>
            <h3>Your Focus Stats</h3>
            <div className={styles.statsGrid}>
              <div className={styles.statBox}>
                <span className={styles.statValue}>{stats.today}m</span>
                <span className={styles.statLabel}>Today</span>
              </div>
              <div className={styles.statBox}>
                <span className={styles.statValue}>{stats.week}m</span>
                <span className={styles.statLabel}>This Week</span>
              </div>
              <div className={styles.statBox}>
                <span className={styles.statValue}>{Math.floor(stats.total / 60)}h</span>
                <span className={styles.statLabel}>All Time</span>
              </div>
            </div>
          </div>

          <div className={styles.historyCard}>
            <h3>Recent Sessions</h3>
            {isLoading ? (
              <div className={styles.loading}>Loading...</div>
            ) : sessions.length === 0 ? (
              <div className={styles.empty}>
                <p>No sessions yet. Start your first focus session!</p>
              </div>
            ) : (
              <div className={styles.sessionList}>
                {sessions.map((session) => (
                  <div key={session.id} className={styles.sessionItem}>
                    <div className={styles.sessionIcon}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                        <path d="M12 6V12L16 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                      </svg>
                    </div>
                    <div className={styles.sessionInfo}>
                      <span className={styles.sessionDuration}>{session.duration_minutes} minutes</span>
                      <span className={styles.sessionDate}>{formatDate(session.started_at)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
