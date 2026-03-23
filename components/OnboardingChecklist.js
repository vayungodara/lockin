'use client';

import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createClient } from '@/lib/supabase/client';
import { getOnboardingState, detectProgress, syncProgress } from '@/lib/onboarding';
import { XP_REWARDS, unlockAchievement } from '@/lib/gamification';
import { celebrationBounce, fadeInScale, prefersReducedMotion } from '@/lib/animations';
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
    action: 'auto', // no button — auto-detected
  },
];

const CIRCUMFERENCE = 2 * Math.PI * 16; // radius=16 for 40px SVG

export default function OnboardingChecklist({ userId, onCreatePact }) {
  const [dbState, setDbState] = useState(null);
  const [loading, setLoading] = useState(true);
  const [allComplete, setAllComplete] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const fadeTimerRef = useRef(null);
  const supabase = useMemo(() => createClient(), []);
  const toast = useToast();

  const completedCount = dbState
    ? STEPS.filter(s => dbState[s.field]).length
    : 0;

  const checkAndSync = useCallback(async () => {
    if (!userId) return;

    const state = await getOnboardingState(supabase, userId);
    if (!state) { setLoading(false); return; }

    // Already completed — don't show
    if (state.onboarding_completed_at) {
      setAllComplete(true);
      setLoading(false);
      return;
    }

    // Previously dismissed — restore state from DB
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
    for (const step of result.newlyCompleted) {
      if (!prefersReducedMotion()) fireConfetti();
      const stepDef = STEPS.find(s => s.field === step.field);
      if (stepDef) {
        toast.success(`+${stepDef.xp} XP — ${stepDef.title} complete!`);
      }
    }

    // All 4 done?
    if (result.updatedState.onboarding_completed_at) {
      setAllComplete(true);
      if (!prefersReducedMotion()) fireMilestoneConfetti();
      await unlockAchievement(supabase, userId, 'onboarding_complete');
      toast.success('Achievement Unlocked: Challenge Accepted! 🏆');
      setShowSuccess(true);
      fadeTimerRef.current = setTimeout(() => setShowSuccess(false), 5000);
    }
  }, [userId, supabase, toast]);

  // Check on mount, custom events, and visibility change
  useEffect(() => {
    const handleEvent = () => checkAndSync();
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') checkAndSync();
    };

    window.addEventListener('pact-created', handleEvent);
    window.addEventListener('focus-session-completed', handleEvent);
    document.addEventListener('visibilitychange', handleVisibility);

    // Initial check on mount (deferred to avoid synchronous setState in effect)
    const timer = setTimeout(checkAndSync, 0);

    return () => {
      window.removeEventListener('pact-created', handleEvent);
      window.removeEventListener('focus-session-completed', handleEvent);
      document.removeEventListener('visibilitychange', handleVisibility);
      clearTimeout(timer);
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
    setDismissed(true);
    await supabase
      .from('user_onboarding')
      .update({ onboarding_dismissed: true })
      .eq('user_id', userId);
  };

  // Don't render if: loading failed (fail-open), already complete, or dismissed
  if (loading) return <div className={styles.loading}>Loading challenge...</div>;
  if (allComplete && !showSuccess) return null;
  if (dismissed) return null;
  if (!dbState) return null;

  // Soft persistence: can't dismiss until at least 1 step done
  const canDismiss = completedCount > 0;

  if (showSuccess) {
    return (
      <motion.div className={`${styles.card} ${styles.successCard}`} {...fadeInScale}>
        <div className={styles.successTitle}>You&apos;re all set! LockIn is yours. 🎉</div>
        <div className={styles.successDesc}>+125 XP earned from the First Week Challenge</div>
      </motion.div>
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

      <div className={styles.steps}>
        <AnimatePresence>
          {STEPS.map((step) => {
            const done = dbState[step.field];
            return (
              <motion.div
                key={step.field}
                className={styles.step}
                layout
                {...(done ? celebrationBounce : {})}
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
        </AnimatePresence>
      </div>

      {canDismiss && (
        <button className={styles.dismissBtn} onClick={handleDismiss}>
          Dismiss challenge
        </button>
      )}
    </div>
  );
}
