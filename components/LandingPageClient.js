'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import NavbarLanding from '@/components/NavbarLanding';
import { useToast } from '@/components/Toast';
import { createClient } from '@/lib/supabase/client';
import { ACCENT_PALETTES } from '@/lib/accentColors';
import styles from '../app/page.module.css';
import {
  buttonHover,
  buttonTap,
  cardHover,
  revealUp,
  ambientFloat,
  easeOutQuint,
  prefersReducedMotion,
  smoothTransition,
  quickTransition,
  staggerContainer,
  staggerItem,
} from '@/lib/animations';

export default function LandingPageClient({ isAuthenticated = false }) {
  const router = useRouter();
  const toast = useToast();
  const reducedMotion = prefersReducedMotion();
  const [checkedPacts, setCheckedPacts] = useState({ 0: true, 1: false, 2: false });

  const streakCount = 7 + Object.values(checkedPacts).filter(Boolean).length - 1;
  const allComplete = Object.values(checkedPacts).every(Boolean);

  const calendarLevels = [3,1,2,0,3,2,1,3,2,3,1,0,2,3,2,1,3,0,2,3,1,2,3,2,0,1,3,2];
  const checkedCount = Object.values(checkedPacts).filter(Boolean).length;
  const extraChecks = checkedCount - 1;
  let emptyFilled = 0;
  const activeLevels = calendarLevels.map((level) => {
    if (level === 0 && emptyFilled < extraChecks) {
      emptyFilled++;
      return 3;
    }
    return level;
  });

  const handleCta = async () => {
    if (isAuthenticated) {
      router.push('/dashboard');
      return;
    }
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    if (error) {
      toast.error('Sign in failed. Please try again.');
    }
  };

  return (
    <>
      <NavbarLanding />

      <main className={styles.main}>
        {/* ===== HERO SECTION ===== */}
        <section className={styles.hero}>
          <div className={styles.heroGrid}>
            {/* LEFT COLUMN — text content */}
            <div className={styles.heroContent}>
              {/* Pill tag */}
              <motion.div
                className={styles.heroTag}
                initial={{ opacity: 0, y: -14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: easeOutQuint }}
              >
                <span className={styles.heroTagDot} />
                Built for students
              </motion.div>

              {/* Headline */}
              <motion.h1
                className={styles.heroTitle}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.1, ease: easeOutQuint }}
              >
                Stop lying to<br />
                your <span className={styles.heroFaded}>future self.</span>
              </motion.h1>

              {/* Description */}
              <motion.p
                className={styles.heroDescription}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2, ease: easeOutQuint }}
              >
                The app that makes sure tomorrow actually comes.
                {' '}Track commitments, keep your group honest, and finally stop procrastinating.
              </motion.p>

              {/* Dual CTAs */}
              <motion.div
                className={styles.heroCtas}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3, ease: easeOutQuint }}
              >
                <motion.button
                  onClick={handleCta}
                  className={styles.ctaPrimary}
                  whileHover={buttonHover}
                  whileTap={buttonTap}
                >
                  Start Locking In
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                    <path d="M5 12H19M19 12L12 5M19 12L12 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </motion.button>
                <Link href="#how-it-works" className={styles.ctaOutline}>
                  See How It Works
                </Link>
              </motion.div>

              {/* Social proof */}
              <motion.div
                className={styles.socialProof}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.4, ease: easeOutQuint }}
              >
                <div className={styles.avatarStack}>
                  {['indigo', 'ocean', 'rose'].map((id, i) => (
                    <div
                      key={id}
                      className={styles.avatar}
                      style={{
                        backgroundColor: ACCENT_PALETTES.find(p => p.id === id).primary,
                        zIndex: 3 - i,
                      }}
                    />
                  ))}
                </div>
                <p>Join students who are finally getting things done.</p>
              </motion.div>
            </div>

            {/* RIGHT COLUMN — floating cards (desktop only) */}
            <div className={styles.heroVisual}>
              <div className={styles.decorativeRing} />

              {/* Completed pact card */}
              <motion.div
                className={`${styles.floatingCard} ${styles.cardCompleted}`}
                initial={{ opacity: 0, x: 30, y: 10 }}
                animate={{ opacity: 1, x: 0, y: reducedMotion ? 0 : [0, -8, 0] }}
                transition={{
                  opacity: { delay: 0.6, duration: 0.5, ease: easeOutQuint },
                  x: { delay: 0.6, duration: 0.5, ease: easeOutQuint },
                  ...(reducedMotion ? {} : { y: { delay: 1.2, duration: 3.5, repeat: Infinity, ease: 'easeInOut' } }),
                }}
              >
                <div className={styles.cardHeader}>
                  <div className={styles.cardBadge} data-status="done">Completed</div>
                  <span className={styles.cardTime}>2h ago</span>
                </div>
                <h4>Finish CS homework</h4>
                <p className={styles.cardBody}>Pact completed on time!</p>
                <div className={styles.cardFooter}>
                  <span className={styles.cardXp}>+25 XP earned</span>
                  <span>🔥 7 day streak</span>
                </div>
              </motion.div>

              {/* Active pact card */}
              <motion.div
                className={`${styles.floatingCard} ${styles.cardActive}`}
                initial={{ opacity: 0, x: -30, y: 10 }}
                animate={{ opacity: 1, x: 0, y: reducedMotion ? 0 : [0, -12, 0] }}
                transition={{
                  opacity: { delay: 0.8, duration: 0.5, ease: easeOutQuint },
                  x: { delay: 0.8, duration: 0.5, ease: easeOutQuint },
                  ...(reducedMotion ? {} : { y: { delay: 1.4, duration: 4, repeat: Infinity, ease: 'easeInOut' } }),
                }}
              >
                <div className={styles.cardTopRow}>
                  <div className={styles.cardIcon}>📚</div>
                  <div>
                    <h4>Read 30 pages</h4>
                    <span className={styles.cardSubtext}>Bio 201</span>
                  </div>
                </div>
                <div className={styles.cardProgress}>
                  <div className={styles.cardProgressHeader}>
                    <span>Time remaining</span>
                    <span className={styles.cardTimer}>06:00:00</span>
                  </div>
                  <div className={styles.progressBar}>
                    <div className={styles.progressFill} style={{ width: '45%' }} />
                  </div>
                </div>
                <div className={styles.cardWarning}>
                  ⚠️ Due today — your group is watching.
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* ===== DASHBOARD PREVIEW — Task 4 ===== */}

        {/* ===== FEATURES DARK SECTION — Task 5 ===== */}

        {/* ===== MARQUEE — Task 5 ===== */}

        {/* ===== HOW IT WORKS — Task 6 ===== */}

        {/* ===== CTA FOOTER — Task 6 ===== */}
      </main>
    </>
  );
}
