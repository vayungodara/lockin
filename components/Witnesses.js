'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { createClient } from '@/lib/supabase/client';
import { getActiveWitnesses } from '@/lib/witnesses';
import UserAvatar from '@/components/UserAvatar';
import { staggerContainer, staggerItem, prefersReducedMotion } from '@/lib/animations';
import styles from './Witnesses.module.css';

const MAX_VISIBLE = 5;
const REFRESH_MS = 30000;

/**
 * Witnesses — live focus-session board for § 02 of the dashboard.
 *
 * Polls the active witnesses helper every 30 seconds. Renders an empty-state
 * caption when no peers are locked in, or a vertical list (max 5 visible)
 * with avatar tile, progress bar, and start time.
 */
export default function Witnesses({ userId }) {
  const [witnesses, setWitnesses] = useState([]);

  useEffect(() => {
    if (!userId) return;

    const supabase = createClient();
    let cancelled = false;

    async function refresh() {
      const next = await getActiveWitnesses(supabase, userId);
      if (!cancelled) setWitnesses(next);
    }

    refresh();
    const interval = setInterval(refresh, REFRESH_MS);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [userId]);

  if (witnesses.length === 0) {
    return <div className={styles.empty}>Nobody locked in right now.</div>;
  }

  const visible = witnesses.slice(0, MAX_VISIBLE);
  const overflow = witnesses.length - MAX_VISIBLE;
  const reduced = prefersReducedMotion();

  return (
    <div className={styles.wrap}>
      <motion.ul
        className={styles.list}
        variants={reduced ? undefined : staggerContainer}
        initial={reduced ? false : 'initial'}
        animate={reduced ? false : 'animate'}
      >
        {visible.map((w) => (
          <WitnessRow key={w.user_id} witness={w} reduced={reduced} />
        ))}
      </motion.ul>

      {overflow > 0 && (
        <div className={styles.more}>and {overflow} more</div>
      )}
    </div>
  );
}

function WitnessRow({ witness, reduced }) {
  const user = {
    id: witness.user_id,
    name: witness.name,
    avatar_url: witness.avatar_url,
  };

  const started = formatStarted(witness.started_at);
  const progress = Math.max(0, Math.min(100, witness.progress_pct || 0));

  return (
    <motion.li
      className={styles.row}
      variants={reduced ? undefined : staggerItem}
    >
      <UserAvatar user={user} size="md" />

      <div className={styles.body}>
        <div className={styles.name}>{witness.name}</div>
        <div className={styles.progressText}>
          {witness.elapsed_minutes}m / {witness.duration_minutes}m
        </div>
        <div className={styles.track}>
          <div className={styles.fill} style={{ width: `${progress}%` }} />
        </div>
      </div>

      <div className={styles.timestamp}>started {started}</div>
    </motion.li>
  );
}

function formatStarted(isoString) {
  if (!isoString) return '';
  try {
    return new Date(isoString).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return '';
  }
}
