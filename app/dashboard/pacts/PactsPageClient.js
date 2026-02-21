'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import styles from './PactsPage.module.css';
import CreatePactModal from '@/components/CreatePactModal';
import PactCard from '@/components/PactCard';

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
    setPacts([newPact, ...pacts]);
  };

  const handlePactUpdate = (updatedPact) => {
    setPacts(pacts.map(p => p.id === updatedPact.id ? updatedPact : p));
  };


  const handleDeletePact = async (pactId) => {
    try {
      const { error } = await supabase
        .from('pacts')
        .delete()
        .eq('id', pactId);

      if (error) throw error;
      setPacts(pacts.filter(p => p.id !== pactId));
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
        <div className={styles.loadingState}>
          <div className={styles.spinner}></div>
          <p>Loading your pacts...</p>
        </div>
      ) : filteredPacts.length === 0 ? (
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M9 11L12 14L22 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M21 12V19C21 19.5304 20.7893 20.0391 20.4142 20.4142C20.0391 20.7893 19.5304 21 19 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <h3>{filter === 'all' ? 'No pacts yet' : `No ${filter} pacts`}</h3>
          <p>{filter === 'all' ? 'Create your first pact to start building accountability.' : `You don't have any ${filter} pacts.`}</p>
          {filter === 'all' && (
            <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 5V19M5 12H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Create Your First Pact
            </button>
          )}
        </div>
      ) : (
        <div className={styles.pactsGrid}>
          {filteredPacts.map((pact) => (
            <PactCard
              key={pact.id}
              pact={pact}
              onUpdate={handlePactUpdate}
            />
          ))}
        </div>
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
