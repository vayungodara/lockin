'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import { createClient } from '@/lib/supabase/client';
import { calculateStreak } from '@/lib/streaks';
import { getUserAchievements } from '@/lib/gamification';
import { getCurrentTier, TIERS } from '@/lib/tiers';
import UserAvatar from '@/components/UserAvatar';
import SectionHeader from '@/components/SectionHeader';
import { SkeletonCard, SkeletonText } from '@/components/Skeleton';
import { fadeInUp } from '@/lib/animations';
import styles from './ProfilePageClient.module.css';

/**
 * Profile — the editorial ledger surface for a user's record.
 *
 * Three seams:
 *   § 01 — Tier         current band, monumental serif label, full ladder
 *   § 02 — Streak       monumental serif streak number + 4 stat grid
 *   § 03 — Achievements earned cards + locked subsection
 *
 * Voice: direct-positive throughout. No courthouse vocabulary, no wry
 * marketing-surface tone. Tier label cascades semantic colors; ink-yellow
 * highlight on the active tier follows the user's chosen ink.
 */
export default function ProfilePageClient({ user }) {
  const [streakData, setStreakData] = useState({ currentStreak: 0, longestStreak: 0, totalCompleted: 0 });
  const [pactStats, setPactStats] = useState({ total: 0, completed: 0, missed: 0, completionRate: 0 });
  const [focusStats, setFocusStats] = useState({ sessionsCount: 0 });
  const [tierData, setTierData] = useState({ totalXp: 0, level: 1 });
  const [achievements, setAchievements] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const supabase = useMemo(() => createClient(), []);

  const fetchProfileData = useCallback(async () => {
    try {
      let timezone = 'UTC';
      try {
        timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
      } catch {
        // Intl unavailable; fall back to UTC.
      }

      const uid = user.id;

      const [
        streak,
        profileRes,
        achievementsRes,
        completedPactsRes,
        missedPactsRes,
        totalPactsRes,
        focusSessionsRes,
      ] = await Promise.all([
        calculateStreak(supabase, uid, timezone),
        supabase.from('profiles').select('total_xp, level').eq('id', uid).single(),
        getUserAchievements(supabase, uid),
        supabase.from('pacts').select('*', { count: 'exact', head: true }).eq('user_id', uid).eq('status', 'completed'),
        supabase.from('pacts').select('*', { count: 'exact', head: true }).eq('user_id', uid).eq('status', 'missed'),
        supabase.from('pacts').select('*', { count: 'exact', head: true }).eq('user_id', uid),
        supabase.from('focus_sessions').select('*', { count: 'exact', head: true }).eq('user_id', uid),
      ]);

      const queryError = [profileRes, completedPactsRes, missedPactsRes, totalPactsRes, focusSessionsRes]
        .find(r => r.error);
      if (queryError) throw queryError.error;

      setStreakData(streak);
      setTierData({
        totalXp: profileRes.data?.total_xp || 0,
        level: profileRes.data?.level || 1,
      });
      setAchievements(achievementsRes.data || []);

      const completedCount = completedPactsRes.count || 0;
      const missedCount = missedPactsRes.count || 0;

      setPactStats({
        total: totalPactsRes.count || 0,
        completed: completedCount,
        missed: missedCount,
        completionRate: completedCount + missedCount > 0
          ? Math.round((completedCount / (completedCount + missedCount)) * 100)
          : 0,
      });

      setFocusStats({ sessionsCount: focusSessionsRes.count || 0 });
    } catch (err) {
      console.error('Error fetching profile:', err);
      setError('Failed to load profile. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [supabase, user.id]);

  useEffect(() => {
    fetchProfileData();
  }, [fetchProfileData]);

  const tier = useMemo(() => getCurrentTier(tierData.totalXp), [tierData.totalXp]);

  const earnedAchievements = useMemo(
    () => achievements.filter(a => a.unlocked),
    [achievements]
  );
  const lockedAchievements = useMemo(
    () => achievements.filter(a => !a.unlocked),
    [achievements]
  );

  const displayName = user.user_metadata?.full_name || user.user_metadata?.name || user.email || 'You';

  const avatarUser = useMemo(() => ({
    id: user.id,
    full_name: displayName,
    avatar_url: user.user_metadata?.avatar_url || null,
  }), [user.id, user.user_metadata?.avatar_url, displayName]);

  const joinedDate = user.created_at ? formatJoinDate(user.created_at) : null;

  if (isLoading) {
    return (
      <div className={styles.container}>
        <header className={styles.header}>
          <SkeletonText width="80px" height="14px" />
          <SkeletonText width="280px" height="56px" />
          <SkeletonText width="180px" height="14px" />
        </header>
        <div className={styles.content}>
          <SkeletonCard height="320px" />
          <SkeletonCard height="220px" />
          <SkeletonCard height="280px" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>
          <p>{error}</p>
          <button className="btn btn-primary" onClick={fetchProfileData}>Try again</button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <motion.header
        className={styles.header}
        variants={fadeInUp}
        initial="initial"
        animate="animate"
      >
        <span className={styles.headerCaption}>§ Your record</span>
        <div className={styles.identityRow}>
          <UserAvatar user={avatarUser} size="lg" isSelf showPhoto />
          <div className={styles.identityBody}>
            <h1 className={styles.displayName}>{displayName}</h1>
            {joinedDate && (
              <span className={styles.joinedLine}>Locked in since {joinedDate}</span>
            )}
          </div>
        </div>
      </motion.header>

      <div className={styles.content}>
        {/* ─────────────── § 01 — Tier ─────────────── */}
        <section className={styles.section}>
          <SectionHeader
            number="01"
            title="Tier"
            caption={`Level ${tierData.level} progression`}
          />
          <div className={styles.tierBlock}>
            <div className={styles.tierMonumental}>
              <span className={styles.tierIndex}>
                Current tier &middot; {String(tier.index + 1).padStart(2, '0')} / 06
              </span>
              <h2 className={styles.tierLabel}>{tier.tier.label}</h2>
              <span className={styles.tierSubtitle}>&ldquo;{tier.tier.subtitle}&rdquo;</span>

              {tier.next ? (
                <div className={styles.tierProgressWrap}>
                  <div className={styles.tierProgressLabels}>
                    <span>{tierData.totalXp} XP</span>
                    <span>{tier.xpToNext} to {tier.next.label}</span>
                  </div>
                  <div className={styles.tierProgressTrack}>
                    <motion.div
                      className={styles.tierProgressFill}
                      initial={{ width: 0 }}
                      animate={{ width: `${tier.progressToNext * 100}%` }}
                      transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
                    />
                  </div>
                </div>
              ) : (
                <div className={styles.tierProgressWrap}>
                  <div className={styles.tierProgressLabels}>
                    <span>{tierData.totalXp} XP</span>
                    <span className={styles.tierCeiling}>Top tier reached</span>
                  </div>
                  <div className={styles.tierProgressTrack}>
                    <div className={styles.tierProgressFill} style={{ width: '100%' }} />
                  </div>
                </div>
              )}
            </div>

            <div className={styles.tierLadder}>
              {TIERS.map((band, i) => {
                const isActive = i === tier.index;
                const isReached = i < tier.index;
                const className = [
                  styles.tierRow,
                  isActive ? styles.tierRowActive : '',
                  isReached ? styles.tierRowReached : '',
                  !isActive && !isReached ? styles.tierRowLocked : '',
                ].filter(Boolean).join(' ');
                const rangeText = band.max === Infinity
                  ? `${band.min}+`
                  : `${band.min}–${band.max}`;
                return (
                  <div key={band.label} className={className}>
                    <span className={styles.tierRowNumeral}>
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    <div className={styles.tierRowBody}>
                      <span className={styles.tierRowLabel}>{band.label}</span>
                      <span className={styles.tierRowSubtitle}>&ldquo;{band.subtitle}&rdquo;</span>
                    </div>
                    <span className={styles.tierRowRange}>{rangeText} XP</span>
                    {isReached || isActive ? (
                      <span className={styles.tierRowCheck} aria-hidden="true">✓</span>
                    ) : (
                      <span className={styles.tierRowCheckEmpty} aria-hidden="true" />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ─────────────── § 02 — Streak ─────────────── */}
        <section className={styles.section}>
          <SectionHeader
            number="02"
            title="Streak"
            caption="Days on the chain"
          />
          <div className={styles.streakBlock}>
            <div className={styles.streakHero}>
              <span className={styles.streakNumeral}>{streakData.currentStreak}</span>
              <span className={styles.streakLabel}>
                {streakData.currentStreak === 1 ? 'day unbroken' : 'days unbroken'}
              </span>
            </div>

            <div className={styles.statGrid}>
              <div className={styles.statCell}>
                <span className={styles.statLabel}>Current</span>
                <span className={styles.statValue}>
                  {streakData.currentStreak}
                  <span className={styles.statUnit}>{streakData.currentStreak === 1 ? 'day' : 'days'}</span>
                </span>
              </div>
              <div className={styles.statCell}>
                <span className={styles.statLabel}>Best</span>
                <span className={styles.statValue}>
                  {streakData.longestStreak}
                  <span className={styles.statUnit}>{streakData.longestStreak === 1 ? 'day' : 'days'}</span>
                </span>
              </div>
              <div className={styles.statCell}>
                <span className={styles.statLabel}>Kept rate</span>
                <span className={styles.statValue}>
                  {pactStats.completionRate}
                  <span className={styles.statUnit}>%</span>
                </span>
              </div>
              <div className={styles.statCell}>
                <span className={styles.statLabel}>Missed</span>
                <span className={styles.statValue}>{pactStats.missed}</span>
              </div>
            </div>
          </div>
        </section>

        {/* ─────────────── § 03 — Achievements ─────────────── */}
        <section className={styles.section}>
          <SectionHeader
            number="03"
            title="Achievements"
            caption={`${earnedAchievements.length} of ${achievements.length} earned`}
          />

          {earnedAchievements.length === 0 ? (
            <div className={styles.empty}>
              <p>No achievements yet.</p>
              <p className={styles.emptyHint}>Keep your first pact to start earning.</p>
            </div>
          ) : (
            <ul className={styles.achGrid}>
              {earnedAchievements.map((a, i) => (
                <li key={a.key} className={styles.achCard}>
                  <span className={styles.achIndex}>
                    Achievement #{String(i + 1).padStart(2, '0')}
                  </span>
                  <span className={styles.achStamp} aria-hidden="true">
                    <span className={styles.achStampGlyph}>{a.icon || '·'}</span>
                  </span>
                  <h3 className={styles.achName}>{a.name}</h3>
                  <p className={styles.achDesc}>{a.description}</p>
                  {a.unlockedAt && (
                    <span className={styles.achDate}>
                      Earned {formatEarnedDate(a.unlockedAt)}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          )}

          {lockedAchievements.length > 0 && (
            <div className={styles.lockedSection}>
              <span className={styles.lockedHeader}>Not yet</span>
              <ul className={styles.achGrid}>
                {lockedAchievements.map((a, i) => (
                  <li key={a.key} className={`${styles.achCard} ${styles.achCardLocked}`}>
                    <span className={styles.achIndex}>
                      Achievement #{String(earnedAchievements.length + i + 1).padStart(2, '0')}
                    </span>
                    <h3 className={styles.achName}>{a.name}</h3>
                    <p className={styles.achDesc}>{a.description}</p>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>

        {/* ─────────────── Footer summary ─────────────── */}
        <div className={styles.footerLine}>
          <span>{pactStats.completed} pacts kept</span>
          <span className={styles.footerSep}>·</span>
          <span>{focusStats.sessionsCount} sessions</span>
          <span className={styles.footerSep}>·</span>
          <span>
            {streakData.currentStreak}-day streak
          </span>
        </div>
      </div>
    </div>
  );
}

/* ----------------------------------------------------------------------
   Date helpers — kept editorial: "14 Oct 2025", "17 Apr 2026" all-caps
   for footer / earned date lines.
   ---------------------------------------------------------------------- */
function formatJoinDate(dateStr) {
  if (!dateStr) return null;
  const date = new Date(dateStr);
  const day = String(date.getDate()).padStart(2, '0');
  const month = date.toLocaleString('en-US', { month: 'short' });
  const year = date.getFullYear();
  return `${day} ${month} ${year}`;
}

function formatEarnedDate(dateStr) {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const day = String(date.getDate()).padStart(2, '0');
  const month = date.toLocaleString('en-US', { month: 'short' }).toUpperCase();
  const year = date.getFullYear();
  return `${day} ${month} ${year}`;
}
