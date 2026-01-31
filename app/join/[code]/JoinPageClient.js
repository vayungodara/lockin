'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { createClient } from '@/lib/supabase/client';
import { fadeInUp, buttonHover, buttonTap } from '@/lib/animations';
import styles from './JoinPage.module.css';

export default function JoinPageClient({ group, user }) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  const handleJoin = async () => {
    setIsLoading(true);
    setError('');

    try {
      const { error: joinError } = await supabase
        .from('group_members')
        .insert({
          group_id: group.id,
          user_id: user.id,
          role: 'member'
        });

      if (joinError) {
        if (joinError.code === '23505') {
          router.push(`/dashboard/groups/${group.id}`);
          return;
        }
        throw joinError;
      }

      router.push(`/dashboard/groups/${group.id}`);
    } catch (err) {
      console.error('Error joining group:', err);
      setError(err.message || 'Failed to join group. Please try again.');
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <motion.div className={styles.card} {...fadeInUp}>
        <div className={styles.groupIcon}>
          {group.name.charAt(0).toUpperCase()}
        </div>
        
        <h1 className={styles.title}>Join {group.name}?</h1>
        
        {group.description && (
          <p className={styles.description}>{group.description}</p>
        )}
        
        <p className={styles.subtitle}>
          You&apos;ve been invited to join this group
        </p>

        {error && (
          <div className={styles.error}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
              <path d="M12 8V12M12 16H12.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            {error}
          </div>
        )}

        <div className={styles.actions}>
          <motion.button
            className={styles.cancelBtn}
            onClick={() => router.push('/dashboard/groups')}
            whileHover={buttonHover}
            whileTap={buttonTap}
          >
            Cancel
          </motion.button>
          <motion.button
            className={styles.joinBtn}
            onClick={handleJoin}
            disabled={isLoading}
            whileHover={!isLoading ? buttonHover : undefined}
            whileTap={!isLoading ? buttonTap : undefined}
          >
            {isLoading ? (
              <>
                <span className={styles.spinner}></span>
                Joining...
              </>
            ) : (
              <>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path d="M16 21V19C16 16.7909 14.2091 15 12 15H5C2.79086 15 1 16.7909 1 19V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  <circle cx="8.5" cy="7" r="4" stroke="currentColor" strokeWidth="2"/>
                  <path d="M20 8V14M17 11H23" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
                Join Group
              </>
            )}
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
}
