'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useScroll, useMotionValueEvent } from 'framer-motion';
import ThemeToggle from './ThemeToggle';
import { useToast } from '@/components/Toast';
import { createClient } from '@/lib/supabase/client';
import { prefersReducedMotion } from '@/lib/animations';
import styles from './NavbarLanding.module.css';

const SCROLL_THRESHOLD = 80;

export default function NavbarLanding({ isAuthenticated = false }) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const toast = useToast();
  const reducedMotion = prefersReducedMotion();

  const { scrollY } = useScroll();

  useMotionValueEvent(scrollY, 'change', (latest) => {
    const scrolled = latest > SCROLL_THRESHOLD;
    setIsScrolled(prev => prev === scrolled ? prev : scrolled);
    if (latest <= SCROLL_THRESHOLD) setIsExpanded(false);
  });

  // Update isMobile on viewport resize
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Close expanded pill when clicking outside
  useEffect(() => {
    if (!isExpanded) return;
    const handler = (e) => {
      if (!e.target.closest(`.${styles.navInner}`)) setIsExpanded(false);
    };
    document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, [isExpanded]);

  const showLinks = !isScrolled || isExpanded;
  const isPill = isScrolled && !isExpanded && !isMobile;

  const router = useRouter();

  const handleGetStarted = async () => {
    if (isAuthenticated) {
      router.push('/dashboard');
      return;
    }
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(window.location.pathname)}` },
    });
    if (error) toast.error('Sign in failed. Please try again.');
  };

  return (
    <nav className={styles.navbar}>
      <div
        className={`${styles.navInner} ${isPill ? styles.navPill : ''} ${reducedMotion ? '' : styles.navAnimated}`}
        aria-expanded={isPill ? isExpanded : undefined}
        aria-label={isPill ? 'Navigation menu' : undefined}
        onClick={(e) => {
          // Only toggle on click in the pill "dead zone" (not on buttons/links)
          if (isScrolled && !e.target.closest('a') && !e.target.closest('button')) {
            setIsExpanded((p) => !p);
          }
        }}
        onKeyDown={(e) => {
          if (isPill && (e.key === 'Enter' || e.key === ' ')) {
            e.preventDefault();
            setIsExpanded((p) => !p);
          }
        }}
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

        <div className={`${styles.navLinks} ${!showLinks ? styles.navLinksHidden : ''}`}>
          <a href="#features" className={styles.navLink} tabIndex={showLinks ? 0 : -1}>Features</a>
          <a href="#how-it-works" className={styles.navLink} tabIndex={showLinks ? 0 : -1}>How it Works</a>
        </div>

        <div className={styles.navActions}>
          <ThemeToggle />
          <button onClick={handleGetStarted} className={styles.ctaBtn}>
            Start a Pact
          </button>
        </div>
      </div>
    </nav>
  );
}
