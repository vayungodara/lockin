'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { formatRelativeTime, getActionInfo } from '@/lib/activity';
import { REACTIONS, getReactions, toggleReaction } from '@/lib/reactions';
import { createClient } from '@/lib/supabase/client';
import styles from './ActivityItem.module.css';

export default function ActivityItem({ activity }) {
  const [showReactions, setShowReactions] = useState(false);
  const initialCounts = activity.reactions?.counts || {};
  const initialUserReactions = activity.reactions?.userReactions || [];
  const [reactionCounts, setReactionCounts] = useState(initialCounts);
  const [userReactions, setUserReactions] = useState(initialUserReactions);
  const [isLoading, setIsLoading] = useState(false);
  const supabase = useMemo(() => createClient(), []);
  
  const actionInfo = getActionInfo(activity.action);
  const user = activity.user || { full_name: 'Unknown' };
  const timeAgo = formatRelativeTime(activity.created_at);

  const fetchReactions = useCallback(async () => {
    const result = await getReactions(supabase, activity.id);
    setReactionCounts(result.counts);
    setUserReactions(result.userReactions);
  }, [supabase, activity.id]);

  const handleReaction = async (reactionKey) => {
    if (isLoading) return;
    setIsLoading(true);
    
    const result = await toggleReaction(supabase, activity.id, reactionKey);
    if (result.success) {
      await fetchReactions();
    }
    
    setIsLoading(false);
    setShowReactions(false);
  };
  
  const getTargetName = () => {
    const meta = activity.metadata || {};
    return meta.task_title || meta.pact_description || meta.group_name || '';
  };

  const targetName = getTargetName();
  const hasReactions = Object.keys(reactionCounts).length > 0;

  const renderIcon = () => {
    const iconClass = `${styles.icon} ${styles[`icon${actionInfo.color.charAt(0).toUpperCase() + actionInfo.color.slice(1)}`]}`;
    
    switch (actionInfo.icon) {
      case 'check':
        return (
          <div className={iconClass}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M20 6L9 17L4 12" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
        );
      case 'plus':
        return (
          <div className={iconClass}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 5V19M5 12H19" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
            </svg>
          </div>
        );
      case 'play':
        return (
          <div className={iconClass}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M5 3L19 12L5 21V3Z" fill="currentColor"/>
            </svg>
          </div>
        );
      case 'hand':
        return (
          <div className={iconClass}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M18 11V6C18 5.46957 17.7893 4.96086 17.4142 4.58579C17.0391 4.21071 16.5304 4 16 4C15.4696 4 14.9609 4.21071 14.5858 4.58579C14.2107 4.96086 14 5.46957 14 6V11M14 11V4C14 3.46957 13.7893 2.96086 13.4142 2.58579C13.0391 2.21071 12.5304 2 12 2C11.4696 2 10.9609 2.21071 10.5858 2.58579C10.2107 2.96086 10 3.46957 10 4V11M10 11V5C10 4.46957 9.78929 3.96086 9.41421 3.58579C9.03914 3.21071 8.53043 3 8 3C7.46957 3 6.96086 3.21071 6.58579 3.58579C6.21071 3.96086 6 4.46957 6 5V12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M18 11C18.5304 11 19.0391 11.2107 19.4142 11.5858C19.7893 11.9609 20 12.4696 20 13V15C20 17.1217 19.1571 19.1566 17.6569 20.6569C16.1566 22.1571 14.1217 23 12 23C9.87827 23 7.84344 22.1571 6.34315 20.6569C4.84285 19.1566 4 17.1217 4 15V12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
        );
      case 'x':
        return (
          <div className={iconClass}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
            </svg>
          </div>
        );
      case 'user-plus':
        return (
          <div className={iconClass}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M16 21V19C16 16.7909 14.2091 15 12 15H5C2.79086 15 1 16.7909 1 19V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              <circle cx="8.5" cy="7" r="4" stroke="currentColor" strokeWidth="2"/>
              <path d="M20 8V14M17 11H23" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </div>
        );
      case 'users':
        return (
          <div className={iconClass}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M17 21V19C17 16.7909 15.2091 15 13 15H5C2.79086 15 1 16.7909 1 19V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              <circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="2"/>
              <path d="M23 21V19C23 17.1362 21.7252 15.5701 20 15.126" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              <path d="M16 3.12598C17.7252 3.57004 19 5.13616 19 7C19 8.86384 17.7252 10.43 16 10.874" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </div>
        );
      case 'trash':
        return (
          <div className={iconClass}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M3 6H5H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              <path d="M8 6V4C8 3.46957 8.21071 2.96086 8.58579 2.58579C8.96086 2.21071 9.46957 2 10 2H14C14.5304 2 15.0391 2.21071 15.4142 2.58579C15.7893 2.96086 16 3.46957 16 4V6M19 6V20C19 20.5304 18.7893 21.0391 18.4142 21.4142C18.0391 21.7893 17.5304 22 17 22H7C6.46957 22 5.96086 21.7893 5.58579 21.4142C5.21071 21.0391 5 20.5304 5 20V6H19Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </div>
        );
      default:
        return (
          <div className={iconClass}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="12" cy="12" r="4" fill="currentColor"/>
            </svg>
          </div>
        );
    }
  };

  return (
    <div className={styles.item}>
      <div className={styles.timeline}>
        {renderIcon()}
        <div className={styles.line}></div>
      </div>

      <div className={styles.content}>
        <div className={styles.mainWrapper}>
          <div className={styles.main}>
            <div className={styles.avatar}>
              {user.avatar_url ? (
                <Image
                  src={user.avatar_url}
                  alt={user.full_name || 'User'}
                  className={styles.avatarImage}
                  width={22}
                  height={22}
                />
              ) : (
                <span>{(user.full_name || 'U').charAt(0).toUpperCase()}</span>
              )}
            </div>

            <div className={styles.text}>
              <span className={styles.userName}>{user.full_name || 'Someone'}</span>
              <span className={styles.verb}>{actionInfo.verb}</span>
              {targetName && (
                <span className={styles.target}>&quot;{targetName}&quot;</span>
              )}
            </div>
          </div>

          <div className={styles.reactions}>
            {hasReactions && (
              <div className={styles.reactionBubbles}>
                {REACTIONS.filter(r => reactionCounts[r.key] > 0).map(r => (
                  <motion.button
                    key={r.key}
                    className={`${styles.reactionBubble} ${userReactions.includes(r.key) ? styles.active : ''}`}
                    onClick={() => handleReaction(r.key)}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <span>{r.emoji}</span>
                    <span className={styles.reactionCount}>{reactionCounts[r.key]}</span>
                  </motion.button>
                ))}
              </div>
            )}

            <div className={styles.reactionTrigger}>
              <motion.button
                className={styles.addReactionBtn}
                onClick={() => setShowReactions(!showReactions)}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                  <path d="M8 14C8.5 15.5 10 17 12 17C14 17 15.5 15.5 16 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  <circle cx="9" cy="10" r="1" fill="currentColor"/>
                  <circle cx="15" cy="10" r="1" fill="currentColor"/>
                </svg>
              </motion.button>

              <AnimatePresence>
                {showReactions && (
                  <motion.div
                    className={styles.reactionPicker}
                    initial={{ opacity: 0, scale: 0.8, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.8, y: 10 }}
                  >
                    {REACTIONS.map(r => (
                      <motion.button
                        key={r.key}
                        className={`${styles.reactionOption} ${userReactions.includes(r.key) ? styles.selected : ''}`}
                        onClick={() => handleReaction(r.key)}
                        whileHover={{ scale: 1.2 }}
                        whileTap={{ scale: 0.9 }}
                        title={r.label}
                      >
                        {r.emoji}
                      </motion.button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        <span className={styles.time}>{timeAgo}</span>
      </div>
    </div>
  );
}
