'use client';

import { useState, useEffect, useMemo, useRef, useSyncExternalStore } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { getLevelFromXP } from '@/lib/gamification';
import { getCurrentTier } from '@/lib/tiers';
import UserAvatar from './UserAvatar';
import NavMarker from './NavMarker';
import InkPicker from './InkPicker';
import styles from './DashboardNav.module.css';

/**
 * DashboardNav — sticky top nav for /dashboard/* routes.
 *
 * Replaces the legacy Sidebar + MobileNav. Mounts in DashboardLayout
 * (Wave 1 — Task C1 hooks it in).
 *
 * Structure (≥768px, left → right):
 *   1. Logo (yellow rotated square + "LockIn." wordmark)
 *   2. Status pill (≥1024px) — live time + green dot
 *   3. Section nav — six links with active-state highlighter underline + NavMarker calm hover
 *   4. Right cluster — rank chip (≥1024px), Lock In CTA, ink-picker placeholder, avatar
 *
 * Mobile (≤768px): logo + hamburger toggle. Drawer holds section links + Lock In + Sign out.
 *
 * Active state via `pathname.startsWith(href)`. The `Today` link has an exact-match
 * carve-out so it doesn't claim every dashboard route.
 *
 * @param {Object} props
 * @param {Object} props.user — Supabase auth user
 */

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Today', exact: true },
  { href: '/dashboard/pacts', label: 'Pacts' },
  { href: '/dashboard/groups', label: 'Groups' },
  { href: '/dashboard/focus', label: 'Focus' },
  { href: '/dashboard/stats', label: 'Stats' },
  { href: '/dashboard/settings', label: 'Profile' },
];

const INK_LABELS = {
  highlighter: 'Highlighter',
  redpen: 'Red Pen',
  carbon: 'Carbon',
  moss: 'Moss',
  'indigo-legacy': 'Indigo',
};

function getInk() {
  if (typeof document === 'undefined') return 'highlighter';
  const value = document.documentElement.getAttribute('data-ink');
  return INK_LABELS[value] ? value : 'highlighter';
}

function subscribeToInkChange(callback) {
  if (typeof window === 'undefined') return () => {};
  // The MutationObserver tracks future Wave 3 ink-picker writes; storage events
  // sync across tabs.
  const observer = new MutationObserver(callback);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-ink'] });
  const onStorage = (e) => {
    if (e.key === 'lockin-ink') callback();
  };
  window.addEventListener('storage', onStorage);
  return () => {
    observer.disconnect();
    window.removeEventListener('storage', onStorage);
  };
}

export default function DashboardNav({ user }) {
  const pathname = usePathname();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [inkPickerOpen, setInkPickerOpen] = useState(false);
  const [now, setNow] = useState(() => new Date());
  const [xp, setXp] = useState({ level: 1, totalXP: 0 });
  const supabase = useMemo(() => createClient(), []);
  const inkBtnRef = useRef(null);

  const inkKey = useSyncExternalStore(
    subscribeToInkChange,
    getInk,
    () => 'highlighter',
  );
  const inkLabel = INK_LABELS[inkKey] || 'Highlighter';

  // Supabase auth users carry their display info under user_metadata; UserAvatar
  // reads name/full_name/avatar_url at the top level. Bridge the shape here so
  // we don't reach into user_metadata in the avatar component.
  const avatarUser = useMemo(() => ({
    id: user?.id,
    full_name: user?.user_metadata?.full_name || user?.full_name || user?.email || 'You',
    avatar_url: user?.user_metadata?.avatar_url || user?.avatar_url || null,
  }), [user]);

  // Tick the status pill clock once a minute.
  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(interval);
  }, []);

  // Load XP for the rank chip. The Sidebar previously owned this; on dashboard
  // routes we read it once and listen for the same xp-updated / pact-created
  // events Sidebar listens for so the chip stays live.
  useEffect(() => {
    if (!user?.id) return undefined;
    let cancelled = false;
    async function fetchXP() {
      const { data, error } = await supabase
        .from('profiles')
        .select('total_xp, level')
        .eq('id', user.id)
        .single();
      if (cancelled || error || !data) return;
      const totalXP = data.total_xp || 0;
      setXp({ level: data.level || getLevelFromXP(totalXP), totalXP });
    }
    fetchXP();
    const handler = () => fetchXP();
    window.addEventListener('pact-created', handler);
    window.addEventListener('xp-updated', handler);
    return () => {
      cancelled = true;
      window.removeEventListener('pact-created', handler);
      window.removeEventListener('xp-updated', handler);
    };
  }, [user?.id, supabase]);

  const tier = useMemo(() => getCurrentTier(xp.totalXP), [xp.totalXP]);

  const isActive = (item) => {
    if (item.exact) return pathname === item.href;
    return pathname.startsWith(item.href);
  };

  const handleSignOut = async () => {
    setMenuOpen(false);
    try {
      await supabase.auth.signOut();
    } catch (err) {
      // Sign-out failure leaves us authenticated; navigating to / forces the
      // server check to refresh the session state.
      console.error('Sign out failed:', err);
    }
    router.push('/');
  };

  const handleInkClick = () => {
    setInkPickerOpen((v) => !v);
  };

  const closeInkPicker = () => setInkPickerOpen(false);

  const closeMenu = () => setMenuOpen(false);

  // Status pill uses Intl APIs for locale-correct display, but in 24h format
  // to match the editorial register on dashboard chrome.
  const dateStr = now.toLocaleDateString(undefined, { weekday: 'short', day: '2-digit', month: 'short' });
  const timeStr = now.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', hour12: false });

  return (
    <header className={styles.navbar}>
      <div className={styles.inner}>
        <div className={styles.brandCluster}>
          <Link href="/dashboard" className={styles.logo} aria-label="LockIn — dashboard">
            <span className={styles.logoMark} aria-hidden="true" />
            <span className={styles.logoWordmark}>
              LockIn<span className={styles.logoDot}>.</span>
            </span>
          </Link>
          <div className={styles.statusPill} aria-hidden="true">
            <span className={styles.statusDot} />
            <span className={styles.statusText}>{`${dateStr} · ${timeStr}`}</span>
          </div>
        </div>

        <nav className={styles.desktopNav} aria-label="Dashboard sections">
          {NAV_ITEMS.map((item, idx) => {
            const active = isActive(item);
            const key = `${item.href}-${item.label}-${idx}`;
            return (
              <Link
                key={key}
                href={item.href}
                className={`${styles.navLink} ${active ? styles.navLinkActive : ''}`.trim()}
                aria-current={active ? 'page' : undefined}
              >
                <NavMarker variant="calm">{item.label}</NavMarker>
                {active && <span className={styles.activeUnderline} aria-hidden="true" />}
              </Link>
            );
          })}
        </nav>

        <div className={styles.rightCluster}>
          <Link
            href="/dashboard/profile"
            className={styles.rankChip}
            aria-label={`Tier: ${tier.tier.label}, ink ${inkLabel}, ${xp.totalXP} XP. View profile.`}
          >
            <span className={styles.rankDot} />
            <span className={styles.rankLabel}>{tier.tier.label}</span>
            <span className={styles.rankSep}>·</span>
            <span className={styles.rankValue}>{`${xp.totalXP}`}</span>
          </Link>

          <Link href="/dashboard/focus" className={styles.lockInBtn}>
            <span className={styles.lockInDot} aria-hidden="true" />
            <span className={styles.lockInLabel}>Lock in</span>
          </Link>

          <div className={styles.inkPickerWrap}>
            <button
              ref={inkBtnRef}
              type="button"
              onClick={handleInkClick}
              className={styles.inkBtn}
              aria-label={`Change ink (current: ${inkLabel})`}
              aria-haspopup="dialog"
              aria-expanded={inkPickerOpen}
              title="Change ink"
            >
              <span className={styles.inkSwatch} aria-hidden="true" />
            </button>
            <InkPicker
              isOpen={inkPickerOpen}
              onClose={closeInkPicker}
              anchorRef={inkBtnRef}
            />
          </div>

          <Link
            href="/dashboard/profile"
            className={styles.avatarLink}
            aria-label="Profile"
          >
            <UserAvatar user={avatarUser} size="sm" isSelf showPhoto />
          </Link>

          <button
            type="button"
            className={styles.menuToggle}
            onClick={() => setMenuOpen((v) => !v)}
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={menuOpen}
            aria-controls="dashboard-mobile-menu"
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
        <div id="dashboard-mobile-menu" className={styles.mobileMenu}>
          <nav className={styles.mobileNav} aria-label="Dashboard sections (mobile)">
            {NAV_ITEMS.map((item, idx) => {
              const active = isActive(item);
              const key = `m-${item.href}-${item.label}-${idx}`;
              return (
                <Link
                  key={key}
                  href={item.href}
                  className={`${styles.mobileLink} ${active ? styles.mobileLinkActive : ''}`.trim()}
                  onClick={closeMenu}
                  aria-current={active ? 'page' : undefined}
                >
                  <span
                    className={`${styles.mobileMarker} ${active ? styles.mobileMarkerActive : ''}`.trim()}
                    aria-hidden="true"
                  />
                  {item.label}
                </Link>
              );
            })}
          </nav>
          <div className={styles.mobileActions}>
            <Link
              href="/dashboard/focus"
              className={styles.mobileLockIn}
              onClick={closeMenu}
            >
              <span className={styles.lockInDot} aria-hidden="true" />
              <span className={styles.lockInLabel}>Lock in</span>
            </Link>
            <button
              type="button"
              onClick={handleSignOut}
              className={styles.mobileSignOut}
            >
              Sign out
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
