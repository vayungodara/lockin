'use client';

import styles from './Ticker.module.css';

/**
 * Ticker — horizontal infinite-scroll activity stream, editorial ticker-tape.
 *
 * Renders a `HH:MM · USERNAME · body` row that loops via CSS keyframes.
 * Reduced-motion stops the animation (the items are still visible — they
 * just don't scroll). Semantically aria-hidden because the content is
 * decorative social proof, not actionable.
 *
 * Decorative `✦` asterisks between items cycle through stamp-red / stamp-green /
 * stamp-yellow to match the ink-cascade feel without muddying any single accent.
 *
 * @example
 *   <Ticker />
 *   <Ticker items={[{ time: '03:41', user: 'THEO', body: 'kept pact #88' }]} />
 *
 * @param {Object} [props]
 * @param {Array<{time:string, user:string, body:string}>} [props.items] — defaults to DEFAULT_ITEMS
 */
export default function Ticker({ items = DEFAULT_ITEMS }) {
  // Double the list so the 50% translateX keyframe loops seamlessly.
  const doubled = [...items, ...items];

  return (
    <div className={styles.ticker} aria-hidden="true">
      <div className={styles.track}>
        {doubled.map((it, i) => (
          <span key={i} className={styles.item}>
            <span className={styles.time}>{it.time}</span>
            <span className={styles.user}>{it.user}</span>
            <span className={styles.body}>{it.body}</span>
            <span className={styles[STAR_CLASS[i % 3]]}>&#10022;</span>
          </span>
        ))}
      </div>
    </div>
  );
}

const STAR_CLASS = ['starRed', 'starGreen', 'starYellow'];

const DEFAULT_ITEMS = [
  { time: '03:41', user: 'THEO',  body: 'kept pact #88' },
  { time: '03:38', user: 'MAYA',  body: 'locked in — 50m' },
  { time: '03:35', user: 'AMR',   body: 'missed pact #12' },
  { time: '03:32', user: 'RIN',   body: 'moved task → done' },
  { time: '03:29', user: 'LIA',   body: 'kept pact #22' },
  { time: '03:27', user: 'SAM',   body: 'locked in — 25m' },
  { time: '03:24', user: 'DEVIN', body: 'kept pact #15' },
  { time: '03:21', user: 'MAYA',  body: '7-day streak' },
  { time: '03:18', user: 'THEO',  body: 'finished focus — 90m' },
  { time: '03:15', user: 'AMR',   body: 'missed pact #13' },
  { time: '03:12', user: 'RIN',   body: 'kept pact #30' },
  { time: '03:09', user: 'LIA',   body: 'made new pact' },
  { time: '03:06', user: 'SAM',   body: 'leveled up — lvl 12' },
];
