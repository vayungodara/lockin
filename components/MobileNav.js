'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { createClient } from '@/lib/supabase/client';
import { getLevelFromXP } from '@/lib/gamification';
import { House, CheckSquare, UsersThree, Timer, ChartLineUp, GearSix } from '@phosphor-icons/react';
import { useFocusSafe } from '@/lib/FocusContext';
import styles from './MobileNav.module.css';

const navItems = [
  { href: '/dashboard', label: 'Home', IconComponent: House },
  { href: '/dashboard/pacts', label: 'Pacts', IconComponent: CheckSquare },
  { href: '/dashboard/groups', label: 'Groups', IconComponent: UsersThree },
  { href: '/dashboard/focus', label: 'Focus', IconComponent: Timer },
  { href: '/dashboard/stats', label: 'Stats', IconComponent: ChartLineUp },
  { href: '/dashboard/settings', label: 'Settings', IconComponent: GearSix },
];

export default function MobileNav({ userId }) {
  const pathname = usePathname();
  const focusContext = useFocusSafe();
  const [level, setLevel] = useState(null);
  const supabase = useMemo(() => createClient(), []);

  useEffect(() => {
    async function fetchLevel() {
      if (!userId) return;
      const { data, error } = await supabase
        .from('profiles')
        .select('total_xp, level')
        .eq('id', userId)
        .single();
      if (error || !data) return;
      setLevel(data.level || getLevelFromXP(data.total_xp || 0));
    }
    fetchLevel();
  }, [userId, supabase]);

  const isActive = (href) => {
    if (href === '/dashboard') {
      return pathname === '/dashboard';
    }
    return pathname.startsWith(href);
  };

  return (
    <>
      {focusContext?.isRunning && (
        <div className={styles.mobileTimer}>
          <div className={styles.mobileTimerContent}>
            <span className={styles.mobileTimerTime}>
              {focusContext.formatTime(focusContext.timeLeft)}
            </span>
            <span className={styles.mobileTimerLabel}>
              {focusContext.mode === 'work' ? 'Focusing' : 'Break'}
            </span>
          </div>
          <motion.button
            className={styles.mobileTimerBtn}
            onClick={focusContext.toggleTimer}
            whileTap={{ scale: 0.95 }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="6" y="4" width="4" height="16" rx="1" fill="currentColor"/>
              <rect x="14" y="4" width="4" height="16" rx="1" fill="currentColor"/>
            </svg>
          </motion.button>
        </div>
      )}
      <nav className={styles.mobileNav}>
      {level !== null && (
        <span className={styles.levelPill} aria-label={`Level ${level}`}>
          Lv. {level}
        </span>
      )}
      {navItems.map((item) => {
        const active = isActive(item.href);
        const IconComp = item.IconComponent;
        return (
        <Link
          key={item.href}
          href={item.href}
          className={`${styles.navItem} ${active ? styles.active : ''}`}
        >
          <motion.span
            className={styles.navIcon}
            whileTap={{ scale: 0.9 }}
          >
            <IconComp size={24} weight={active ? 'fill' : 'regular'} />
          </motion.span>
          <span className={styles.navLabel}>{item.label}</span>
          {active && (
            <motion.div
              className={styles.activeDot}
              layoutId="mobile-nav-dot"
              transition={{ type: 'spring', stiffness: 350, damping: 30, mass: 0.8 }}
            />
          )}
        </Link>
        );
      })}
    </nav>
    </>
  );
}
