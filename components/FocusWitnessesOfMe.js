'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { createClient } from '@/lib/supabase/client';
import UserAvatar from '@/components/UserAvatar';
import { staggerContainer, staggerItem, prefersReducedMotion } from '@/lib/animations';
import styles from './FocusWitnessesOfMe.module.css';

const MAX_VISIBLE = 6;

/**
 * FocusWitnessesOfMe — roster of group members who would see me lock in.
 *
 * Different from `<Witnesses />` (which lists peers currently locked-in).
 * This component answers "who will know if I start a session right now?" —
 * a static-ish audience preview the user can glance at before pressing
 * Start.
 *
 * @param {Object} props
 * @param {string} props.userId
 * @param {boolean} props.isRunning — pulse dot beside avatars when active
 */
export default function FocusWitnessesOfMe({ userId, isRunning = false }) {
  const [peers, setPeers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;
    const supabase = createClient();
    let cancelled = false;

    async function fetchPeers() {
      try {
        const { data: myMemberships } = await supabase
          .from('group_members')
          .select('group_id')
          .eq('user_id', userId);

        const groupIds = [
          ...new Set((myMemberships || []).map((m) => m.group_id).filter(Boolean)),
        ];
        if (groupIds.length === 0) {
          if (!cancelled) {
            setPeers([]);
            setIsLoading(false);
          }
          return;
        }

        const { data: members } = await supabase
          .from('group_members')
          .select('user_id')
          .in('group_id', groupIds);

        const peerIds = [
          ...new Set(
            (members || [])
              .map((m) => m.user_id)
              .filter((id) => id && id !== userId)
          ),
        ];
        if (peerIds.length === 0) {
          if (!cancelled) {
            setPeers([]);
            setIsLoading(false);
          }
          return;
        }

        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, full_name, avatar_url')
          .in('id', peerIds);

        if (!cancelled) {
          setPeers(
            (profiles || []).map((p) => ({
              id: p.id,
              name: p.full_name || 'Friend',
              avatar_url: p.avatar_url,
            }))
          );
          setIsLoading(false);
        }
      } catch (err) {
        console.error('Error fetching witnesses-of-me:', err);
        if (!cancelled) setIsLoading(false);
      }
    }

    fetchPeers();
    return () => {
      cancelled = true;
    };
  }, [userId]);

  if (isLoading) {
    return <div className={styles.empty}>Loading…</div>;
  }

  if (peers.length === 0) {
    return (
      <div className={styles.empty}>
        Join a group so your friends can see you lock in.
      </div>
    );
  }

  const visible = peers.slice(0, MAX_VISIBLE);
  const overflow = peers.length - MAX_VISIBLE;
  const reduced = prefersReducedMotion();

  return (
    <div className={styles.wrap}>
      <motion.ul
        className={styles.list}
        variants={reduced ? undefined : staggerContainer}
        initial={reduced ? false : 'initial'}
        animate={reduced ? false : 'animate'}
      >
        {visible.map((peer) => (
          <motion.li
            key={peer.id}
            className={styles.row}
            variants={reduced ? undefined : staggerItem}
          >
            <UserAvatar user={peer} size="md" />
            <span className={styles.name}>{peer.name}</span>
            {isRunning ? <span className={styles.pulseDot} aria-hidden="true" /> : null}
          </motion.li>
        ))}
      </motion.ul>

      {overflow > 0 ? (
        <div className={styles.more}>and {overflow} more</div>
      ) : null}

      <p className={styles.caption}>
        {isRunning
          ? 'They can see you locked in right now.'
          : 'These friends will see when you lock in.'}
      </p>
    </div>
  );
}
