'use client';

import { useState, useEffect, useSyncExternalStore, useCallback } from 'react';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from './ThemeProvider';
import { useFocusSafe } from '@/lib/FocusContext';
import NotificationBell from './NotificationBell';
import styles from './Sidebar.module.css';

function getSidebarCollapsed() {
  const saved = localStorage.getItem('sidebar-collapsed');
  return saved !== null ? saved === 'true' : true;
}

function subscribeToSidebarStorage(callback) {
  const handler = (e) => {
    if (e.key === 'sidebar-collapsed') callback();
  };
  window.addEventListener('storage', handler);
  return () => window.removeEventListener('storage', handler);
}

const navItems = [
  {
    href: '/dashboard',
    label: 'Dashboard',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M3 9L12 2L21 9V20C21 20.5304 20.7893 21.0391 20.4142 21.4142C20.0391 21.7893 19.5304 22 19 22H5C4.46957 22 3.96086 21.7893 3.58579 21.4142C3.21071 21.0391 3 20.5304 3 20V9Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M9 22V12H15V22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
  },
  {
    href: '/dashboard/pacts',
    label: 'My Pacts',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M9 11L12 14L22 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M21 12V19C21 19.5304 20.7893 20.0391 20.4142 20.4142C20.0391 20.7893 19.5304 21 19 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
  },
  {
    href: '/dashboard/groups',
    label: 'Groups',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M17 21V19C17 17.9391 16.5786 16.9217 15.8284 16.1716C15.0783 15.4214 14.0609 15 13 15H5C3.93913 15 2.92172 15.4214 2.17157 16.1716C1.42143 16.9217 1 17.9391 1 19V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="2"/>
        <path d="M23 21V19C22.9993 18.1137 22.7044 17.2528 22.1614 16.5523C21.6184 15.8519 20.8581 15.3516 20 15.13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M16 3.13C16.8604 3.35031 17.623 3.85071 18.1676 4.55232C18.7122 5.25392 19.0078 6.11683 19.0078 7.005C19.0078 7.89318 18.7122 8.75608 18.1676 9.45769C17.623 10.1593 16.8604 10.6597 16 10.88" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
  },
  {
    href: '/dashboard/focus',
    label: 'Focus Timer',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
        <path d="M12 6V12L16 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    href: '/dashboard/stats',
    label: 'Stats',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M18 20V10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M12 20V4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M6 20V14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
  },
  {
    href: '/dashboard/settings',
    label: 'Settings',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2"/>
        <path d="M12 1V4M12 20V23M4.22 4.22L6.34 6.34M17.66 17.66L19.78 19.78M1 12H4M20 12H23M4.22 19.78L6.34 17.66M17.66 6.34L19.78 4.22" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      </svg>
    ),
  },
];

export default function Sidebar({ user, onSignOut, onExpandChange }) {
  const pathname = usePathname();
  const { theme, setTheme, resolvedTheme, mounted } = useTheme();
  const focusContext = useFocusSafe();
  
  const isCollapsed = useSyncExternalStore(
    subscribeToSidebarStorage,
    getSidebarCollapsed,
    () => true
  );
  
    const [hoveredItem, setHoveredItem] = useState(null);
  const [isHovering, setIsHovering] = useState(false);

  const handleCollapseToggle = useCallback(() => {
    const newState = !isCollapsed;
    localStorage.setItem('sidebar-collapsed', String(newState));
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
      return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="2" y="3" width="20" height="14" rx="2" stroke="currentColor" strokeWidth="2"/>
          <path d="M8 21H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          <path d="M12 17V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        </svg>
      );
    }
    if (resolvedTheme === 'dark') {
      return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      );
    }
    return (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="12" cy="12" r="5" stroke="currentColor" strokeWidth="2"/>
        <path d="M12 1V3M12 21V23M4.22 4.22L5.64 5.64M18.36 18.36L19.78 19.78M1 12H3M21 12H23M4.22 19.78L5.64 18.36M18.36 5.64L19.78 4.22" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      </svg>
    );
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
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
      animate={{ width: isExpanded ? 260 : 72 }}
      transition={{ type: 'spring', stiffness: 200, damping: 25, mass: 1 }}
    >
      <div className={styles.header}>
        <Link href="/dashboard" className={styles.logoLink}>
          <motion.div
            className={styles.logoIcon}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Image
              src="/lock-icon.png"
              alt="LockIn"
              width={26}
              height={32}
              priority
              style={{ width: 'auto', height: '32px' }}
            />
          </motion.div>
          <AnimatePresence>
            {isExpanded && (
              <motion.div
                className={styles.logoTextWrapper}
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: 'auto' }}
                exit={{ opacity: 0, width: 0 }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
              >
                <Image
                  src="/logo-text.png"
                  alt="LockIn"
                  width={107}
                  height={32}
                  priority
                  style={{ width: 'auto', height: '28px' }}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </Link>
      </div>

      <nav className={styles.nav}>
        {navItems.map((item) => {
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`${styles.navItem} ${active ? styles.active : ''}`}
              title={isExpanded ? undefined : item.label}
              onMouseEnter={() => setHoveredItem(item.href)}
              onMouseLeave={() => setHoveredItem(null)}
            >
              {hoveredItem === item.href && !active && (
                <motion.div
                  className={styles.navItemHoverBg}
                  layoutId="navHover"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                />
              )}
              <motion.span 
                className={styles.navIcon}
                animate={{ 
                  scale: active ? 1.1 : 1,
                  color: active ? 'var(--accent-primary)' : 'currentColor'
                }}
              >
                {item.icon}
              </motion.span>
              <AnimatePresence>
                {isExpanded && (
                  <motion.span
                    className={styles.navLabel}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    transition={{ duration: 0.2 }}
                  >
                    {item.label}
                  </motion.span>
                )}
              </AnimatePresence>
            </Link>
          );
        })}
      </nav>

      {focusContext?.isRunning && (
        <motion.div
          className={`${styles.miniTimer} ${isExpanded ? styles.miniTimerExpanded : styles.miniTimerCollapsed}`}
          layout="position"
          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
        >
          <motion.div
            className={styles.miniTimerPulse}
            animate={{ scale: [1, 1.15, 1], opacity: [0.3, 0.6, 0.3] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          />

          <Link href="/dashboard/focus" className={styles.miniTimerLink}>
            <span className={styles.miniTimerTime}>
              {focusContext.formatTime(focusContext.timeLeft)}
            </span>

            <AnimatePresence mode="popLayout">
              {isExpanded && (
                <motion.span
                  className={styles.miniTimerLabel}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ duration: 0.15 }}
                >
                  {focusContext.mode === 'work' ? 'Focusing' : 'Break'}
                </motion.span>
              )}
            </AnimatePresence>
          </Link>

          <AnimatePresence mode="popLayout">
            {isExpanded && (
              <motion.button
                className={styles.miniTimerBtn}
                onClick={(e) => {
                  e.stopPropagation();
                  focusContext.toggleTimer();
                }}
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.5 }}
                whileHover={{ scale: 1.1, backgroundColor: 'rgba(255, 255, 255, 0.35)' }}
                whileTap={{ scale: 0.95 }}
                transition={{ duration: 0.15 }}
                title="Pause timer"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect x="6" y="4" width="4" height="16" rx="1" fill="currentColor"/>
                  <rect x="14" y="4" width="4" height="16" rx="1" fill="currentColor"/>
                </svg>
              </motion.button>
            )}
          </AnimatePresence>
        </motion.div>
      )}

      <div className={styles.footer}>
        <div className={styles.userInfo}>
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
          <AnimatePresence>
            {isExpanded && (
              <motion.div
                className={styles.userDetails}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
              >
                <span className={styles.userName}>
                  {user?.user_metadata?.full_name || 'User'}
                </span>
                <span className={styles.userEmail}>{user?.email}</span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <NotificationBell />

        <motion.button
          onClick={cycleTheme}
          className={styles.themeBtn}
          aria-label={`Change theme. Current: ${getThemeLabel()}`}
          whileHover={{ scale: 1.1, backgroundColor: 'var(--surface-2)' }}
          whileTap={{ scale: 0.95 }}
        >
          {getThemeIcon()}
        </motion.button>

        <motion.button
          onClick={onSignOut}
          className={styles.signOutBtn}
          aria-label="Sign out"
          whileHover={{ scale: 1.1, backgroundColor: 'var(--danger-bg)', color: 'var(--danger)' }}
          whileTap={{ scale: 0.95 }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M9 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M16 17L21 12L16 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M21 12H9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </motion.button>
      </div>

      <motion.button
        className={styles.collapseBtn}
        onClick={handleCollapseToggle}
        aria-label={isCollapsed ? 'Pin sidebar' : 'Collapse sidebar'}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
      >
        <motion.svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          animate={{ rotate: isCollapsed ? 0 : 180 }}
          transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
        >
          <path d="M9 18L15 12L9 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </motion.svg>
      </motion.button>
    </motion.aside>
  );
}
