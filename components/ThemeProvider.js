'use client';

import { createContext, useContext, useEffect, useSyncExternalStore, useCallback, useRef } from 'react';

const ThemeContext = createContext({
  theme: 'system',
  setTheme: () => {},
  resolvedTheme: 'light',
  mounted: false,
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

  const resolvedTheme = theme === 'system' ? systemTheme : theme;
  
  const prevResolvedTheme = useRef(resolvedTheme);

  useEffect(() => {
    if (!mounted) return;

    const root = document.documentElement;
    root.setAttribute('data-theme', resolvedTheme);
    prevResolvedTheme.current = resolvedTheme;
  }, [resolvedTheme, mounted]);

  const setTheme = useCallback((newTheme) => {
    localStorage.setItem('lockin-theme', newTheme);
    window.dispatchEvent(new StorageEvent('storage', { key: 'lockin-theme' }));
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, resolvedTheme, mounted }}>
      {children}
    </ThemeContext.Provider>
  );
}
