'use client';

import { createContext, useContext, useCallback, useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';

const KeyboardShortcutsContext = createContext(null);

export function KeyboardShortcutsProvider({ children }) {
  const pathname = usePathname();

  // Store callbacks in refs so they can be updated without re-registering listeners
  const callbacksRef = useRef({
    onNewPact: null,
    onToggleTimer: null,
    onCloseModal: null,
  });

  // Register callbacks
  const registerCallbacks = useCallback((callbacks) => {
    if (callbacks.onNewPact !== undefined) {
      callbacksRef.current.onNewPact = callbacks.onNewPact;
    }
    if (callbacks.onToggleTimer !== undefined) {
      callbacksRef.current.onToggleTimer = callbacks.onToggleTimer;
    }
    if (callbacks.onCloseModal !== undefined) {
      callbacksRef.current.onCloseModal = callbacks.onCloseModal;
    }
  }, []);

  // Unregister callbacks
  const unregisterCallbacks = useCallback((keys) => {
    keys.forEach(key => {
      callbacksRef.current[key] = null;
    });
  }, []);

  useEffect(() => {
    const handleKeyDown = (e) => {
      // Don't trigger shortcuts when typing in input fields
      const target = e.target;
      const tagName = target.tagName?.toLowerCase();
      const isEditable = target.isContentEditable;
      const isInput = tagName === 'input' || tagName === 'textarea' || tagName === 'select' || isEditable;

      // Escape always works to close modals
      if (e.key === 'Escape' && callbacksRef.current.onCloseModal) {
        callbacksRef.current.onCloseModal();
        return;
      }

      // Don't process other shortcuts when in input fields
      if (isInput) return;

      // Cmd/Ctrl + N: Open new pact modal
      if ((e.metaKey || e.ctrlKey) && e.key === 'n') {
        e.preventDefault();
        if (callbacksRef.current.onNewPact) {
          callbacksRef.current.onNewPact();
        }
        return;
      }

      // Space: Toggle timer (only on focus page)
      if (e.key === ' ' && pathname === '/dashboard/focus') {
        e.preventDefault();
        if (callbacksRef.current.onToggleTimer) {
          callbacksRef.current.onToggleTimer();
        }
        return;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [pathname]);

  const value = {
    registerCallbacks,
    unregisterCallbacks,
  };

  return (
    <KeyboardShortcutsContext.Provider value={value}>
      {children}
    </KeyboardShortcutsContext.Provider>
  );
}

export function useKeyboardShortcuts() {
  const context = useContext(KeyboardShortcutsContext);
  if (!context) {
    throw new Error('useKeyboardShortcuts must be used within a KeyboardShortcutsProvider');
  }
  return context;
}

// Safe version that doesn't throw - returns no-op functions when outside provider
export function useKeyboardShortcutsSafe() {
  const context = useContext(KeyboardShortcutsContext);
  if (!context) {
    return {
      registerCallbacks: () => {},
      unregisterCallbacks: () => {},
    };
  }
  return context;
}
