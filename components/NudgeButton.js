'use client';

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { createClient } from '@/lib/supabase/client';
import { sendNudge } from '@/lib/nudges';
import { useToast } from '@/components/Toast';
import { buttonTap } from '@/lib/animations';
import styles from './NudgeButton.module.css';

export default function NudgeButton({ userId, userName }) {
  const [isLoading, setIsLoading] = useState(false);
  const [nudged, setNudged] = useState(false);
  const supabase = useMemo(() => createClient(), []);
  const toast = useToast();

  const handleNudge = async () => {
    if (isLoading || nudged) return;
    setIsLoading(true);

    const result = await sendNudge(supabase, userId);
    if (result.success) {
      setNudged(true);
      toast.success(`Nudged ${userName}!`);
      // Reset after 1 hour
      setTimeout(() => setNudged(false), 60 * 60 * 1000);
    } else {
      toast.error(result.error || 'Failed to nudge');
    }

    setIsLoading(false);
  };

  return (
    <motion.button
      className={`${styles.nudgeBtn} ${nudged ? styles.nudged : ''}`}
      onClick={handleNudge}
      disabled={isLoading || nudged}
      whileTap={buttonTap}
      title={nudged ? 'Already nudged' : `Nudge ${userName}`}
    >
      {nudged ? (
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M20 6L9 17L4 12" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      ) : (
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M13.73 21a2 2 0 01-3.46 0" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      )}
      {nudged ? 'Nudged' : 'Nudge'}
    </motion.button>
  );
}
