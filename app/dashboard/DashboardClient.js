'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence, LayoutGroup } from 'framer-motion';
import { createClient } from '@/lib/supabase/client';
import { useKeyboardShortcutsSafe } from '@/lib/KeyboardShortcutsContext';
import { staggerContainer, staggerItem, fadeInUp, cardHover, buttonHover, buttonTap, smoothTransition } from '@/lib/animations';
import styles from './Dashboard.module.css';
import Link from 'next/link';
import CreatePactModal from '@/components/CreatePactModal';
import PactCard from '@/components/PactCard';
import ActivityFeed from '@/components/ActivityFeed';
import CompactActivityCard from '@/components/CompactActivityCard';
import DailySummaryCard from '@/components/DailySummaryCard';
import OnboardingModal from '@/components/OnboardingModal';
import XPBar from '@/components/XPBar';

function AnimatedCounter({ value }) {
  const [displayValue, setDisplayValue] = useState(value === 0 ? 0 : null);
  
  useEffect(() => {
    if (value === 0) {
      return;
    }
    
    let start = 0;
    const duration = 800;
    const increment = value / (duration / 16);
    
    const timer = setInterval(() => {
      start += increment;
      if (start >= value) {
        setDisplayValue(value);
        clearInterval(timer);
      } else {
        setDisplayValue(Math.floor(start));
      }
    }, 16);
    
    return () => clearInterval(timer);
  }, [value]);
  
  return <span>{displayValue ?? 0}</span>;
}

export default function DashboardClient({ user }) {
  const [pacts, setPacts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const supabase = useMemo(() => createClient(), []);
  const { registerCallbacks, unregisterCallbacks } = useKeyboardShortcutsSafe();

  // Register keyboard shortcuts
  useEffect(() => {
    registerCallbacks({
      onNewPact: () => setIsModalOpen(true),
      onCloseModal: () => setIsModalOpen(false),
    });

    return () => {
      unregisterCallbacks(['onNewPact', 'onCloseModal']);
    };
  }, [registerCallbacks, unregisterCallbacks]);

  const fetchPacts = useCallback(async () => {
    try {
      setError(null);
      const { error: overdueError } = await supabase.rpc('mark_overdue_pacts');
      if (overdueError) {
        console.error('Error marking overdue pacts:', overdueError);
      }

      const { data, error } = await supabase
        .from('pacts')
        .select('*')
        .eq('user_id', user.id)
        .order('deadline', { ascending: true });

      if (error) throw error;
      
      setPacts(data || []);
    } catch (err) {
      console.error('Error fetching pacts:', err);
      setError('Failed to load pacts. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [supabase, user]);

  // Fetch pacts on mount
  useEffect(() => {
    if (user) {
      fetchPacts();
    }
  }, [user, fetchPacts]);

  const handlePactCreated = (newPact) => {
    setPacts([...pacts, newPact].sort((a, b) => new Date(a.deadline) - new Date(b.deadline)));
  };

  const handlePactUpdate = (updatedPact) => {
    setPacts(pacts.map(p => p.id === updatedPact.id ? updatedPact : p));
    // Refresh DailySummaryCard and XPBar when a pact status changes
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

  const handleSignOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Error signing out:', error.message || error);
      }
      window.location.href = '/';
    } catch (err) {
      console.error('Error signing out:', err);
    }
  };

  // Calculate stats
  const activePacts = pacts.filter(p => p.status === 'active');
  const completedPacts = pacts.filter(p => p.status === 'completed');
  const missedPacts = pacts.filter(p => p.status === 'missed');

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
    <>
      <motion.header 
        className={styles.header}
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={smoothTransition}
      >
          <div>
            <h1 className={styles.greeting}>
              Welcome back, {firstName}!
            </h1>
            <p className={styles.subGreeting}>Ready to lock in today?</p>
            <XPBar userId={user?.id} refreshKey={refreshKey} />
          </div>
          <motion.button 
            className="btn btn-primary" 
            onClick={() => setIsModalOpen(true)}
            whileHover={buttonHover}
            whileTap={buttonTap}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 5V19M5 12H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            New Pact
          </motion.button>
        </motion.header>
        
        <DailySummaryCard userId={user?.id} refreshKey={refreshKey} />

        {/* Stats Overview */}
        <motion.div
          className={styles.statsGrid}
          variants={staggerContainer}
          initial="initial"
          animate="animate"
        >
          <motion.div className={styles.statCard} variants={staggerItem} whileHover={cardHover}>
            <div className={styles.statIcon}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M22 11.08V12C21.9988 14.1564 21.3005 16.2547 20.0093 17.9818C18.7182 19.709 16.9033 20.9725 14.8354 21.5839C12.7674 22.1953 10.5573 22.1219 8.53447 21.3746C6.51168 20.6273 4.78465 19.2461 3.61096 17.4371C2.43727 15.628 1.87979 13.4881 2.02168 11.3363C2.16356 9.18455 2.99721 7.13631 4.39828 5.49706C5.79935 3.85781 7.69279 2.71537 9.79619 2.24013C11.8996 1.7649 14.1003 1.98232 16.07 2.85999" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M22 4L12 14.01L9 11.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <div className={styles.statContent}>
              <span className={styles.statValue}><AnimatedCounter value={completedPacts.length} /></span>
              <span className={styles.statLabel}>Pacts Completed</span>
            </div>
          </motion.div>
          
          <motion.div className={styles.statCard} variants={staggerItem} whileHover={cardHover}>
            <div className={`${styles.statIcon} ${styles.warning}`}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                <path d="M12 6V12L16 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </div>
            <div className={styles.statContent}>
              <span className={styles.statValue}><AnimatedCounter value={activePacts.length} /></span>
              <span className={styles.statLabel}>Active Pacts</span>
            </div>
          </motion.div>
          
          <motion.div className={styles.statCard} variants={staggerItem} whileHover={cardHover}>
            <div className={`${styles.statIcon} ${styles.danger}`}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <div className={styles.statContent}>
              <span className={styles.statValue}><AnimatedCounter value={missedPacts.length} /></span>
              <span className={styles.statLabel}>Missed</span>
            </div>
          </motion.div>
          
          <motion.div className={styles.statCard} variants={staggerItem} whileHover={cardHover}>
            <div className={`${styles.statIcon} ${styles.accent}`}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M13 2L3 14H12L11 22L21 10H12L13 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <div className={styles.statContent}>
              <span className={styles.statValue}><AnimatedCounter value={pacts.length} /></span>
              <span className={styles.statLabel}>Total Pacts</span>
            </div>
          </motion.div>
        </motion.div>
        
        {/* Pacts List or Empty State */}
        {isLoading ? (
          <div className={styles.loadingState}>
            <div className={styles.spinner}></div>
            <p>Loading your pacts...</p>
          </div>
        ) : error ? (
          <motion.div 
            className={styles.emptyState}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <div className={styles.emptyIcon} style={{ color: 'var(--danger)' }}>
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                <path d="M12 8V12M12 16H12.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </div>
            <h3>Something went wrong</h3>
            <p>{error}</p>
            <motion.button 
              className="btn btn-primary" 
              onClick={fetchPacts}
              whileHover={buttonHover}
              whileTap={buttonTap}
            >
              Try Again
            </motion.button>
          </motion.div>
        ) : pacts.length === 0 ? (
          <motion.div 
            className={styles.emptyState}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
          >
            <div className={styles.emptyIcon}>
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M9 11L12 14L22 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M21 12V19C21 19.5304 20.7893 20.0391 20.4142 20.4142C20.0391 20.7893 19.5304 21 19 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <h3>No pacts yet</h3>
            <p>Create your first pact to start building accountability.</p>
            <motion.button 
              className="btn btn-primary" 
              onClick={() => setIsModalOpen(true)}
              whileHover={buttonHover}
              whileTap={buttonTap}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 5V19M5 12H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Create Your First Pact
            </motion.button>
          </motion.div>
        ) : (
          <motion.div className={styles.pactsSection} variants={fadeInUp} initial="initial" animate="animate">
            <div className={styles.sectionHeader}>
              <h2>{activePacts.length > 0 ? 'Active Pacts' : 'Recent Pacts'}</h2>
              <a href="/dashboard/pacts" className={styles.viewAllLink}>View all</a>
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

        {!isLoading && pacts.length > 0 && (
          <motion.div 
            className={styles.activitySection}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...smoothTransition, delay: 0.3 }}
          >
            <CompactActivityCard userId={user?.id} />
          </motion.div>
        )}

        {!isLoading && pacts.length > 0 && (
          <motion.div 
            className={styles.activitySection}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...smoothTransition, delay: 0.4 }}
          >
            <ActivityFeed pageSize={10} />
          </motion.div>
        )}
      
      <CreatePactModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onPactCreated={handlePactCreated}
      />

      <OnboardingModal userId={user?.id} onCreatePact={() => setIsModalOpen(true)} />
    </>
  );
}
