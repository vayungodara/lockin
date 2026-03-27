'use client';

import { motion } from 'framer-motion';
import { fadeInUp, streakCelebration } from '@/lib/animations';
import styles from './StreakHero.module.css';

const MILESTONE_DAYS = [7, 14, 30, 100];

const MICRO_COPY = [
  "Don't break the chain.",
  "Your streak is watching.",
  "Keep showing up.",
  "Consistency beats intensity.",
  "One day at a time.",
  "Momentum is everything.",
];

function getStreakTier(streak) {
  if (streak >= 100) return { icon: '\uD83D\uDC51', tier: 'legendary', label: 'Legendary' };
  if (streak >= 30)  return { icon: '\uD83D\uDC8E', tier: 'diamond', label: 'Diamond' };
  if (streak >= 14)  return { icon: '\u26A1', tier: 'electric', label: 'Electric' };
  if (streak >= 7)   return { icon: '\uD83D\uDD25', tier: 'fire', label: 'On fire' };
  if (streak >= 3)   return { icon: '\uD83D\uDD25', tier: 'warm', label: 'Warming up' };
  return { icon: '\uD83D\uDD25', tier: 'default', label: '' };
}

function getMicroCopy(streak) {
  if (streak === 0) return "Start your streak today.";
  if (streak >= 100) return "Legendary. Nothing stops you.";
  if (streak >= 30) return "A whole month. Diamond hands.";
  if (streak >= 14) return "Two weeks strong.";
  if (streak >= 7) return "One week locked in.";
  // Deterministic pick based on streak value
  return MICRO_COPY[streak % MICRO_COPY.length];
}

export default function StreakHero({ currentStreak, longestStreak }) {
  const { icon, tier } = getStreakTier(currentStreak);
  const isMilestone = MILESTONE_DAYS.includes(currentStreak);
  const microCopy = getMicroCopy(currentStreak);

  return (
    <motion.div
      className={`${styles.hero} ${styles[tier] || ''}`}
      variants={fadeInUp}
      initial="initial"
      animate="animate"
    >
      {/* Background decoration */}
      <div className={styles.bgDecoration} aria-hidden="true" />

      <div className={styles.content}>
        {/* Streak icon — celebration wraps inner span to avoid overriding CSS pulse */}
        <div className={styles.iconWrapper}>
          {isMilestone ? (
            <motion.span {...streakCelebration} style={{ display: 'inline-block' }}>
              <span className={styles.icon} role="img" aria-label="streak icon">{icon}</span>
            </motion.span>
          ) : (
            <span className={styles.icon} role="img" aria-label="streak icon">{icon}</span>
          )}
        </div>

        {/* Streak count */}
        <div className={styles.stats}>
          <div className={styles.primary}>
            <span className={styles.count}>{currentStreak}</span>
            <span className={styles.label}>day streak</span>
          </div>

          <p className={styles.microCopy}>{microCopy}</p>

          {longestStreak > 0 && (
            <div className={styles.secondary}>
              <span className={styles.bestLabel}>Best:</span>
              <span className={styles.bestValue}>{longestStreak} days</span>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
