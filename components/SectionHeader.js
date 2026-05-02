'use client';

import styles from './SectionHeader.module.css';

/**
 * Editorial section header — the spine of multi-section pages.
 * Renders `§ 0N — Title` with optional uppercase caption above and a
 * right-aligned action slot (e.g., "View all →" link).
 *
 * The `§` numeral is JetBrains Mono, the title is Redaction display,
 * both sit above a flat 1px editorial rule. No gradients, no glow.
 *
 * @example
 *   <SectionHeader number={1} title="Today's pacts"
 *     action={<Link href="/pacts">View all →</Link>} />
 *
 *   <SectionHeader number="04" title="Activity" caption="This week" />
 *
 * @param {Object} props
 * @param {number|string} props.number — accepts `1` or `"01"`; zero-padded to 2 digits
 * @param {string} props.title
 * @param {string} [props.caption] — optional uppercase tracked caption above title
 * @param {React.ReactNode} [props.action] — optional right-aligned element
 * @param {string} [props.className]
 */
export default function SectionHeader({
  number,
  title,
  caption,
  action = null,
  className = '',
}) {
  const padded = formatNumber(number);

  return (
    <div className={`${styles.sectionHeader} ${className}`.trim()}>
      <div className={styles.leftCluster}>
        <span className={styles.numeral} aria-hidden="true">§ {padded}</span>
        <div className={styles.titleBlock}>
          {caption ? <div className={styles.caption}>{caption}</div> : null}
          <h2 className={styles.title}>{title}</h2>
        </div>
      </div>
      {action ? <div className={styles.action}>{action}</div> : null}
    </div>
  );
}

/**
 * Zero-pad a section number to 2 digits.
 * `1 → "01"`, `"04" → "04"`, `12 → "12"`, `"" → "00"`.
 */
function formatNumber(value) {
  if (value === null || value === undefined || value === '') return '00';
  const asNumber = typeof value === 'number' ? value : Number(value);
  if (Number.isFinite(asNumber)) {
    return String(asNumber).padStart(2, '0');
  }
  // Fall back to the raw string if the caller passed something exotic
  return String(value).padStart(2, '0');
}
