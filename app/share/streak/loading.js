import styles from './loading.module.css';

/**
 * Skeleton for /share/streak — Next.js auto-wraps this in Suspense while the
 * server component fetches profile + streak data (up to 366 days of pacts).
 * Mirrors the ShareStreakClient layout (gradient card, large streak number,
 * avatar + name, stats row, tagline, two buttons) so the loading-to-loaded
 * transition feels designed rather than janky.
 */
export default function Loading() {
  return (
    <div className={styles.container} aria-busy="true" aria-label="Loading share card">
      <div className={styles.card}>
        {/* Logo row */}
        <div className={styles.logoRow}>
          <div className={styles.block} style={{ width: 78, height: 20 }} />
        </div>

        {/* Large streak number + label */}
        <div className={styles.streakSection}>
          <div className={styles.block} style={{ width: 168, height: 76 }} />
          <div className={styles.block} style={{ width: 110, height: 22 }} />
        </div>

        {/* Avatar + name */}
        <div className={styles.userInfo}>
          <div
            className={`${styles.block} ${styles.circle}`}
            style={{ width: 40, height: 40 }}
          />
          <div className={styles.block} style={{ width: 140, height: 18 }} />
        </div>

        {/* Stats row */}
        <div className={styles.stats}>
          <div className={styles.stat}>
            <div className={styles.block} style={{ width: 44, height: 28 }} />
            <div className={styles.block} style={{ width: 70, height: 12 }} />
          </div>
          <div className={styles.statDivider} aria-hidden="true" />
          <div className={styles.stat}>
            <div className={styles.block} style={{ width: 44, height: 28 }} />
            <div className={styles.block} style={{ width: 70, height: 12 }} />
          </div>
        </div>

        {/* Tagline */}
        <div className={styles.taglineRow}>
          <div className={styles.block} style={{ width: 180, height: 14 }} />
        </div>
      </div>

      {/* Action buttons */}
      <div className={styles.actions}>
        <div className={styles.buttonBlock} />
        <div className={`${styles.buttonBlock} ${styles.buttonBlockSecondary}`} />
      </div>
    </div>
  );
}
