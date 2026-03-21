'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence, LayoutGroup } from 'framer-motion';
import { createClient } from '@/lib/supabase/client';
import styles from './PactsPage.module.css';
import CreatePactModal from '@/components/CreatePactModal';
import PactCard from '@/components/PactCard';
import { SkeletonRow } from '@/components/Skeleton';

export default function PactsPageClient({ user }) {
  const [pacts, setPacts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [filter, setFilter] = useState('all');
  const supabase = useMemo(() => createClient(), []);

  const fetchPacts = useCallback(async () => {
    try {
      const { error: overdueError } = await supabase.rpc('mark_overdue_pacts');
      if (overdueError) {
        console.error('Error marking overdue pacts:', overdueError);
      }

      const { data, error } = await supabase
        .from('pacts')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setPacts(data || []);
    } catch (err) {
      console.error('Error fetching pacts:', err);
    } finally {
      setIsLoading(false);
    }
  }, [supabase, user]);

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
        <button 
          className={`${styles.filterTab} ${filter === 'all' ? styles.active : ''}`}
          onClick={() => setFilter('all')}
        >
          All ({pacts.length})
        </button>
        <button 
          className={`${styles.filterTab} ${filter === 'active' ? styles.active : ''}`}
          onClick={() => setFilter('active')}
        >
          Active ({activePacts.length})
        </button>
        <button 
          className={`${styles.filterTab} ${filter === 'completed' ? styles.active : ''}`}
          onClick={() => setFilter('completed')}
        >
          Completed ({completedPacts.length})
        </button>
        <button 
          className={`${styles.filterTab} ${filter === 'missed' ? styles.active : ''}`}
          onClick={() => setFilter('missed')}
        >
          Missed ({missedPacts.length})
        </button>
      </div>

      {/* Pacts List */}
      {isLoading ? (
        <div className={styles.pactsGrid}>
          <SkeletonRow />
          <SkeletonRow />
          <SkeletonRow />
        </div>
      ) : filteredPacts.length === 0 ? (
        <div className={styles.emptyState}>
          <span className={styles.emptyEmoji}>{filter === 'all' ? '\uD83D\uDD12' : '\uD83D\uDC40'}</span>
          <h3 className={styles.emptyTitle}>
            {filter === 'all' ? 'Suspiciously empty.' : `No ${filter} pacts.`}
          </h3>
          <p className={styles.emptySubtext}>
            {filter === 'all'
              ? 'Time to put some skin in the game. Create your first pact and lock in.'
              : `Nothing here yet. Go make some ${filter === 'completed' ? 'progress' : filter === 'missed' ? 'better choices' : 'commitments'}.`}
          </p>
          {filter === 'all' && (
            <button className="btn btn-primary" onClick={() => setIsModalOpen(true)} style={{ marginTop: 'var(--space-2)' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 5V19M5 12H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Create Your First Pact
            </button>
          )}
        </div>
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
