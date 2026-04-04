'use client';

import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import styles from './Navbar.module.css';
import ThemeToggle from './ThemeToggle';
import { useState } from 'react';
import { useToast } from '@/components/Toast';
import { createClient } from '@/lib/supabase/client';

export default function Navbar() {
  const [hoveredLink, setHoveredLink] = useState(null);
  const toast = useToast();

  const handleGetStarted = async () => {
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
          <div className={styles.logoInner}>
            <Image
              src="/logos/indigo-lock.png"
              alt="LockIn"
              width={26}
              height={32}
              priority
              style={{ width: 'auto', height: '28px' }}
            />
            <Image
              src="/logos/indigo-text.png"
              alt="LockIn"
              width={107}
              height={28}
              priority
              style={{ width: 'auto', height: '22px' }}
            />
          </div>
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
            className={`btn btn-primary ${styles.ctaBtn}`}
            whileTap={{ scale: 0.95 }}
          >
            Get Started
          </motion.button>
        </div>
      </div>
    </motion.nav>
  );
}
