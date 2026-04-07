'use client';

import { useState, useRef, useMemo, useEffect } from 'react';
import { motion } from 'framer-motion';
import { createClient } from '@/lib/supabase/client';
import { logActivity } from '@/lib/activity';
import { useConfetti } from '@/lib/confetti';
import { cardHover, buttonHover, buttonTap, celebrationBounce, celebrationGlow } from '@/lib/animations';
import { useToast } from '@/components/Toast';
import { playCompletionSound, playMissSound } from '@/lib/sounds';
import styles from './PactCard.module.css';

export default function PactCard({ pact, onUpdate, onDelete }) {
  const [isLoading, setIsLoading] = useState(false);
  const isCompletingRef = useRef(false);
  const justCompletedRef = useRef(false);
  const [showBounce, setShowBounce] = useState(false);
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

  if (!pact) {
    return null;
  }

  const now = new Date();
  const deadlineDate = new Date(pact.deadline);
  const isOverdue = deadlineDate < now && pact.status === 'active';
  const isDueToday = !isOverdue && pact.status === 'active' &&
    deadlineDate.toDateString() === now.toDateString();
  const isCompleted = pact.status === 'completed';

  // Determine urgency tier for card-level CSS class
  const urgencyTierClass = isOverdue ? styles.pactCardOverdue
    : isDueToday ? styles.pactCardDueToday
    : isCompleted ? styles.pactCardCompleted
    : styles.pactCardDefault;

  // Hours overdue for badge text
  const hoursOverdue = isOverdue
    ? Math.floor((now - deadlineDate) / (1000 * 60 * 60))
    : 0;

  // Hours remaining for "Due in X hours" text
  const hoursUntilDue = isDueToday
    ? Math.max(0, Math.floor((deadlineDate - now) / (1000 * 60 * 60)))
    : 0;

  // Deadline urgency coloring (for deadline text)
  const hoursRemaining = pact.deadline ? (deadlineDate - now) / (1000 * 60 * 60) : null;
  const deadlineUrgencyClass = hoursRemaining !== null
    ? hoursRemaining < 6 ? styles.urgencyCritical
    : hoursRemaining < 12 ? styles.urgencyHigh
    : hoursRemaining < 24 ? styles.urgencyMedium
    : styles.urgencyLow
    : '';

  // Format deadline
  const formatDeadline = () => {
    const now = new Date();
    const diff = deadlineDate - now;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (pact.status === 'completed') {
      return 'Completed';
    }
    
    if (pact.status === 'missed') {
      return 'Missed';
    }
    
    if (diff < 0) {
      return 'Overdue';
    }
    
    if (days === 0) {
      if (hours === 0) {
        return 'Due in less than an hour';
      }
      return `Due in ${hours} hour${hours === 1 ? '' : 's'}`;
    }
    
    if (days === 1) {
      return 'Due tomorrow';
    }
    
    if (days < 7) {
      return `Due in ${days} days`;
    }
    
    return `Due ${deadlineDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
  };

  const handleComplete = async () => {
    if (isCompletingRef.current) return;
    isCompletingRef.current = true;
    setIsLoading(true);

    // Safety timeout — if the entire operation hangs for 15s, unlock the UI
    const safetyTimer = setTimeout(() => {
      isCompletingRef.current = false;
      setIsLoading(false);
    }, 15000);

    try {
      // Step 1: Mark pact as completed in DB — this is the critical operation
      const { error } = await supabase
        .from('pacts')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString()
        })
        .eq('id', pact.id);

      if (error) throw error;

      // Pact is now saved. Everything below is best-effort — failures must not
      // revert the completion or show an error toast to the user.

      triggerConfetti();
      justCompletedRef.current = true;
      setShowBounce(true);

      // Activity logging — independent, non-blocking
      try {
        await logActivity(supabase, 'pact_completed', null, { pact_description: pact.title });
      } catch (err) {
        console.error('Activity logging failed:', err);
      }

      // XP award — independent
      const xpPromise = import('@/lib/gamification').then(({ awardXP, XP_REWARDS }) =>
        awardXP(supabase, pact.user_id, 'pact_completed', XP_REWARDS.PACT_COMPLETED, { pactId: pact.id })
      ).catch(err => console.error('XP award error:', err));

      // Streak calculation, then streak-advanced + achievements — isolated from each other
      const streakPromise = import('@/lib/streaks').then(({ calculateStreak }) =>
        calculateStreak(supabase, pact.user_id)
      ).then(({ currentStreak, longestStreak, totalCompleted }) => {
        // Run streak update and achievement check independently so one failure
        // does not prevent the other from completing
        const streakUpdate = import('@/lib/streaks-advanced').then(({ updateStreakOnCompletion }) =>
          updateStreakOnCompletion(supabase, pact.user_id, currentStreak, longestStreak)
        ).catch(err => console.error('Streak advanced update error:', err));

        const achievementCheck = import('@/lib/gamification').then(({ checkPactAchievements }) =>
          checkPactAchievements(supabase, pact.user_id, totalCompleted, currentStreak)
        ).catch(err => console.error('Achievement check error:', err));

        return Promise.all([streakUpdate, achievementCheck]);
      }).catch(err => console.error('Streak calculation error:', err));

      // Partner notification — independent
      const partnerPromise = import('@/lib/partnerships').then(({ notifyPartner }) =>
        notifyPartner(supabase, pact.user_id, 'completed', pact.title)
      ).catch(err => console.error('Partner notify error:', err));

      // Wait for best-effort work, but cap at 10s so we don't hang the UI
      await Promise.race([
        Promise.all([xpPromise, streakPromise, partnerPromise]),
        new Promise(resolve => setTimeout(resolve, 10000)),
      ]);

      playCompletionSound();

      if (pact.is_recurring && pact.recurrence_type) {
        toast.success(`Pact completed! It'll reset for the next ${pact.recurrence_type === 'daily' ? 'day' : pact.recurrence_type === 'weekly' ? 'week' : pact.recurrence_type === 'monthly' ? 'month' : 'weekday'}.`);
      }

      if (onUpdate) {
        onUpdate({ ...pact, status: 'completed', completed_at: new Date().toISOString() });
      }
    } catch (err) {
      console.error('Error completing pact:', err);
      toast.error('Failed to complete pact. Please try again.');
    } finally {
      clearTimeout(safetyTimer);
      isCompletingRef.current = false;
      setIsLoading(false);
    }
  };

  const handleMiss = async () => {
    if (isCompletingRef.current) return;
    isCompletingRef.current = true;
    setIsLoading(true);

    // Safety timeout — if the operation hangs for 15s, unlock the UI
    const safetyTimer = setTimeout(() => {
      isCompletingRef.current = false;
      setIsLoading(false);
    }, 15000);

    try {
      const { error } = await supabase
        .from('pacts')
        .update({ status: 'missed' })
        .eq('id', pact.id);

      if (error) throw error;

      // Activity logging — best-effort, don't block on failure
      try {
        await logActivity(supabase, 'pact_missed', null, { pact_description: pact.title });
      } catch (err) {
        console.error('Activity logging failed:', err);
      }

      // Notify accountability partner (fire-and-forget)
      import('@/lib/partnerships').then(({ notifyPartner }) =>
        notifyPartner(supabase, pact.user_id, 'missed', pact.title)
      ).catch(err => console.error('Partner notify error:', err));

      playMissSound();

      if (onUpdate) {
        onUpdate({ ...pact, status: 'missed' });
      }

      if (pact.is_recurring && pact.recurrence_type) {
        toast.success(`Marked as missed. It'll reset for the next ${pact.recurrence_type === 'daily' ? 'day' : pact.recurrence_type === 'weekly' ? 'week' : pact.recurrence_type === 'monthly' ? 'month' : 'weekday'}.`);
      }
    } catch (err) {
      console.error('Error marking pact as missed:', err);
      toast.error('Failed to update pact. Please try again.');
    } finally {
      clearTimeout(safetyTimer);
      isCompletingRef.current = false;
      setIsLoading(false);
    }
  };

  const getStatusClass = () => {
    if (pact.status === 'completed') return styles.completed;
    if (pact.status === 'missed') return styles.missed;
    if (isOverdue) return `${styles.missed} ${styles.overdue}`;
    return styles.active;
  };

  return (
    <motion.div
      ref={cardRef}
      className={`${styles.card} ${getStatusClass()} ${urgencyTierClass}`}
      whileHover={pact.status === 'active' ? cardHover : undefined}
      animate={showBounce ? celebrationGlow.animate : undefined}
      style={{ position: 'relative' }}
    >
      {ConfettiComponent}

      {/* Overdue pulsing indicator dot */}
      {isOverdue && <span className={styles.pulseDot} aria-hidden="true" />}

      {/* Due today amber indicator dot */}
      {isDueToday && <span className={styles.amberDot} aria-hidden="true" />}

      <div className={styles.content}>
        <div className={styles.header}>
          <h3 className={styles.title}>{pact.title}</h3>
          <div className={styles.badgeGroup}>
            {/* Overdue hours badge */}
            {isOverdue && (
              <span className={styles.overdueBadge}>
                {hoursOverdue === 0 ? 'Just overdue' : `${hoursOverdue}h overdue`}
              </span>
            )}

            {/* Completed XP reward badge */}
            {isCompleted && (
              <span className={styles.xpBadge}>
                +{pact.xp_reward || 10} XP
              </span>
            )}

            <span className={`${styles.badge} ${getStatusClass()}`}>
              {pact.status === 'completed' ? 'Done' : pact.status === 'missed' ? 'Missed' : isOverdue ? 'Overdue' : 'Active'}
            </span>
          </div>
        </div>

        {pact.description && (
          <p className={styles.description}>{pact.description}</p>
        )}

        <div className={styles.footer}>
          <div className={`${styles.deadline} ${pact.status === 'active' ? deadlineUrgencyClass : ''}`}>
            {/* Overdue: no clock icon, use warning icon */}
            {isOverdue ? (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 9V13M12 17H12.01M5.07 19H18.93C20.52 19 21.5 17.28 20.7 15.89L13.77 3.97C12.97 2.58 11.03 2.58 10.23 3.97L3.3 15.89C2.5 17.28 3.48 19 5.07 19Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            ) : isCompleted ? (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M9 12L11 14L15 10M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                <path d="M12 6V12L16 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            )}
            {isDueToday && hoursUntilDue > 0 ? `Due in ${hoursUntilDue} hour${hoursUntilDue === 1 ? '' : 's'}` : formatDeadline()}
          </div>
          
          {pact.status === 'active' ? (
            <div className={styles.actions}>
              <motion.button
                onClick={handleMiss}
                disabled={isLoading}
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
                disabled={isLoading}
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
                disabled={isLoading}
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
