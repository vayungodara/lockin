'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useScroll, useMotionValueEvent } from 'framer-motion';
import NavMarker from './NavMarker';
import { useToast } from '@/components/Toast';
import { createClient } from '@/lib/supabase/client';
import { prefersReducedMotion } from '@/lib/animations';
import styles from './NavbarLanding.module.css';

const NAV_LINKS = [
  ['#how-it-works', 'How it works'],
  ['#features', 'The system'],
  ['#witnesses', 'Witnesses'],
  ['#faq', 'Objections'],
];

const SCROLL_THRESHOLD = 80;

export default function NavbarLanding({ isAuthenticated = false }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const router = useRouter();
  const toast = useToast();
  const reducedMotion = prefersReducedMotion();

  const { scrollY } = useScroll();

  useMotionValueEvent(scrollY, 'change', (latest) => {
    const scrolled = latest > SCROLL_THRESHOLD;
    setIsScrolled((prev) => (prev === scrolled ? prev : scrolled));
  });

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Bar stays full at every scroll position. isScrolled only drives a subtle
  // height/padding shrink + a soft shadow so the bar reads as "floating" once
  // you're past the hero. No collapse, no click-to-expand. isMobile retained
  // for any mobile-only conditional but no longer gates desktop nav visibility.
  void isMobile;

  const handleGetStarted = async () => {
    if (isAuthenticated) {
      router.push('/dashboard');
      return;
    }
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(window.location.pathname)}`,
      },
    });
    if (error) toast.error('Sign in failed. Please try again.');
  };

  const closeMenu = () => setMenuOpen(false);

  return (
    <header className={styles.navbar}>
      <div
        className={`${styles.inner} ${isScrolled ? styles.innerScrolled : ''} ${reducedMotion ? '' : styles.innerAnimated}`}
      >
        <Link href="/" className={styles.logo} aria-label="LockIn — home">
          <span className={styles.logoMark} aria-hidden="true" />
          <span className={styles.logoWordmark}>
            LockIn<span className={styles.logoDot}>.</span>
          </span>
        </Link>

        <nav className={styles.desktopNav} aria-label="Primary">
          {NAV_LINKS.map(([href, label]) => (
            <a key={href} href={href} className={styles.navLink}>
              <NavMarker>{label}</NavMarker>
            </a>
          ))}
        </nav>

        <div className={styles.actions}>
          <button
            type="button"
            onClick={handleGetStarted}
            className={styles.signInBtn}
          >
            Sign in
          </button>
          <button
            type="button"
            onClick={handleGetStarted}
            className={styles.ctaBtn}
          >
            Start a pact <span aria-hidden="true">→</span>
          </button>
          <button
            type="button"
            className={styles.menuToggle}
            onClick={() => setMenuOpen((v) => !v)}
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={menuOpen}
            aria-controls="landing-mobile-menu"
          >
            <svg width="22" height="22" viewBox="0 0 22 22" aria-hidden="true">
              <rect x="3" y="6" width="16" height="1.5" fill="currentColor" />
              <rect x="3" y="11" width="16" height="1.5" fill="currentColor" />
              <rect x="3" y="16" width="16" height="1.5" fill="currentColor" />
            </svg>
          </button>
        </div>
      </div>

      {menuOpen && (
        <div
          id="landing-mobile-menu"
          className={styles.mobileMenu}
        >
          <nav className={styles.mobileNav} aria-label="Mobile primary">
            {NAV_LINKS.map(([href, label]) => (
              <a
                key={href}
                href={href}
                className={styles.mobileLink}
                onClick={closeMenu}
              >
                {label}
              </a>
            ))}
          </nav>
          <div className={styles.mobileActions}>
            <button
              type="button"
              onClick={() => {
                closeMenu();
                handleGetStarted();
              }}
              className={styles.mobileSignIn}
            >
              Sign in
            </button>
            <button
              type="button"
              onClick={() => {
                closeMenu();
                handleGetStarted();
              }}
              className={styles.mobileCta}
            >
              Start a pact <span aria-hidden="true">→</span>
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
