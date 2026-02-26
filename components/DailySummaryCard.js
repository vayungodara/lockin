'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { createClient } from '@/lib/supabase/client';
import { fadeInUp, streakCelebration } from '@/lib/animations';
import { checkStreakAtRisk, useStreakFreeze, getStreakFreezeStatus } from '@/lib/streaks-advanced';
import { useToast } from '@/components/Toast';
import styles from './DailySummaryCard.module.css';

export default function DailySummaryCard({ userId, refreshKey }) {
  const [summary, setSummary] = useState(null);
  const [streakRisk, setStreakRisk] = useState(null);
  const [freezeAvailable, setFreezeAvailable] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
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
          .select('current_streak, last_activity_date, total_xp, level')
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
        });

        // Check streak risk
        const risk = await checkStreakAtRisk(supabase, userId);
        setStreakRisk(risk);

        if (risk.atRisk) {
          const freeze = await getStreakFreezeStatus(supabase, userId);
          setFreezeAvailable(freeze.available);
        }
      } catch (err) {
        console.error('Error loading summary:', err);
      } finally {
        setIsLoading(false);
      }
    }

    fetchSummary();
  }, [userId, supabase, refreshKey]);

  const handleUseFreeze = async () => {
    const result = await useStreakFreeze(supabase);
    if (result.success) {
      toast.success('Streak freeze activated!');
      setStreakRisk({ atRisk: false, streak: streakRisk.streak });
      setFreezeAvailable(false);
    } else {
      toast.error(result.error || 'Failed to use freeze');
    }
  };

  if (isLoading || !summary) return null;

  const hasActivity = summary.dueToday > 0 || summary.overdue > 0 || summary.completedToday > 0 || summary.focusMinutes > 0;

  return (
    <motion.div className={styles.card} variants={fadeInUp} initial="initial" animate="animate">
      <div className={styles.header}>
        <h3 className={styles.title}>Today</h3>
        {summary.streak > 0 && (
          <div className={styles.streakBadge}>
            <span className={styles.streakIcon}>🔥</span>
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

      {streakRisk?.atRisk && (
        <div className={styles.riskBanner}>
          <span>⚠️ Your {streakRisk.streak}-day streak is at risk!</span>
          {freezeAvailable && (
            <button className={styles.freezeBtn} onClick={handleUseFreeze}>
              Use Freeze
            </button>
          )}
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
