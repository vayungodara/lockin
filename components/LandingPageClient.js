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
        <section className={styles.appPreview}>
          <motion.div
            className={styles.sectionHeader}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ amount: 0.5 }}
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
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ amount: 0.2 }}
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
              <aside className={styles.mockSidebar}>
                <div className={styles.mockSidebarLogo}>
                  <div className={styles.mockLogoIcon} />
                </div>
                <nav className={styles.mockNavItems}>
                  {[
                    {
                      label: 'Overview',
                      active: true,
                      icon: 'M3 9L12 2L21 9V20C21 21.1 20.1 22 19 22H5C3.9 22 3 21.1 3 20V9Z',
                    },
                    { label: 'Pacts', icon: 'M12 6V12L16 14' },
                    {
                      label: 'Groups',
                      icon: 'M17 21V19C17 16.79 15.21 15 13 15H5C2.79 15 1 16.79 1 19V21',
                    },
                    { label: 'Timer', icon: 'M12 6V12L16 16' },
                    { label: 'Stats', icon: 'M22 12H18L15 21L9 3L6 12H2' },
                  ].map((item) => (
                    <div
                      key={item.label}
                      className={`${styles.mockNavItem} ${item.active ? styles.mockNavActive : ''}`}
                    >
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                      >
                        <path
                          d={item.icon}
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </div>
                  ))}
                </nav>
              </aside>

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
                      viewport={{ amount: 0.3 }}
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
                  viewport={{ amount: 0.3 }}
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
                        layout
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
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
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
              viewport={{ amount: 0.3 }} transition={{ duration: 0.6, ease: easeOutQuint }}>
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
                viewport={{ amount: 0.3 }} transition={{ duration: 0.5, ease: easeOutQuint }}
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
                viewport={{ amount: 0.3 }} transition={{ duration: 0.5, delay: 0.1, ease: easeOutQuint }}
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
                viewport={{ amount: 0.3 }} transition={{ duration: 0.5, delay: 0.2, ease: easeOutQuint }}
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
        <div className={styles.marquee}>
          <div className={styles.marqueeTrack}>
            {[...Array(4)].map((_, i) => (
              <span key={i} className={styles.marqueeSegment}>
                <span className={styles.marqueeText}>STOP SAYING TOMORROW. LOCK IN TODAY.</span>
                <span className={styles.marqueeDot}>&bull;</span>
              </span>
            ))}
          </div>
        </div>

        {/* ===== HOW IT WORKS — Task 6 ===== */}

        {/* ===== CTA FOOTER — Task 6 ===== */}
      </main>
    </>
  );
}
