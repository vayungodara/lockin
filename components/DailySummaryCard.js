'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { createClient } from '@/lib/supabase/client';
import { fadeInUp, streakCelebration } from '@/lib/animations';
import { checkStreakAtRisk, applyStreakFreeze, getStreakFreezeStatus, FREEZE_COOLDOWN_DAYS } from '@/lib/streaks-advanced';
import { useToast } from '@/components/Toast';
import styles from './DailySummaryCard.module.css';

/**
 * Pick the right icon for the streak level:
 *   100+ days = crown, 30+ = diamond, 7+ = fire, otherwise fire
 */
function getStreakIcon(streak) {
  if (streak >= 100) return { emoji: '\uD83D\uDC51', tier: 'legendary' };  // crown
  if (streak >= 30) return { emoji: '\uD83D\uDC8E', tier: 'diamond' };     // diamond
  if (streak >= 7) return { emoji: '\uD83D\uDD25', tier: 'fire' };         // fire with glow
  return { emoji: '\uD83D\uDD25', tier: 'default' };                       // plain fire
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

  useEffect(() => {
    async function fetchSummary() {
      if (!userId) return;
      try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayISO = today.toISOString();

        // Fetch pacts due today/overdue
        const { data: activePacts } = await supabase
          .from('pacts')
          .select('id, deadline')
          .eq('user_id', userId)
          .eq('status', 'active');

        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const dueToday = (activePacts || []).filter(p => {
          const d = new Date(p.deadline);
          return d >= today && d < tomorrow;
        }).length;

        const overdue = (activePacts || []).filter(p =>
          new Date(p.deadline) < today
        ).length;

        // Fetch focus sessions today
        const { data: focusSessions } = await supabase
          .from('focus_sessions')
          .select('duration_minutes')
          .eq('user_id', userId)
          .gte('started_at', todayISO)
          .not('ended_at', 'is', null);

        const focusMinutes = (focusSessions || []).reduce(
          (sum, s) => sum + (s.duration_minutes || 0), 0
        );

        // Fetch completed pacts today
        const { data: completedToday } = await supabase
          .from('pacts')
          .select('id')
          .eq('user_id', userId)
          .eq('status', 'completed')
          .gte('completed_at', todayISO);

        // Streak info — also fetch last_activity_date to validate stale data
        const { data: profile } = await supabase
          .from('profiles')
          .select('current_streak, last_activity_date, total_xp, level, streak_freezes_remaining')
          .eq('id', userId)
          .single();

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

        // Check streak risk
        const risk = await checkStreakAtRisk(supabase, userId);
        setStreakRisk(risk);

        // Always fetch freeze status (we show count in header, not just when at risk)
        const freeze = await getStreakFreezeStatus(supabase, userId);
        setFreezeStatus(freeze);
      } catch (err) {
        console.error('Error loading summary:', err);
      } finally {
        setIsLoading(false);
      }
    }

    fetchSummary();
  }, [userId, supabase, refreshKey]);

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

  if (isLoading || !summary) return null;

  const streakInfo = getStreakIcon(summary.streak);
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

          {/* Streak badge with tier-based icon */}
          {summary.streak > 0 && (
            <div className={`${styles.streakBadge} ${styles[`streak_${streakInfo.tier}`] || ''}`}>
              <span className={styles.streakIcon}>{streakInfo.emoji}</span>
              {summary.streak >= 3 ? (
                <motion.span {...streakCelebration}>
                  {summary.streak} day streak
                </motion.span>
              ) : (
                <span>{summary.streak} day streak</span>
              )}
            </div>
          )}
        </div>
      </div>

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
