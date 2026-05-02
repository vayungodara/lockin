'use client';

import { useEffect, useRef, useSyncExternalStore } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { fadeInScale } from '@/lib/animations';
import styles from './InkPicker.module.css';

/**
 * InkPicker — five-ink cascade panel for the dashboard top nav.
 *
 * Presents five rotated swatches (Highlighter, Red Pen, Carbon, Moss, Indigo).
 * Hovering a swatch live-previews the ink across the page by mutating
 * `document.documentElement.dataset.ink`; mouse-leave reverts to the persisted
 * value. Click writes `lockin-ink` to localStorage and commits the change.
 *
 * The DashboardNav MutationObserver on `[data-ink]` keeps the rank chip's
 * label in sync without any extra wiring.
 *
 * @param {Object} props
 * @param {boolean} props.isOpen — panel visibility (controlled by parent)
 * @param {() => void} props.onClose — close handler (parent toggles isOpen)
 * @param {React.RefObject<HTMLElement>} props.anchorRef — picker button ref
 *   used to detect click-outside without false positives.
 */

const INKS = [
  { key: 'highlighter', label: 'Highlighter', swatch: 'oklch(0.88 0.13 92)' },
  { key: 'redpen', label: 'Red Pen', swatch: 'oklch(0.64 0.22 28)' },
  { key: 'carbon', label: 'Carbon', swatch: 'oklch(0.72 0.15 230)' },
  { key: 'moss', label: 'Moss', swatch: 'oklch(0.56 0.14 142)' },
  { key: 'indigo-legacy', label: 'Indigo', swatch: 'oklch(0.58 0.19 278)' },
];

const VALID_KEYS = new Set(INKS.map((i) => i.key));

function readPersistedInk() {
  if (typeof window === 'undefined') return 'highlighter';
  try {
    const stored = localStorage.getItem('lockin-ink');
    if (stored && VALID_KEYS.has(stored)) return stored;
  } catch {
    // localStorage may throw in private mode — fall through to default.
  }
  return 'highlighter';
}

function applyInk(key) {
  if (typeof document === 'undefined') return;
  document.documentElement.setAttribute('data-ink', key);
}

// External-store subscription — listen for cross-tab storage events on
// `lockin-ink`. Hover preview mutates the DOM directly; the highlighted
// swatch reflects the persisted choice, so we only need to react when
// localStorage changes (commit, or another tab).
function subscribeToInk(callback) {
  if (typeof window === 'undefined') return () => {};
  const onStorage = (e) => {
    if (e.key === 'lockin-ink') callback();
  };
  window.addEventListener('storage', onStorage);
  return () => window.removeEventListener('storage', onStorage);
}

export default function InkPicker({ isOpen, onClose, anchorRef }) {
  const panelRef = useRef(null);

  // The highlighted swatch tracks the *persisted* ink, not the *applied* ink,
  // because hover preview mutates the DOM but not localStorage. useSyncExternalStore
  // gives us SSR-safe reads (server snapshot returns 'highlighter') and re-renders
  // when another tab writes to lockin-ink.
  const selected = useSyncExternalStore(
    subscribeToInk,
    readPersistedInk,
    () => 'highlighter',
  );

  // Click-outside + Escape — both close. We compare against both the panel and
  // the anchor button so toggling via the button doesn't immediately reclose.
  useEffect(() => {
    if (!isOpen) return undefined;

    const handlePointerDown = (e) => {
      const panelEl = panelRef.current;
      const anchorEl = anchorRef?.current;
      if (panelEl && panelEl.contains(e.target)) return;
      if (anchorEl && anchorEl.contains(e.target)) return;
      onClose();
    };

    const handleKey = (e) => {
      if (e.key === 'Escape') onClose();
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKey);
    };
  }, [isOpen, onClose, anchorRef]);

  const handleHover = (key) => {
    applyInk(key);
  };

  const handleHoverEnd = () => {
    // Revert to whatever's persisted — uses the latest localStorage value
    // rather than `selected` so a click that just landed wins immediately.
    applyInk(readPersistedInk());
  };

  const handleClick = (key) => {
    try {
      localStorage.setItem('lockin-ink', key);
    } catch {
      // Private mode / quota — apply visually anyway, choice is non-essential.
    }
    applyInk(key);
    // Same-tab subscribers (DashboardNav rank chip, this picker's selected
    // state via useSyncExternalStore) are notified through the MutationObserver
    // on data-ink and a synthetic storage event for cross-tab parity.
    try {
      window.dispatchEvent(new StorageEvent('storage', {
        key: 'lockin-ink',
        newValue: key,
        storageArea: window.localStorage,
      }));
    } catch {
      // StorageEvent constructor may not be available in older runtimes.
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          ref={panelRef}
          className={styles.panel}
          role="dialog"
          aria-label="Choose your ink"
          {...fadeInScale}
        >
          <div className={styles.caption}>§ Choose your ink</div>
          <ul className={styles.grid} onMouseLeave={handleHoverEnd}>
            {INKS.map((ink) => {
              const isActive = selected === ink.key;
              return (
                <li key={ink.key} className={styles.item}>
                  <button
                    type="button"
                    onClick={() => handleClick(ink.key)}
                    onMouseEnter={() => handleHover(ink.key)}
                    onFocus={() => handleHover(ink.key)}
                    onBlur={handleHoverEnd}
                    className={`${styles.swatchBtn} ${isActive ? styles.swatchBtnActive : ''}`.trim()}
                    aria-label={`${ink.label} ink${isActive ? ' (selected)' : ''}`}
                    aria-pressed={isActive}
                  >
                    <span
                      className={styles.swatch}
                      style={{ background: ink.swatch }}
                      aria-hidden="true"
                    />
                    <span className={styles.label}>{ink.label}</span>
                    {isActive && <span className={styles.activeDot} aria-hidden="true" />}
                  </button>
                </li>
              );
            })}
          </ul>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
