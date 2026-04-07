'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { motion } from 'framer-motion';
import { createClient } from '@/lib/supabase/client';
import { getLevelFromXP, getProgressToNextLevel } from '@/lib/gamification';
import { xpFillFlash } from '@/lib/animations';
import styles from './XPBar.module.css';

export default function XPBar({ userId, refreshKey }) {
  const [xp, setXP] = useState(0);
  const [level, setLevel] = useState(1);
  const [xpChanged, setXpChanged] = useState(false);
  const [xpDelta, setXpDelta] = useState(0);
  const prevXpRef = useRef(null);
  const flashTimerRef = useRef(null);
  const supabase = useMemo(() => createClient(), []);

  useEffect(() => {
    async function fetchXP() {
      const { data, error } = await supabase
        .from('profiles')
        .select('total_xp, level')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Failed to fetch XP:', error);
        return;
      }

      if (data) {
        const newXP = data.total_xp || 0;
        if (prevXpRef.current !== null && newXP > 0 && newXP !== prevXpRef.current) {
          if (flashTimerRef.current) clearTimeout(flashTimerRef.current);
          setXpDelta(newXP - prevXpRef.current);
          setXpChanged(true);
          flashTimerRef.current = setTimeout(() => setXpChanged(false), 2500);
        }
        prevXpRef.current = newXP;
        setXP(newXP);
        setLevel(data.level || getLevelFromXP(newXP));
      }
    }
    if (userId) fetchXP();
  }, [userId, supabase, refreshKey]);

  useEffect(() => {
    return () => {
      if (flashTimerRef.current) clearTimeout(flashTimerRef.current);
    };
  }, []);

  const progress = getProgressToNextLevel(xp);
  const xpInLevel = xp % 100;

  return (
    <div className={styles.container}>
      <div className={styles.levelBadge}>
        <span className={styles.starIcon} role="img" aria-label="star">⭐</span>
        <span>Lv. {level}</span>
      </div>

      <div className={styles.progressArea}>
        <div className={styles.progressHeader}>
          <span className={styles.progressLabel}>Scholar Rank Progress</span>
          <span className={styles.xpCounter}>{xpInLevel} / 100 XP</span>
        </div>
        <div className={styles.track}>
          <motion.div
            className={styles.fill}
            initial={{ width: 0 }}
            animate={{
              width: `${progress}%`,
              ...(xpChanged ? xpFillFlash.animate : {}),
            }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          />
        </div>
        {xpChanged && xpDelta > 0 && (
          <span className={styles.xpFloat}>+{xpDelta} XP</span>
        )}
      </div>
    </div>
  );
}
