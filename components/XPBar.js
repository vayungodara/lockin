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
  const prevXpRef = useRef(null);
  const supabase = useMemo(() => createClient(), []);

  useEffect(() => {
    async function fetchXP() {
      const { data } = await supabase
        .from('profiles')
        .select('total_xp, level')
        .eq('id', userId)
        .single();

      if (data) {
        const newXP = data.total_xp || 0;
        if (prevXpRef.current !== null && newXP > 0 && newXP !== prevXpRef.current) {
          setXpChanged(true);
          setTimeout(() => setXpChanged(false), 600);
        }
        prevXpRef.current = newXP;
        setXP(newXP);
        setLevel(data.level || getLevelFromXP(newXP));
      }
    }
    if (userId) fetchXP();
  }, [userId, supabase, refreshKey]);

  const progress = getProgressToNextLevel(xp);

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <span className={styles.levelBadge}>Lv. {level}</span>
        <span className={styles.xpText}>{xp % 100} / 100 XP</span>
      </div>
      <div className={styles.track}>
        <motion.div
          className={styles.fill}
          initial={{ width: 0 }}
          animate={{
            width: `${progress}%`,
            ...(xpChanged ? xpFillFlash.animate : {}),
          }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        />
      </div>
    </div>
  );
}
