'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import ParticleBackground from '@/components/ParticleBackground';
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
              className="text-gradient"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.6 }}
            >
              Start locking in today
            </motion.span>
          </motion.h1>
          
          <motion.p 
            className={styles.heroDescription}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3, ease: easeOutQuint }}
          >
            The accountability app that uses social pressure to help you actually follow through. 
            Track commitments, keep your group honest, and finally stop procrastinating.
          </motion.p>
          
          <motion.div 
            className={styles.heroCtas}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4, ease: easeOutQuint }}
          >
            <motion.div whileHover={buttonHover} whileTap={buttonTap}>
              <Link href="/dashboard" className={`btn btn-primary ${styles.ctaButton}`}>
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
              </Link>
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
              <Link href="/dashboard" className={`btn btn-primary ${styles.ctaButton}`}>
                Start Locking In
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <path d="M5 12H19M19 12L12 5M19 12L12 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </Link>
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
            <p className={styles.footerText}>
              Built with frustration and caffeine. For students who are tired of their own excuses.
            </p>
          </div>
        </motion.footer>
      </main>
    </>
  );
}
