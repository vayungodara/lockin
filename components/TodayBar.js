'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createClient } from '@/lib/supabase/client';
import { fadeInUp, streakCelebration } from '@/lib/animations';
import { calculateStreak } from '@/lib/streaks';
import { checkStreakAtRisk, applyStreakFreeze, getStreakFreezeStatus, FREEZE_COOLDOWN_DAYS } from '@/lib/streaks-advanced';
import { fireMilestoneConfetti } from '@/lib/confetti';
import { playStreakMilestone } from '@/lib/sounds';
import { Timer, Snowflake } from '@phosphor-icons/react';
import { useToast } from '@/components/Toast';
import styles from './TodayBar.module.css';

/* ── Streak milestones ── */
const STREAK_MILESTONES = [7, 14, 30, 50, 100];

function getMilestoneMessage(streak) {
  if (streak >= 100) return { text: '100 days locked in. Legendary.' };
  if (streak >= 50) return { text: '50 days. Diamond hands.' };
  if (streak >= 30) return { text: '30 days. Monthly master.' };
  if (streak >= 14) return { text: '2 weeks strong. Keep going.' };
  if (streak >= 7) return { text: 'One week locked in.' };
  return null;
}

/* ── Streak tier system ── */
const MICRO_COPY = [
  "Don't break the chain.",
  "Your streak is watching.",
  "Keep showing up.",
  "Consistency beats intensity.",
  "One day at a time.",
  "Momentum is everything.",
];

function getStreakTier(streak) {
  if (streak >= 100) return { tier: 'legendary' };
  if (streak >= 30) return { tier: 'diamond' };
  if (streak >= 14) return { tier: 'electric' };
  if (streak >= 7) return { tier: 'fire' };
  if (streak >= 3) return { tier: 'warm' };
  return { tier: 'base' };
}

function getMicroCopy(streak) {
  if (streak === 0) return "Start your streak today.";
  if (streak >= 100) return "Legendary. Nothing stops you.";
  if (streak >= 30) return "A whole month. Diamond hands.";
  if (streak >= 14) return "Two weeks strong.";
  if (streak >= 7) return "One week locked in.";
  return MICRO_COPY[streak % MICRO_COPY.length];
}

/* ── Cooldown formatter ── */
function formatCooldown(cooldownEnds) {
  if (!cooldownEnds) return '';
  const diff = new Date(cooldownEnds) - new Date();
  if (diff <= 0) return '';
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(hours / 24);
  const remainingHours = hours % 24;
  if (days > 0) return `${days}d ${remainingHours}h`;
  return `${hours}h`;
}

export default function TodayBar({ userId, refreshKey, currentStreak, longestStreak }) {
  const [summary, setSummary] = useState(null);
  const [streakRisk, setStreakRisk] = useState(null);
  const [freezeStatus, setFreezeStatus] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [freezeLoading, setFreezeLoading] = useState(false);
  const supabase = useMemo(() => createClient(), []);
  const toast = useToast();
  useEffect(() => {
    async function fetchSummary() {
      if (!userId) return;
      try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayISO = today.toISOString();

        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        let timezone = 'UTC';
        try { timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'; } catch {}

        const [
          { data: activePacts, error: pactsError },
          { data: focusSessions, error: focusError },
          { data: completedToday, error: completedError },
          { data: profile, error: profileError },
          streakResult,
          risk,
          freeze,
        ] = await Promise.all([
          supabase
            .from('pacts')
            .select('id, deadline')
            .eq('user_id', userId)
            .eq('status', 'active'),
          supabase
            .from('focus_sessions')
            .select('duration_minutes')
            .eq('user_id', userId)
            .gte('started_at', todayISO)
            .not('ended_at', 'is', null),
          supabase
            .from('pacts')
            .select('id')
            .eq('user_id', userId)
            .eq('status', 'completed')
            .gte('completed_at', todayISO),
          supabase
            .from('profiles')
            .select('total_xp, level, streak_freezes_remaining')
            .eq('id', userId)
            .single(),
          calculateStreak(supabase, userId, timezone),
          checkStreakAtRisk(supabase, userId, timezone),
          getStreakFreezeStatus(supabase, userId),
        ]);

        if (pactsError) console.warn('TodayBar: failed to fetch active pacts', pactsError);
        if (focusError) console.warn('TodayBar: failed to fetch focus sessions', focusError);
        if (completedError) console.warn('TodayBar: failed to fetch completed pacts', completedError);
        if (profileError) console.warn('TodayBar: failed to fetch profile', profileError);

        const dueToday = (activePacts || []).filter(p => {
          const d = new Date(p.deadline);
          return d >= today && d < tomorrow;
        }).length;

        const overdue = (activePacts || []).filter(p =>
          new Date(p.deadline) < today
        ).length;

        const focusMinutes = (focusSessions || []).reduce(
          (sum, s) => sum + (s.duration_minutes || 0), 0
        );

        const streak = streakResult?.currentStreak ?? 0;

        setSummary({
          dueToday,
          overdue,
          completedToday: completedToday?.length || 0,
          focusMinutes,
          streak,
          xp: profile?.total_xp || 0,
          level: profile?.level || 1,
          freezesRemaining: profile?.streak_freezes_remaining || 0,
        });

        const reconciledRisk = (streak === 0 && risk?.atRisk)
          ? { atRisk: false, streak: 0 }
          : risk;
        setStreakRisk(reconciledRisk);
        setFreezeStatus(freeze);
      } catch (err) {
        console.error('Error loading TodayBar summary:', err);
      } finally {
        setIsLoading(false);
      }
    }

    fetchSummary();
  }, [userId, supabase, refreshKey]);

  // Derive streak value: prefer fetched summary, fall back to prop
  const streak = summary?.streak ?? currentStreak ?? 0;
  const { tier } = getStreakTier(streak);
  const microCopy = getMicroCopy(streak);
  const isMilestoneDay = STREAK_MILESTONES.includes(streak);
  const milestoneMessage = getMilestoneMessage(streak);

  // Fire celebration effects once per session when a milestone is detected
  useEffect(() => {
    if (!isMilestoneDay || !milestoneMessage) return;
    const milestoneKey = `milestone-fired-${streak}`;
    if (typeof window !== 'undefined' && !sessionStorage.getItem(milestoneKey)) {
      sessionStorage.setItem(milestoneKey, 'true');
      fireMilestoneConfetti();
      playStreakMilestone();
    }
  }, [isMilestoneDay, milestoneMessage, streak]);

  const handleUseFreeze = async () => {
    setFreezeLoading(true);
    let timezone = 'UTC';
    try { timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'; } catch {}
    const result = await applyStreakFreeze(supabase, timezone);
    setFreezeLoading(false);

    if (result.success) {
      toast.success(`Streak saved. ${result.freezesRemaining} freeze${result.freezesRemaining !== 1 ? 's' : ''} remaining.`);
      setStreakRisk({ atRisk: false, streak: streakRisk.streak });
      setFreezeStatus(prev => ({
        ...prev,
        available: false,
        freezesRemaining: result.freezesRemaining,
        cooldownEnds: new Date(Date.now() + FREEZE_COOLDOWN_DAYS * 24 * 60 * 60 * 1000),
      }));
      setSummary(prev => ({ ...prev, freezesRemaining: result.freezesRemaining }));
    } else {
      toast.error(result.error || 'Failed to use freeze');
    }
  };

  // Skeleton placeholder while loading
  if (isLoading || !summary) {
    return <div className={styles.skeleton} aria-label="Loading today summary" />;
  }

  const freezesRemaining = freezeStatus?.freezesRemaining ?? summary.freezesRemaining;
  const showSecondaryRow = (streakRisk?.atRisk) || (isMilestoneDay && milestoneMessage);

  // Compose pact-status copy as a single direct-positive line.
  // Voice: "3 pacts due today", "2 overdue", "All done for today", "No pacts due"
  let pactStatusText;
  let pactStatusTone = 'neutral';
  if (summary.overdue > 0) {
    pactStatusText = `${summary.overdue} overdue`;
    pactStatusTone = 'danger';
    if (summary.dueToday > 0) {
      pactStatusText += ` · ${summary.dueToday} due today`;
    }
  } else if (summary.dueToday > 0) {
    pactStatusText = `${summary.dueToday} pact${summary.dueToday !== 1 ? 's' : ''} due today`;
    pactStatusTone = 'active';
  } else if (summary.completedToday > 0) {
    pactStatusText = 'All done for today';
    pactStatusTone = 'done';
  } else {
    pactStatusText = 'No pacts due';
    pactStatusTone = 'neutral';
  }

  const completedSuffix =
    summary.completedToday > 0 && (summary.overdue + summary.dueToday) > 0
      ? ` · ${summary.completedToday} kept`
      : '';

  return (
    <motion.div
      className={`${styles.bar} ${styles[tier] || ''}`}
      variants={fadeInUp}
      initial="initial"
      animate="animate"
      role="region"
      aria-label="Today's summary"
    >
      {/* ── Primary row: 3 zones ── */}
      <div className={styles.primaryRow}>

        {/* Zone 1: Streak — monumental serif numeral */}
        <div className={styles.streakZone}>
          {isMilestoneDay ? (
            <motion.span {...streakCelebration} className={styles.streakCountWrap}>
              <span className={styles.streakCount}>{streak}</span>
            </motion.span>
          ) : (
            <span className={styles.streakCountWrap}>
              <span className={styles.streakCount}>{streak}</span>
            </span>
          )}
          <div className={styles.streakMeta}>
            <span className={styles.streakLabel}>day streak</span>
            <p className={styles.microCopy}>{microCopy}</p>
            {longestStreak > 0 && longestStreak > streak && (
              <span className={styles.bestBadge} title={`Best: ${longestStreak} days`}>
                Best · {longestStreak}
              </span>
            )}
          </div>
        </div>

        {/* Zone divider */}
        <div className={styles.zoneDivider} aria-hidden="true" />

        {/* Zone 2: Pacts due — single direct-positive line */}
        <div className={styles.pactsZone}>
          <span className={styles.zoneCaption}>Today</span>
          <div className={styles.pactStatusLine}>
            <span className={`${styles.zoneDot} ${styles[pactStatusTone]}`} aria-hidden="true" />
            <span className={styles.pactStatusText}>
              {pactStatusText}
              {completedSuffix && <span className={styles.completedFragment}>{completedSuffix}</span>}
            </span>
          </div>
        </div>

        {/* Zone divider */}
        <div className={styles.zoneDivider} aria-hidden="true" />

        {/* Zone 3: Focus time + freeze badge */}
        <div className={styles.focusZone}>
          <div className={styles.focusContent}>
            <span className={styles.focusIconWrap} aria-hidden="true">
              <Timer size={16} weight="regular" />
            </span>
            <div className={styles.focusText}>
              <span className={styles.zoneCaption}>Locked in</span>
              <span className={styles.focusValue}>{summary.focusMinutes}m</span>
            </div>
          </div>
          {freezesRemaining > 0 && (
            <div
              className={styles.freezeBadge}
              title={`${freezesRemaining} streak freeze${freezesRemaining !== 1 ? 's' : ''} available`}
            >
              <Snowflake size={12} weight="regular" />
              <span>{freezesRemaining}</span>
            </div>
          )}
        </div>
      </div>

      {/* ── Secondary row: at-risk banner OR milestone banner ── */}
      <AnimatePresence>
        {showSecondaryRow && (
          <motion.div
            className={styles.secondaryRow}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.25, 0.1, 0.25, 1] }}
          >
            {/* At-risk banner takes priority — uses CLOSES SOON chip pattern */}
            {streakRisk?.atRisk ? (
              <div className={styles.riskBanner}>
                <span className={styles.riskChip}>1 day left</span>
                <span className={styles.riskText}>
                  Keep a pact to save your {streakRisk.streak}-day streak
                </span>
                {freezeStatus?.available ? (
                  <button
                    className={styles.freezeBtn}
                    onClick={handleUseFreeze}
                    disabled={freezeLoading}
                  >
                    {freezeLoading ? 'Using…' : `Use freeze (${freezesRemaining} left)`}
                  </button>
                ) : freezesRemaining > 0 && freezeStatus?.cooldownEnds ? (
                  <button className={`${styles.freezeBtn} ${styles.freezeBtnDisabled}`} disabled>
                    Cooldown · {formatCooldown(freezeStatus.cooldownEnds)}
                  </button>
                ) : null}
              </div>
            ) : isMilestoneDay && milestoneMessage ? (
              <div className={styles.milestoneBanner}>
                <span className={styles.milestoneChip}>Milestone</span>
                <span className={styles.milestoneText}>{milestoneMessage.text}</span>
              </div>
            ) : null}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
