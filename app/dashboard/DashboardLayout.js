'use client';

import { useState, useCallback, useMemo, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { createClient } from '@/lib/supabase/client';
import { FocusProvider } from '@/lib/FocusContext';
import { KeyboardShortcutsProvider } from '@/lib/KeyboardShortcutsContext';
import { NotificationProvider } from '@/lib/NotificationContext';
import { pageTransition } from '@/lib/animations';
import Sidebar from '@/components/Sidebar';
import MobileNav from '@/components/MobileNav';
import ErrorBoundary from '@/components/ErrorBoundary';
import CommandPalette from '@/components/CommandPalette';
import CreatePactModal from '@/components/CreatePactModal';
import styles from './DashboardLayout.module.css';

export default function DashboardLayout({ user, children }) {
  const [sidebarExpanded, setSidebarExpanded] = useState(false);
  const [showCreatePact, setShowCreatePact] = useState(false);
  const pathname = usePathname();
  const supabase = useMemo(() => createClient(), []);

  // Detect and persist the user's IANA timezone so streak calculations
  // can bucket activity into their local day instead of UTC.
  // Migration needed: ALTER TABLE profiles ADD COLUMN IF NOT EXISTS timezone TEXT DEFAULT 'UTC';
  useEffect(() => {
    if (!user?.id) return;
    try {
      const detectedTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      if (detectedTimezone) {
        supabase
          .from('profiles')
          .update({ timezone: detectedTimezone })
          .eq('id', user.id)
          .then(() => {}); // fire-and-forget
      }
    } catch {
      // Intl API unavailable — timezone stays as DB default ('UTC')
    }
  }, [user?.id, supabase]);

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

  // Konami code easter egg
  useEffect(() => {
    const konamiCode = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'];
    let konamiIndex = 0;

    const handleKeyDown = (e) => {
      if (e.key === konamiCode[konamiIndex]) {
        konamiIndex++;
        if (konamiIndex === konamiCode.length) {
          import('@/lib/confetti').then(({ fireConfetti }) => {
            if (fireConfetti) fireConfetti();
          });
          konamiIndex = 0;
        }
      } else {
        konamiIndex = 0;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <FocusProvider>
      <NotificationProvider>
        <KeyboardShortcutsProvider>
          <div id="dashboard-layout" className={styles.layout}>
            <Sidebar user={user} onSignOut={handleSignOut} onExpandChange={handleExpandChange} />
            <MobileNav />
            <CommandPalette onCreatePact={() => setShowCreatePact(true)} />
            <CreatePactModal
              isOpen={showCreatePact}
              onClose={() => setShowCreatePact(false)}
              onPactCreated={() => setShowCreatePact(false)}
            />
            <main
              id="main-content"
              className={styles.main}
              style={{ marginLeft: sidebarExpanded ? 260 : 80 }}
            >
              <ErrorBoundary message="Something went wrong loading this page.">
                <motion.div
                  key={pathname}
                  initial={pageTransition.initial}
                  animate={pageTransition.animate}
                >
                  {children}
                </motion.div>
              </ErrorBoundary>
            </main>
          </div>
        </KeyboardShortcutsProvider>
      </NotificationProvider>
    </FocusProvider>
  );
}
