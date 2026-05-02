'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import { createClient } from '@/lib/supabase/client';
import { calculateStreak } from '@/lib/streaks';
import { getUserAchievements } from '@/lib/gamification';
import { getCurrentTier, TIERS } from '@/lib/tiers';
import MonthlyCalendar from '@/components/MonthlyCalendar';
import SectionHeader from '@/components/SectionHeader';
import EmptyState from '@/components/EmptyState';
import { SkeletonCard, SkeletonText } from '@/components/Skeleton';
import { fadeInUp } from '@/lib/animations';
import styles from './StatsPage.module.css';

const WEEKDAY_LABELS = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];

export default function StatsPageClient({ user }) {
  const [streakData, setStreakData] = useState({ currentStreak: 0, longestStreak: 0, totalCompleted: 0 });
  const [pactStats, setPactStats] = useState({ total: 0, completed: 0, missed: 0, active: 0, completionRate: 0 });
  const [focusStats, setFocusStats] = useState({ totalMinutes: 0, sessionsCount: 0, avgDuration: 0, thisWeekSessions: 0, thisMonthSessions: 0, avgPerDay: 0 });
  const [recentSessions, setRecentSessions] = useState([]);
  const [weekMinutes, setWeekMinutes] = useState(Array(7).fill(0));
  const [tierData, setTierData] = useState({ totalXp: 0, level: 1 });
  const [achievements, setAchievements] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const supabase = useMemo(() => createClient(), []);

  const fetchStats = useCallback(async () => {
    try {
      const now = new Date();
      const weekAgo = new Date(now);
      weekAgo.setDate(weekAgo.getDate() - 7);
      const monthAgo = new Date(now);
      monthAgo.setMonth(monthAgo.getMonth() - 1);
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      sevenDaysAgo.setHours(0, 0, 0, 0);

      let timezone = 'UTC';
      try {
        timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
      } catch {
        // Intl API unavailable — fall back to UTC
      }

      const uid = user.id;

      const [
        streak,
        profileRes,
        achievementsRes,
        totalPactsRes,
        completedPactsRes,
        missedPactsRes,
        activePactsRes,
        focusTotalsRes,
        thisWeekFocusRes,
        thisMonthFocusRes,
        firstFocusRes,
        weekSessionsRes,
        recentSessionsRes,
      ] = await Promise.all([
        calculateStreak(supabase, uid, timezone),
        // Total XP + Level for tier resolution
        supabase.from('profiles').select('total_xp, level').eq('id', uid).single(),
        // Full achievement list (unlocked + locked) for § 05
        getUserAchievements(supabase, uid),
        // Pact counts
        supabase.from('pacts').select('*', { count: 'exact', head: true }).eq('user_id', uid),
        supabase.from('pacts').select('*', { count: 'exact', head: true }).eq('user_id', uid).eq('status', 'completed'),
        supabase.from('pacts').select('*', { count: 'exact', head: true }).eq('user_id', uid).eq('status', 'missed'),
        supabase.from('pacts').select('*', { count: 'exact', head: true }).eq('user_id', uid).eq('status', 'active'),
        // Focus totals — only duration_minutes column for lifetime sum/avg
        supabase.from('focus_sessions').select('duration_minutes').eq('user_id', uid).limit(5000),
        supabase.from('focus_sessions').select('*', { count: 'exact', head: true })
          .eq('user_id', uid).gte('started_at', weekAgo.toISOString()),
        supabase.from('focus_sessions').select('*', { count: 'exact', head: true })
          .eq('user_id', uid).gte('started_at', monthAgo.toISOString()),
        // Earliest session for avg-per-day denominator
        supabase.from('focus_sessions').select('started_at').eq('user_id', uid)
          .order('started_at', { ascending: true }).limit(1),
        // Last 7 days of sessions with started_at + duration for the week chart
        supabase.from('focus_sessions').select('started_at, duration_minutes')
          .eq('user_id', uid).gte('started_at', sevenDaysAgo.toISOString()).limit(500),
        // Recent sessions list for the bottom of § 04
        supabase.from('focus_sessions').select('id, started_at, duration_minutes, ended_at')
          .eq('user_id', uid).gte('started_at', sevenDaysAgo.toISOString())
          .order('started_at', { ascending: false }).limit(20),
      ]);

      const queryError = [
        profileRes, totalPactsRes, completedPactsRes, missedPactsRes, activePactsRes,
        focusTotalsRes, thisWeekFocusRes, thisMonthFocusRes, firstFocusRes,
        weekSessionsRes, recentSessionsRes,
      ].find(r => r.error);
      if (queryError) throw queryError.error;

      setStreakData(streak);

      setTierData({
        totalXp: profileRes.data?.total_xp || 0,
        level: profileRes.data?.level || 1,
      });

      setAchievements(achievementsRes.data || []);

      const completedCount = completedPactsRes.count || 0;
      const missedCount = missedPactsRes.count || 0;
      const activeCount = activePactsRes.count || 0;

      setPactStats({
        total: totalPactsRes.count || 0,
        completed: completedCount,
        missed: missedCount,
        active: activeCount,
        completionRate: completedCount + missedCount > 0
          ? Math.round((completedCount / (completedCount + missedCount)) * 100)
          : 0,
      });

      const focusSessions = focusTotalsRes.data || [];
      const totalMinutes = focusSessions.reduce((acc, s) => acc + (s.duration_minutes || 0), 0);
      const sessionsCount = focusSessions.length;
      const firstStartedAt = firstFocusRes.data?.[0]?.started_at;
      const daysSinceFirst = firstStartedAt
        ? Math.max(1, Math.ceil((now - new Date(firstStartedAt)) / (1000 * 60 * 60 * 24)))
        : 1;
      const avgPerDay = sessionsCount > 0 ? Math.round(totalMinutes / daysSinceFirst) : 0;

      setFocusStats({
        totalMinutes,
        sessionsCount,
        avgDuration: sessionsCount > 0 ? Math.round(totalMinutes / sessionsCount) : 0,
        thisWeekSessions: thisWeekFocusRes.count || 0,
        thisMonthSessions: thisMonthFocusRes.count || 0,
        avgPerDay,
      });

      // Build the rolling 7-day chart, Mon..Sun.
      // weekMinutes[0] = oldest day (6 days ago), weekMinutes[6] = today.
      const weekData = weekSessionsRes.data || [];
      const buckets = Array(7).fill(0);
      const todayMidnight = new Date();
      todayMidnight.setHours(0, 0, 0, 0);
      weekData.forEach(s => {
        const sessionDate = new Date(s.started_at);
        sessionDate.setHours(0, 0, 0, 0);
        const daysAgo = Math.floor((todayMidnight - sessionDate) / (1000 * 60 * 60 * 24));
        if (daysAgo >= 0 && daysAgo < 7) {
          // Index 0 = 6 days ago, index 6 = today
          buckets[6 - daysAgo] += s.duration_minutes || 0;
        }
      });
      setWeekMinutes(buckets);

      setRecentSessions(recentSessionsRes.data || []);
    } catch (err) {
      console.error('Error fetching stats:', err);
      setError('Failed to load stats. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [supabase, user.id]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    }
    if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    }
    return date.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
  };

  const formatTime = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  };

  const formatDuration = (minutes) => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  const formatEarnedDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  // Weekday label rotation: today's label sits at the right edge.
  // Today's getDay returns 0=Sun..6=Sat; we display Mon..Sun left-to-right
  // ending in today, so labels[i] = day-of-week for (today - 6 + i).
  const weekDayLabels = useMemo(() => {
    const labels = [];
    const today = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      // 0 = Sun in JS; convert to Mon=0..Sun=6
      const jsDay = d.getDay();
      const monBased = (jsDay + 6) % 7;
      labels.push(WEEKDAY_LABELS[monBased]);
    }
    return labels;
  }, []);

  const groupedSessions = useMemo(() => {
    const groups = {};
    recentSessions.forEach(session => {
      const dateKey = new Date(session.started_at).toDateString();
      if (!groups[dateKey]) groups[dateKey] = [];
      groups[dateKey].push(session);
    });
    return Object.entries(groups).map(([dateKey, sessions]) => ({ date: dateKey, sessions }));
  }, [recentSessions]);

  const tier = useMemo(() => getCurrentTier(tierData.totalXp), [tierData.totalXp]);
  const weekMax = useMemo(() => Math.max(60, ...weekMinutes), [weekMinutes]);
  const earnedAchievements = achievements.filter(a => a.unlocked);

  if (isLoading) {
    return (
      <div className={styles.container}>
        <header className={styles.header}>
          <SkeletonText width="80px" height="14px" />
          <SkeletonText width="200px" height="56px" />
          <SkeletonText width="280px" height="14px" />
        </header>
        <div className={styles.content}>
          <SkeletonCard height="280px" />
          <SkeletonCard height="220px" />
          <SkeletonCard height="320px" />
          <SkeletonCard height="240px" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>
          <p>{error}</p>
          <button className="btn btn-primary" onClick={fetchStats}>Try again</button>
        </div>
      </div>
    );
  }

  const hasNoActivity = pactStats.total === 0 && focusStats.sessionsCount === 0;

  return (
    <div className={styles.container}>
      <motion.header
        className={styles.header}
        variants={fadeInUp}
        initial="initial"
        animate="animate"
      >
        <span className={styles.headerCaption}>§ Stats</span>
        <h1 className={styles.headerTitle}>Your record.</h1>
        <span className={styles.headerSubtitle}>
          Lv. {tierData.level} &middot; {tierData.totalXp} XP &middot; {pactStats.completed} pacts kept
        </span>
      </motion.header>

      <div className={styles.content}>
        {hasNoActivity && (
          <EmptyState
            floating={false}
            title="Your story starts with day one."
            description="Complete pacts and focus sessions to see your progress here."
          />
        )}

        {/* ─────────────── § 01 — Tier ─────────────── */}
        <section className={styles.section}>
          <SectionHeader
            number="01"
            title="Tier"
            caption={`Level ${tierData.level} progression`}
          />
          <div className={styles.tierBlock}>
            <div className={styles.tierCurrent}>
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
                      <span className={styles.tierRowSubtitle}>{band.subtitle}</span>
                    </div>
                    <span className={styles.tierRowRange}>{rangeText} XP</span>
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
            <div className={styles.streakStats}>
              <div className={styles.streakStat}>
                <span className={styles.streakStatLabel}>Best</span>
                <span className={styles.streakStatValue}>
                  {streakData.longestStreak}
                  <span className={styles.streakStatUnit}>{streakData.longestStreak === 1 ? 'day' : 'days'}</span>
                </span>
              </div>
              <div className={styles.streakStat}>
                <span className={styles.streakStatLabel}>Kept total</span>
                <span className={styles.streakStatValue}>{streakData.totalCompleted}</span>
              </div>
              <div className={styles.streakStat}>
                <span className={styles.streakStatLabel}>Keep rate</span>
                <span className={styles.streakStatValue}>
                  {pactStats.completionRate}
                  <span className={styles.streakStatUnit}>%</span>
                </span>
              </div>
            </div>
          </div>

          {/* Pact breakdown — folded into the same § so it reads as the
              "your record" detail underneath the streak hero. */}
          <div className={styles.pactBreakdown}>
            <div className={styles.pactStat}>
              <span className={styles.pactStatLabel}>
                <span className={`${styles.pactStatDot} ${styles.pactStatDotKept}`} />
                Kept
              </span>
              <span className={styles.pactStatValue}>{pactStats.completed}</span>
            </div>
            <div className={styles.pactStat}>
              <span className={styles.pactStatLabel}>
                <span className={`${styles.pactStatDot} ${styles.pactStatDotActive}`} />
                Active
              </span>
              <span className={styles.pactStatValue}>{pactStats.active}</span>
            </div>
            <div className={styles.pactStat}>
              <span className={styles.pactStatLabel}>
                <span className={`${styles.pactStatDot} ${styles.pactStatDotMissed}`} />
                Missed
              </span>
              <span className={styles.pactStatValue}>{pactStats.missed}</span>
            </div>
            <div className={styles.pactStat}>
              <span className={styles.pactStatLabel}>
                <span className={`${styles.pactStatDot} ${styles.pactStatDotRate}`} />
                Total
              </span>
              <span className={styles.pactStatValue}>{pactStats.total}</span>
            </div>
          </div>
        </section>

        {/* ─────────────── § 03 — Activity ─────────────── */}
        <section className={styles.section}>
          <SectionHeader
            number="03"
            title="Activity"
            caption="Calendar view"
          />
          <MonthlyCalendar userId={user.id} />
        </section>

        {/* ─────────────── § 04 — Sessions ─────────────── */}
        <section className={styles.section}>
          <SectionHeader
            number="04"
            title="Sessions"
            caption="Focus time"
          />
          <div className={styles.sessionsBlock}>
            <div className={styles.sessionsTotals}>
              <div className={styles.sessionsStat}>
                <span className={styles.sessionsStatLabel}>Lifetime</span>
                <span className={styles.sessionsStatValue}>{formatDuration(focusStats.totalMinutes)}</span>
              </div>
              <div className={styles.sessionsStat}>
                <span className={styles.sessionsStatLabel}>Sessions</span>
                <span className={styles.sessionsStatValue}>{focusStats.sessionsCount}</span>
              </div>
              <div className={styles.sessionsStat}>
                <span className={styles.sessionsStatLabel}>Avg session</span>
                <span className={styles.sessionsStatValue}>
                  {focusStats.avgDuration}
                  <span className={styles.streakStatUnit}>m</span>
                </span>
              </div>
            </div>

            <div className={styles.sessionsChart}>
              <span className={styles.sessionsChartTitle}>Last 7 days</span>
              {weekMinutes.map((mins, i) => (
                <div key={i} className={styles.chartRow}>
                  <span className={styles.chartDayLabel}>{weekDayLabels[i]}</span>
                  <div className={styles.chartTrack}>
                    <motion.div
                      className={`${styles.chartFill} ${mins === 0 ? styles.chartFillEmpty : ''}`}
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(100, (mins / weekMax) * 100)}%` }}
                      transition={{
                        duration: 0.6,
                        ease: [0.22, 1, 0.36, 1],
                        delay: 0.1 + i * 0.04,
                      }}
                    />
                  </div>
                  <span className={styles.chartValue}>{mins}m</span>
                </div>
              ))}
            </div>

            {groupedSessions.length === 0 ? (
              <div className={styles.empty}>
                <p>No focus sessions in the last 7 days.</p>
                <p className={styles.emptyHint}>The timer is waiting. Go lock in.</p>
              </div>
            ) : (
              <div className={styles.sessionsList}>
                <span className={styles.sessionsListTitle}>Recent sessions</span>
                {groupedSessions.map(({ date, sessions }) => (
                  <div key={date} className={styles.dayGroup}>
                    <div className={styles.dayHeader}>{formatDate(date)}</div>
                    <div className={styles.daySessions}>
                      {sessions.map(session => (
                        <div key={session.id} className={styles.sessionItem}>
                          <span className={styles.sessionTag}>Focus</span>
                          <span className={styles.sessionDuration}>
                            {session.duration_minutes} min
                          </span>
                          <span className={styles.sessionTime}>
                            {formatTime(session.started_at)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* ─────────────── § 05 — Achievements ─────────────── */}
        <section className={styles.section}>
          <SectionHeader
            number="05"
            title="Achievements"
            caption={`${earnedAchievements.length} of ${achievements.length} earned`}
          />
          {achievements.length === 0 ? (
            <div className={styles.empty}>
              <p>Achievements load after your first pact.</p>
            </div>
          ) : (
            <div className={styles.achGrid}>
              {achievements.map(a => (
                <div
                  key={a.key}
                  className={`${styles.achCard} ${a.unlocked ? '' : styles.achCardLocked}`}
                  title={`${a.name} — ${a.description}`}
                >
                  <div className={styles.achHeader}>
                    <span className={styles.achGlyph} aria-hidden="true">
                      {a.unlocked ? a.icon : '·'}
                    </span>
                    <span className={styles.achStatus}>
                      {a.unlocked ? 'Earned' : 'Locked'}
                    </span>
                  </div>
                  <div className={styles.achName}>{a.name}</div>
                  <div className={styles.achDesc}>{a.description}</div>
                  {a.unlocked && a.unlockedAt && (
                    <div className={styles.achDate}>{formatEarnedDate(a.unlockedAt)}</div>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
