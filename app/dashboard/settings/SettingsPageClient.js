'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { useTheme } from '@/components/ThemeProvider';
import { buttonHover, buttonTap } from '@/lib/animations';
import { useToast } from '@/components/Toast';
import { ACCENT_PALETTES } from '@/lib/accentColors';
import styles from './SettingsPage.module.css';

const STORAGE_KEYS = {
  workDuration: 'lockin-work-duration',
  breakDuration: 'lockin-break-duration',
  soundEnabled: 'lockin-sound-enabled',
};

export default function SettingsPageClient({ user }) {
  const { theme, setTheme, accent, setAccent } = useTheme();
  const toast = useToast();

  // Preload all logo color variants for instant accent swaps
  useEffect(() => {
    ACCENT_PALETTES.forEach(palette => {
      new window.Image().src = `/logos/${palette.id}-lock.png`;
      new window.Image().src = `/logos/${palette.id}-text.png`;
    });
  }, []);

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
              <svg width="16" height="16" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
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
              <button
                className={`${styles.toggle} ${soundEnabled ? styles.toggleOn : ''}`}
                onClick={handleSoundToggle}
                type="button"
                aria-pressed={soundEnabled}
              >
                <span
                  className={styles.toggleKnob}
                  style={{ transform: `translateX(${soundEnabled ? 20 : 0}px)` }}
                />
              </button>
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

            <div className={styles.accentRow}>
              <span className={styles.settingLabel}>Accent Color</span>
              <div className={styles.accentGrid}>
                {ACCENT_PALETTES.map((palette) => (
                  <button
                    key={palette.id}
                    className={`${styles.accentSwatch} ${accent === palette.id ? styles.accentSwatchActive : ''}`}
                    onClick={() => setAccent(palette.id)}
                    title={palette.name}
                    type="button"
                    style={{
                      background: `linear-gradient(135deg, ${palette.primary}, ${palette.secondary}, ${palette.tertiary})`,
                    }}
                  />
                ))}
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
