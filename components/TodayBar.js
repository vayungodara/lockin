'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createClient } from '@/lib/supabase/client';
import { fadeInUp, streakCelebration } from '@/lib/animations';
import { checkStreakAtRisk, applyStreakFreeze, getStreakFreezeStatus, FREEZE_COOLDOWN_DAYS } from '@/lib/streaks-advanced';
import { fireMilestoneConfetti } from '@/lib/confetti';
import { playStreakMilestone } from '@/lib/sounds';
import { useToast } from '@/components/Toast';
import styles from './TodayBar.module.css';

/* ── Streak milestones ── */
const STREAK_MILESTONES = [7, 14, 30, 50, 100];

function getMilestoneMessage(streak) {
  if (streak >= 100) return { emoji: '\uD83D\uDC51', text: 'Legendary. 100 days locked in.' };
  if (streak >= 50) return { emoji: '\uD83D\uDC8E', text: '50 days. Diamond hands.' };
  if (streak >= 30) return { emoji: '\uD83D\uDD25', text: '30 days. Monthly master.' };
  if (streak >= 14) return { emoji: '\u26A1', text: '2 weeks strong. Keep going.' };
  if (streak >= 7) return { emoji: '\uD83C\uDFAF', text: 'One week locked in. W.' };
  return null;
}

/* ── Streak tier system (from StreakHero) ── */
const MICRO_COPY = [
  "Don't break the chain.",
  "Your streak is watching.",
  "Keep showing up.",
  "Consistency beats intensity.",
  "One day at a time.",
  "Momentum is everything.",
];

function getStreakTier(streak) {
  if (streak >= 100) return { icon: '\uD83D\uDC51', tier: 'legendary', label: 'Legendary' };
  if (streak >= 30) return { icon: '\uD83D\uDC8E', tier: 'diamond', label: 'Diamond' };
  if (streak >= 14) return { icon: '\u26A1', tier: 'electric', label: 'Electric' };
  if (streak >= 7) return { icon: '\uD83D\uDD25', tier: 'fire', label: 'On fire' };
  if (streak >= 3) return { icon: '\uD83D\uDD25', tier: 'warm', label: 'Warming up' };
  return { icon: '\uD83D\uDD25', tier: 'base', label: '' };
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
  const milestoneFiredRef = useRef(false);

  useEffect(() => {
    async function fetchSummary() {
      if (!userId) return;
      try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayISO = today.toISOString();

        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        // Run all independent queries in parallel
        const [
          { data: activePacts, error: pactsError },
          { data: focusSessions, error: focusError },
          { data: completedToday, error: completedError },
          { data: profile, error: profileError },
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
            .select('current_streak, last_activity_date, total_xp, level, streak_freezes_remaining')
            .eq('id', userId)
            .single(),
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

        // If last_activity_date is more than 1 day ago, streak is broken
        // regardless of what current_streak says (cron may not have reset it).
        let streak = profile?.current_streak || 0;
        if (streak > 0 && profile?.last_activity_date) {
          const now = new Date();
          const todayUTC = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
          const lastActivity = new Date(profile.last_activity_date + 'T00:00:00Z').getTime();
          const daysSince = Math.round((todayUTC - lastActivity) / (1000 * 60 * 60 * 24));
          if (daysSince > 1) streak = 0;
        }

        // Check streak risk and freeze status in parallel
        const [risk, freeze] = await Promise.all([
          checkStreakAtRisk(supabase, userId),
          getStreakFreezeStatus(supabase, userId),
        ]);

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

        setStreakRisk(risk);
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
  const { icon, tier } = getStreakTier(streak);
  const microCopy = getMicroCopy(streak);
  const isMilestoneDay = STREAK_MILESTONES.includes(streak);
  const milestoneMessage = getMilestoneMessage(streak);

  // Fire celebration effects once per session when a milestone is detected
  useEffect(() => {
    if (isMilestoneDay && milestoneMessage && !milestoneFiredRef.current) {
      milestoneFiredRef.current = true;
      fireMilestoneConfetti();
      playStreakMilestone();
    }
  }, [isMilestoneDay, milestoneMessage]);

  const handleUseFreeze = async () => {
    setFreezeLoading(true);
    const result = await applyStreakFreeze(supabase);
    setFreezeLoading(false);

    if (result.success) {
      toast.success(`Streak saved! ${result.freezesRemaining} freeze${result.freezesRemaining !== 1 ? 's' : ''} remaining.`);
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
  const totalDue = summary.dueToday + summary.overdue;

  return (
    <motion.div
      className={`${styles.bar} ${styles[tier] || ''}`}
      variants={fadeInUp}
      initial="initial"
      animate="animate"
      role="region"
      aria-label="Today's summary"
    >
      {/* Background decoration */}
      <div className={styles.bgDecoration} aria-hidden="true" />

      {/* ── Primary row: 3 zones ── */}
      <div className={styles.primaryRow}>

        {/* Zone 1: Streak */}
        <div className={styles.streakZone}>
          <div className={styles.iconWrapper}>
            {isMilestoneDay ? (
              <motion.span {...streakCelebration} style={{ display: 'inline-block' }}>
                <span className={styles.streakIcon} role="img" aria-label="streak icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 23C16.5 23 20 19.5 20 15.5C20 11.5 17 8 15 6C14.5 8 13 9.5 12 10C11.5 7 10 4 8 2C7 5 5 8.5 5 12C5 16 7.5 23 12 23Z" fill="#FF6B35" stroke="#E8530E" strokeWidth="1"/>
                    <path d="M12 23C14.5 23 16.5 20.5 16.5 17.5C16.5 14.5 14 12 13 11C12.5 13 12 14 11 14.5C10.5 12 10 10 9 8.5C8.5 11 7.5 13 7.5 15.5C7.5 19 9.5 23 12 23Z" fill="#FFB800" stroke="#FF9500" strokeWidth="0.5"/>
                  </svg>
                </span>
              </motion.span>
            ) : (
              <span className={styles.streakIcon} role="img" aria-label="streak icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 23C16.5 23 20 19.5 20 15.5C20 11.5 17 8 15 6C14.5 8 13 9.5 12 10C11.5 7 10 4 8 2C7 5 5 8.5 5 12C5 16 7.5 23 12 23Z" fill="#FF6B35" stroke="#E8530E" strokeWidth="1"/>
                  <path d="M12 23C14.5 23 16.5 20.5 16.5 17.5C16.5 14.5 14 12 13 11C12.5 13 12 14 11 14.5C10.5 12 10 10 9 8.5C8.5 11 7.5 13 7.5 15.5C7.5 19 9.5 23 12 23Z" fill="#FFB800" stroke="#FF9500" strokeWidth="0.5"/>
                </svg>
              </span>
            )}
            <span className={styles.confettiDotBlue} aria-hidden="true" />
            <span className={styles.confettiDotGreen} aria-hidden="true" />
          </div>
          <div className={styles.streakText}>
            <div className={styles.streakHeadline}>
              <span className={styles.streakCount}>{streak}</span>
              <span className={styles.streakLabel}>day streak!</span>
              {longestStreak > 0 && longestStreak > streak && (
                <span className={styles.bestBadge} title={`Best: ${longestStreak} days`}>
                  Best: {longestStreak}
                </span>
              )}
            </div>
            <p className={styles.microCopy}>{microCopy}</p>
          </div>
        </div>

        {/* Zone divider */}
        <div className={styles.zoneDivider} aria-hidden="true" />

        {/* Zone 2: Pacts due */}
        <div className={styles.pactsZone}>
          {summary.overdue > 0 ? (
            <>
              <div className={styles.zoneRow}>
                <span className={`${styles.zoneDot} ${styles.danger}`} />
                <span className={styles.zoneValue}>
                  <span className={styles.zoneNumber}>{summary.overdue}</span> overdue
                </span>
              </div>
              {summary.dueToday > 0 && (
                <div className={styles.zoneRow}>
                  <span className={`${styles.zoneDot} ${styles.warning}`} />
                  <span className={styles.zoneValue}>
                    <span className={styles.zoneNumber}>{summary.dueToday}</span> due today
                  </span>
                </div>
              )}
            </>
          ) : summary.dueToday > 0 ? (
            <div className={styles.zoneRow}>
              <span className={`${styles.zoneDot} ${styles.active}`} />
              <span className={styles.zoneValue}>
                <span className={styles.zoneNumber}>{summary.dueToday}</span> pact{summary.dueToday !== 1 ? 's' : ''} due today
              </span>
            </div>
          ) : (
            <div className={styles.zoneRow}>
              <span className={`${styles.zoneDot} ${styles.done}`} />
              <span className={styles.zoneValue}>
                {summary.completedToday > 0 ? 'All done for today' : 'No pacts due'}
              </span>
            </div>
          )}
          {summary.completedToday > 0 && totalDue > 0 && (
            <div className={styles.zoneRow}>
              <span className={`${styles.zoneDot} ${styles.done}`} />
              <span className={styles.zoneValue}>
                <span className={styles.zoneNumber}>{summary.completedToday}</span> completed
              </span>
            </div>
          )}
        </div>

        {/* Zone divider */}
        <div className={styles.zoneDivider} aria-hidden="true" />

        {/* Zone 3: Focus time + freeze badge */}
        <div className={styles.focusZone}>
          <div className={styles.focusContent}>
            <span className={styles.focusIcon} role="img" aria-label="focus time">{'\u23F1'}</span>
            <div className={styles.focusText}>
              <span className={styles.focusValue}>{summary.focusMinutes}m</span>
              <span className={styles.focusLabel}>focused</span>
            </div>
          </div>
          {freezesRemaining > 0 && (
            <div className={styles.freezeBadge} title={`${freezesRemaining} streak freeze${freezesRemaining !== 1 ? 's' : ''} available`}>
              <span className={styles.freezeBadgeIcon}>{'\u2744\uFE0F'}</span>
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
            {/* At-risk banner takes priority */}
            {streakRisk?.atRisk ? (
              <div className={styles.riskBanner}>
                <span className={styles.riskText}>
                  {'\u26A0\uFE0F'} Complete a pact to save your {streakRisk.streak}-day streak!
                </span>
                {freezeStatus?.available ? (
                  <button
                    className={styles.freezeBtn}
                    onClick={handleUseFreeze}
                    disabled={freezeLoading}
                  >
                    {freezeLoading ? 'Using...' : `Use Freeze (${freezesRemaining} left)`}
                  </button>
                ) : freezesRemaining > 0 && freezeStatus?.cooldownEnds ? (
                  <button className={`${styles.freezeBtn} ${styles.freezeBtnDisabled}`} disabled>
                    Cooldown: {formatCooldown(freezeStatus.cooldownEnds)}
                  </button>
                ) : null}
              </div>
            ) : isMilestoneDay && milestoneMessage ? (
              <div className={styles.milestoneBanner}>
                <span className={styles.milestoneEmoji}>{milestoneMessage.emoji}</span>
                <span className={styles.milestoneText}>{milestoneMessage.text}</span>
              </div>
            ) : null}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
