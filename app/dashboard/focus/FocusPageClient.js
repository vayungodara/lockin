'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import { createClient } from '@/lib/supabase/client';
import { useKeyboardShortcuts } from '@/lib/KeyboardShortcutsContext';
import { useFocus } from '@/lib/FocusContext';
import { fadeInUp } from '@/lib/animations';
import SectionHeader from '@/components/SectionHeader';
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
    switchMode,
    WORK_DURATION,
    BREAK_DURATION,
    LONG_BREAK_DURATION,
  } = useFocus();

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
    <motion.div
      className={styles.page}
      variants={fadeInUp}
      initial="initial"
      animate="animate"
    >
      {/* Page header */}
      <header className={styles.pageHeader}>
        <SectionHeader
          number="00"
          title="Focus session"
          caption={isRunning ? 'LIVE · IN PROGRESS' : 'POMODORO'}
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
              }`}
            >
              {isRunning
                ? '· LIVE · SESSION IN PROGRESS'
                : mode === 'work'
                  ? '§ READY'
                  : '§ BREAK'}
            </span>
            <div className={styles.stampSlot}>
              <LockedInBadge />
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

          {isRunning ? (
            <>
              <div className={styles.ruleDotted} />
              <p className={styles.runningCopy}>
                Your friends know you&apos;re working.
              </p>
            </>
          ) : null}
        </section>

        {/* ── Sidebar: Witnesses + Today + Recent ──────────────────── */}
        <aside className={styles.sidebar}>
          <section className={styles.sideSection}>
            <SectionHeader
              number="01"
              title="Witnesses of me"
              caption="WHO SEES YOU"
            />
            <FocusWitnessesOfMe userId={user.id} isRunning={isRunning} />
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
    </motion.div>
  );
}
