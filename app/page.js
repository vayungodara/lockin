'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import ParticleBackground from '@/components/ParticleBackground';
import styles from './page.module.css';
import { 
  fadeInUp, 
  fadeInDown, 
  staggerContainer, 
  staggerItem,
  heroText,
  floatAnimation,
} from '@/lib/animations';

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

export default function HomePage() {
  return (
    <>
      <ParticleBackground particleCount={60} speed={0.3} connectDistance={100} />
      <Navbar />
      
      <main className={styles.main}>
        <section className={styles.hero}>
          <motion.div 
            className={styles.heroVisual}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 0.5 }}
          >
            <motion.div 
              className={`${styles.floatingCard} ${styles.card1}`}
              {...floatAnimation}
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0, y: [0, -10, 0] }}
              transition={{ 
                opacity: { delay: 0.8, duration: 0.5 },
                x: { delay: 0.8, duration: 0.5 },
                y: { delay: 1.3, duration: 4, repeat: Infinity, ease: "easeInOut" }
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
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0, y: [0, -12, 0] }}
              transition={{ 
                opacity: { delay: 1, duration: 0.5 },
                x: { delay: 1, duration: 0.5 },
                y: { delay: 1.5, duration: 5, repeat: Infinity, ease: "easeInOut" }
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
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0, y: [0, -8, 0] }}
              transition={{ 
                opacity: { delay: 1.2, duration: 0.5 },
                x: { delay: 1.2, duration: 0.5 },
                y: { delay: 1.7, duration: 4.5, repeat: Infinity, ease: "easeInOut" }
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
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <motion.span 
              className={styles.heroTagDot}
              animate={{ scale: [1, 1.2, 1], opacity: [1, 0.7, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
            Built for students who mean business
          </motion.div>
          
          <motion.h1 
            className={styles.heroTitle}
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2, type: "spring", stiffness: 100 }}
          >
            <span className={styles.titleLine}>
              Stop saying <motion.span 
                className={styles.strikethrough}
                initial={{ backgroundSize: "0% 4px" }}
                animate={{ backgroundSize: "100% 4px" }}
                transition={{ delay: 1, duration: 0.8 }}
              >tomorrow</motion.span>
            </span>
            <br />
            <motion.span 
              className="text-gradient"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6, duration: 0.8 }}
            >
              Start locking in today
            </motion.span>
          </motion.h1>
          
          <motion.p 
            className={styles.heroDescription}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            The accountability app that uses social pressure to help you actually follow through. 
            Track commitments, keep your group honest, and finally stop procrastinating.
          </motion.p>
          
          <motion.div 
            className={styles.heroCtas}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
          >
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Link href="/dashboard" className={`btn btn-primary ${styles.ctaButton}`}>
                Start Locking In
                <motion.svg 
                  width="18" 
                  height="18" 
                  viewBox="0 0 24 24" 
                  fill="none"
                  initial={{ x: 0 }}
                  whileHover={{ x: 4 }}
                  transition={{ type: "spring", stiffness: 400 }}
                >
                  <path d="M5 12H19M19 12L12 5M19 12L12 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </motion.svg>
              </Link>
            </motion.div>
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Link href="#how-it-works" className="btn btn-secondary">
                See How It Works
              </Link>
            </motion.div>
          </motion.div>
          
          <motion.div 
            className={styles.heroStats}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.7 }}
          >
            {[
              { number: "100%", label: "Free forever" },
              { number: "2min", label: "To get started" },
              { number: "0", label: "More excuses" },
            ].map((stat, i) => (
              <motion.div 
                key={stat.label} 
                className={styles.stat}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 + i * 0.1 }}
              >
                <motion.span 
                  className={styles.statNumber}
                  initial={{ scale: 0.5 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.9 + i * 0.1, type: "spring", stiffness: 200 }}
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
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
          >
            <h2>Everything you need to <span className="text-gradient">get stuff done</span></h2>
            <p>No more empty promises. LockIn gives you the tools and the social pressure to follow through.</p>
          </motion.div>
          
          <motion.div 
            className={styles.featureGrid}
            variants={staggerContainer}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true, margin: "-50px" }}
          >
            {features.map((feature, index) => (
              <motion.div 
                key={feature.title}
                className={styles.featureCard}
                variants={staggerItem}
                whileHover={{ y: -8, transition: { type: "spring", stiffness: 300 } }}
              >
                <motion.div 
                  className={styles.featureIcon}
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  transition={{ type: "spring", stiffness: 400 }}
                >
                  {feature.icon}
                </motion.div>
                <h3>{feature.title}</h3>
                <p>{feature.description}</p>
              </motion.div>
            ))}
          </motion.div>
        </section>
        
        <section id="how-it-works" className={styles.howItWorks}>
          <motion.div 
            className={styles.sectionHeader}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
          >
            <h2>Get started in <span className="text-gradient">3 simple steps</span></h2>
            <p>No complicated setup. No learning curve. Just accountability.</p>
          </motion.div>
          
          <motion.div 
            className={styles.steps}
            variants={staggerContainer}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true, margin: "-50px" }}
          >
            {steps.map((step, index) => (
              <motion.div 
                key={step.number}
                className={styles.step}
                variants={staggerItem}
                whileHover={{ y: -8, transition: { type: "spring", stiffness: 300 } }}
              >
                <motion.div 
                  className={styles.stepNumber}
                  initial={{ scale: 0 }}
                  whileInView={{ scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.2 + index * 0.1, type: "spring", stiffness: 200 }}
                >
                  {step.number}
                </motion.div>
                <h3>{step.title}</h3>
                <p>{step.description}</p>
              </motion.div>
            ))}
          </motion.div>
        </section>
        
        <section className={styles.ctaSection}>
          <motion.div 
            className={styles.ctaCard}
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8, type: "spring" }}
          >
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
            >
              Ready to stop making excuses?
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 }}
            >
              Join students who are finally getting things done. Free, simple, and it works.
            </motion.p>
            <motion.div 
              whileHover={{ scale: 1.02 }} 
              whileTap={{ scale: 0.98 }}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.4 }}
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
          transition={{ duration: 0.6 }}
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
