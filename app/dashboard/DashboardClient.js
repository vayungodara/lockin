'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence, LayoutGroup } from 'framer-motion';
import { createClient } from '@/lib/supabase/client';
import { useKeyboardShortcutsSafe } from '@/lib/KeyboardShortcutsContext';
import { Plus, Fire } from '@phosphor-icons/react';
import { fadeInUp, buttonHover, buttonTap, smoothTransition } from '@/lib/animations';
import { calculateStreak } from '@/lib/streaks';
import styles from './Dashboard.module.css';
import Link from 'next/link';
import PactCard from '@/components/PactCard';
import ActivityFeed from '@/components/ActivityFeed';
import TodayBar from '@/components/TodayBar';
import OnboardingChecklist from '@/components/OnboardingChecklist';
import XPBar from '@/components/XPBar';
import EmptyState from '@/components/EmptyState';
import { SkeletonCard } from '@/components/Skeleton';

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

      // Dashboard only displays up to 3 pacts. Fetch a small working set so
      // we can still classify overdue/due-today/active locally without
      // pulling the user's entire pact history. Full list is fetched by
      // the /dashboard/pacts page. Kept select('*') to avoid drift with
      // schema migrations that add new columns (e.g. xp_reward, is_recurring).
      const { data, error } = await supabase
        .from('pacts')
        .select('*')
        .eq('user_id', user.id)
        .order('deadline', { ascending: true })
        .limit(50);

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
    // Refresh TodayBar and XPBar on any status change (including undo back to active)
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

  // Dashboard shows pacts due today + overdue first; if none, show upcoming or recent completed
  const urgentPacts = [...overduePacts, ...pactsDueToday];
  const dashboardPacts = urgentPacts.length > 0
    ? urgentPacts.slice(0, 3)
    : activePacts.length > 0
      ? activePacts.slice(0, 3)
      : completedPacts.slice(0, 3);

  // User is signed in - show dashboard (middleware redirects unauthenticated users)
  return (
    <div className={styles.pageContent}>
      <motion.header
        className={styles.header}
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={smoothTransition}
      >
          <div>
            <h1 className={styles.pageTitle}>Dashboard</h1>
            <p className={styles.pageSubtitle}>
              {pactsDueToday.length > 0 ? `${pactsDueToday.length} pact${pactsDueToday.length !== 1 ? 's' : ''} due today` : 'No pacts due'}
              {overduePacts.length > 0 && ` \u00b7 ${overduePacts.length} overdue`}
              {' \u00b7 '}
              <span className={styles.streakHighlight}>
                <Fire size={16} weight="fill" color="var(--warning)" style={{ verticalAlign: 'text-bottom', display: 'inline' }} />{' '}
                {streakData.currentStreak > 0 ? `${streakData.currentStreak} day streak` : 'Start your streak'}
              </span>
            </p>
          </div>
          <motion.button
            className="btn btn-primary"
            onClick={requestCreatePact}
            whileHover={buttonHover}
            whileTap={buttonTap}
          >
            <Plus size={20} weight="bold" />
            New Pact
          </motion.button>
        </motion.header>

        <XPBar userId={user?.id} refreshKey={refreshKey} />

        <TodayBar
          userId={user?.id}
          refreshKey={refreshKey}
          currentStreak={streakData.currentStreak}
          longestStreak={streakData.longestStreak}
        />

        <OnboardingChecklist userId={user?.id} onCreatePact={requestCreatePact} />

        {/* Two-column grid: Pacts + Activity */}
        <div className={styles.dashboardGrid}>
          {/* Left column: Pacts */}
          <div className={styles.pactsColumn}>
            <AnimatePresence mode="wait">
              {isLoading ? (
                <motion.div
                  key="skeletons"
                  className={styles.pactsGrid}
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
                      Try Again
                    </motion.button>
                  }
                />
              ) : pacts.length === 0 ? (
                <EmptyState
                  key="empty"
                  icon={
                    <svg width="80" height="80" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M40 12C40 12 28 28 28 46C28 54 33 60 40 60C47 60 52 54 52 46C52 28 40 12 40 12Z" stroke="var(--accent-primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="rgba(var(--accent-primary-rgb), 0.08)" />
                      <circle cx="40" cy="36" r="5" stroke="var(--accent-primary)" strokeWidth="2" fill="rgba(var(--accent-primary-rgb), 0.08)" />
                      <path d="M28 50C28 50 20 52 18 58C18 58 24 58 28 56" stroke="var(--accent-primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="rgba(var(--accent-primary-rgb), 0.08)" />
                      <path d="M52 50C52 50 60 52 62 58C62 58 56 58 52 56" stroke="var(--accent-primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="rgba(var(--accent-primary-rgb), 0.08)" />
                      <path d="M36 60C36 60 38 68 40 72C42 68 44 60 44 60" stroke="var(--accent-primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity="0.5" />
                      <path d="M38 60C38 60 39 65 40 67C41 65 42 60 42 60" stroke="var(--accent-primary)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.3" />
                    </svg>
                  }
                  title="Nothing here yet. Go make something happen."
                  description="Create your first pact and start holding yourself accountable."
                  action={
                    <motion.button
                      className="btn btn-primary"
                      onClick={requestCreatePact}
                      whileHover={buttonHover}
                      whileTap={buttonTap}
                    >
                      <Plus size={20} weight="bold" />
                      Create Your First Pact
                    </motion.button>
                  }
                />
              ) : (
                <motion.div
                  key="pacts"
                  className={styles.pactsSection}
                  variants={fadeInUp}
                  initial="initial"
                  animate="animate"
                >
                  <div className={styles.sectionHeader}>
                    <h2>{activePacts.length > 0 ? "Today\u2019s Pacts" : 'Recent Pacts'}</h2>
                    <Link href="/dashboard/pacts" className={styles.viewAllLink}>View all</Link>
                  </div>
                  <LayoutGroup>
                    <motion.div className={styles.pactsGrid}>
                      <AnimatePresence mode="popLayout">
                        {dashboardPacts.map((pact) => (
                          <motion.div
                            key={pact.id}
                            layout
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            transition={{ type: "spring", stiffness: 500, damping: 30 }}
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
          </div>

          {/* Right column: Activity */}
          <div className={styles.activityColumn}>
            <div className={styles.sectionHeader}>
              <h2>Activity</h2>
            </div>
            <ActivityFeed pageSize={3} hideHeader />
            <div className={styles.activityFooter}>
              <Link href="/dashboard/stats" className={styles.activityFooterLink}>View Older Activity &rarr;</Link>
            </div>
          </div>
        </div>
    </div>
  );
}
