'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useKeyboardShortcuts } from '@/lib/KeyboardShortcutsContext';
import { useFocus } from '@/lib/FocusContext';
import { Eye } from '@phosphor-icons/react';
import styles from './FocusPage.module.css';
import FocusTimer from '@/components/FocusTimer';

function timeAgo(dateStr) {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
}

export default function FocusPageClient({ user }) {
  const [sessions, setSessions] = useState([]);
  const [todayMinutes, setTodayMinutes] = useState(0);
  const [todaySessions, setTodaySessions] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [broadcast, setBroadcast] = useState(false);
  const supabase = useMemo(() => createClient(), []);
  const { registerCallbacks, unregisterCallbacks } = useKeyboardShortcuts();
  const { toggleTimer, mode, isRunning, switchMode } = useFocus();

  // Register keyboard shortcut for timer toggle
  useEffect(() => {
    registerCallbacks({
      onToggleTimer: toggleTimer,
    });

    return () => {
      unregisterCallbacks(['onToggleTimer']);
    };
  }, [registerCallbacks, unregisterCallbacks, toggleTimer]);

  const fetchSessions = useCallback(async () => {
    setError(null);
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const [recentResult, todayResult] = await Promise.all([
        supabase
          .from('focus_sessions')
          .select('id, started_at, duration_minutes')
          .eq('user_id', user.id)
          .order('started_at', { ascending: false })
          .limit(1),
        supabase
          .from('focus_sessions')
          .select('id, started_at, duration_minutes')
          .eq('user_id', user.id)
          .gte('started_at', today.toISOString())
          .order('started_at', { ascending: false }),
      ]);

      if (recentResult.error) throw recentResult.error;
      if (todayResult.error) throw todayResult.error;

      setSessions(recentResult.data || []);

      const todayData = todayResult.data || [];
      setTodaySessions(todayData.length);
      setTodayMinutes(todayData.reduce((acc, s) => acc + (s.duration_minutes || 0), 0));
    } catch (err) {
      console.error('Error fetching sessions:', err);
      setError('Failed to load focus sessions.');
    } finally {
      setIsLoading(false);
    }
  }, [supabase, user.id]);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  // Determine the last completed session
  const lastSession = sessions[0] || null;

  // Mode selector labels mapped to context mode values
  const modes = [
    { label: 'Focus', value: 'work' },
    { label: 'Short Break', value: 'break' },
    { label: 'Long Break', value: 'longBreak' },
  ];

  // Current active tab: map context mode to selector
  const activeMode = mode; // 'work', 'break', or 'longBreak'

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1>Focus</h1>

        <div className={styles.broadcastPill}>
          <Eye size={18} weight="regular" />
          <span className={styles.broadcastLabel}>Broadcast to group</span>
          <div className={styles.toggleSwitch}>
            <input
              type="checkbox"
              id="broadcastToggle"
              className={styles.toggleInput}
              checked={broadcast}
              onChange={(e) => setBroadcast(e.target.checked)}
            />
            <label htmlFor="broadcastToggle" className={styles.toggleTrack} />
          </div>
        </div>
      </header>

      <section className={styles.focusLayout}>
        {/* Mode selector pills */}
        <div className={styles.modeSelector}>
          {modes.map((m) => (
            <button
              key={m.value}
              className={`${styles.modeButton} ${activeMode === m.value ? styles.modeButtonActive : ''}`}
              disabled={isRunning}
              onClick={() => switchMode(m.value)}
              aria-pressed={activeMode === m.value}
            >
              {m.label}
            </button>
          ))}
        </div>

        {/* Timer hero */}
        <FocusTimer />

        {/* Inline stats */}
        {error ? (
          <div className={styles.errorBox}>
            <p>{error}</p>
            <button className="btn btn-primary" onClick={fetchSessions}>Try Again</button>
          </div>
        ) : (
          <div>
            <p className={styles.inlineStats}>
              Today: {todayMinutes}m focused · {todaySessions} {todaySessions === 1 ? 'session' : 'sessions'}
            </p>
            {lastSession && !isLoading && (
              <p className={styles.lastSession}>
                Last: {lastSession.duration_minutes}min · {timeAgo(lastSession.started_at)}
              </p>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
