'use client';

import { useState, useRef, useMemo, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { createClient } from '@/lib/supabase/client';
import { logActivity } from '@/lib/activity';
import { useConfetti } from '@/lib/confetti';
import { buttonHover, buttonTap, celebrationBounce } from '@/lib/animations';
import { useToast } from '@/components/Toast';
import { playCompletionSound, playMissSound } from '@/lib/sounds';
import Stamp from '@/components/Stamp';
import styles from './PactCard.module.css';

/**
 * Personal commitment card — editorial redesign.
 *
 * Single-urgency-signal rule (per .impeccable.md principle #2):
 *  - Pending, deadline > 4h away  → clean card (index + title + footer).
 *  - Pending, deadline ≤ 4h away  → rotated `CLOSES SOON` highlighter sticker,
 *    top-right, ~3° tilt. No border tints, no glow, no pulse on the card.
 *  - In-progress (focus active)   → `<Stamp kind="locked-in" />` + pulse dot on
 *    the primary avatar (not the whole card).
 *  - Kept (completed on time)     → `<Stamp kind="kept" slam />`, card
 *    opacity 0.85.
 *  - Missed                       → `<Stamp kind="missed" slam />`, card
 *    opacity 0.80.
 *
 * The stamp IS the urgency/resolution signal — no stacking glow bars, pulse
 * dots, and border-color shifts on the same surface.
 *
 * @param {Object} props
 * @param {Object} props.pact     — Supabase `pacts` row
 * @param {Function} [props.onUpdate] — optimistic-UI parent callback
 * @param {Function} [props.onDelete] — delete handler (shown on resolved pacts)
 */
export default function PactCard({ pact, onUpdate, onDelete }) {
  const [isPending, setIsPending] = useState(false);
  const isCompletingRef = useRef(false);
  const justCompletedRef = useRef(false);
  const [showBounce, setShowBounce] = useState(false);
  const [justResolved, setJustResolved] = useState(false);
  const cardRef = useRef(null);
  const supabase = useMemo(() => createClient(), []);
  const toast = useToast();
  const { fire: triggerConfetti, ConfettiComponent } = useConfetti();

  // Clear bounce animation after 1s
  useEffect(() => {
    if (!showBounce) return;
    const timer = setTimeout(() => {
      setShowBounce(false);
      justCompletedRef.current = false;
    }, 1000);
    return () => clearTimeout(timer);
  }, [showBounce]);

  // --- Commit functions: write to DB immediately ---

  const commitComplete = useCallback(async () => {
    try {
      const { error } = await supabase
        .from('pacts')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString()
        })
        .eq('id', pact?.id);

      if (error) throw error;

      // Best-effort side effects — failures do not revert completion
      try {
        await logActivity(supabase, 'pact_completed', null, { pact_description: pact?.title });
      } catch (err) {
        console.error('Activity logging failed:', err);
      }

      const xpPromise = import('@/lib/gamification').then(({ awardXP, XP_REWARDS }) =>
        awardXP(supabase, pact?.user_id, 'pact_completed', XP_REWARDS.PACT_COMPLETED, { pactId: pact?.id })
      ).catch(err => console.error('XP award error:', err));

      const streakPromise = import('@/lib/streaks').then(({ calculateStreak }) =>
        calculateStreak(supabase, pact?.user_id)
      ).then(({ currentStreak, longestStreak, totalCompleted }) => {
        const streakUpdate = import('@/lib/streaks-advanced').then(({ updateStreakOnCompletion }) =>
          updateStreakOnCompletion(supabase, pact?.user_id, currentStreak, longestStreak)
        ).catch(err => console.error('Streak advanced update error:', err));

        const achievementCheck = import('@/lib/gamification').then(({ checkPactAchievements }) =>
          checkPactAchievements(supabase, pact?.user_id, totalCompleted, currentStreak)
        ).catch(err => console.error('Achievement check error:', err));

        return Promise.all([streakUpdate, achievementCheck]);
      }).catch(err => console.error('Streak calculation error:', err));

      const partnerPromise = import('@/lib/partnerships').then(({ notifyPartner }) =>
        notifyPartner(supabase, pact?.user_id, 'completed', pact?.title)
      ).catch(err => console.error('Partner notify error:', err));

      await Promise.race([
        Promise.all([xpPromise, streakPromise, partnerPromise]),
        new Promise(resolve => setTimeout(resolve, 10000)),
      ]);

      // Signal Sidebar + MobileNav to refresh XP display
      window.dispatchEvent(new CustomEvent('xp-updated'));
    } catch (err) {
      console.error('Error committing pact completion:', err);
      // Revert optimistic UI on DB error
      if (onUpdate && pact) {
        onUpdate({ ...pact, status: 'active', completed_at: null });
      }
      toast.error('Failed to complete pact. Please try again.');
    }
  }, [supabase, pact, onUpdate, toast]);

  const commitMiss = useCallback(async () => {
    try {
      const { error } = await supabase
        .from('pacts')
        .update({ status: 'missed' })
        .eq('id', pact?.id);

      if (error) throw error;

      // Best-effort side effects
      try {
        await logActivity(supabase, 'pact_missed', null, { pact_description: pact?.title });
      } catch (err) {
        console.error('Activity logging failed:', err);
      }

      import('@/lib/partnerships').then(({ notifyPartner }) =>
        notifyPartner(supabase, pact?.user_id, 'missed', pact?.title)
      ).catch(err => console.error('Partner notify error:', err));
    } catch (err) {
      console.error('Error committing pact miss:', err);
      // Revert optimistic UI on DB error
      if (onUpdate && pact) {
        onUpdate({ ...pact, status: 'active' });
      }
      toast.error('Failed to update pact. Please try again.');
    }
  }, [supabase, pact, onUpdate, toast]);

  // --- Revert functions: undo a committed action ---

  const revertComplete = useCallback(async () => {
    setIsPending(true);
    try {
      // 1. Revert pact status back to active
      const { error } = await supabase
        .from('pacts')
        .update({ status: 'active', completed_at: null })
        .eq('id', pact?.id);

      if (error) throw error;

      // 2. Claw back XP by awarding negative amount (award_xp is SECURITY DEFINER,
      //    handles negative values — subtracts from total_xp and recalculates level)
      try {
        const { awardXP, XP_REWARDS } = await import('@/lib/gamification');
        await awardXP(supabase, pact?.user_id, 'pact_completed_reverted', -XP_REWARDS.PACT_COMPLETED, { pactId: pact?.id });
      } catch (err) {
        console.error('XP clawback failed:', err);
      }

      // 3. Recalculate streak after reverting
      try {
        const { calculateStreak } = await import('@/lib/streaks');
        await calculateStreak(supabase, pact?.user_id);
      } catch (err) {
        console.error('Streak recalculation failed:', err);
      }

      // 4. Revert optimistic UI + signal XP refresh
      if (onUpdate) {
        onUpdate({ ...pact, status: 'active', completed_at: null });
      }
      setJustResolved(false);
      window.dispatchEvent(new CustomEvent('xp-updated'));
    } catch (err) {
      console.error('Error reverting pact completion:', err);
      toast.error('Failed to undo. Please try again.');
    } finally {
      setIsPending(false);
      isCompletingRef.current = false;
    }
  }, [supabase, pact, onUpdate, toast]);

  const revertMiss = useCallback(async () => {
    setIsPending(true);
    try {
      const { error } = await supabase
        .from('pacts')
        .update({ status: 'active' })
        .eq('id', pact?.id);

      if (error) throw error;

      // Revert optimistic UI
      if (onUpdate) {
        onUpdate({ ...pact, status: 'active' });
      }
      setJustResolved(false);
    } catch (err) {
      console.error('Error reverting pact miss:', err);
      toast.error('Failed to undo. Please try again.');
    } finally {
      setIsPending(false);
      isCompletingRef.current = false;
    }
  }, [supabase, pact, onUpdate, toast]);

  if (!pact) {
    return null;
  }

  const now = new Date();
  const deadlineDate = new Date(pact.deadline);
  const msUntilDeadline = deadlineDate - now;
  const hoursUntilDeadline = msUntilDeadline / (1000 * 60 * 60);
  const isActive = pact.status === 'active';
  const isOverdue = msUntilDeadline < 0 && isActive;
  const isCompleted = pact.status === 'completed';
  const isMissed = pact.status === 'missed';
  // "In progress" — an active focus session is running against this pact.
  // Uses `in_progress` flag (optional — falsy when not set, non-breaking).
  const isInProgress = isActive && pact.in_progress === true;
  // Closes soon: pending + ≤4h until deadline (already-overdue counts).
  const closesSoon = isActive && hoursUntilDeadline <= 4;

  // Pact index — monospace Pact #0047 label. Uses pact.index if present,
  // else last 4 chars of id, else an em-dash placeholder.
  const pactIndex = pact.index
    ? String(pact.index).padStart(4, '0')
    : pact.id
    ? String(pact.id).slice(-4).toUpperCase()
    : '————';

  // Format deadline as `Mon · 10:00 PM` (JetBrains mono header)
  const deadlineHeaderLabel = (() => {
    if (!pact.deadline) return '—';
    const weekday = deadlineDate.toLocaleDateString('en-US', { weekday: 'short' });
    const time = deadlineDate.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
    });
    return `${weekday} · ${time}`;
  })();

  // Footer time label — short, factual, colored per state.
  const footerTimeLabel = (() => {
    const timeStr = deadlineDate.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
    }).toLowerCase();

    if (isCompleted) {
      const when = pact.completed_at
        ? new Date(pact.completed_at).toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
          }).toLowerCase()
        : timeStr;
      return `kept · ${when}`;
    }
    if (isMissed) return `missed · ${timeStr}`;
    if (isInProgress) return `locked in · due ${timeStr}`;
    if (isOverdue) {
      const hoursOver = Math.max(1, Math.floor(-hoursUntilDeadline));
      return `overdue · ${hoursOver}h`;
    }
    if (hoursUntilDeadline < 1) return `due in <1h · ${timeStr}`;
    if (hoursUntilDeadline < 24) {
      const h = Math.floor(hoursUntilDeadline);
      return `due in ${h}h · ${timeStr}`;
    }
    const days = Math.floor(hoursUntilDeadline / 24);
    if (days === 1) return `due tomorrow · ${timeStr}`;
    if (days < 7) return `due in ${days}d · ${timeStr}`;
    return `due ${deadlineDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
  })();

  const handleComplete = async () => {
    if (isCompletingRef.current) return;
    isCompletingRef.current = true;
    setIsPending(true);

    // 1. Optimistic UI — confetti, sound, update parent (fires immediately)
    triggerConfetti();
    justCompletedRef.current = true;
    setShowBounce(true);
    setJustResolved(true);
    playCompletionSound();

    if (onUpdate) {
      onUpdate({ ...pact, status: 'completed', completed_at: new Date().toISOString() });
    }

    // 2. Commit to DB — toast only appears after success
    try {
      await commitComplete();

      // 3. Toast with Undo — only shown after commit succeeds,
      //    so the user cannot race the initial write
      const recurrenceMsg = pact.is_recurring && pact.recurrence_type
        ? ` It'll reset for the next ${pact.recurrence_type === 'daily' ? 'day' : pact.recurrence_type === 'weekly' ? 'week' : pact.recurrence_type === 'monthly' ? 'month' : 'weekday'}.`
        : '';

      toast.success(`Pact completed!${recurrenceMsg}`, {
        label: 'Undo',
        onClick: () => {
          setShowBounce(false);
          justCompletedRef.current = false;
          revertComplete();
        },
      });
    } finally {
      setIsPending(false);
      isCompletingRef.current = false;
    }
  };

  const handleMiss = async () => {
    if (isCompletingRef.current) return;
    isCompletingRef.current = true;
    setIsPending(true);

    // 1. Optimistic UI — sound, update parent (fires immediately)
    playMissSound();
    setJustResolved(true);

    if (onUpdate) {
      onUpdate({ ...pact, status: 'missed' });
    }

    // 2. Commit to DB — toast only appears after success
    try {
      await commitMiss();

      // 3. Toast with Undo — only shown after commit succeeds,
      //    so the user cannot race the initial write
      const recurrenceMsg = pact.is_recurring && pact.recurrence_type
        ? ` It'll reset for the next ${pact.recurrence_type === 'daily' ? 'day' : pact.recurrence_type === 'weekly' ? 'week' : pact.recurrence_type === 'monthly' ? 'month' : 'weekday'}.`
        : '';

      toast.warning(`Marked as missed.${recurrenceMsg}`, {
        label: 'Undo',
        onClick: () => {
          revertMiss();
        },
      });
    } finally {
      setIsPending(false);
      isCompletingRef.current = false;
    }
  };

  // State-based class (drives opacity muting + footer text color)
  const stateClass = isCompleted
    ? styles.cardKept
    : isMissed
    ? styles.cardMissed
    : isInProgress
    ? styles.cardInProgress
    : styles.cardPending;

  return (
    <motion.div
      ref={cardRef}
      className={`${styles.card} ${stateClass}`}
      whileHover={isActive ? { y: -1 } : undefined}
      transition={{ duration: 0.12, ease: 'easeOut' }}
    >
      {ConfettiComponent}

      {/* CLOSES SOON sticker — only when active + ≤4h away */}
      {closesSoon && (
        <span className={styles.closesSoonSticker} aria-label="Closes soon">
          CLOSES SOON
        </span>
      )}

      <div className={styles.content}>
        {/* Editorial index row — `Pact #0047 · Mon · 10:00 PM` */}
        <div className={styles.indexRow}>
          <span className={styles.indexText}>
            Pact #{pactIndex} · {deadlineHeaderLabel}
          </span>
          {/* Resolution / progress stamp sits next to the index */}
          {isCompleted && (
            <Stamp kind="kept" size="md" slam={justResolved} />
          )}
          {isMissed && (
            <Stamp kind="missed" size="md" slam={justResolved} />
          )}
          {isInProgress && !isCompleted && !isMissed && (
            <Stamp kind="locked-in" size="md" />
          )}
        </div>

        <h3 className={styles.title}>{pact.title}</h3>

        {pact.description && (
          <p className={styles.description}>{pact.description}</p>
        )}

        <div className={styles.footer}>
          <div className={styles.footerMeta}>
            {isInProgress && !isCompleted && !isMissed && (
              <span className={styles.pulseDot} aria-hidden="true" />
            )}
            <span className={styles.timeLabel}>{footerTimeLabel}</span>
            {isCompleted && (
              <span className={styles.xpChip}>+{pact.xp_reward || 10} XP</span>
            )}
          </div>

          {isActive ? (
            <div className={styles.actions}>
              <motion.button
                onClick={handleMiss}
                disabled={isPending}
                className={styles.missBtn}
                aria-label="Mark pact as missed"
                whileHover={buttonHover}
                whileTap={buttonTap}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </motion.button>
              <motion.button
                onClick={handleComplete}
                disabled={isPending}
                className={`${styles.completeBtn} ${showBounce ? styles.completedCheck : ''}`}
                aria-label="Mark pact as complete"
                whileHover={buttonHover}
                whileTap={buttonTap}
                {...(showBounce ? celebrationBounce : {})}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M20 6L9 17L4 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </motion.button>
            </div>
          ) : onDelete && (
            <div className={styles.actions}>
              <motion.button
                onClick={() => onDelete(pact.id)}
                disabled={isPending}
                className={styles.missBtn}
                aria-label="Delete pact"
                whileHover={buttonHover}
                whileTap={buttonTap}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M3 6H5H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M8 6V4C8 3.46957 8.21071 2.96086 8.58579 2.58579C8.96086 2.21071 9.46957 2 10 2H14C14.5304 2 15.0391 2.21071 15.4142 2.58579C15.7893 2.96086 16 3.46957 16 4V6M19 6V20C19 20.5304 18.7893 21.0391 18.4142 21.4142C18.0391 21.7893 17.5304 22 17 22H7C6.46957 22 5.96086 21.7893 5.58579 21.4142C5.21071 21.0391 5 20.5304 5 20V6H19Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </motion.button>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
