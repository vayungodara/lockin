'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, useScroll, useTransform, useMotionValueEvent } from 'framer-motion';
import ThemeToggle from './ThemeToggle';
import { useToast } from '@/components/Toast';
import { createClient } from '@/lib/supabase/client';
import { prefersReducedMotion, navPillSpring } from '@/lib/animations';
import styles from './NavbarLanding.module.css';

const SCROLL_THRESHOLD = 80;

export default function NavbarLanding() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const toast = useToast();

  const { scrollY } = useScroll();

  // Morph transforms: full-width bar -> compact floating pill
  const navWidth = useTransform(scrollY, [0, SCROLL_THRESHOLD], ['100%', '520px']);
  const navRadius = useTransform(scrollY, [0, SCROLL_THRESHOLD], [16, 32]);
  const navPadding = useTransform(scrollY, [0, SCROLL_THRESHOLD], [12, 8]);
  const navShadow = useTransform(
    scrollY,
    [0, SCROLL_THRESHOLD],
    ['0 1px 3px rgba(0,0,0,0.04)', '0 8px 32px rgba(0,0,0,0.12)']
  );

  // Track scroll state for link visibility
  useMotionValueEvent(scrollY, 'change', (latest) => {
    setIsScrolled(latest > SCROLL_THRESHOLD);
  });

  // Links visible when at top OR hovering/tapping the pill
  const showLinks = !isScrolled || isHovered;

  // Touch support: tap the pill to toggle links when scrolled
  const handlePillClick = () => {
    if (isScrolled) {
      setIsHovered(prev => !prev);
    }
  };

  // Close expanded pill when tapping outside
  useEffect(() => {
    if (!isHovered || !isScrolled) return;
    const handleClickOutside = (e) => {
      if (!e.target.closest(`.${styles.navInner}`)) {
        setIsHovered(false);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [isHovered, isScrolled]);

  // Skip morph animation on mobile or when user prefers reduced motion
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    setIsMobile(window.innerWidth < 768);
  }, []);
  const shouldMorph = !prefersReducedMotion() && !isMobile;

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

  return (
    <motion.nav
      className={styles.navbar}
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
    >
      <motion.div
        className={styles.navInner}
        style={
          shouldMorph
            ? {
                width: navWidth,
                borderRadius: navRadius,
                padding: navPadding,
                boxShadow: navShadow,
              }
            : undefined
        }
        onClick={handlePillClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        transition={navPillSpring}
      >
        <Link href="/" className={styles.logo}>
          <div className={styles.logoInner}>
            <Image
              src="/logos/indigo-lock.png"
              alt=""
              width={26}
              height={32}
              priority
              style={{ width: 'auto', height: '24px' }}
            />
            <Image
              src="/logos/indigo-text.png"
              alt="LockIn"
              width={107}
              height={28}
              priority
              style={{ width: 'auto', height: '20px' }}
            />
          </div>
        </Link>

        <motion.div
          className={styles.navLinks}
          animate={{
            opacity: showLinks ? 1 : 0,
            width: showLinks ? 'auto' : 0,
          }}
          transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
          style={{ pointerEvents: showLinks ? 'auto' : 'none' }}
        >
          <a href="#features" className={styles.navLink}>
            Features
          </a>
          <a href="#how-it-works" className={styles.navLink}>
            How it Works
          </a>
        </motion.div>

        <div className={styles.navActions}>
          <ThemeToggle />
          <motion.button
            onClick={handleGetStarted}
            className={styles.ctaBtn}
            whileTap={{ scale: 0.95 }}
          >
            Start a Pact
          </motion.button>
        </div>
      </motion.div>
    </motion.nav>
  );
}
