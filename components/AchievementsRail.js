'use client';

import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { createClient } from '@/lib/supabase/client';
import { getUserAchievements } from '@/lib/gamification';
import { AchievementIcon } from '@/lib/achievementIcons';
import { staggerContainer, staggerItem, prefersReducedMotion } from '@/lib/animations';
import styles from './AchievementsRail.module.css';

/**
 * AchievementsRail — § 05 of the dashboard.
 *
 * Renders the full achievement set as a rail of editorial-tile cards.
 * Earned tiles seat a Phosphor line-icon on a rotated highlighter stamp;
 * locked tiles dim to glassine-paper grey + a dashed outline and a muted
 * icon so they read as the "yet to be earned" set without disappearing.
 *
 * Refreshes when the global `xp-updated` event fires (any pact completion
 * fans out to checkPactAchievements which can unlock a tile silently;
 * we want the rail to reflect that without a route change).
 *
 * @param {Object} props
 * @param {string} props.userId — Supabase auth user id
 */
export default function AchievementsRail({ userId }) {
  const supabase = useMemo(() => createClient(), []);
  const [achievements, setAchievements] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return undefined;
    let cancelled = false;

    async function fetchAchievements() {
      const { data } = await getUserAchievements(supabase, userId);
      if (cancelled) return;
      setAchievements(data || []);
      setLoading(false);
    }

    fetchAchievements();

    const handler = () => fetchAchievements();
    window.addEventListener('xp-updated', handler);
    return () => {
      cancelled = true;
      window.removeEventListener('xp-updated', handler);
    };
  }, [userId, supabase]);

  if (loading) {
    return (
      <div className={styles.rail} aria-busy="true">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className={`${styles.tile} ${styles.skeleton}`} />
        ))}
      </div>
    );
  }

  if (achievements.length === 0) {
    return <div className={styles.empty}>No achievements yet.</div>;
  }

  const reduced = prefersReducedMotion();
  const earnedCount = achievements.filter((a) => a.unlocked).length;

  return (
    <div className={styles.wrap}>
      <div className={styles.summary}>
        <span className={styles.count}>{earnedCount}</span>
        <span className={styles.countLabel}>of {achievements.length} earned</span>
      </div>
      <motion.div
        className={styles.rail}
        variants={reduced ? undefined : staggerContainer}
        initial={reduced ? false : 'initial'}
        animate={reduced ? false : 'animate'}
      >
        {achievements.map((a) => (
          <AchievementTile key={a.key} achievement={a} reduced={reduced} />
        ))}
      </motion.div>
    </div>
  );
}

function AchievementTile({ achievement, reduced }) {
  const { key, name, description, unlocked } = achievement;
  return (
    <motion.div
      className={`${styles.tile} ${unlocked ? styles.tileUnlocked : styles.tileLocked}`}
      variants={reduced ? undefined : staggerItem}
      title={`${name} — ${description}`}
    >
      <span className={styles.tileIcon} aria-hidden="true">
        <AchievementIcon achievementKey={key} size={22} weight={unlocked ? 'duotone' : 'regular'} />
      </span>
      <div className={styles.tileBody}>
        <div className={styles.tileName}>{name}</div>
        <div className={styles.tileDesc}>{description}</div>
      </div>
      {unlocked && <span className={styles.tileBadge}>Earned</span>}
    </motion.div>
  );
}
