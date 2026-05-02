'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence, LayoutGroup } from 'framer-motion';
import { createClient } from '@/lib/supabase/client';
import { useKeyboardShortcutsSafe } from '@/lib/KeyboardShortcutsContext';
import { Plus } from '@phosphor-icons/react';
import { fadeInUp, buttonHover, buttonTap } from '@/lib/animations';
import { calculateStreak } from '@/lib/streaks';
import styles from './Dashboard.module.css';
import PactCard from '@/components/PactCard';
import ActivityFeed from '@/components/ActivityFeed';
import TodayBar from '@/components/TodayBar';
import OnboardingChecklist from '@/components/OnboardingChecklist';
import EmptyState from '@/components/EmptyState';
import { SkeletonCard } from '@/components/Skeleton';
import SectionHeader from '@/components/SectionHeader';
import Witnesses from '@/components/Witnesses';
import MonthlyCalendar from '@/components/MonthlyCalendar';
import AchievementsRail from '@/components/AchievementsRail';

// Helper to request the layout-level CreatePactModal to open
function requestCreatePact() {
  window.dispatchEvent(new CustomEvent('open-create-pact'));
}

export default function DashboardClient({ user }) {
  const [pacts, setPacts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const supabase = useMemo(() => createClient(), []);
  const { registerCallbacks, unregisterCallbacks } = useKeyboardShortcutsSafe();
  const [streakData, setStreakData] = useState({ currentStreak: 0, longestStreak: 0 });

  // Fetch streak data with timezone-aware calculation
  useEffect(() => {
    if (!user?.id) return;
    let timezone = 'UTC';
    try {
      timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
    } catch {
      // Intl API unavailable — fall back to UTC
    }
    calculateStreak(supabase, user.id, timezone).then(data => {
      setStreakData(data);
    }).catch(err => console.error('Error fetching streak:', err));
  }, [supabase, user?.id, refreshKey]);

  // Register keyboard shortcuts — delegate to layout-level CreatePactModal
  useEffect(() => {
    registerCallbacks({
      onNewPact: requestCreatePact,
    });

    return () => {
      unregisterCallbacks(['onNewPact']);
    };
  }, [registerCallbacks, unregisterCallbacks]);

  // Listen for pact-created events from the layout-level CreatePactModal
  useEffect(() => {
    const handlePactCreated = (e) => {
      if (e.detail) {
        setPacts(prev => [...prev, e.detail].sort((a, b) => new Date(a.deadline) - new Date(b.deadline)));
      }
    };
    window.addEventListener('pact-created', handlePactCreated);
    return () => window.removeEventListener('pact-created', handlePactCreated);
  }, []);

  const fetchPacts = useCallback(async () => {
    try {
      setError(null);

      // Only call mark_overdue_pacts once per calendar day
      const today = new Date().toDateString();
      const lastCheck = localStorage.getItem('lastOverdueCheck');
      if (lastCheck !== today) {
        const { error: overdueError } = await supabase.rpc('mark_overdue_pacts');
        if (overdueError) {
          console.error('Error marking overdue pacts:', overdueError);
        } else {
          localStorage.setItem('lastOverdueCheck', today);
        }
      }

      // Dashboard renders today's grid plus headroom for due-today/overdue
      // counts in the TodayBar. limit=200 gives space for active+historical
      // so active pacts aren't pushed out by a long tail of completed/missed.
      // select('*') avoids drift with schema migrations that add new columns
      // (e.g. xp_reward, is_recurring).
      const { data, error } = await supabase
        .from('pacts')
        .select('*')
        .eq('user_id', user.id)
        .order('deadline', { ascending: true })
        .limit(200);

      if (error) throw error;

      setPacts(data || []);
    } catch (err) {
      console.error('Error fetching pacts:', err);
      setError('Failed to load pacts. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [supabase, user?.id]);

  // Fetch pacts on mount
  useEffect(() => {
    if (user?.id) {
      fetchPacts();
    }
  }, [user?.id, fetchPacts]);

  const handlePactUpdate = (updatedPact) => {
    setPacts(prev => prev.map(p => p.id === updatedPact.id ? updatedPact : p));
    // Refresh TodayBar on any status change (including undo back to active)
    setRefreshKey(k => k + 1);
  };

  // Calculate stats
  const activePacts = pacts.filter(p => p.status === 'active');
  const completedPacts = pacts.filter(p => p.status === 'completed');

  // Separate pacts due today from overdue pacts
  const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date(); todayEnd.setHours(23, 59, 59, 999);
  const pactsDueToday = activePacts.filter(p => {
    const d = new Date(p.deadline);
    return d >= todayStart && d <= todayEnd;
  });
  const overduePacts = activePacts.filter(p => new Date(p.deadline) < todayStart);

  // § 01 shows urgent pacts first (overdue + due today), with a wider window
  // than the legacy 3-card preview — the editorial grid wraps to fit. Cap at
  // 6 to keep the section punchy; if a user wants more they tap "View all".
  const urgentPacts = [...overduePacts, ...pactsDueToday];
  const sectionPacts = urgentPacts.length > 0
    ? urgentPacts.slice(0, 6)
    : activePacts.length > 0
      ? activePacts.slice(0, 6)
      : completedPacts.slice(0, 6);

  // User is signed in — middleware redirects unauthenticated users.
  return (
    <div className={styles.dashboardRoot}>
      {/* Stays at top — first impression. */}
      <TodayBar
        userId={user?.id}
        refreshKey={refreshKey}
        currentStreak={streakData.currentStreak}
        longestStreak={streakData.longestStreak}
      />

      {/* Onboarding self-hides once dismissed/complete; renders inline above
          the editorial sections so first-time users see the next step. */}
      <OnboardingChecklist userId={user?.id} onCreatePact={requestCreatePact} />

      {/* § 01 — Today's pacts: full-width editorial grid. */}
      <section className={styles.section}>
        <SectionHeader
          number="01"
          title="Today's pacts"
          action={
            <a href="/dashboard/pacts" className={styles.sectionAction}>
              View all
            </a>
          }
        />

        <AnimatePresence mode="wait">
          {isLoading ? (
            <motion.div
              key="skeletons"
              className={styles.pactGrid}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <SkeletonCard height="140px" />
              <SkeletonCard height="140px" />
              <SkeletonCard height="140px" />
            </motion.div>
          ) : error ? (
            <EmptyState
              key="error"
              floating={false}
              icon={
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ color: 'var(--danger)' }}>
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                  <path d="M12 8V12M12 16H12.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              }
              title="Something went wrong"
              description={error}
              action={
                <motion.button
                  className="btn btn-primary"
                  onClick={fetchPacts}
                  whileHover={buttonHover}
                  whileTap={buttonTap}
                >
                  Try again
                </motion.button>
              }
            />
          ) : pacts.length === 0 ? (
            <EmptyState
              key="empty"
              floating={false}
              title="No pacts yet."
              description="Add your first pact to start building a streak."
              action={
                <motion.button
                  className="btn btn-primary"
                  onClick={requestCreatePact}
                  whileHover={buttonHover}
                  whileTap={buttonTap}
                >
                  <Plus size={18} weight="bold" />
                  Create a pact
                </motion.button>
              }
            />
          ) : sectionPacts.length === 0 ? (
            <EmptyState
              key="none-today"
              floating={false}
              title="No pacts due today."
              description="Make one. Your streak depends on it."
              action={
                <motion.button
                  className="btn btn-primary"
                  onClick={requestCreatePact}
                  whileHover={buttonHover}
                  whileTap={buttonTap}
                >
                  <Plus size={18} weight="bold" />
                  Create a pact
                </motion.button>
              }
            />
          ) : (
            <motion.div
              key="pacts"
              variants={fadeInUp}
              initial="initial"
              animate="animate"
            >
              <LayoutGroup>
                <motion.div className={styles.pactGrid}>
                  <AnimatePresence mode="popLayout">
                    {sectionPacts.map((pact) => (
                      <motion.div
                        key={pact.id}
                        layout
                        initial={{ opacity: 0, scale: 0.96 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.96 }}
                        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                      >
                        <PactCard
                          pact={pact}
                          onUpdate={handlePactUpdate}
                        />
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </motion.div>
              </LayoutGroup>
            </motion.div>
          )}
        </AnimatePresence>
      </section>

      {/* § 02 + § 03 — Witnesses + Activity, side-by-side at ≥1024px. */}
      <div className={styles.mosaic2}>
        <section className={styles.section}>
          <SectionHeader
            number="02"
            title="Witnesses now"
            caption="LIVE"
          />
          <Witnesses userId={user?.id} />
        </section>

        <section className={styles.section}>
          <SectionHeader
            number="03"
            title="Activity"
            action={
              <a href="/dashboard/stats" className={styles.sectionAction}>
                View older
              </a>
            }
          />
          <ActivityFeed pageSize={6} hideHeader />
        </section>
      </div>

      {/* § 04 + § 05 — Stats + Achievements, side-by-side at ≥1024px. */}
      <div className={styles.mosaic2}>
        <section className={styles.section}>
          <SectionHeader
            number="04"
            title="Stats"
            action={
              <a href="/dashboard/stats" className={styles.sectionAction}>
                View all
              </a>
            }
          />
          <MonthlyCalendar userId={user?.id} />
        </section>

        <section className={styles.section}>
          <SectionHeader
            number="05"
            title="Achievements"
          />
          <AchievementsRail userId={user?.id} />
        </section>
      </div>
    </div>
  );
}
