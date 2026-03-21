'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useTheme } from '@/components/ThemeProvider';
import { modalContent } from '@/lib/animations';
import { useModalScrollLock } from '@/lib/useModalScrollLock';
import styles from './CommandPalette.module.css';

const commands = [
  { id: 'new-pact', label: 'Create New Pact', shortcut: '\u2318N', icon: '\uD83D\uDD12', action: 'create-pact' },
  { id: 'dashboard', label: 'Go to Dashboard', icon: '\uD83D\uDCCA', action: 'navigate', path: '/dashboard' },
  { id: 'pacts', label: 'My Pacts', icon: '\uD83D\uDCCB', action: 'navigate', path: '/dashboard/pacts' },
  { id: 'groups', label: 'Groups', icon: '\uD83D\uDC65', action: 'navigate', path: '/dashboard/groups' },
  { id: 'focus', label: 'Start Focus Session', shortcut: '\u2318F', icon: '\u23F1', action: 'navigate', path: '/dashboard/focus' },
  { id: 'stats', label: 'Stats & Streaks', icon: '\uD83D\uDCC8', action: 'navigate', path: '/dashboard/stats' },
  { id: 'settings', label: 'Settings', icon: '\u2699\uFE0F', action: 'navigate', path: '/dashboard/settings' },
  { id: 'theme', label: 'Toggle Theme', icon: '\uD83C\uDF19', action: 'theme' },
];

export default function CommandPalette({ onCreatePact } = {}) {
  const [open, setOpen] = useState(false);
  useModalScrollLock(open);
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef(null);
  const listRef = useRef(null);
  const router = useRouter();
  const { resolvedTheme, setTheme } = useTheme();

  const filtered = useMemo(() => {
    if (!query) return commands;
    const lower = query.toLowerCase();
    return commands.filter(
      (cmd) =>
        cmd.label.toLowerCase().includes(lower) ||
        cmd.id.toLowerCase().includes(lower)
    );
  }, [query]);

  // Reset active index when filtered results change
  useEffect(() => {
    setActiveIndex(0);
  }, [filtered]);

  // Open/close with Cmd+K / Ctrl+K
  useEffect(() => {
    function handleKeyDown(e) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Focus input when opened, reset state when closed
  useEffect(() => {
    if (open) {
      setQuery('');
      setActiveIndex(0);
      // Small delay so the portal mounts before we focus
      requestAnimationFrame(() => {
        inputRef.current?.focus();
      });
    }
  }, [open]);

  // Scroll the active item into view
  useEffect(() => {
    if (!listRef.current) return;
    const activeEl = listRef.current.children[activeIndex];
    if (activeEl) {
      activeEl.scrollIntoView({ block: 'nearest' });
    }
  }, [activeIndex]);

  const executeCommand = useCallback(
    (cmd) => {
      setOpen(false);
      if (cmd.action === 'navigate') {
        router.push(cmd.path);
      } else if (cmd.action === 'theme') {
        setTheme(resolvedTheme === 'dark' ? 'light' : 'dark');
      } else if (cmd.action === 'create-pact') {
        if (onCreatePact) onCreatePact();
      }
    },
    [router, resolvedTheme, setTheme, onCreatePact]
  );

  const handleKeyDown = useCallback(
    (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        setOpen(false);
        return;
      }

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setActiveIndex((prev) => (prev + 1) % filtered.length);
        return;
      }

      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActiveIndex((prev) => (prev - 1 + filtered.length) % filtered.length);
        return;
      }

      if (e.key === 'Enter') {
        e.preventDefault();
        if (filtered[activeIndex]) {
          executeCommand(filtered[activeIndex]);
        }
      }
    },
    [filtered, activeIndex, executeCommand]
  );

  if (typeof document === 'undefined') return null;
  if (!open) return null;

  return createPortal(
    <div
      className={styles.overlay}
      onClick={() => setOpen(false)}
    >
      <motion.div
        className={styles.palette}
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
        {...modalContent}
      >
            <div className={styles.searchWrap}>
              <svg
                className={styles.searchIcon}
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input
                ref={inputRef}
                className={styles.searchInput}
                type="text"
                placeholder="Type a command or search..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                aria-label="Command palette search"
                autoComplete="off"
                spellCheck={false}
              />
              <kbd className={styles.escBadge}>ESC</kbd>
            </div>

            {filtered.length > 0 ? (
              <ul ref={listRef} className={styles.list} role="listbox">
                {filtered.map((cmd, i) => (
                  <li
                    key={cmd.id}
                    role="option"
                    aria-selected={i === activeIndex}
                    className={`${styles.item} ${i === activeIndex ? styles.itemActive : ''}`}
                    onMouseEnter={() => setActiveIndex(i)}
                    onClick={() => executeCommand(cmd)}
                  >
                    <span className={styles.itemIcon}>{cmd.icon}</span>
                    <span className={styles.itemLabel}>{cmd.label}</span>
                    {cmd.shortcut && (
                      <kbd className={styles.shortcut}>{cmd.shortcut}</kbd>
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <div className={styles.empty}>
                No results for &ldquo;{query}&rdquo;
              </div>
            )}

            <div className={styles.footer}>
              <span className={styles.footerHint}>
                <kbd className={styles.footerKbd}>&uarr;</kbd>
                <kbd className={styles.footerKbd}>&darr;</kbd>
                navigate
              </span>
              <span className={styles.footerHint}>
                <kbd className={styles.footerKbd}>&crarr;</kbd>
                select
              </span>
              <span className={styles.footerHint}>
                <kbd className={styles.footerKbd}>esc</kbd>
                close
              </span>
            </div>
          </motion.div>
    </div>,
    document.body
  );
}
