'use client';

import { useState } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { useTheme } from '@/components/ThemeProvider';
import { buttonHover, buttonTap } from '@/lib/animations';
import { useToast } from '@/components/Toast';
import styles from './SettingsPage.module.css';

const STORAGE_KEYS = {
  workDuration: 'lockin-work-duration',
  breakDuration: 'lockin-break-duration',
  soundEnabled: 'lockin-sound-enabled',
};

export default function SettingsPageClient({ user }) {
  const { theme, setTheme } = useTheme();
  const toast = useToast();

  // Timer settings - initialize from localStorage
  const [workDuration, setWorkDuration] = useState(() => {
    if (typeof window === 'undefined') return 25;
    const saved = localStorage.getItem(STORAGE_KEYS.workDuration);
    return saved ? parseInt(saved, 10) : 25;
  });
  const [breakDuration, setBreakDuration] = useState(() => {
    if (typeof window === 'undefined') return 5;
    const saved = localStorage.getItem(STORAGE_KEYS.breakDuration);
    return saved ? parseInt(saved, 10) : 5;
  });
  const [soundEnabled, setSoundEnabled] = useState(() => {
    if (typeof window === 'undefined') return true;
    const saved = localStorage.getItem(STORAGE_KEYS.soundEnabled);
    return saved === null ? true : saved === 'true';
  });

  const handleWorkDurationChange = (value) => {
    setWorkDuration(value);
    localStorage.setItem(STORAGE_KEYS.workDuration, value.toString());
    // Dispatch storage event for other components to react
    window.dispatchEvent(new StorageEvent('storage', { key: STORAGE_KEYS.workDuration }));
  };

  const handleBreakDurationChange = (value) => {
    setBreakDuration(value);
    localStorage.setItem(STORAGE_KEYS.breakDuration, value.toString());
    window.dispatchEvent(new StorageEvent('storage', { key: STORAGE_KEYS.breakDuration }));
  };

  const handleSoundToggle = () => {
    const newValue = !soundEnabled;
    setSoundEnabled(newValue);
    localStorage.setItem(STORAGE_KEYS.soundEnabled, newValue.toString());
    toast.success(newValue ? 'Sound effects enabled' : 'Sound effects disabled');
  };

  const handleThemeChange = (newTheme) => {
    setTheme(newTheme);
  };

  const getThemeButtonClass = (themeName) => {
    return `${styles.themeBtn} ${theme === themeName ? styles.themeBtnActive : ''}`;
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div>
          <h1>Settings</h1>
          <p className={styles.subtitle}>Customize your LockIn experience</p>
        </div>
      </header>

      <div className={styles.content}>
        {/* Account Section */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="12" cy="7" r="4" stroke="currentColor" strokeWidth="2"/>
              <path d="M5.5 21C5.5 17.134 8.41015 14 12 14C15.5899 14 18.5 17.134 18.5 21" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            Account
          </h2>
          <div className={styles.accountCard}>
            <div className={styles.accountInfo}>
              {user?.user_metadata?.avatar_url ? (
                <Image
                  src={user.user_metadata.avatar_url}
                  alt={user.user_metadata?.full_name || 'User'}
                  className={styles.avatar}
                  width={64}
                  height={64}
                />
              ) : (
                <div className={styles.avatarPlaceholder}>
                  {user?.email?.[0]?.toUpperCase() || 'U'}
                </div>
              )}
              <div className={styles.accountDetails}>
                <span className={styles.accountName}>
                  {user?.user_metadata?.full_name || 'User'}
                </span>
                <span className={styles.accountEmail}>{user?.email}</span>
              </div>
            </div>
            <div className={styles.accountBadge}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M22.65 14.39L12 22.13L1.35 14.39C1.12 14.21 0.97 13.95 0.93 13.67C0.89 13.39 0.97 13.1 1.15 12.87L12 0.87L22.85 12.87C23.03 13.1 23.11 13.39 23.07 13.67C23.03 13.95 22.88 14.21 22.65 14.39Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M12 22.13V0.87" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Google Account
            </div>
          </div>
        </section>

        {/* Timer Settings Section */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
              <path d="M12 6V12L16 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            Focus Timer
          </h2>

          <div className={styles.settingCard}>
            <div className={styles.settingRow}>
              <div className={styles.settingInfo}>
                <span className={styles.settingLabel}>Work Duration</span>
                <span className={styles.settingDescription}>Length of each focus session</span>
              </div>
              <div className={styles.sliderWrapper}>
                <input
                  type="range"
                  min="15"
                  max="60"
                  step="5"
                  value={workDuration}
                  onChange={(e) => handleWorkDurationChange(parseInt(e.target.value, 10))}
                  className={styles.slider}
                />
                <span className={styles.sliderValue}>{workDuration} min</span>
              </div>
            </div>

            <div className={styles.settingRow}>
              <div className={styles.settingInfo}>
                <span className={styles.settingLabel}>Break Duration</span>
                <span className={styles.settingDescription}>Length of each break session</span>
              </div>
              <div className={styles.sliderWrapper}>
                <input
                  type="range"
                  min="1"
                  max="15"
                  step="1"
                  value={breakDuration}
                  onChange={(e) => handleBreakDurationChange(parseInt(e.target.value, 10))}
                  className={styles.slider}
                />
                <span className={styles.sliderValue}>{breakDuration} min</span>
              </div>
            </div>

            <div className={styles.settingRow}>
              <div className={styles.settingInfo}>
                <span className={styles.settingLabel}>Sound Effects</span>
                <span className={styles.settingDescription}>Play sound when timer completes</span>
              </div>
              <motion.button
                className={`${styles.toggle} ${soundEnabled ? styles.toggleOn : ''}`}
                onClick={handleSoundToggle}
                whileTap={buttonTap}
              >
                <motion.div
                  className={styles.toggleKnob}
                  animate={{ x: soundEnabled ? 20 : 0 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                />
              </motion.button>
            </div>
          </div>
        </section>

        {/* Appearance Section */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="12" cy="12" r="5" stroke="currentColor" strokeWidth="2"/>
              <path d="M12 1V3M12 21V23M4.22 4.22L5.64 5.64M18.36 18.36L19.78 19.78M1 12H3M21 12H23M4.22 19.78L5.64 18.36M18.36 5.64L19.78 4.22" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            Appearance
          </h2>

          <div className={styles.settingCard}>
            <div className={styles.themeRow}>
              <span className={styles.settingLabel}>Theme</span>
              <div className={styles.themeButtons}>
                <motion.button
                  className={getThemeButtonClass('light')}
                  onClick={() => handleThemeChange('light')}
                  whileHover={buttonHover}
                  whileTap={buttonTap}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="12" cy="12" r="5" stroke="currentColor" strokeWidth="2"/>
                    <path d="M12 1V3M12 21V23M4.22 4.22L5.64 5.64M18.36 18.36L19.78 19.78M1 12H3M21 12H23M4.22 19.78L5.64 18.36M18.36 5.64L19.78 4.22" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                  Light
                </motion.button>
                <motion.button
                  className={getThemeButtonClass('dark')}
                  onClick={() => handleThemeChange('dark')}
                  whileHover={buttonHover}
                  whileTap={buttonTap}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  Dark
                </motion.button>
                <motion.button
                  className={getThemeButtonClass('system')}
                  onClick={() => handleThemeChange('system')}
                  whileHover={buttonHover}
                  whileTap={buttonTap}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <rect x="2" y="3" width="20" height="14" rx="2" stroke="currentColor" strokeWidth="2"/>
                    <path d="M8 21H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                    <path d="M12 17V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                  System
                </motion.button>
              </div>
            </div>
          </div>
        </section>

        {/* Keyboard Shortcuts Section */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="2" y="4" width="20" height="16" rx="2" stroke="currentColor" strokeWidth="2"/>
              <path d="M6 8H6.01M10 8H10.01M14 8H14.01M18 8H18.01M6 12H6.01M18 12H18.01M8 16H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            Keyboard Shortcuts
          </h2>

          <div className={styles.settingCard}>
            <div className={styles.shortcutList}>
              <div className={styles.shortcutItem}>
                <span className={styles.shortcutLabel}>Create new pact</span>
                <div className={styles.shortcutKeys}>
                  <kbd className={styles.kbd}>⌘</kbd>
                  <span className={styles.shortcutPlus}>+</span>
                  <kbd className={styles.kbd}>N</kbd>
                </div>
              </div>
              <div className={styles.shortcutItem}>
                <span className={styles.shortcutLabel}>Pause/Resume timer</span>
                <div className={styles.shortcutKeys}>
                  <kbd className={styles.kbd}>Space</kbd>
                </div>
              </div>
              <div className={styles.shortcutItem}>
                <span className={styles.shortcutLabel}>Close modal</span>
                <div className={styles.shortcutKeys}>
                  <kbd className={styles.kbd}>Esc</kbd>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
