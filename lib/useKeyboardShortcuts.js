'use client';

import { useEffect, useCallback } from 'react';
import { usePathname } from 'next/navigation';

/**
 * Keyboard shortcuts hook for LockIn app
 *
 * Shortcuts:
 * - Cmd/Ctrl + N: Open new pact modal (dashboard)
 * - Space: Pause/Resume timer (focus page only)
 * - Escape: Close any open modal
 */
export function useKeyboardShortcuts({
  onNewPact,
  onToggleTimer,
  onCloseModal,
}) {
  const pathname = usePathname();

  const handleKeyDown = useCallback((e) => {
    // Don't trigger shortcuts when typing in input fields
    const target = e.target;
    const tagName = target.tagName?.toLowerCase();
    const isEditable = target.isContentEditable;
    const isInput = tagName === 'input' || tagName === 'textarea' || tagName === 'select' || isEditable;

    // Escape always works to close modals
    if (e.key === 'Escape' && onCloseModal) {
      onCloseModal();
      return;
    }

    // Don't process other shortcuts when in input fields
    if (isInput) return;

    // Cmd/Ctrl + N: Open new pact modal
    if ((e.metaKey || e.ctrlKey) && e.key === 'n') {
      e.preventDefault();
      if (onNewPact) {
        onNewPact();
      }
      return;
    }

    // Space: Toggle timer (only on focus page)
    if (e.key === ' ' && pathname === '/dashboard/focus') {
      e.preventDefault();
      if (onToggleTimer) {
        onToggleTimer();
      }
      return;
    }
  }, [pathname, onNewPact, onToggleTimer, onCloseModal]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
}
