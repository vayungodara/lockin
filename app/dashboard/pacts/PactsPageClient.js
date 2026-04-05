'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence, LayoutGroup } from 'framer-motion';
import { createClient } from '@/lib/supabase/client';
import styles from './PactsPage.module.css';
import CreatePactModal from '@/components/CreatePactModal';
import PactCard from '@/components/PactCard';
import EmptyState from '@/components/EmptyState';
import { SkeletonRow } from '@/components/Skeleton';
import { fadeInUp } from '@/lib/animations';

export default function PactsPageClient({ user }) {
  const [pacts, setPacts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [filter, setFilter] = useState('all');
  const supabase = useMemo(() => createClient(), []);

  const fetchPacts = useCallback(async () => {
    try {
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
        .order('created_at', { ascending: false })
        .limit(500);

      if (error) throw error;

      setPacts(data || []);
    } catch (err) {
      console.error('Error fetching pacts:', err);
    } finally {
      setIsLoading(false);
    }
  }, [supabase, user.id]);

  useEffect(() => {
    fetchPacts();
  }, [fetchPacts]);

  const handlePactCreated = (newPact) => {
    setPacts(prev => [newPact, ...prev]);
  };

  const handlePactUpdate = (updatedPact) => {
    setPacts(prev => prev.map(p => p.id === updatedPact.id ? updatedPact : p));
  };

  const handleDeletePact = async (pactId) => {
    try {
      const { error } = await supabase
        .from('pacts')
        .delete()
        .eq('id', pactId);

      if (error) throw error;
      setPacts(prev => prev.filter(p => p.id !== pactId));
    } catch (err) {
      console.error('Error deleting pact:', err);
    }
  };

  // Filter pacts
  const filteredPacts = pacts.filter(pact => {
    if (filter === 'all') return true;
    if (filter === 'active') return pact.status === 'active';
    if (filter === 'completed') return pact.status === 'completed';
    if (filter === 'missed') return pact.status === 'missed';
    return true;
  });

  // Stats
  const activePacts = pacts.filter(p => p.status === 'active');
  const completedPacts = pacts.filter(p => p.status === 'completed');
  const missedPacts = pacts.filter(p => p.status === 'missed');

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1>My Pacts</h1>
          <p className={styles.subtitle}>{pacts.length} total pacts</p>
        </div>
        <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 5V19M5 12H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          New Pact
        </button>
      </div>

      {/* Stats Bar */}
      <div className={styles.statsBar}>
        <div className={styles.statItem}>
          <span className={styles.statValue}>{activePacts.length}</span>
          <span className={styles.statLabel}>Active</span>
        </div>
        <div className={styles.statDivider}></div>
        <div className={styles.statItem}>
          <span className={`${styles.statValue} ${styles.success}`}>{completedPacts.length}</span>
          <span className={styles.statLabel}>Completed</span>
        </div>
        <div className={styles.statDivider}></div>
        <div className={styles.statItem}>
          <span className={`${styles.statValue} ${styles.danger}`}>{missedPacts.length}</span>
          <span className={styles.statLabel}>Missed</span>
        </div>
        <div className={styles.statDivider}></div>
        <div className={styles.statItem}>
          <span className={styles.statValue}>
            {pacts.length > 0 ? Math.round((completedPacts.length / pacts.length) * 100) : 0}%
          </span>
          <span className={styles.statLabel}>Success Rate</span>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className={styles.filterTabs}>
        {[
          { key: 'all', label: 'All', count: pacts.length },
          { key: 'active', label: 'Active', count: activePacts.length },
          { key: 'completed', label: 'Completed', count: completedPacts.length },
          { key: 'missed', label: 'Missed', count: missedPacts.length },
        ].map(tab => (
          <button
            key={tab.key}
            className={`${styles.filterTab} ${filter === tab.key ? styles.active : ''}`}
            onClick={() => setFilter(tab.key)}
          >
            {filter === tab.key && (
              <motion.div
                layoutId="pacts-active-filter"
                className={styles.filterIndicator}
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              />
            )}
            <span className={styles.filterLabel}>{tab.label} ({tab.count})</span>
          </button>
        ))}
      </div>

      {/* Pacts List */}
      {isLoading ? (
        <div className={styles.pactsGrid}>
          <SkeletonRow />
          <SkeletonRow />
          <SkeletonRow />
        </div>
      ) : filteredPacts.length === 0 ? (
        <EmptyState
          icon={
            <svg width="120" height="120" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="55" cy="62" r="40" stroke="currentColor" strokeWidth="1.5" opacity="0.12" fill="rgba(var(--accent-primary-rgb), 0.03)" />
              <circle cx="55" cy="62" r="28" stroke="currentColor" strokeWidth="1.5" opacity="0.2" fill="rgba(var(--accent-primary-rgb), 0.05)" />
              <circle cx="55" cy="62" r="16" stroke="currentColor" strokeWidth="1.5" opacity="0.35" fill="rgba(var(--accent-primary-rgb), 0.08)" />
              <circle cx="55" cy="62" r="5" fill="currentColor" opacity="0.5" />
              <path d="M55 62L92 25" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.55" />
              <path d="M92 25L82 27" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.55" />
              <path d="M92 25L90 35" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.55" />
              <path d="M55 62L48 68" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.3" />
              <path d="M55 62L62 68" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.3" />
              <path d="M49 55L45 51" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.2" />
              <path d="M62 56L66 52" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.2" />
              <path d="M52 70L48 74" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.15" />
            </svg>
          }
          title={filter === 'all' ? 'No pacts yet? Your future self is judging you.' : `No ${filter} pacts`}
          description={
            filter === 'all'
              ? 'Create your first commitment and start building momentum.'
              : filter === 'completed' ? 'Nothing checked off yet. You got this.'
              : filter === 'missed' ? "Clean record so far. Let's keep it that way."
              : 'Time to commit to something new.'
          }
          action={filter === 'all' ? { label: '+ Create Your First Pact', onClick: () => setIsModalOpen(true) } : null}
        />
      ) : (
        <LayoutGroup>
          <motion.div className={styles.pactsGrid}>
            <AnimatePresence mode="popLayout">
              {filteredPacts.map((pact) => (
                <motion.div
                  key={pact.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                >
                  <PactCard
                    pact={pact}
                    onUpdate={handlePactUpdate}
                    onDelete={handleDeletePact}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        </LayoutGroup>
      )}

      {/* Create Pact Modal */}
      <CreatePactModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onPactCreated={handlePactCreated}
      />
    </div>
  );
}
