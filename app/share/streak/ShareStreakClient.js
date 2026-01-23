'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { createClient } from '@/lib/supabase/client';
import { fadeInUp, buttonHover, buttonTap } from '@/lib/animations';
import styles from './ShareStreak.module.css';

export default function ShareStreakClient({ user, profile, streakData }) {
  const [copied, setCopied] = useState(false);
  const router = useRouter();
  
  const shareUrl = typeof window !== 'undefined' 
    ? `${window.location.origin}/share/streak?streak=${streakData.currentStreak}&name=${encodeURIComponent(profile?.full_name || 'A LockIn user')}`
    : '';

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${streakData.currentStreak}-day streak on LockIn!`,
          text: `I'm on a ${streakData.currentStreak}-day streak! Join me on LockIn.`,
          url: shareUrl,
        });
      } catch (err) {
        if (err.name !== 'AbortError') {
          handleCopyLink();
        }
      }
    } else {
      handleCopyLink();
    }
  };

  return (
    <div className={styles.container}>
      <motion.div className={styles.card} {...fadeInUp}>
        <div className={styles.header}>
          <div className={styles.logo}>LockIn</div>
        </div>
        
        <div className={styles.streakSection}>
          <div className={styles.streakNumber}>{streakData.currentStreak}</div>
          <div className={styles.streakLabel}>day streak</div>
        </div>
        
        <div className={styles.userInfo}>
          {profile?.avatar_url ? (
            <Image src={profile.avatar_url} alt="" className={styles.avatar} width={40} height={40} />
          ) : (
            <div className={styles.avatarPlaceholder}>
              {(profile?.full_name || user.email || 'U').charAt(0).toUpperCase()}
            </div>
          )}
          <span className={styles.userName}>{profile?.full_name || 'LockIn User'}</span>
        </div>
        
        <div className={styles.stats}>
          <div className={styles.stat}>
            <span className={styles.statValue}>{streakData.longestStreak}</span>
            <span className={styles.statLabel}>Best Streak</span>
          </div>
          <div className={styles.statDivider} />
          <div className={styles.stat}>
            <span className={styles.statValue}>{streakData.totalCompleted}</span>
            <span className={styles.statLabel}>Pacts Done</span>
          </div>
        </div>
        
        <div className={styles.tagline}>
          Locked in and crushing goals
        </div>
      </motion.div>
      
      <div className={styles.actions}>
        <motion.button
          className={styles.shareBtn}
          onClick={handleShare}
          whileHover={buttonHover}
          whileTap={buttonTap}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M4 12V20C4 21.1 4.9 22 6 22H18C19.1 22 20 21.1 20 20V12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <polyline points="16,6 12,2 8,6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <line x1="12" y1="2" x2="12" y2="15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          {copied ? 'Copied!' : 'Share'}
        </motion.button>
        
        <motion.button
          className={styles.backBtn}
          onClick={() => router.push('/dashboard')}
          whileHover={buttonHover}
          whileTap={buttonTap}
        >
          Back to Dashboard
        </motion.button>
      </div>
    </div>
  );
}
