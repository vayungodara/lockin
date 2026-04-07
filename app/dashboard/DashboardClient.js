'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence, LayoutGroup } from 'framer-motion';
import { createClient } from '@/lib/supabase/client';
import { useKeyboardShortcutsSafe } from '@/lib/KeyboardShortcutsContext';
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
    // Refresh TodayBar and XPBar when a pact status changes
    if (updatedPact.status === 'completed' || updatedPact.status === 'missed') {
      setRefreshKey(k => k + 1);
    }
  };


  const handleSignIn = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      
      if (error) {
        console.error('Error signing in:', error.message);
      }
    } catch (err) {
      console.error('Error signing in:', err);
    }
  };

  // Calculate stats
  const activePacts = pacts.filter(p => p.status === 'active');
  const completedPacts = pacts.filter(p => p.status === 'completed');

  // Dashboard shows active pacts first; if none, show a few recent completed ones
  const dashboardPacts = activePacts.length > 0
    ? activePacts
    : completedPacts.slice(0, 3);

  // If no user, show sign-in page
  const fullName = typeof user?.user_metadata?.full_name === 'string'
    ? user.user_metadata.full_name
    : '';
  const firstName = fullName ? fullName.split(' ')[0] : 'there';

  if (!user) {
    return (
      <div className={styles.authContainer}>
        <div className={styles.authCard}>
          <div className={styles.authLogo}>
            <span className={styles.logoIcon}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </span>
            <span className={styles.logoText}>LockIn</span>
          </div>
          
          <h1 className={styles.authTitle}>Welcome back</h1>
          <p className={styles.authDescription}>
            Sign in with your Google account to access your dashboard and start locking in.
          </p>
          
          <button onClick={handleSignIn} className={styles.googleButton}>
            <svg width="20" height="20" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Continue with Google
          </button>
          
          <p className={styles.authFooter}>
            By signing in, you agree to hold yourself accountable.
          </p>
          
          <Link href="/" className={styles.backLink}>
            ← Back to home
          </Link>
        </div>
      </div>
    );
  }

  // User is signed in - show dashboard
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
              {activePacts.length > 0 ? `${activePacts.length} pact${activePacts.length !== 1 ? 's' : ''} due` : 'No pacts due'}
              {' \u00b7 '}
              <span className={styles.streakHighlight}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ verticalAlign: 'text-bottom', marginRight: 2 }}>
                  <path d="M12 23C16.5 23 20 19.5 20 15.5C20 11.5 17 8 15 6C14.5 8 13 9.5 12 10C11.5 7 10 4 8 2C7 5 5 8.5 5 12C5 16 7.5 23 12 23Z" fill="#FF6B35" stroke="#E8530E" strokeWidth="1"/>
                  <path d="M12 23C14.5 23 16.5 20.5 16.5 17.5C16.5 14.5 14 12 13 11C12.5 13 12 14 11 14.5C10.5 12 10 10 9 8.5C8.5 11 7.5 13 7.5 15.5C7.5 19 9.5 23 12 23Z" fill="#FFB800" stroke="#FF9500" strokeWidth="0.5"/>
                </svg>
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
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 5V19M5 12H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
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
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M12 5V19M5 12H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
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
            <ActivityFeed pageSize={5} hideHeader />
          </div>
        </div>
    </div>
  );
}
