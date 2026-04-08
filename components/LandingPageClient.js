'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { DM_Sans } from 'next/font/google';
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

const dmSans = DM_Sans({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-body',
  weight: ['400', '500', '600'],
});

export default function LandingPageClient({ isAuthenticated = false, returnTo }) {
  const router = useRouter();
  const toast = useToast();
  const reducedMotion = prefersReducedMotion();
  const [checkedPacts, setCheckedPacts] = useState({ 0: true, 1: false, 2: false });

  const checkedCount = Object.values(checkedPacts).filter(Boolean).length;
  const streakCount = 7 + checkedCount - 1;
  const allComplete = Object.values(checkedPacts).every(Boolean);

  const calendarLevels = [3,1,2,0,3,2,1,3,2,3,1,0,2,3,2,1,3,0,2,3,1,2,3,2,0,1,3,2];
  const extraChecks = checkedCount - 1;
  const activeLevels = (() => {
    let filled = 0;
    return calendarLevels.map((level) => {
      if (level === 0 && filled < extraChecks) {
        filled++;
        return 3;
      }
      return level;
    });
  })();

  const handleCta = async () => {
    if (isAuthenticated) {
      router.push('/dashboard');
      return;
    }
    const supabase = createClient();
    const callbackUrl = new URL('/auth/callback', window.location.origin);
    if (returnTo && typeof returnTo === 'string' && returnTo.startsWith('/') && !returnTo.startsWith('//')) {
      callbackUrl.searchParams.set('next', returnTo);
    }
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: callbackUrl.toString(),
      },
    });
    if (error) {
      toast.error('Sign in failed. Please try again.');
    }
  };

  return (
    <div className={dmSans.variable}>
      <NavbarLanding />

      <main id="main-content" className={styles.main}>
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
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
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
                        backgroundColor: ACCENT_PALETTES.find(p => p.id === id)?.primary || '#5B5EF5',
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
        <section className={styles.appPreview}>
          <motion.div
            className={styles.sectionHeader}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ amount: 0.15, once: true }}
            transition={{ duration: 0.5, ease: easeOutQuint }}
          >
            <h2>
              Your accountability{' '}
              <span className={styles.textGradient}>command center</span>.
            </h2>
            <p>
              Not another to-do list you&apos;ll ignore. A real-time dashboard
              tracking your pacts, streaks, and who&apos;s actually delivering.
            </p>
          </motion.div>

          <motion.div
            className={styles.browserFrame}
            aria-hidden="true"
            role="presentation"
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ amount: 0.1, once: true }}
            transition={{ duration: 0.6, ease: easeOutQuint }}
          >
            {/* Browser chrome bar */}
            <div className={styles.browserBar}>
              <div className={styles.browserDots}>
                <span className={styles.dotRed} />
                <span className={styles.dotYellow} />
                <span className={styles.dotGreen} />
              </div>
              <div className={styles.browserUrl}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                  <rect
                    x="3"
                    y="11"
                    width="18"
                    height="11"
                    rx="2"
                    stroke="currentColor"
                    strokeWidth="2"
                  />
                  <path
                    d="M7 11V7C7 4.24 9.24 2 12 2C14.76 2 17 4.24 17 7V11"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
                lockin.app/dashboard
              </div>
            </div>

            {/* Mock dashboard layout */}
            <div className={styles.mockDashboard}>
              {/* Sidebar */}
              <div className={styles.mockSidebar}>
                <div className={styles.mockSidebarLogo}>
                  <div className={styles.mockLogoIcon} />
                </div>
                <div className={styles.mockNavItems}>
                  {[
                    {
                      label: 'Overview',
                      active: true,
                      svg: (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                          <path d="M3 9L12 2L21 9V20C21 21.1 20.1 22 19 22H5C3.9 22 3 21.1 3 20V9Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      ),
                    },
                    {
                      label: 'Pacts',
                      svg: (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                          <path d="M12 6V12L16 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                        </svg>
                      ),
                    },
                    {
                      label: 'Groups',
                      svg: (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                          <path d="M17 21V19C17 16.79 15.21 15 13 15H5C2.79 15 1 16.79 1 19V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                          <circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="2"/>
                        </svg>
                      ),
                    },
                    {
                      label: 'Timer',
                      svg: (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                          <path d="M12 6V12L16 16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                        </svg>
                      ),
                    },
                    {
                      label: 'Stats',
                      svg: (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                          <path d="M22 12H18L15 21L9 3L6 12H2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      ),
                    },
                  ].map((item) => (
                    <div
                      key={item.label}
                      className={`${styles.mockNavItem} ${item.active ? styles.mockNavActive : ''}`}
                    >
                      {item.svg}
                    </div>
                  ))}
                </div>
              </div>

              {/* Main content area */}
              <div className={styles.mockMain}>
                {/* Header with streak badge */}
                <div className={styles.mockHeader}>
                  <div className={styles.mockHeaderText}>
                    <h3>Today&apos;s Pacts</h3>
                  </div>
                  <div className={styles.mockStreakBadge}>
                    <span>🔥</span>
                    <AnimatePresence mode="popLayout">
                      <motion.span
                        key={streakCount}
                        initial={{ y: 8, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: -8, opacity: 0 }}
                        transition={{ ...quickTransition, duration: 0.25 }}
                      >
                        {streakCount} day streak
                      </motion.span>
                    </AnimatePresence>
                  </div>
                </div>

                {/* Pact cards with colored left borders */}
                <div className={styles.mockCards}>
                  {[
                    {
                      title: 'Finish CS homework',
                      meta: 'Due today',
                      status: 'done',
                      statusLabel: 'Done',
                      color: 'green',
                    },
                    {
                      title: 'Read 30 pages',
                      meta: '6 hours left',
                      status: 'progress',
                      statusLabel: 'In Progress',
                      color: 'amber',
                    },
                    {
                      title: 'Go to the gym',
                      meta: 'Tomorrow',
                      status: 'upcoming',
                      statusLabel: 'Upcoming',
                      color: 'indigo',
                    },
                  ].map((pact, i) => (
                    <motion.div
                      key={pact.title}
                      className={styles.mockPactCard}
                      initial={{ opacity: 0, x: -10 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ amount: 0.1, once: true }}
                      transition={{
                        ...smoothTransition,
                        delay: 0.3 + i * 0.1,
                        duration: 0.4,
                      }}
                    >
                      <div
                        className={`${styles.mockCardBorder} ${styles[`border${pact.color.charAt(0).toUpperCase() + pact.color.slice(1)}`]}`}
                      />
                      <div className={styles.mockPactContent}>
                        <div className={styles.mockPactHeader}>
                          <div className={styles.mockPactTop}>
                            <span
                              className={`${styles.statusBadge} ${styles[`status${pact.color.charAt(0).toUpperCase() + pact.color.slice(1)}`]}`}
                            >
                              {pact.statusLabel}
                            </span>
                            <span className={styles.mockPactMeta}>
                              {pact.meta}
                            </span>
                          </div>
                          <div className={styles.mockPactRow}>
                            <motion.button
                              className={`${styles.mockCheckbox} ${!checkedPacts[i] ? styles.mockUnchecked : ''}`}
                              onClick={() =>
                                setCheckedPacts((prev) => ({
                                  ...prev,
                                  [i]: !prev[i],
                                }))
                              }
                              tabIndex={-1}
                              whileTap={{ scale: 0.85 }}
                              animate={
                                checkedPacts[i]
                                  ? { scale: [1, 1.2, 1] }
                                  : { scale: 1 }
                              }
                              transition={{ duration: 0.25 }}
                            >
                              <motion.svg
                                width="10"
                                height="10"
                                viewBox="0 0 24 24"
                                fill="none"
                                initial={false}
                                animate={{
                                  opacity: checkedPacts[i] ? 1 : 0,
                                  scale: checkedPacts[i] ? 1 : 0.5,
                                }}
                                transition={{ duration: 0.15 }}
                              >
                                <path
                                  d="M20 6L9 17L4 12"
                                  stroke="white"
                                  strokeWidth="3"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                />
                              </motion.svg>
                            </motion.button>
                            <span
                              className={styles.mockPactTitle}
                              style={{
                                textDecoration: checkedPacts[i]
                                  ? 'line-through'
                                  : 'none',
                                opacity: checkedPacts[i] ? 0.4 : 1,
                              }}
                            >
                              {pact.title}
                            </span>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>

                {/* Activity calendar */}
                <motion.div
                  className={styles.mockCalendar}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ amount: 0.1, once: true }}
                  transition={{
                    duration: 0.5,
                    delay: 0.6,
                    ease: easeOutQuint,
                  }}
                >
                  <div className={styles.mockCalendarHeader}>
                    <span>Activity</span>
                    <span className={styles.mockCalendarMonth}>January</span>
                  </div>
                  <div className={styles.mockCalendarGrid}>
                    {activeLevels.map((level, i) => (
                      <motion.div
                        key={i}
                        className={`${styles.mockCalendarCell} ${styles[`mockLevel${level}`]}`}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.3 }}
                      />
                    ))}
                  </div>
                </motion.div>
              </div>
            </div>
          </motion.div>

          {/* Celebration when all pacts checked */}
          <AnimatePresence>
            {allComplete && (
              <motion.div
                className={styles.mockCelebration}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                transition={{ duration: 0.5, ease: easeOutQuint }}
              >
                <p>See? That felt good. Imagine that every day.</p>
                <motion.button
                  onClick={handleCta}
                  className={styles.ctaPrimary}
                  whileHover={buttonHover}
                  whileTap={buttonTap}
                >
                  Start Locking In
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <path
                      d="M5 12H19M19 12L12 5M19 12L12 19"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>
        </section>

        {/* ===== FEATURES DARK SECTION — Task 5 ===== */}
        <section id="features" className={styles.featuresDark}>
          <div className={styles.featuresInner}>
            <motion.div className={styles.featuresLeft}
              initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }}
              viewport={{ amount: 0.1, once: true }} transition={{ duration: 0.6, ease: easeOutQuint }}>
              <h2 className={styles.featuresHeading}>Why you&apos;ll actually do it this time.</h2>
              <p className={styles.featuresDescription}>
                Standard to-do lists rely on motivation. Motivation fades. LockIn relies on two
                irrefutable human truths: we care what our friends think, and streaks are addictive.
              </p>
              <ul className={styles.featureChecklist}>
                {['Google OAuth — 5-second signup', 'Real-time activity feed', 'XP, levels & achievements'].map((item) => (
                  <li key={item} className={styles.featureCheckItem}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                      <circle cx="12" cy="12" r="10" fill="var(--accent-primary)" opacity="0.2"/>
                      <path d="M9 12L11 14L15 10" stroke="var(--accent-primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    {item}
                  </li>
                ))}
              </ul>
            </motion.div>

            <div className={styles.featuresRight}>
              {/* Wide card: Personal Pacts */}
              <motion.div className={`${styles.bentoCard} ${styles.bentoWide}`}
                initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ amount: 0.1, once: true }} transition={{ duration: 0.5, ease: easeOutQuint }}
                whileHover={cardHover}>
                <h3>Personal Pacts</h3>
                <p>Make commitments that stick. Set deadlines, track daily check-ins, build accountability streaks. Choose from 20+ pact templates or create your own.</p>
                <div className={styles.bentoReward}>
                  <div className={styles.bentoRewardLabel}>Active Pact</div>
                  <div className={styles.bentoRewardStatus}>&#10003; Completed on time</div>
                  <div className={styles.bentoRewardXp}>+50 XP</div>
                </div>
              </motion.div>

              {/* Half card: Group Accountability */}
              <motion.div className={styles.bentoCard}
                initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ amount: 0.1, once: true }} transition={{ duration: 0.5, delay: 0.1, ease: easeOutQuint }}
                whileHover={cardHover}>
                <h3>Group Accountability</h3>
                <p>See who is pulling their weight and who is slacking. Kanban boards, task ownership, real-time activity. No more carrying the team alone.</p>
                <div className={styles.bentoAvatars}>
                  <div className={styles.bentoAvatar} style={{ background: '#3B82F6' }} />
                  <div className={styles.bentoAvatar} style={{ background: '#10B981' }} />
                  <div className={styles.bentoAvatarMore}>+4</div>
                </div>
              </motion.div>

              {/* Half card: Focus Timer */}
              <motion.div className={`${styles.bentoCard} ${styles.bentoTimer}`}
                initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ amount: 0.1, once: true }} transition={{ duration: 0.5, delay: 0.2, ease: easeOutQuint }}
                whileHover={cardHover}>
                <h3>Focus Timer</h3>
                <p>Pomodoro-style deep work sessions. Track your focus hours, compete with your past self, and earn XP for every session.</p>
                <div className={styles.bentoTimerDisplay}>25:00</div>
                <div className={styles.bentoTimerGlow} />
              </motion.div>
            </div>
          </div>
        </section>

        {/* ===== MARQUEE — Task 5 ===== */}
        <div className={styles.marquee} role="marquee">
          <div className={styles.marqueeTrack}>
            {[...Array(4)].map((_, i) => (
              <span key={i} className={styles.marqueeSegment} aria-hidden={i > 0 ? 'true' : undefined}>
                <span className={styles.marqueeText}>STOP SAYING TOMORROW. LOCK IN TODAY.</span>
                <span className={styles.marqueeDot}>&bull;</span>
              </span>
            ))}
          </div>
        </div>

        {/* ===== HOW IT WORKS — Task 6 ===== */}
        <section id="how-it-works" className={styles.howItWorks}>
          <div className={styles.stepsInner}>
            <motion.div className={styles.stepsLeft}
              initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }}
              viewport={{ amount: 0.1, once: true }} transition={{ duration: 0.6, ease: easeOutQuint }}>
              <h2 className={styles.stepsHeading}>Get started in 3 steps.</h2>
              <p className={styles.stepsDescription}>
                No complicated setup. No learning curve. Just accountability that actually works.
              </p>
              <div className={styles.stepsArrow}>
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" opacity="0.15">
                  <path d="M7 7L17 17M17 17V7M17 17H7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
            </motion.div>

            <div className={styles.stepsRight}>
              {/* Step 1: Sign in with Google */}
              <motion.div className={styles.timelineStep}
                initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ amount: 0.1, once: true }} transition={{ duration: 0.5, ease: easeOutQuint }}>
                <div className={styles.stepNumber}>01</div>
                <div className={styles.stepDot} />
                <h3 className={styles.stepTitle}>Sign in with Google</h3>
                <p className={styles.stepText}>
                  Use your university email. Takes 5 seconds. No passwords to remember, no forms to fill out.
                </p>
                <div className={styles.googleMockup}>
                  <div className={styles.googleIcon}>
                    <svg width="20" height="20" viewBox="0 0 24 24">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                    </svg>
                  </div>
                  <div className={styles.googleText}>
                    <span className={styles.googleLabel}>Continue with</span>
                    <span className={styles.googleBold}>Google</span>
                  </div>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ color: 'var(--landing-ink-light)', opacity: 0.4 }}>
                    <path d="M5 12H19M19 12L12 5M19 12L12 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
              </motion.div>

              {/* Step 2: Create your first pact */}
              <motion.div className={styles.timelineStep}
                initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ amount: 0.1, once: true }} transition={{ duration: 0.5, delay: 0.1, ease: easeOutQuint }}>
                <div className={styles.stepNumber}>02</div>
                <div className={styles.stepDot} />
                <h3 className={styles.stepTitle}>Create your first pact</h3>
                <p className={styles.stepText}>
                  What will you commit to? Make it specific, make it achievable. Pick from 20+ templates or write your own.
                </p>
              </motion.div>

              {/* Step 3: Lock in and deliver */}
              <motion.div className={`${styles.timelineStep} ${styles.timelineStepLast}`}
                initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ amount: 0.1, once: true }} transition={{ duration: 0.5, delay: 0.2, ease: easeOutQuint }}>
                <div className={styles.stepNumber}>03</div>
                <div className={`${styles.stepDot} ${styles.stepDotFilled}`}>
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none">
                    <path d="M20 6L9 17L4 12" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <h3 className={styles.stepTitle}>Lock in and deliver</h3>
                <p className={styles.stepText}>
                  Complete it or miss it — either way, it shows. Your reputation is on the line. Build streaks, earn XP, and watch your consistency compound.
                </p>
              </motion.div>
            </div>
          </div>
        </section>

        {/* ===== CTA FOOTER — Task 6 ===== */}
      </main>

      <footer className={styles.ctaFooter}>
        <div className={styles.ctaGlow} />
        <div className={styles.ctaContent}>
          <motion.div className={styles.ctaLockIcon}
            animate={reducedMotion ? {} : { scale: [1, 1.05, 1], opacity: [0.8, 1, 0.8] }}
            transition={reducedMotion ? {} : { duration: 3, repeat: Infinity, ease: 'easeInOut' }}>
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none">
              <rect x="3" y="11" width="18" height="11" rx="2" stroke="currentColor" strokeWidth="1.5"/>
              <path d="M7 11V7C7 4.24 9.24 2 12 2C14.76 2 17 4.24 17 7V11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </motion.div>

          <motion.h2 className={styles.ctaHeadline}
            initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={{ amount: 0.1, once: true }} transition={{ duration: 0.6, ease: easeOutQuint }}>
            Tomorrow actually comes.
          </motion.h2>

          <motion.p className={styles.ctaDescription}
            initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={{ amount: 0.1, once: true }} transition={{ duration: 0.5, delay: 0.1, ease: easeOutQuint }}>
            Join students who are finally getting things done. Free, simple, and it works.
          </motion.p>

          <motion.button onClick={handleCta} className={styles.ctaButtonLarge}
            whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }}
            initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={{ amount: 0.1, once: true }} transition={{ duration: 0.5, delay: 0.15, ease: easeOutQuint }}>
            Start Locking In
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M5 12H19M19 12L12 5M19 12L12 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </motion.button>

          <span className={styles.ctaSubtext}>100% free. Sign in with Google. 2 minutes to start.</span>
        </div>

        <div className={styles.footerLinks}>
          <span className={styles.footerBrand}>LockIn.</span>
          <nav className={styles.footerNav} aria-label="Footer navigation">
            <a href="#features">Features</a>
            <a href="#how-it-works">How It Works</a>
            <a href="https://github.com/vayungodara/lockin" target="_blank" rel="noopener noreferrer">GitHub</a>
          </nav>
          <span className={styles.footerCredit}>Built by Vayun Godara</span>
        </div>
      </footer>
    </div>
  );
}
