'use client';

import Link from 'next/link';
import Image from 'next/image';
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
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            transition={smoothSpring}
          >
            <Image
              src="/logo.png"
              alt="LockIn"
              width={160}
              height={56}
              priority
              style={{ width: 'auto', height: '44px' }}
            />
          </motion.div>
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
