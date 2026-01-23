'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import styles from './Navbar.module.css';
import ThemeToggle from './ThemeToggle';
import { useState } from 'react';
import { smoothSpring } from '@/lib/animations';

export default function Navbar() {
  const router = useRouter();
  const [hoveredLink, setHoveredLink] = useState(null);

  const handleGetStarted = () => {
    router.push('/dashboard');
  };

  const navLinks = [
    { href: '#features', label: 'Features' },
    { href: '#how-it-works', label: 'How it Works' }
  ];

  return (
    <motion.nav 
      className={styles.navbar}
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className={styles.container}>
        <Link href="/" className={styles.logo}>
          <motion.span 
            className={styles.logoIcon}
            whileHover={{ scale: 1.1, rotate: 5 }}
            whileTap={{ scale: 0.9 }}
            transition={smoothSpring}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </motion.span>
          <span className={styles.logoText}>LockIn</span>
        </Link>
        
        <div className={styles.navLinks}>
          {navLinks.map((link) => (
            <a 
              key={link.href}
              href={link.href} 
              className={styles.navLink}
              onMouseEnter={() => setHoveredLink(link.href)}
              onMouseLeave={() => setHoveredLink(null)}
            >
              {link.label}
              {hoveredLink === link.href && (
                <motion.div
                  className={styles.navLinkUnderline}
                  layoutId="navUnderline"
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
              )}
            </a>
          ))}
        </div>
        
        <div className={styles.navActions}>
          <ThemeToggle />
          <motion.button 
            onClick={handleGetStarted} 
            className="btn btn-primary"
            whileHover={{ scale: 1.05, boxShadow: "0 0 20px rgba(99, 102, 241, 0.4)" }}
            whileTap={{ scale: 0.95 }}
            transition={smoothSpring}
          >
            Get Started
          </motion.button>
        </div>
      </div>
    </motion.nav>
  );
}
