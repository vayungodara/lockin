'use client';

import styles from './NavMarker.module.css';

/**
 * NavMarker — hand-drawn highlighter stroke under nav links on hover.
 * Color follows the user's current ink via --stamp-yellow cascade.
 * Reference: lockin-test globals.css:281-313 + .impeccable.md § Component Vocabulary.
 *
 * Wrap the link text: <a><NavMarker>Features</NavMarker></a>
 * The parent anchor owns :hover — we hook onto that via group-hover semantics.
 *
 * Variants:
 *   - "loud" (default) — full-amplitude editorial swipe, used on landing nav.
 *   - "calm" — shorter sweep, lower amplitude, opacity reduced. Used on
 *     dashboard nav where motion language stays understated.
 *
 * @param {Object} props
 * @param {React.ReactNode} props.children
 * @param {"loud"|"calm"} [props.variant="loud"]
 */
export default function NavMarker({ children, variant = 'loud' }) {
  const strokeClass = variant === 'calm'
    ? `${styles.stroke} ${styles.strokeCalm}`
    : styles.stroke;

  return (
    <span className={styles.wrap}>
      <span className={styles.text}>{children}</span>
      <svg
        className={strokeClass}
        viewBox="0 0 120 12"
        preserveAspectRatio="none"
        aria-hidden="true"
        focusable="false"
      >
        <path
          d="M1,5.4 C14,3.6 30,4.2 52,3.7 C74,3.1 95,4.6 119,4.2 L118.5,8.7 C96,9.6 72,8.8 46,9.4 C24,9.8 6,8.9 1.5,8.3 Z"
          fill="currentColor"
          filter="url(#marker-roughen)"
        />
      </svg>
    </span>
  );
}
