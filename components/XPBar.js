'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { createClient } from '@/lib/supabase/client';
import { getLevelFromXP, getProgressToNextLevel } from '@/lib/gamification';
import styles from './XPBar.module.css';

export default function XPBar({ userId, refreshKey }) {
  const [xp, setXP] = useState(0);
  const [level, setLevel] = useState(1);
  const supabase = useMemo(() => createClient(), []);

  useEffect(() => {
    async function fetchXP() {
      const { data } = await supabase
        .from('profiles')
        .select('total_xp, level')
        .eq('id', userId)
        .single();

      if (data) {
        setXP(data.total_xp || 0);
        setLevel(data.level || getLevelFromXP(data.total_xp || 0));
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
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        />
      </div>
    </div>
  );
}
