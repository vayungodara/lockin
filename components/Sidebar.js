'use client';

import { useState, useEffect, useRef, useMemo, useSyncExternalStore, useCallback } from 'react';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  navPillSpring,
  sidebarSpring,
  sidebarExpandTransition,
  sidebarTap,
  timerPulse,
  snappyTransition,
  smoothTransition,
} from '@/lib/animations';
import { House, CheckSquare, UsersThree, Timer, ChartBar, GearSix, Sun, Moon, Monitor, ArrowSquareOut, SignOut } from '@phosphor-icons/react';
import { createClient } from '@/lib/supabase/client';
import { getLevelFromXP, getProgressToNextLevel } from '@/lib/gamification';
import { useTheme } from './ThemeProvider';
import { useFocusSafe } from '@/lib/FocusContext';
import NotificationBell from './NotificationBell';
import styles from './Sidebar.module.css';

function getSidebarCollapsed() {
  if (typeof window === 'undefined') return true;
  try {
    const saved = localStorage.getItem('sidebar-collapsed');
    return saved !== null ? saved === 'true' : true;
  } catch {
    return true;
  }
}

function subscribeToSidebarStorage(callback) {
  const handler = (e) => {
    if (e.key === 'sidebar-collapsed') callback();
  };
  window.addEventListener('storage', handler);
  return () => window.removeEventListener('storage', handler);
}

const navItems = [
  { href: '/dashboard', label: 'Dashboard', IconComponent: House },
  { href: '/dashboard/pacts', label: 'My Pacts', IconComponent: CheckSquare },
  { href: '/dashboard/groups', label: 'Groups', IconComponent: UsersThree },
  { href: '/dashboard/focus', label: 'Focus Timer', IconComponent: Timer },
  { href: '/dashboard/stats', label: 'Stats', IconComponent: ChartBar },
  { href: '/dashboard/settings', label: 'Settings', IconComponent: GearSix },
];

export default function Sidebar({ user, onSignOut, onExpandChange, hideXP }) {
  const pathname = usePathname();
  const { theme, setTheme, resolvedTheme, mounted, accent } = useTheme();
  const lockSrc = `/logos/${accent || 'indigo'}-lock.png`;
  const textSrc = `/logos/${accent || 'indigo'}-text.png`;
  const focusContext = useFocusSafe();

  // XP state
  const [xpData, setXpData] = useState({ level: 1, progress: 0, currentXP: 0 });
  const supabase = useMemo(() => createClient(), []);

  useEffect(() => {
    async function fetchXP() {
      if (!user?.id) return;
      const { data, error } = await supabase
        .from('profiles')
        .select('total_xp, level')
        .eq('id', user.id)
        .single();
      if (error || !data) return;
      const totalXP = data.total_xp || 0;
      setXpData({
        level: data.level || getLevelFromXP(totalXP),
        progress: getProgressToNextLevel(totalXP),
        currentXP: totalXP % 100,
      });
    }
    fetchXP();

    // Refresh XP when pact status changes (completion triggers XP gain)
    const handlePactUpdate = () => fetchXP();
    window.addEventListener('pact-created', handlePactUpdate);
    window.addEventListener('xp-updated', handlePactUpdate);
    return () => {
      window.removeEventListener('pact-created', handlePactUpdate);
      window.removeEventListener('xp-updated', handlePactUpdate);
    };
  }, [user?.id, supabase]);

  const isCollapsed = useSyncExternalStore(
    subscribeToSidebarStorage,
    getSidebarCollapsed,
    () => true
  );

  const [isHovering, setIsHovering] = useState(false);
  const hoverTimeout = useRef(null);

  const handleMouseEnter = useCallback(() => {
    if (hoverTimeout.current) {
      clearTimeout(hoverTimeout.current);
      hoverTimeout.current = null;
    }
    setIsHovering(true);
  }, []);

  const handleMouseLeave = useCallback(() => {
    hoverTimeout.current = setTimeout(() => {
      setIsHovering(false);
    }, 100);
  }, []);

  useEffect(() => {
    return () => {
      if (hoverTimeout.current) clearTimeout(hoverTimeout.current);
    };
  }, []);

  const handleCollapseToggle = useCallback(() => {
    const newState = !isCollapsed;
    try {
      localStorage.setItem('sidebar-collapsed', String(newState));
    } catch {
      // Ignore SecurityError when storage is blocked (strict extensions, enterprise policy)
    }
    window.dispatchEvent(new StorageEvent('storage', { key: 'sidebar-collapsed' }));
  }, [isCollapsed]);

  const isExpanded = !isCollapsed || isHovering;

  useEffect(() => {
    if (onExpandChange) {
      onExpandChange(isExpanded);
    }
  }, [isExpanded, onExpandChange]);

  const isActive = (href) => {
    if (href === '/dashboard') {
      return pathname === '/dashboard';
    }
    return pathname.startsWith(href);
  };

  const cycleTheme = () => {
    const themes = ['light', 'dark', 'system'];
    const currentIndex = themes.indexOf(theme);
    const nextIndex = (currentIndex + 1) % themes.length;
    setTheme(themes[nextIndex]);
  };

  const getThemeIcon = () => {
    if (!mounted || theme === 'system') {
      return <Monitor size={18} weight="regular" />;
    }
    if (resolvedTheme === 'dark') {
      return <Moon size={18} weight="regular" />;
    }
    return <Sun size={18} weight="regular" />;
  };

  const getThemeLabel = () => {
    if (!mounted) return 'Theme';
    if (theme === 'system') return 'System';
    if (theme === 'dark') return 'Dark';
    return 'Light';
  };

  return (
    <motion.aside
      className={styles.sidebar}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      animate={{ width: isExpanded ? 260 : 72 }}
      transition={sidebarSpring}
    >
      <div className={styles.header}>
        <Link href="/dashboard" className={styles.logoLink}>
          <div className={styles.logoIcon}>
            <Image
              src={lockSrc}
              alt="LockIn"
              width={26}
              height={32}
              priority
              style={{ width: 'auto', height: '32px' }}
            />
          </div>
          {/* Always mounted -- animate width between 0 and fixed value */}
          <motion.div
            className={styles.logoTextWrapper}
            initial={false}
            animate={{
              opacity: isExpanded ? 1 : 0,
              width: isExpanded ? 120 : 0,
            }}
            transition={sidebarExpandTransition}
          >
            <Image
              src={textSrc}
              alt="LockIn"
              width={107}
              height={32}
              priority
              style={{ width: 'auto', height: '28px' }}
            />
          </motion.div>
        </Link>
      </div>

      <nav className={styles.nav}>
        {navItems.map((item) => {
          const active = isActive(item.href);
          const IconComp = item.IconComponent;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`${styles.navItem} ${active ? styles.active : ''}`}
              data-label={isExpanded ? undefined : item.label}
            >
              {active && (
                <motion.div
                  className={styles.navPill}
                  layoutId="nav-pill"
                  transition={navPillSpring}
                />
              )}
              <span className={`${styles.navIcon} ${active ? styles.navIconActive : ''}`}>
                <IconComp size={20} weight={active ? 'fill' : 'regular'} />
              </span>
              {/* Always mounted -- fade + collapse width to prevent truncated text */}
              <motion.span
                className={styles.navLabel}
                initial={false}
                animate={{
                  opacity: isExpanded ? 1 : 0,
                  width: isExpanded ? 'auto' : 0,
                }}
                transition={sidebarExpandTransition}
                style={{ pointerEvents: isExpanded ? 'auto' : 'none' }}
              >
                {item.label}
              </motion.span>
            </Link>
          );
        })}
      </nav>

      {focusContext?.isRunning && (
        <motion.div
          className={`${styles.miniTimer} ${isExpanded ? styles.miniTimerExpanded : styles.miniTimerCollapsed}`}
          layout="position"
          transition={snappyTransition}
        >
          <motion.div
            className={styles.miniTimerPulse}
            {...timerPulse}
          />

          <Link href="/dashboard/focus" className={styles.miniTimerLink}>
            <span className={styles.miniTimerTime}>
              {focusContext.formatTime(focusContext.timeLeft)}
            </span>

            {/* Always mounted -- fade + scale */}
            <motion.span
              className={styles.miniTimerLabel}
              initial={false}
              animate={{
                opacity: isExpanded ? 1 : 0,
                scale: isExpanded ? 1 : 0.8,
              }}
              transition={{ duration: 0.15 }}
              style={{ pointerEvents: isExpanded ? 'auto' : 'none' }}
            >
              {focusContext.mode === 'work' ? 'Focusing' : 'Break'}
            </motion.span>
          </Link>

          {/* Always mounted -- fade + scale */}
          <motion.button
            className={styles.miniTimerBtn}
            onClick={(e) => {
              e.stopPropagation();
              focusContext.toggleTimer();
            }}
            initial={false}
            animate={{
              opacity: isExpanded ? 1 : 0,
              scale: isExpanded ? 1 : 0.5,
            }}
            whileTap={sidebarTap}
            transition={{ duration: 0.15 }}
            title="Pause timer"
            style={{ pointerEvents: isExpanded ? 'auto' : 'none' }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="6" y="4" width="4" height="16" rx="1" fill="currentColor"/>
              <rect x="14" y="4" width="4" height="16" rx="1" fill="currentColor"/>
            </svg>
          </motion.button>
        </motion.div>
      )}

      {/* Footer */}
      <motion.div
        className={`${styles.footer} ${isExpanded ? styles.footerExpanded : ''}`}
        layout
        transition={snappyTransition}
      >
        {/* User Section - Avatar + optional name/email */}
        <motion.div
          className={`${styles.userSection} ${isExpanded ? styles.userSectionExpanded : ''}`}
          layout
          transition={snappyTransition}
        >
          <motion.div layout transition={snappyTransition} className={styles.avatarWrapper}>
            {user?.user_metadata?.avatar_url ? (
              <Image
                src={user.user_metadata.avatar_url}
                alt={user.user_metadata?.full_name || 'User'}
                className={styles.avatar}
                width={36}
                height={36}
              />
            ) : (
              <div className={styles.avatarPlaceholder}>
                {user?.email?.[0]?.toUpperCase() || 'U'}
              </div>
            )}
            {/* XP progress ring — visible when collapsed */}
            {!isExpanded && (
              <svg
                className={styles.xpRing}
                width="44"
                height="44"
                viewBox="0 0 44 44"
                aria-label={`Level ${xpData.level}, ${xpData.currentXP} of 100 XP`}
              >
                <circle
                  cx="22"
                  cy="22"
                  r="19"
                  fill="none"
                  stroke="var(--border-subtle)"
                  strokeWidth="2.5"
                />
                <circle
                  cx="22"
                  cy="22"
                  r="19"
                  fill="none"
                  stroke="var(--accent-primary)"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeDasharray={2 * Math.PI * 19}
                  strokeDashoffset={2 * Math.PI * 19 * (1 - xpData.progress / 100)}
                  style={{ transform: 'rotate(-90deg)', transformOrigin: 'center', transition: 'stroke-dashoffset 0.6s ease' }}
                />
              </svg>
            )}
          </motion.div>

          {/* Always mounted -- animate width between 0 and fixed value */}
          <motion.div
            className={styles.userDetails}
            initial={false}
            animate={{
              opacity: isExpanded ? 1 : 0,
              width: isExpanded ? 150 : 0,
            }}
            transition={sidebarExpandTransition}
          >
            <span className={styles.userName}>
              {user?.user_metadata?.full_name || 'User'}
            </span>
            {!hideXP && (
              <div className={styles.xpExpanded}>
                <div className={styles.xpExpandedHeader}>
                  <span className={styles.levelBadge}>Lv. {xpData.level}</span>
                  <span className={styles.xpText}>{xpData.currentXP} / 100 XP</span>
                </div>
                <div className={styles.xpTrack}>
                  <motion.div
                    className={styles.xpFill}
                    initial={{ width: 0 }}
                    animate={{ width: `${xpData.progress}%` }}
                    transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                  />
                </div>
              </div>
            )}
          </motion.div>
        </motion.div>

        {/* Action buttons - vertical when collapsed, horizontal when expanded */}
        <motion.div
          className={`${styles.footerActions} ${isExpanded ? styles.footerActionsExpanded : ''}`}
          layout
          transition={snappyTransition}
        >
          <motion.div layout transition={snappyTransition}>
            <NotificationBell />
          </motion.div>

          <motion.button
            layout
            onClick={cycleTheme}
            className={styles.actionBtn}
            aria-label={`Change theme. Current: ${getThemeLabel()}`}
            title={getThemeLabel()}
            transition={snappyTransition}
            whileTap={sidebarTap}
          >
            {getThemeIcon()}
          </motion.button>

          <motion.div layout whileTap={sidebarTap} transition={snappyTransition}>
            <Link
              href="/?preview=true"
              className={`${styles.actionBtn} ${styles.landingBtn}`}
              aria-label="View landing page"
              title="View Landing Page"
            >
              <ArrowSquareOut size={18} weight="regular" />
            </Link>
          </motion.div>

          <motion.button
            layout
            onClick={onSignOut}
            className={`${styles.actionBtn} ${styles.signOutBtn}`}
            aria-label="Sign out"
            title="Sign out"
            transition={snappyTransition}
            whileTap={sidebarTap}
          >
            <SignOut size={18} weight="regular" />
          </motion.button>
        </motion.div>
      </motion.div>

      <motion.button
        className={styles.collapseBtn}
        onClick={handleCollapseToggle}
        aria-label={isCollapsed ? 'Pin sidebar' : 'Collapse sidebar'}
        whileTap={sidebarTap}
      >
        <motion.svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          animate={{ rotate: isCollapsed ? 0 : 180 }}
          transition={smoothTransition}
        >
          <path d="M9 18L15 12L9 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </motion.svg>
      </motion.button>
    </motion.aside>
  );
}
