'use client';

import { useState, useEffect, useMemo, useSyncExternalStore } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useTheme } from '@/components/ThemeProvider';
import { useToast } from '@/components/Toast';
import { setSoundEnabled as setGlobalSoundEnabled } from '@/lib/sounds';
import { resetOnboarding } from '@/lib/onboarding';
import { createClient } from '@/lib/supabase/client';
import { SkeletonCard, SkeletonText } from '@/components/Skeleton';
import SectionHeader from '@/components/SectionHeader';
import styles from './SettingsPage.module.css';

const STORAGE_KEYS = {
  workDuration: 'lockin-work-duration',
  breakDuration: 'lockin-break-duration',
};

// Same ink set the InkPicker popover renders. The settings page is the
// primary discovery surface, so the swatches live here inline rather than
// behind the nav popover. We intentionally compose the swatch grid in-place
// instead of re-mounting <InkPicker /> with a new mode prop — InkPicker's
// click-outside / escape / AnimatePresence wiring is popover-specific and
// would short-circuit half its logic in an inline context.
const INKS = [
  { key: 'highlighter', label: 'Highlighter', swatch: 'oklch(0.88 0.13 92)' },
  { key: 'redpen', label: 'Red Pen', swatch: 'oklch(0.64 0.22 28)' },
  { key: 'carbon', label: 'Carbon', swatch: 'oklch(0.72 0.15 230)' },
  { key: 'moss', label: 'Moss', swatch: 'oklch(0.56 0.14 142)' },
  { key: 'indigo-legacy', label: 'Indigo', swatch: 'oklch(0.58 0.19 278)' },
];

const VALID_INK_KEYS = new Set(INKS.map((i) => i.key));

function readPersistedInk() {
  if (typeof window === 'undefined') return 'highlighter';
  try {
    const stored = localStorage.getItem('lockin-ink');
    if (stored && VALID_INK_KEYS.has(stored)) return stored;
  } catch {
    // localStorage may throw in private mode — fall through to default.
  }
  return 'highlighter';
}

function applyInk(key) {
  if (typeof document === 'undefined') return;
  document.documentElement.setAttribute('data-ink', key);
}

function subscribeToInk(callback) {
  if (typeof window === 'undefined') return () => {};
  const onStorage = (e) => {
    if (e.key === 'lockin-ink') callback();
  };
  window.addEventListener('storage', onStorage);
  return () => window.removeEventListener('storage', onStorage);
}

export default function SettingsPageClient({ user }) {
  const { theme, setTheme } = useTheme();
  const toast = useToast();
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  // Timer settings — initialize from localStorage. Logic preserved verbatim
  // from the previous client; only the surrounding chrome changes.
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
  const [globalSoundEnabled, setGlobalSoundEnabledState] = useState(() => {
    if (typeof window === 'undefined') return true;
    try { return localStorage.getItem('lockin_sounds') !== 'false'; }
    catch { return true; }
  });

  const selectedInk = useSyncExternalStore(
    subscribeToInk,
    readPersistedInk,
    () => 'highlighter',
  );

  const handleWorkDurationChange = (value) => {
    setWorkDuration(value);
    localStorage.setItem(STORAGE_KEYS.workDuration, value.toString());
    window.dispatchEvent(new StorageEvent('storage', { key: STORAGE_KEYS.workDuration }));
  };

  const handleBreakDurationChange = (value) => {
    setBreakDuration(value);
    localStorage.setItem(STORAGE_KEYS.breakDuration, value.toString());
    window.dispatchEvent(new StorageEvent('storage', { key: STORAGE_KEYS.breakDuration }));
  };

  const handleGlobalSoundToggle = () => {
    const newValue = !globalSoundEnabled;
    setGlobalSoundEnabled(newValue);
    setGlobalSoundEnabledState(newValue);
    toast.success(newValue ? 'Sounds on' : 'Sounds off');
  };

  const handleThemeChange = (newTheme) => {
    setTheme(newTheme);
  };

  const handleInkHover = (key) => {
    applyInk(key);
  };

  const handleInkHoverEnd = () => {
    applyInk(readPersistedInk());
  };

  const handleInkClick = (key) => {
    try {
      localStorage.setItem('lockin-ink', key);
    } catch {
      // Private mode / quota — apply visually anyway.
    }
    applyInk(key);
    try {
      window.dispatchEvent(new StorageEvent('storage', {
        key: 'lockin-ink',
        newValue: key,
        storageArea: window.localStorage,
      }));
    } catch {
      // StorageEvent constructor unavailable.
    }
  };

  const themeButtonClass = (themeName) =>
    `${styles.themeBtn} ${theme === themeName ? styles.themeBtnActive : ''}`.trim();

  if (!user) {
    return (
      <div className={styles.container}>
        <header className={styles.pageHeader}>
          <div className={styles.pageHeaderLeft}>
            <SkeletonText width="120px" height="14px" />
            <SkeletonText width="220px" height="48px" />
          </div>
        </header>
        <div className={styles.content}>
          <SkeletonCard height="120px" />
          <SkeletonCard height="200px" />
          <SkeletonCard height="160px" />
        </div>
      </div>
    );
  }

  const fullName = user?.user_metadata?.full_name || 'You';
  const avatarUrl = user?.user_metadata?.avatar_url;

  return (
    <div className={styles.container}>
      <header className={styles.pageHeader}>
        <div className={styles.pageHeaderLeft}>
          <div className={styles.pageEyebrow}>§ Settings</div>
          <h1 className={styles.pageTitle}>Settings</h1>
          <p className={styles.pageSubtitle}>
            Configure your account, ink, timer, and sounds.
          </p>
        </div>
      </header>

      <div className={styles.content}>
        {/* § 01 — Account ── Read-only OAuth identity. */}
        <section className={styles.section}>
          <SectionHeader number="01" title="Account" caption="Identity" />
          <div className={styles.panel}>
            <div className={styles.accountRow}>
              <div className={styles.accountInfo}>
                {avatarUrl ? (
                  <Image
                    src={avatarUrl}
                    alt={fullName}
                    className={styles.avatar}
                    width={56}
                    height={56}
                  />
                ) : (
                  <div className={styles.avatarPlaceholder} aria-hidden="true">
                    {(user?.email?.[0] || 'U').toUpperCase()}
                  </div>
                )}
                <div className={styles.accountDetails}>
                  <div className={styles.fieldLabel}>Display name</div>
                  <div className={styles.accountName}>{fullName}</div>
                  <div className={styles.fieldLabel}>Email address</div>
                  <div className={styles.accountEmail}>{user?.email}</div>
                </div>
              </div>
              <div className={styles.accountBadge}>
                <svg width="14" height="14" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                <span>Signed in with Google</span>
              </div>
            </div>
          </div>
        </section>

        {/* § 02 — Ink ── Visual identity. Always-visible swatch grid plus
            theme toggle as a sub-control. Hover previews live, click commits. */}
        <section className={styles.section}>
          <SectionHeader number="02" title="Ink" caption="Visual identity" />
          <div className={styles.panel}>
            <p className={styles.panelLead}>
              Pick your accent color. Used across the app.
            </p>
            <ul
              className={styles.inkGrid}
              onMouseLeave={handleInkHoverEnd}
            >
              {INKS.map((ink) => {
                const isActive = selectedInk === ink.key;
                return (
                  <li key={ink.key} className={styles.inkItem}>
                    <button
                      type="button"
                      onClick={() => handleInkClick(ink.key)}
                      onMouseEnter={() => handleInkHover(ink.key)}
                      onFocus={() => handleInkHover(ink.key)}
                      onBlur={handleInkHoverEnd}
                      className={`${styles.inkBtn} ${isActive ? styles.inkBtnActive : ''}`.trim()}
                      aria-pressed={isActive}
                      aria-label={`${ink.label} ink${isActive ? ' (selected)' : ''}`}
                    >
                      <span
                        className={styles.inkSwatch}
                        style={{ background: ink.swatch }}
                        aria-hidden="true"
                      />
                      <span className={styles.inkLabel}>{ink.label}</span>
                      {isActive && <span className={styles.inkActiveDot} aria-hidden="true" />}
                    </button>
                  </li>
                );
              })}
            </ul>

            <div className={styles.divider} aria-hidden="true" />

            <div className={styles.subRow}>
              <div className={styles.subRowInfo}>
                <span className={styles.fieldLabel}>Theme</span>
                <span className={styles.fieldHelp}>
                  Cream paper or warm dark ink.
                </span>
              </div>
              <div className={styles.themeButtons}>
                <button
                  type="button"
                  className={themeButtonClass('light')}
                  onClick={() => handleThemeChange('light')}
                  aria-pressed={theme === 'light'}
                >
                  Light
                </button>
                <button
                  type="button"
                  className={themeButtonClass('dark')}
                  onClick={() => handleThemeChange('dark')}
                  aria-pressed={theme === 'dark'}
                >
                  Dark
                </button>
                <button
                  type="button"
                  className={themeButtonClass('system')}
                  onClick={() => handleThemeChange('system')}
                  aria-pressed={theme === 'system'}
                >
                  System
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* § 03 — Timer ── Pomodoro work + break durations. */}
        <section className={styles.section}>
          <SectionHeader number="03" title="Timer" caption="Pomodoro" />
          <div className={styles.panel}>
            <div className={styles.fieldRow}>
              <div className={styles.subRowInfo}>
                <span className={styles.fieldLabel}>Pomodoro length</span>
                <span className={styles.fieldHelp}>
                  Length of each focus session.
                </span>
              </div>
              <div className={styles.sliderWrap}>
                <input
                  type="range"
                  min="15"
                  max="60"
                  step="5"
                  value={workDuration}
                  onChange={(e) => handleWorkDurationChange(parseInt(e.target.value, 10))}
                  className={styles.slider}
                  aria-label="Pomodoro length in minutes"
                />
                <span className={styles.sliderValue}>{workDuration} min</span>
              </div>
            </div>

            <div className={styles.fieldRow}>
              <div className={styles.subRowInfo}>
                <span className={styles.fieldLabel}>Break length</span>
                <span className={styles.fieldHelp}>
                  Length of each break between sessions.
                </span>
              </div>
              <div className={styles.sliderWrap}>
                <input
                  type="range"
                  min="1"
                  max="15"
                  step="1"
                  value={breakDuration}
                  onChange={(e) => handleBreakDurationChange(parseInt(e.target.value, 10))}
                  className={styles.slider}
                  aria-label="Break length in minutes"
                />
                <span className={styles.sliderValue}>{breakDuration} min</span>
              </div>
            </div>
          </div>
        </section>

        {/* § 04 — Sound ── Single global toggle for all app sounds. */}
        <section className={styles.section}>
          <SectionHeader number="04" title="Sound" caption="Audio" />
          <div className={styles.panel}>
            <div className={styles.fieldRow}>
              <div className={styles.subRowInfo}>
                <span className={styles.fieldLabel}>App sounds</span>
                <span className={styles.fieldHelp}>
                  Plays a chime on pact completion, timer finish, and streak milestones.
                </span>
              </div>
              <button
                type="button"
                className={`${styles.toggle} ${globalSoundEnabled ? styles.toggleOn : ''}`.trim()}
                onClick={handleGlobalSoundToggle}
                aria-pressed={globalSoundEnabled}
                aria-label="Toggle app sounds"
              >
                <span
                  className={styles.toggleKnob}
                  style={{ transform: `translateX(${globalSoundEnabled ? 20 : 0}px)` }}
                />
              </button>
            </div>
          </div>
        </section>

        {/* § 05 — Keyboard ── Read-only shortcut reference. */}
        <section className={styles.section}>
          <SectionHeader number="05" title="Keyboard" caption="Shortcuts" />
          <div className={styles.panel}>
            <ul className={styles.shortcutList}>
              <li className={styles.shortcutItem}>
                <span className={styles.shortcutLabel}>Create new pact</span>
                <span className={styles.shortcutKeys}>
                  <kbd className={styles.kbd}>Cmd</kbd>
                  <span className={styles.kbdPlus}>+</span>
                  <kbd className={styles.kbd}>N</kbd>
                </span>
              </li>
              <li className={styles.shortcutItem}>
                <span className={styles.shortcutLabel}>Pause or resume timer</span>
                <span className={styles.shortcutKeys}>
                  <kbd className={styles.kbd}>Space</kbd>
                </span>
              </li>
              <li className={styles.shortcutItem}>
                <span className={styles.shortcutLabel}>Close modal</span>
                <span className={styles.shortcutKeys}>
                  <kbd className={styles.kbd}>Esc</kbd>
                </span>
              </li>
            </ul>
          </div>
        </section>

        {/* § 06 — Help ── Reset onboarding. */}
        <section className={styles.section}>
          <SectionHeader number="06" title="Help" caption="Tutorials" />
          <div className={styles.panel}>
            <div className={styles.fieldRow}>
              <div className={styles.subRowInfo}>
                <span className={styles.fieldLabel}>Restart onboarding</span>
                <span className={styles.fieldHelp}>
                  Show the First Week Challenge again on your dashboard.
                </span>
              </div>
              <button
                type="button"
                className={styles.secondaryBtn}
                onClick={async () => {
                  const success = await resetOnboarding(supabase, user?.id);
                  if (success) {
                    toast.success('Onboarding reset. Open your dashboard to start the challenge.');
                  } else {
                    toast.error('Could not reset onboarding. Try again.');
                  }
                }}
              >
                Reset
              </button>
            </div>
          </div>
        </section>

        {/* § 07 — Sign out ── Preserved from D1. */}
        <section className={styles.section}>
          <SectionHeader number="07" title="Sign out" caption="Session" />
          <div className={styles.panel}>
            <div className={styles.fieldRow}>
              <div className={styles.subRowInfo}>
                <span className={styles.fieldLabel}>Sign out</span>
                <span className={styles.fieldHelp}>
                  End your current session on this device.
                </span>
              </div>
              <button
                type="button"
                onClick={handleSignOut}
                className={styles.dangerBtn}
              >
                Sign out
              </button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
