'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createClient } from '@/lib/supabase/client';
import { modalOverlay, modalContent } from '@/lib/animations';
import styles from './OnboardingModal.module.css';

const STEPS = [
  {
    title: 'Make a Pact',
    description: 'Create your first commitment with a deadline. Pacts are promises you make to yourself — missing them breaks your streak.',
    icon: '🎯',
    action: 'Create a Pact',
    href: null, // handled by parent
    field: 'has_created_pact',
  },
  {
    title: 'Join a Group',
    description: 'Groups add social pressure. Your activity is visible to group members — so they\'ll know when you slack off.',
    icon: '👥',
    action: 'Browse Groups',
    href: '/dashboard/groups',
    field: 'has_joined_group',
  },
  {
    title: 'Try Focus Timer',
    description: 'Lock in with the Pomodoro timer. Your focus sessions show up on the group leaderboard.',
    icon: '⏱️',
    action: 'Start Focusing',
    href: '/dashboard/focus',
    field: 'has_used_focus_timer',
  },
];

export default function OnboardingModal({ userId, onCreatePact }) {
  const [isOpen, setIsOpen] = useState(false);
  const [onboarding, setOnboarding] = useState(null);
  const [currentStep, setCurrentStep] = useState(0);
  const supabase = useMemo(() => createClient(), []);

  useEffect(() => {
    async function checkOnboarding() {
      if (!userId) return;

      const { data, error } = await supabase
        .from('user_onboarding')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (error) {
        console.error('Onboarding check error:', error);
        return;
      }

      if (!data) {
        // First time — create record and show
        await supabase
          .from('user_onboarding')
          .insert({ user_id: userId });
        setOnboarding({ has_created_pact: false, has_joined_group: false, has_used_focus_timer: false, onboarding_dismissed: false });
        setIsOpen(true);
      } else if (!data.onboarding_dismissed) {
        const incomplete = !data.has_created_pact || !data.has_joined_group || !data.has_used_focus_timer;
        if (incomplete) {
          setOnboarding(data);
          // Start at first incomplete step
          const firstIncomplete = STEPS.findIndex(s => !data[s.field]);
          setCurrentStep(firstIncomplete >= 0 ? firstIncomplete : 0);
          setIsOpen(true);
        }
      }
    }

    checkOnboarding();
  }, [userId, supabase]);

  const handleDismiss = async () => {
    setIsOpen(false);
    await supabase
      .from('user_onboarding')
      .update({ onboarding_dismissed: true })
      .eq('user_id', userId);
  };

  const handleAction = (step) => {
    if (step.href) {
      window.location.href = step.href;
    } else if (step.field === 'has_created_pact' && onCreatePact) {
      setIsOpen(false);
      onCreatePact();
    }
  };

  if (!isOpen || !onboarding) return null;

  const step = STEPS[currentStep];
  const completedCount = STEPS.filter(s => onboarding[s.field]).length;

  return (
    <AnimatePresence>
      <motion.div className={styles.overlay} {...modalOverlay} onClick={handleDismiss}>
        <motion.div
          className={styles.modal}
          {...modalContent}
          onClick={(e) => e.stopPropagation()}
        >
          <div className={styles.progress}>
            {STEPS.map((s, i) => (
              <div
                key={i}
                className={`${styles.dot} ${onboarding[s.field] ? styles.dotDone : i === currentStep ? styles.dotActive : ''}`}
              />
            ))}
          </div>

          <div className={styles.stepIcon}>{step.icon}</div>
          <h2 className={styles.stepTitle}>{step.title}</h2>
          <p className={styles.stepDescription}>{step.description}</p>

          <div className={styles.actions}>
            <button className={styles.actionBtn} onClick={() => handleAction(step)}>
              {step.action}
            </button>
            <div className={styles.secondaryActions}>
              {currentStep > 0 && (
                <button className={styles.skipBtn} onClick={() => setCurrentStep(currentStep - 1)}>
                  Back
                </button>
              )}
              {currentStep < STEPS.length - 1 && (
                <button className={styles.skipBtn} onClick={() => setCurrentStep(currentStep + 1)}>
                  Skip
                </button>
              )}
              <button className={styles.skipBtn} onClick={handleDismiss}>
                Dismiss
              </button>
            </div>
          </div>

          <div className={styles.counter}>{completedCount}/{STEPS.length} completed</div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
