'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import NavMarker from './NavMarker';
import { useToast } from '@/components/Toast';
import { createClient } from '@/lib/supabase/client';
import styles from './NavbarLanding.module.css';

const NAV_LINKS = [
  ['#how-it-works', 'How it works'],
  ['#features', 'The system'],
  ['#witnesses', 'Witnesses'],
  ['#faq', 'Objections'],
];

export default function NavbarLanding({ isAuthenticated = false }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const router = useRouter();
  const toast = useToast();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

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
    <header className={`${styles.navbar}${scrolled ? ` ${styles.scrolled}` : ''}`}>
      <div className={styles.inner}>
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
