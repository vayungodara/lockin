'use client';

import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createClient } from '@/lib/supabase/client';
import { getOnboardingState, detectProgress, syncProgress } from '@/lib/onboarding';
import { XP_REWARDS, unlockAchievement } from '@/lib/gamification';
import { celebrationBounce, fadeInScale, staggerContainer, staggerItem, prefersReducedMotion } from '@/lib/animations';
import { fireConfetti, fireMilestoneConfetti } from '@/lib/confetti';
import { useToast } from '@/components/Toast';
import styles from './OnboardingChecklist.module.css';

const STEPS = [
  {
    field: 'has_created_pact',
    title: 'Make a Pact',
    description: 'Create your first commitment',
    icon: '🎯',
    actionLabel: 'Create a Pact',
    xp: XP_REWARDS.ONBOARDING_PACT,
    action: 'create-pact',
  },
  {
    field: 'has_used_focus_timer',
    title: 'Lock In',
    description: 'Complete a focus session',
    icon: '⏱️',
    actionLabel: 'Start Focusing',
    xp: XP_REWARDS.ONBOARDING_FOCUS,
    action: 'navigate',
    href: '/dashboard/focus',
  },
  {
    field: 'has_joined_group',
    title: 'Join the Squad',
    description: 'Join or create a group',
    icon: '👥',
    actionLabel: 'Browse Groups',
    xp: XP_REWARDS.ONBOARDING_GROUP,
    action: 'navigate',
    href: '/dashboard/groups',
  },
  {
    field: 'has_built_momentum',
    title: 'Build Momentum',
    description: 'Hit a 2-day streak',
    icon: '🔥',
    xp: XP_REWARDS.ONBOARDING_MOMENTUM,
    action: 'auto',
  },
];

const CIRCUMFERENCE = 2 * Math.PI * 16;

export default function OnboardingChecklist({ userId, onCreatePact }) {
  // Dev preview: add ?onboarding=preview to URL to see empty card
  const isPreview = typeof window !== 'undefined' &&
    new URLSearchParams(window.location.search).get('onboarding') === 'preview';

  const [dbState, setDbState] = useState(isPreview ? {
    has_created_pact: false, has_used_focus_timer: false,
    has_joined_group: false, has_built_momentum: false,
  } : null);
  const [loading, setLoading] = useState(!isPreview);
  const [allComplete, setAllComplete] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [newlyDone, setNewlyDone] = useState(new Set());
  const fadeTimerRef = useRef(null);
  const syncInFlight = useRef(false);
  const supabase = useMemo(() => createClient(), []);
  const toast = useToast();

  const completedCount = dbState
    ? STEPS.filter(s => dbState[s.field]).length
    : 0;

  const checkAndSync = useCallback(async () => {
    if (!userId || isPreview || syncInFlight.current) return;
    syncInFlight.current = true;

    try {
      const state = await getOnboardingState(supabase, userId);
      if (!state) { setLoading(false); return; }

      if (state.onboarding_completed_at) {
        setAllComplete(true);
        setLoading(false);
        return;
      }

      if (state.onboarding_dismissed) {
        setDismissed(true);
        setLoading(false);
        return;
      }

      const detected = await detectProgress(supabase, userId);
      if (!detected) {
        setDbState(state);
        setLoading(false);
        return;
      }

      const result = await syncProgress(supabase, userId, state, detected);
      if (!result) {
        setDbState(state);
        setLoading(false);
        return;
      }

      setDbState(result.updatedState);
      setLoading(false);

      // Celebrate newly completed steps
      if (result.newlyCompleted.length > 0) {
        const fields = new Set(result.newlyCompleted.map(s => s.field));
        setNewlyDone(fields);
        // Clear the bounce animation after it plays
        setTimeout(() => setNewlyDone(new Set()), 800);

        for (const step of result.newlyCompleted) {
          if (!prefersReducedMotion()) fireConfetti();
          const stepDef = STEPS.find(s => s.field === step.field);
          if (stepDef) {
            toast.success(`+${stepDef.xp} XP — ${stepDef.title} complete!`);
          }
        }
      }

      // All 4 done? Only celebrate if not already marked complete
      if (result.updatedState.onboarding_completed_at && !allComplete) {
        setAllComplete(true);
        if (!prefersReducedMotion()) fireMilestoneConfetti();
        await unlockAchievement(supabase, userId, 'onboarding_complete');
        toast.success('Achievement Unlocked: Challenge Accepted! 🏆');
        setShowSuccess(true);
        fadeTimerRef.current = setTimeout(() => setShowSuccess(false), 5000);
      }
    } finally {
      syncInFlight.current = false;
    }
  }, [userId, supabase, toast, isPreview, allComplete]);

  // Check on mount, custom events, and visibility change
  useEffect(() => {
    const handleEvent = () => checkAndSync();
    let debounceTimer = null;
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(checkAndSync, 2000);
      }
    };

    window.addEventListener('pact-created', handleEvent);
    window.addEventListener('focus-session-completed', handleEvent);
    document.addEventListener('visibilitychange', handleVisibility);

    // Initial check on mount
    const mountTimer = setTimeout(checkAndSync, 0);

    return () => {
      window.removeEventListener('pact-created', handleEvent);
      window.removeEventListener('focus-session-completed', handleEvent);
      document.removeEventListener('visibilitychange', handleVisibility);
      clearTimeout(mountTimer);
      clearTimeout(debounceTimer);
      if (fadeTimerRef.current) clearTimeout(fadeTimerRef.current);
    };
  }, [checkAndSync]);

  const handleAction = (step) => {
    if (step.action === 'create-pact' && onCreatePact) {
      onCreatePact();
    } else if (step.action === 'navigate' && step.href) {
      window.location.assign(step.href);
    }
  };

  const handleDismiss = async () => {
    if (!userId) return;
    setDismissed(true);
    await supabase
      .from('user_onboarding')
      .update({ onboarding_dismissed: true })
      .eq('user_id', userId);
  };

  // Don't render if: loading failed (fail-open), already complete, or dismissed
  if (loading) return <div className={styles.loading}>Loading challenge...</div>;
  if (dismissed) return null;
  if (!dbState) return null;

  // Soft persistence: can't dismiss until at least 1 step done
  const canDismiss = completedCount > 0;

  if (allComplete) {
    if (!showSuccess) return null;
    return (
      <AnimatePresence>
        {showSuccess && (
          <motion.div
            className={`${styles.card} ${styles.successCard}`}
            {...fadeInScale}
            exit={{ opacity: 0, scale: 0.97, transition: { duration: 0.3 } }}
          >
            <div className={styles.successTitle}>You&apos;re all set! LockIn is yours. 🎉</div>
            <div className={styles.successDesc}>+125 XP earned from the First Week Challenge</div>
          </motion.div>
        )}
      </AnimatePresence>
    );
  }

  const dashOffset = CIRCUMFERENCE - (completedCount / STEPS.length) * CIRCUMFERENCE;

  return (
    <div className={`${styles.card} ${completedCount === 0 ? styles.cardNew : ''}`}>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <svg className={styles.progressRing} viewBox="0 0 40 40">
            <circle className={styles.progressBg} cx="20" cy="20" r="16" />
            <circle
              className={styles.progressFill}
              cx="20" cy="20" r="16"
              strokeDasharray={CIRCUMFERENCE}
              strokeDashoffset={dashOffset}
            />
            <text
              className={styles.progressText}
              x="20" y="20"
              transform="rotate(90 20 20)"
            >
              {completedCount}/{STEPS.length}
            </text>
          </svg>
          <span className={styles.title}>Your First Week Challenge</span>
        </div>
      </div>

      <motion.div className={styles.steps} variants={staggerContainer} initial="initial" animate="animate">
        {STEPS.map((step, i) => {
          const done = dbState[step.field];
          const justCompleted = newlyDone.has(step.field);
          return (
            <motion.div
              key={step.field}
              className={styles.step}
              variants={justCompleted ? undefined : staggerItem}
              {...(justCompleted ? celebrationBounce : {})}
            >
              <div className={`${styles.stepIcon} ${done ? styles.stepIconDone : ''}`}>
                {done ? '✓' : step.icon}
              </div>
              <div className={styles.stepContent}>
                <div className={`${styles.stepTitle} ${done ? styles.stepTitleDone : ''}`}>
                  {step.title}
                </div>
                {!done && <div className={styles.stepDesc}>{step.description}</div>}
              </div>
              <div className={styles.stepAction}>
                {done ? (
                  <span className={styles.xpBadge}>+{step.xp} XP</span>
                ) : step.action !== 'auto' ? (
                  <button className={styles.actionBtn} onClick={() => handleAction(step)}>
                    {step.actionLabel}
                  </button>
                ) : null}
              </div>
            </motion.div>
          );
        })}
      </motion.div>

      {canDismiss && (
        <button className={styles.dismissBtn} onClick={handleDismiss}>
          Dismiss challenge
        </button>
      )}
    </div>
  );
}
