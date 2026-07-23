'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useKeyboardShortcuts } from '@/lib/KeyboardShortcutsContext';
import { useFocus } from '@/lib/FocusContext';
import SectionHeader from '@/components/SectionHeader';
import Stamp from '@/components/Stamp';
import FocusTimer, { FocusControls, LockedInBadge } from '@/components/FocusTimer';
import FocusWitnessesOfMe from '@/components/FocusWitnessesOfMe';
import styles from './FocusPage.module.css';

const MODES = [
  { label: 'Focus', value: 'work' },
  { label: 'Short break', value: 'break' },
  { label: 'Long break', value: 'longBreak' },
];

/**
 * Format an ISO timestamp as a relative "Nm ago" / "Nh ago" / "Nd ago".
 * Returns "just now" for diffs under one minute.
 */
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
  const [todaySessions, setTodaySessions] = useState(0);
  const [todayMinutes, setTodayMinutes] = useState(0);
  const [recentSessions, setRecentSessions] = useState([]);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const supabase = useMemo(() => createClient(), []);
  const { registerCallbacks, unregisterCallbacks } = useKeyboardShortcuts();
  const {
    toggleTimer,
    mode,
    isRunning,
    isPaused,
    switchMode,
    WORK_DURATION,
    BREAK_DURATION,
    LONG_BREAK_DURATION,
  } = useFocus();

  // A paused work session is still "locked in" — just on hold. Treat
  // running and paused-work as the same in-progress state for the stamp,
  // pulse dots and atmosphere copy so pausing doesn't revert to the idle
  // render. Paused breaks read as idle (no locked-in framing).
  const isWorkActive = mode === 'work' && (isRunning || isPaused);

  // Register Space-bar shortcut for timer toggle
  useEffect(() => {
    registerCallbacks({ onToggleTimer: toggleTimer });
    return () => unregisterCallbacks(['onToggleTimer']);
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
          .limit(6),
        supabase
          .from('focus_sessions')
          .select('id, started_at, duration_minutes')
          .eq('user_id', user.id)
          .gte('started_at', today.toISOString())
          .order('started_at', { ascending: false }),
      ]);

      if (recentResult.error) throw recentResult.error;
      if (todayResult.error) throw todayResult.error;

      setRecentSessions(recentResult.data || []);

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

  // Refresh today's tally + recent list when a session ends
  useEffect(() => {
    const handler = () => fetchSessions();
    window.addEventListener('focus-session-completed', handler);
    return () => window.removeEventListener('focus-session-completed', handler);
  }, [fetchSessions]);

  const targetMinutes = Math.round(
    (mode === 'work'
      ? WORK_DURATION
      : mode === 'longBreak'
        ? LONG_BREAK_DURATION
        : BREAK_DURATION) / 60
  );

  return (
    <div className={styles.page}>
      {/* Page header */}
      <header className={styles.pageHeader}>
        <SectionHeader
          number="00"
          title="Focus session"
          caption={isRunning ? 'LIVE · IN PROGRESS' : isWorkActive ? 'PAUSED' : 'POMODORO'}
        />
      </header>

      <div className={styles.layout}>
        {/* ── Timer card ───────────────────────────────────────────── */}
        <section className={styles.timerCard}>
          {/* Status caption row */}
          <div className={styles.timerHeader}>
            <span
              className={`${styles.statusCaption} ${
                isRunning ? styles.statusRunning : ''
              } ${isWorkActive && !isRunning ? styles.statusPaused : ''}`.trim()}
            >
              {isRunning
                ? '· LIVE · SESSION IN PROGRESS'
                : isWorkActive
                  ? '§ PAUSED · STILL LOCKED IN'
                  : mode === 'work'
                    ? '§ READY'
                    : '§ BREAK'}
            </span>
            <div className={styles.stampSlot}>
              {isRunning ? (
                <LockedInBadge />
              ) : isWorkActive ? (
                <Stamp kind="locked-in" size="md" />
              ) : null}
            </div>
          </div>

          {/* Mode selector */}
          <div
            className={styles.modeRow}
            role="tablist"
            aria-label="Timer mode"
          >
            {MODES.map((m) => {
              const active = mode === m.value;
              return (
                <button
                  key={m.value}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  className={`${styles.modeButton} ${
                    active ? styles.modeButtonActive : ''
                  }`}
                  onClick={() => switchMode(m.value)}
                  disabled={isRunning && !active}
                >
                  {m.label}
                </button>
              );
            })}
          </div>

          {/* Hero timer + linear bar */}
          <FocusTimer />

          {/* Controls */}
          <FocusControls targetMinutes={targetMinutes} />

          {isWorkActive ? (
            <>
              <div className={styles.ruleDotted} />
              <p className={styles.runningCopy}>
                {isRunning
                  ? 'Your friends know you’re working.'
                  : 'Paused. Your friends still see you locked in — pick it back up.'}
              </p>
            </>
          ) : null}
        </section>

        {/* ── Sidebar: Witnesses + Today + Recent ──────────────────── */}
        <aside className={styles.sidebar}>
          <section className={styles.sideSection}>
            <SectionHeader
              number="01"
              title="Your friends"
              caption="WHO SEES YOU LOCK IN"
            />
            <FocusWitnessesOfMe userId={user.id} isRunning={isWorkActive} />
          </section>

          <section className={styles.sideSection}>
            <SectionHeader number="02" title="Today" />
            {error ? (
              <div className={styles.errorBox}>
                <p>{error}</p>
                <button
                  type="button"
                  className={styles.errorRetry}
                  onClick={fetchSessions}
                >
                  Try again
                </button>
              </div>
            ) : (
              <div className={styles.todayBlock}>
                <div className={styles.todayHeadline}>
                  <span className={styles.todayNumeral}>{todayMinutes}</span>
                  <span className={styles.todayLabel}>MIN FOCUSED</span>
                </div>
                <p className={styles.todaySub}>
                  {todaySessions === 1
                    ? '1 session today'
                    : `${todaySessions} sessions today`}
                </p>
              </div>
            )}
          </section>

          <section className={styles.sideSection}>
            <SectionHeader number="03" title="Recent sessions" />
            {isLoading ? (
              <div className={styles.recentEmpty}>Loading…</div>
            ) : recentSessions.length === 0 ? (
              <div className={styles.recentEmpty}>
                No sessions yet. Lock in for your first.
              </div>
            ) : (
              <ul className={styles.recentList}>
                {recentSessions.map((s) => (
                  <li key={s.id} className={styles.recentRow}>
                    <span className={styles.recentTime}>
                      {timeAgo(s.started_at)}
                    </span>
                    <span className={styles.recentDuration}>
                      {s.duration_minutes ?? 0}m
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </aside>
      </div>
    </div>
  );
}
