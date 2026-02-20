'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import ParticleBackground from '@/components/ParticleBackground';
import { createClient } from '@/lib/supabase/client';
import styles from '../app/page.module.css';
import { 
  buttonHover,
  buttonTap,
  iconHover,
} from '@/lib/animations';

const easeOutQuint = [0.22, 1, 0.36, 1];

const features = [
  {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
        <path d="M12 6V12L16 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      </svg>
    ),
    title: "Personal Pacts",
    description: "Make commitments that stick. Set deadlines, check in daily, and build accountability streaks.",
  },
  {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M17 21V19C17 16.79 15.21 15 13 15H5C2.79 15 1 16.79 1 19V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        <circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="2"/>
        <path d="M23 21V19C23 17.14 21.73 15.57 20 15.13" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        <path d="M16 3.13C17.73 3.57 19 5.14 19 7C19 8.86 17.73 10.43 16 10.87" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      </svg>
    ),
    title: "Group Accountability",
    description: "See who is pulling their weight and who is slacking. No more carrying the team alone.",
  },
  {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="2"/>
        <path d="M16 2V6M8 2V6M3 10H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      </svg>
    ),
    title: "Task Ownership",
    description: "Every task has one owner and one deadline. Crystal clear responsibility, no room for excuses.",
  },
  {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M22 12H18L15 21L9 3L6 12H2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
    title: "Activity Feed",
    description: "Real-time updates on who completed what. Social pressure works — let it work for you.",
  },
  {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
        <path d="M12 6V12L16 16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      </svg>
    ),
    title: "Focus Timer",
    description: "Pomodoro-style focus sessions. Track your deep work and compete with your past self.",
  },
  {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
    title: "Streaks & Stats",
    description: "Build momentum with streaks. See your progress over time and celebrate your wins.",
  },
];

const steps = [
  {
    number: "1",
    title: "Sign in with Google",
    description: "Use your university email. Takes 5 seconds. No passwords to remember.",
  },
  {
    number: "2",
    title: "Create your first pact",
    description: "What will you commit to? Make it specific, make it achievable.",
  },
  {
    number: "3",
    title: "Lock in and deliver",
    description: "Complete it or miss it — either way, it shows. Your reputation is on the line.",
  },
];

export default function LandingPageClient() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [checkedPacts, setCheckedPacts] = useState({ 0: true, 1: false, 2: false });

  const streakCount = 7 + Object.values(checkedPacts).filter(Boolean).length - 1;
  const allComplete = Object.values(checkedPacts).every(Boolean);

  const calendarLevels = [3,1,2,0,3,2,1,3,2,3,1,0,2,3,2,1,3,0,2,3,1,2,3,2,0,1,3,2];
  const checkedCount = Object.values(checkedPacts).filter(Boolean).length;
  // Light up empty cells based on how many pacts are checked (beyond the initial one)
  const extraChecks = checkedCount - 1; // subtract the pre-checked one
  let emptyFilled = 0;
  const activeLevels = calendarLevels.map((level) => {
    if (level === 0 && emptyFilled < extraChecks) {
      emptyFilled++;
      return 3;
    }
    return level;
  });

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        router.replace('/dashboard');
      } else {
        setIsLoading(false);
      }
    });
  }, [router]);

  const handleSignIn = async () => {
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    if (error) {
      console.error('Error signing in:', error.message);
    }
  };

  if (isLoading) {
    return null;
  }

  return (
    <>
      <ParticleBackground particleCount={50} speed={0.25} connectDistance={90} />
      <Navbar />
      
      <main className={styles.main}>
        <section className={styles.hero}>
          <motion.div 
            className={styles.heroVisual}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.3, ease: easeOutQuint }}
          >
            <motion.div 
              className={`${styles.floatingCard} ${styles.card1}`}
              initial={{ opacity: 0, x: 30, y: 10 }}
              animate={{ opacity: 1, x: 0, y: [0, -8, 0] }}
              transition={{ 
                opacity: { delay: 0.6, duration: 0.5, ease: easeOutQuint },
                x: { delay: 0.6, duration: 0.5, ease: easeOutQuint },
                y: { delay: 1.2, duration: 3.5, repeat: Infinity, ease: "easeInOut" }
              }}
            >
              <div className={styles.cardIcon}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path d="M9 11L12 14L22 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M21 12V19C21 20.1046 20.1046 21 19 21H5C3.89543 21 3 20.1046 3 19V5C3 3.89543 3.89543 3 5 3H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <span>Pact completed!</span>
            </motion.div>
            
            <motion.div 
              className={`${styles.floatingCard} ${styles.card2}`}
              initial={{ opacity: 0, x: -30, y: 10 }}
              animate={{ opacity: 1, x: 0, y: [0, -10, 0] }}
              transition={{ 
                opacity: { delay: 0.8, duration: 0.5, ease: easeOutQuint },
                x: { delay: 0.8, duration: 0.5, ease: easeOutQuint },
                y: { delay: 1.4, duration: 4, repeat: Infinity, ease: "easeInOut" }
              }}
            >
              <div className={styles.cardIcon} style={{ background: 'var(--warning-light)', color: 'var(--warning)' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                  <path d="M12 6V12L16 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </div>
              <span>2 hours left</span>
            </motion.div>
            
            <motion.div 
              className={`${styles.floatingCard} ${styles.card3}`}
              initial={{ opacity: 0, x: 30, y: -10 }}
              animate={{ opacity: 1, x: 0, y: [0, -6, 0] }}
              transition={{ 
                opacity: { delay: 1, duration: 0.5, ease: easeOutQuint },
                x: { delay: 1, duration: 0.5, ease: easeOutQuint },
                y: { delay: 1.6, duration: 3.8, repeat: Infinity, ease: "easeInOut" }
              }}
            >
              <div className={styles.cardIcon} style={{ background: 'var(--info-light)', color: 'var(--info)' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path d="M17 21V19C17 16.79 15.21 15 13 15H5C2.79 15 1 16.79 1 19V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  <circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="2"/>
                  <path d="M23 21V19C23 17.14 21.73 15.57 20 15.13" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  <path d="M16 3.13C17.73 3.57 19 5.14 19 7C19 8.86 17.73 10.43 16 10.87" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </div>
              <span>Alex joined</span>
            </motion.div>
          </motion.div>

          <motion.div 
            className={styles.heroTag}
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: easeOutQuint }}
          >
            <motion.span 
              className={styles.heroTagDot}
              animate={{ scale: [1, 1.15, 1], opacity: [1, 0.8, 1] }}
              transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
            />
            Built for students who mean business
          </motion.div>
          
          <motion.h1 
            className={styles.heroTitle}
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.15, ease: easeOutQuint }}
          >
            <span className={styles.titleLine}>
              Stop saying <motion.span 
                className={styles.strikethrough}
                initial={{ backgroundSize: "0% 3px" }}
                animate={{ backgroundSize: "100% 3px" }}
                transition={{ delay: 0.8, duration: 0.6, ease: easeOutQuint }}
              >tomorrow</motion.span>
            </span>
            <br />
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.6 }}
            >
              Start locking in <span className="text-gradient">today</span>
            </motion.span>
          </motion.h1>
          
          <motion.p 
            className={styles.heroDescription}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3, ease: easeOutQuint }}
          >
            The app that makes sure tomorrow actually comes.
            {' '}Track commitments, keep your group honest, and finally stop procrastinating.
          </motion.p>
          
          <motion.div 
            className={styles.heroCtas}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4, ease: easeOutQuint }}
          >
            <motion.div whileHover={buttonHover} whileTap={buttonTap}>
              <button onClick={handleSignIn} className={`btn btn-primary ${styles.ctaButton}`}>
                Start Locking In
                <motion.svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  initial={{ x: 0 }}
                  whileHover={{ x: 3 }}
                  transition={{ duration: 0.2, ease: easeOutQuint }}
                >
                  <path d="M5 12H19M19 12L12 5M19 12L12 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </motion.svg>
              </button>
            </motion.div>
            <motion.div whileHover={buttonHover} whileTap={buttonTap}>
              <Link href="#how-it-works" className="btn btn-secondary">
                See How It Works
              </Link>
            </motion.div>
          </motion.div>
          
          <motion.div 
            className={styles.heroStats}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.55, ease: easeOutQuint }}
          >
            {[
              { number: "100%", label: "Free forever" },
              { number: "2min", label: "To get started" },
              { number: "0", label: "More excuses" },
            ].map((stat, i) => (
              <motion.div 
                key={stat.label} 
                className={styles.stat}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.65 + i * 0.08, duration: 0.4, ease: easeOutQuint }}
              >
                <motion.span 
                  className={styles.statNumber}
                  initial={{ scale: 0.85, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.7 + i * 0.08, duration: 0.35, ease: easeOutQuint }}
                >
                  {stat.number}
                </motion.span>
                <span className={styles.statLabel}>{stat.label}</span>
              </motion.div>
            ))}
          </motion.div>
        </section>
        
        <section id="features" className={styles.features}>
          <motion.div 
            className={styles.sectionHeader}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.5 }}
            transition={{ duration: 0.5, ease: easeOutQuint }}
          >
            <h2>Everything you need to <span className="text-gradient">get stuff done</span></h2>
            <p>No more empty promises. LockIn gives you the tools and the social pressure to follow through.</p>
          </motion.div>
          
          <div className={styles.featureGrid}>
            {features.map((feature, index) => (
              <motion.div 
                key={feature.title}
                className={styles.featureCard}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.4, delay: index * 0.06, ease: easeOutQuint }}
                whileHover={{ y: -5, transition: { duration: 0.2, ease: easeOutQuint } }}
              >
                <motion.div 
                  className={styles.featureIcon}
                  whileHover={iconHover}
                >
                  {feature.icon}
                </motion.div>
                <h3>{feature.title}</h3>
                <p>{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </section>
        
        <section className={styles.appPreview}>
          <motion.div
            className={styles.sectionHeader}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.5 }}
            transition={{ duration: 0.5, ease: easeOutQuint }}
          >
            <h2>Your accountability <span className="text-gradient">command center</span></h2>
            <p>Everything you need in one clean dashboard. No clutter, no distractions.</p>
          </motion.div>

          <motion.div
            className={styles.browserFrame}
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.6, ease: easeOutQuint }}
          >
            <div className={styles.browserBar}>
              <div className={styles.browserDots}>
                <span className={styles.dotRed} />
                <span className={styles.dotYellow} />
                <span className={styles.dotGreen} />
              </div>
              <div className={styles.browserUrl}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                  <rect x="3" y="11" width="18" height="11" rx="2" stroke="currentColor" strokeWidth="2"/>
                  <path d="M7 11V7C7 4.24 9.24 2 12 2C14.76 2 17 4.24 17 7V11" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
                lockin.app/dashboard
              </div>
            </div>

            <div className={styles.mockDashboard}>
              <div className={styles.mockSidebar}>
                <div className={styles.mockSidebarLogo}>
                  <div className={styles.mockLogoIcon} />
                </div>
                <div className={styles.mockNavItems}>
                  <div className={`${styles.mockNavItem} ${styles.mockNavActive}`}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M3 9L12 2L21 9V20C21 21.1 20.1 22 19 22H5C3.9 22 3 21.1 3 20V9Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  </div>
                  <div className={styles.mockNavItem}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/><path d="M12 6V12L16 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
                  </div>
                  <div className={styles.mockNavItem}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M17 21V19C17 16.79 15.21 15 13 15H5C2.79 15 1 16.79 1 19V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="2"/></svg>
                  </div>
                  <div className={styles.mockNavItem}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M22 12H18L15 21L9 3L6 12H2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  </div>
                </div>
              </div>

              <div className={styles.mockMain}>
                <div className={styles.mockGreeting}>
                  <div className={styles.mockGreetingText}>
                    <div className={styles.mockTextLine} style={{ width: '55%', height: '14px' }} />
                    <div className={styles.mockTextLine} style={{ width: '35%', height: '10px', opacity: 0.5 }} />
                  </div>
                  <div className={styles.mockStreakBadge}>
                    <span className={styles.mockFireIcon}>🔥</span>
                    <AnimatePresence mode="popLayout">
                      <motion.span
                        key={streakCount}
                        initial={{ y: 8, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: -8, opacity: 0 }}
                        transition={{ duration: 0.25, ease: easeOutQuint }}
                      >
                        {streakCount} day streak
                      </motion.span>
                    </AnimatePresence>
                  </div>
                </div>

                <div className={styles.mockCards}>
                  {[
                    { title: 'Finish CS homework', meta: 'Due today', warning: false },
                    { title: 'Read 30 pages', meta: '6 hours left', warning: true },
                    { title: 'Go to the gym', meta: 'Tomorrow', warning: false },
                  ].map((pact, i) => (
                    <motion.div
                      key={pact.title}
                      className={styles.mockPactCard}
                      initial={{ opacity: 0, x: -10 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: 0.3 + i * 0.1, duration: 0.4, ease: easeOutQuint }}
                    >
                      <div className={styles.mockPactHeader}>
                        <motion.button
                          className={`${styles.mockCheckbox} ${styles.mockCheckboxClickable} ${!checkedPacts[i] ? styles.mockUnchecked : ''}`}
                          onClick={() => setCheckedPacts(prev => ({ ...prev, [i]: !prev[i] }))}
                          whileTap={{ scale: 0.85 }}
                          animate={checkedPacts[i] ? { scale: [1, 1.2, 1] } : { scale: 1 }}
                          transition={{ duration: 0.25 }}
                        >
                          <motion.svg
                            width="10" height="10" viewBox="0 0 24 24" fill="none"
                            initial={false}
                            animate={{ opacity: checkedPacts[i] ? 1 : 0, scale: checkedPacts[i] ? 1 : 0.5 }}
                            transition={{ duration: 0.15 }}
                          >
                            <path d="M20 6L9 17L4 12" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
                          </motion.svg>
                        </motion.button>
                        <span
                          className={styles.mockPactTitle}
                          style={{
                            textDecoration: checkedPacts[i] ? 'line-through' : 'none',
                            opacity: checkedPacts[i] ? 0.45 : 1,
                            transition: 'opacity 0.25s, text-decoration 0.25s',
                          }}
                        >
                          {pact.title}
                        </span>
                      </div>
                      <div className={styles.mockPactMeta}>
                        <span className={pact.warning ? styles.mockDeadlineWarning : styles.mockDeadline}>
                          {pact.meta}
                        </span>
                      </div>
                    </motion.div>
                  ))}
                </div>

                <motion.div
                  className={styles.mockCalendar}
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.6, duration: 0.4, ease: easeOutQuint }}
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

          <AnimatePresence>
            {allComplete && (
              <motion.div
                className={styles.mockCelebration}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                transition={{ duration: 0.5, ease: easeOutQuint }}
              >
                <p>See? That felt good. Imagine that every day.</p>
                <motion.div whileHover={buttonHover} whileTap={buttonTap}>
                  <button onClick={handleSignIn} className={`btn btn-primary ${styles.ctaButton}`}>
                    Start Locking In
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                      <path d="M5 12H19M19 12L12 5M19 12L12 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </button>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </section>

        <section id="how-it-works" className={styles.howItWorks}>
          <motion.div 
            className={styles.sectionHeader}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.5 }}
            transition={{ duration: 0.5, ease: easeOutQuint }}
          >
            <h2>Get started in <span className="text-gradient">3 simple steps</span></h2>
            <p>No complicated setup. No learning curve. Just accountability.</p>
          </motion.div>
          
          <div className={styles.steps}>
            {steps.map((step, index) => (
              <motion.div 
                key={step.number}
                className={styles.step}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.4, delay: index * 0.1, ease: easeOutQuint }}
                whileHover={{ y: -5, transition: { duration: 0.2, ease: easeOutQuint } }}
              >
                <motion.div 
                  className={styles.stepNumber}
                  initial={{ scale: 0.8, opacity: 0 }}
                  whileInView={{ scale: 1, opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.15 + index * 0.08, duration: 0.35, ease: easeOutQuint }}
                >
                  {step.number}
                </motion.div>
                <h3>{step.title}</h3>
                <p>{step.description}</p>
              </motion.div>
            ))}
          </div>
        </section>
        
        <section className={styles.ctaSection}>
          <motion.div 
            className={styles.ctaCard}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.4 }}
            transition={{ duration: 0.5, ease: easeOutQuint }}
          >
            <motion.h2
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1, duration: 0.4, ease: easeOutQuint }}
            >
              Ready to stop making excuses?
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.15, duration: 0.4, ease: easeOutQuint }}
            >
              Join students who are finally getting things done. Free, simple, and it works.
            </motion.p>
            <motion.div 
              whileHover={buttonHover}
              whileTap={buttonTap}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2, duration: 0.4, ease: easeOutQuint }}
            >
              <button onClick={handleSignIn} className={`btn btn-primary ${styles.ctaButton}`}>
                Start Locking In
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <path d="M5 12H19M19 12L12 5M19 12L12 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            </motion.div>
          </motion.div>
        </section>
        
        <motion.footer
          className={styles.footer}
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, ease: easeOutQuint }}
        >
          <div className={styles.footerContent}>
            <div className={styles.footerTop}>
              <div className={styles.footerBrand}>
                <div className={styles.footerLogo}>
                  <span className={styles.logoIcon}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                      <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </span>
                  LockIn
                </div>
                <p className={styles.footerTagline}>
                  The app that makes sure tomorrow actually comes.
                </p>
              </div>

              <div className={styles.footerLinks}>
                <div className={styles.footerColumn}>
                  <h4 className={styles.footerColumnTitle}>Product</h4>
                  <a href="#features" className={styles.footerLink}>Features</a>
                  <a href="#how-it-works" className={styles.footerLink}>How It Works</a>
                  <button onClick={handleSignIn} className={styles.footerLink}>Get Started</button>
                </div>
                <div className={styles.footerColumn}>
                  <h4 className={styles.footerColumnTitle}>Project</h4>
                  <a href="https://github.com/vayungodara/lockin" target="_blank" rel="noopener noreferrer" className={styles.footerLink}>
                    GitHub
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="M7 17L17 7M17 7H7M17 7V17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  </a>
                </div>
              </div>
            </div>

            <div className={styles.footerBottom}>
              <p className={styles.footerText}>
                Built by Vayun Godara
              </p>
            </div>
          </div>
        </motion.footer>
      </main>
    </>
  );
}
