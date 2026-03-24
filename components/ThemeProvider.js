'use client';

import { createContext, useContext, useEffect, useSyncExternalStore, useCallback, useRef } from 'react';
import { applyAccentToDocument, DEFAULT_PALETTE_ID } from '@/lib/accentColors';

const ThemeContext = createContext({
  theme: 'system',
  setTheme: () => {},
  resolvedTheme: 'light',
  mounted: false,
  accent: DEFAULT_PALETTE_ID,
  setAccent: () => {},
});

export function useTheme() {
  return useContext(ThemeContext);
}

function getSystemTheme() {
  if (typeof window === 'undefined') return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function subscribeToSystemTheme(callback) {
  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
  mediaQuery.addEventListener('change', callback);
  return () => mediaQuery.removeEventListener('change', callback);
}

const noopSubscribe = () => () => {};
const isClient = () => true;
const isServer = () => false;

function getStoredTheme() {
  const stored = localStorage.getItem('lockin-theme');
  if (stored && ['light', 'dark', 'system'].includes(stored)) {
    return stored;
  }
  return 'system';
}

function subscribeToStorage(callback) {
  const handler = (e) => {
    if (e.key === 'lockin-theme') callback();
  };
  window.addEventListener('storage', handler);
  return () => window.removeEventListener('storage', handler);
}

function getStoredAccent() {
  const stored = localStorage.getItem('lockin-accent');
  return stored || DEFAULT_PALETTE_ID;
}

function subscribeToAccentStorage(callback) {
  const handler = (e) => {
    if (e.key === 'lockin-accent') callback();
  };
  window.addEventListener('storage', handler);
  return () => window.removeEventListener('storage', handler);
}

export default function ThemeProvider({ children }) {
  const mounted = useSyncExternalStore(noopSubscribe, isClient, isServer);

  const theme = useSyncExternalStore(
    subscribeToStorage,
    getStoredTheme,
    () => 'system'
  );

  const systemTheme = useSyncExternalStore(
    subscribeToSystemTheme,
    getSystemTheme,
    () => 'light'
  );

  const accent = useSyncExternalStore(
    subscribeToAccentStorage,
    getStoredAccent,
    () => DEFAULT_PALETTE_ID
  );

  const resolvedTheme = theme === 'system' ? systemTheme : theme;

  const prevResolvedTheme = useRef(resolvedTheme);

  // Apply theme on mount and when user changes it.
  // The inline themeScript in layout.js already sets data-theme before
  // first paint, so the initial run here is a no-op for the attribute.
  // We add data-theme-ready to enable CSS transitions only AFTER the
  // first paint, preventing the light→dark background animation flash.
  const themeReadyRef = useRef(false);

  useEffect(() => {
    if (!mounted) return;

    const root = document.documentElement;
    root.setAttribute('data-theme', resolvedTheme);
    prevResolvedTheme.current = resolvedTheme;

    applyAccentToDocument(accent, resolvedTheme === 'dark');

    // Enable theme transitions after the first theme application,
    // so only user-initiated toggles animate (not initial load).
    if (!themeReadyRef.current) {
      themeReadyRef.current = true;
      requestAnimationFrame(() => {
        root.setAttribute('data-theme-ready', '');
      });
    }
  }, [resolvedTheme, mounted, accent]);

  const setTheme = useCallback((newTheme) => {
    localStorage.setItem('lockin-theme', newTheme);
    window.dispatchEvent(new StorageEvent('storage', { key: 'lockin-theme' }));
  }, []);

  const setAccent = useCallback((newAccent) => {
    localStorage.setItem('lockin-accent', newAccent);
    window.dispatchEvent(new StorageEvent('storage', { key: 'lockin-accent' }));
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, resolvedTheme, mounted, accent, setAccent }}>
      {children}
    </ThemeContext.Provider>
  );
}
