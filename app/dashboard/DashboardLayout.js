'use client';

import { useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import Sidebar from '@/components/Sidebar';
import MobileNav from '@/components/MobileNav';
import ErrorBoundary from '@/components/ErrorBoundary';
import styles from './DashboardLayout.module.css';

export default function DashboardLayout({ user, children }) {
  const [sidebarExpanded, setSidebarExpanded] = useState(false);
  const supabase = createClient();

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

  const handleExpandChange = useCallback((expanded) => {
    setSidebarExpanded(expanded);
  }, []);

  return (
    <div className={styles.layout}>
      <Sidebar user={user} onSignOut={handleSignOut} onExpandChange={handleExpandChange} />
      <MobileNav />
      <main 
        className={styles.main}
        style={{ marginLeft: sidebarExpanded ? 260 : 72 }}
      >
        <ErrorBoundary message="Something went wrong loading this page.">
          {children}
        </ErrorBoundary>
      </main>
    </div>
  );
}
