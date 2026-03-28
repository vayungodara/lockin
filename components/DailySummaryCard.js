'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { motion } from 'framer-motion';
import { createClient } from '@/lib/supabase/client';
import { fadeInUp } from '@/lib/animations';
import { checkStreakAtRisk, applyStreakFreeze, getStreakFreezeStatus, FREEZE_COOLDOWN_DAYS } from '@/lib/streaks-advanced';
import { fireMilestoneConfetti } from '@/lib/confetti';
import { playStreakMilestone } from '@/lib/sounds';
import { useToast } from '@/components/Toast';
import styles from './DailySummaryCard.module.css';

const STREAK_MILESTONES = [7, 14, 30, 50, 100];

function getMilestoneMessage(streak) {
  if (streak >= 100) return { emoji: '\uD83D\uDC51', text: 'Legendary. 100 days locked in.' };
  if (streak >= 50) return { emoji: '\uD83D\uDC8E', text: '50 days. Diamond hands.' };
  if (streak >= 30) return { emoji: '\uD83D\uDD25', text: '30 days. Monthly master.' };
  if (streak >= 14) return { emoji: '\u26A1', text: '2 weeks strong. Keep going.' };
  if (streak >= 7) return { emoji: '\uD83C\uDFAF', text: 'One week locked in. W.' };
  return null;
}

/**
 * Format cooldown remaining as "Xd Yh" or "Xh"
 */
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

export default function DailySummaryCard({ userId, refreshKey }) {
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
          { data: activePacts },
          { data: focusSessions },
          { data: completedToday },
          { data: profile },
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
        // Use UTC dates on both sides to match server-side streak logic.
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
        console.error('Error loading summary:', err);
      } finally {
        setIsLoading(false);
      }
    }

    fetchSummary();
  }, [userId, supabase, refreshKey]);

  // Milestone detection
  const isMilestone = STREAK_MILESTONES.includes(summary?.streak);
  const milestoneMessage = summary ? getMilestoneMessage(summary.streak) : null;

  // Fire celebration effects once per session when a milestone is detected
  useEffect(() => {
    if (isMilestone && milestoneMessage && !milestoneFiredRef.current) {
      milestoneFiredRef.current = true;
      fireMilestoneConfetti();
      playStreakMilestone();
    }
  }, [isMilestone, milestoneMessage]);

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
      // Update summary freeze count too
      setSummary(prev => ({ ...prev, freezesRemaining: result.freezesRemaining }));
    } else {
      toast.error(result.error || 'Failed to use freeze');
    }
  };

  if (isLoading || !summary) return <div style={{ height: '120px' }} />;

  const freezesRemaining = freezeStatus?.freezesRemaining ?? summary.freezesRemaining;

  return (
    <motion.div className={styles.card} variants={fadeInUp} initial="initial" animate="animate">
      <div className={styles.header}>
        <h3 className={styles.title}>Today</h3>
        <div className={styles.headerBadges}>
          {/* Freeze count badge — always visible if user has freezes */}
          {freezesRemaining > 0 && (
            <div className={styles.freezeBadge} title={`${freezesRemaining} streak freeze${freezesRemaining !== 1 ? 's' : ''} available`}>
              <span className={styles.freezeIcon}>{'\u2744\uFE0F'}</span>
              <span>{freezesRemaining}</span>
            </div>
          )}
        </div>
      </div>

      {/* Milestone celebration banner */}
      {isMilestone && milestoneMessage && (
        <motion.div
          className={styles.milestoneBanner}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <span className={styles.milestoneEmoji}>{milestoneMessage.emoji}</span>
          <span className={styles.milestoneText}>{milestoneMessage.text}</span>
        </motion.div>
      )}

      {/* At-risk banner with freeze controls */}
      {streakRisk?.atRisk && (
        <div className={styles.riskBanner}>
          <span>{'\u26A0\uFE0F'} Complete a pact to save your {streakRisk.streak}-day streak!</span>
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
      )}

      <div className={styles.stats}>
        <div className={styles.stat}>
          <span className={styles.statValue}>{summary.completedToday}</span>
          <span className={styles.statLabel}>Completed</span>
        </div>
        <div className={styles.divider} />
        <div className={styles.stat}>
          <span className={`${styles.statValue} ${summary.dueToday > 0 ? styles.warning : ''}`}>
            {summary.dueToday}
          </span>
          <span className={styles.statLabel}>Due Today</span>
        </div>
        <div className={styles.divider} />
        <div className={styles.stat}>
          <span className={styles.statValue}>{summary.focusMinutes}m</span>
          <span className={styles.statLabel}>Focused</span>
        </div>
        {summary.overdue > 0 && (
          <>
            <div className={styles.divider} />
            <div className={styles.stat}>
              <span className={`${styles.statValue} ${styles.danger}`}>{summary.overdue}</span>
              <span className={styles.statLabel}>Overdue</span>
            </div>
          </>
        )}
      </div>
    </motion.div>
  );
}
