'use client';

import { useState, useCallback, useMemo, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { staggerItem, buttonTap, buttonHover, iconHover, fadeIn, navPillSpring } from '@/lib/animations';
import { formatRelativeTime } from '@/lib/activity';
import { REACTIONS, getReactions, toggleReaction } from '@/lib/reactions';
import { createClient } from '@/lib/supabase/client';
import UserAvatar from './UserAvatar';
import Stamp from './Stamp';
import ActivityComments from './ActivityComments';
import styles from './ActivityItem.module.css';

/**
 * Editorial row for the activity feed.
 *
 * Single horizontal line of:
 *   [WitnessTile sm]  <Name> <verb> <target>  [inline Stamp]   ┈┈   <timestamp>
 *
 * Reactions live below the copy (indented under the name); comments collapse
 * to a tracked-uppercase `[ N comments → ]` link that expands the existing
 * ActivityComments thread inline. Direct-positive voice only.
 */
function ActivityItem({ activity }) {
  const [showReactions, setShowReactions] = useState(false);
  const initialCounts = activity.reactions?.counts || {};
  const initialUserReactions = activity.reactions?.userReactions || [];
  const [reactionCounts, setReactionCounts] = useState(initialCounts);
  const [userReactions, setUserReactions] = useState(initialUserReactions);
  const [isLoading, setIsLoading] = useState(false);
  const supabase = useMemo(() => createClient(), []);

  const editorial = getEditorialAction(activity.action, activity.metadata);
  const user = activity.user || { full_name: 'Unknown' };
  const timeAgo = formatRelativeTime(activity.created_at);
  const targetText = getTargetText(activity);

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

  const hasReactions = Object.keys(reactionCounts).length > 0;

  return (
    <motion.div className={styles.row} variants={staggerItem}>
      <div className={styles.rowHead}>
        <UserAvatar user={user} size="sm" className={styles.avatar} />

        <div className={styles.copy}>
          <span className={styles.name}>{user.full_name || 'Someone'}</span>
          <span className={styles.verbText}>{editorial.verb}</span>
          {targetText ? (
            <span className={styles.target}>{targetText}</span>
          ) : null}
          {editorial.suffix ? (
            <span className={styles.suffix}>{editorial.suffix}</span>
          ) : null}
        </div>

        {editorial.stampKind ? (
          <Stamp
            kind={editorial.stampKind}
            size="sm"
            className={styles.inlineStamp}
          />
        ) : null}

        <span className={styles.time}>{timeAgo}</span>
      </div>

      <div className={styles.indented}>
        <div className={styles.reactions}>
          {hasReactions && (
            <div className={styles.reactionBubbles}>
              {REACTIONS.filter(r => reactionCounts[r.key] > 0).map(r => (
                <motion.button
                  key={r.key}
                  className={`${styles.reactionBubble} ${userReactions.includes(r.key) ? styles.active : ''}`}
                  onClick={() => handleReaction(r.key)}
                  whileHover={buttonHover}
                  whileTap={buttonTap}
                >
                  <span>{r.emoji}</span>
                  <span className={styles.reactionCount}>{reactionCounts[r.key]}</span>
                </motion.button>
              ))}
            </div>
          )}

          <motion.div
            className={`${styles.reactionTrigger} ${showReactions ? styles.reactionTriggerOpen : ''}`}
            layout
            transition={navPillSpring}
            onClick={() => !showReactions && setShowReactions(true)}
          >
            <AnimatePresence mode="wait">
              {!showReactions ? (
                <motion.button
                  key="trigger"
                  className={styles.addReactionBtn}
                  {...fadeIn}
                  whileHover={iconHover}
                  whileTap={buttonTap}
                  aria-label="Add reaction"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                    <path d="M8 14C8.5 15.5 10 17 12 17C14 17 15.5 15.5 16 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                    <circle cx="9" cy="10" r="1" fill="currentColor"/>
                    <circle cx="15" cy="10" r="1" fill="currentColor"/>
                  </svg>
                </motion.button>
              ) : (
                <motion.div
                  key="picker"
                  className={styles.reactionPickerInline}
                  {...fadeIn}
                >
                  {REACTIONS.map((r, i) => (
                    <motion.button
                      key={r.key}
                      className={`${styles.reactionOption} ${userReactions.includes(r.key) ? styles.selected : ''}`}
                      onClick={(e) => { e.stopPropagation(); handleReaction(r.key); }}
                      initial={{ opacity: 0, scale: 0 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: i * 0.03, type: "spring", stiffness: 500, damping: 25 }}
                      whileHover={iconHover}
                      whileTap={buttonTap}
                      title={r.label}
                    >
                      {r.emoji}
                    </motion.button>
                  ))}
                  <motion.button
                    className={styles.reactionClose}
                    onClick={(e) => { e.stopPropagation(); setShowReactions(false); }}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.15 }}
                    whileHover={iconHover}
                    whileTap={buttonTap}
                    aria-label="Close reactions"
                  >
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none">
                      <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
                    </svg>
                  </motion.button>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>

        <ActivityComments activityId={activity.id} initialCount={activity.comment_count || 0} />
      </div>
    </motion.div>
  );
}

/* -------------------------------------------------------------------------
   Editorial verb mapping — direct-positive voice. Returns the verb to
   render plus the inline `Stamp` kind (kept/missed/null) for resolution
   events. Non-resolution events (creates, joins, milestones) get a verb
   only — no stamp.
   ------------------------------------------------------------------------- */
function getEditorialAction(action, metadata) {
  const minutes = metadata?.duration_minutes;
  const minutesSuffix = Number.isFinite(minutes) && minutes > 0 ? `— ${minutes}m` : null;

  switch (action) {
    case 'pact_completed':
      return { verb: 'kept', stampKind: 'kept', suffix: null };
    case 'pact_missed':
      return { verb: 'missed', stampKind: 'missed', suffix: null };
    case 'pact_created':
      return { verb: 'made a pact', stampKind: null, suffix: null };
    case 'task_completed':
      return { verb: 'completed', stampKind: 'kept', suffix: null };
    case 'task_created':
      return { verb: 'added', stampKind: null, suffix: null };
    case 'task_started':
      return { verb: 'started', stampKind: null, suffix: null };
    case 'task_claimed':
      return { verb: 'claimed', stampKind: null, suffix: null };
    case 'task_deleted':
      return { verb: 'removed', stampKind: null, suffix: null };
    case 'focus_session_started':
      return { verb: 'locked in', stampKind: null, suffix: minutesSuffix };
    case 'focus_session_completed':
      return { verb: 'wrapped a session', stampKind: null, suffix: minutesSuffix };
    case 'streak_broken':
      return { verb: 'broke a streak', stampKind: null, suffix: null };
    case 'streak_milestone':
      return { verb: 'hit a streak milestone', stampKind: null, suffix: null };
    case 'streak_freeze_used':
      return { verb: 'used a streak freeze', stampKind: null, suffix: null };
    case 'member_joined':
      return { verb: 'joined the group', stampKind: null, suffix: null };
    case 'group_created':
      return { verb: 'started a group', stampKind: null, suffix: null };
    case 'nudge_sent':
      return { verb: 'sent a nudge', stampKind: null, suffix: null };
    case 'partner_request':
      return { verb: 'sent a partner request', stampKind: null, suffix: null };
    case 'challenge_created':
      return { verb: 'started a challenge', stampKind: null, suffix: null };
    case 'challenge_won':
      return { verb: 'won a challenge', stampKind: null, suffix: null };
    default:
      return { verb: action, stampKind: null, suffix: null };
  }
}

function getTargetText(activity) {
  const meta = activity.metadata || {};
  return meta.task_title || meta.pact_description || meta.group_name || '';
}

export default memo(ActivityItem);
