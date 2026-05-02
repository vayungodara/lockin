/**
 * Tier ladder — six XP-banded progress bands shown on /dashboard/stats.
 *
 * Tier sits *alongside* numeric Level (Lv. 7), not in place of it. Level is
 * fine-grained (every 100 XP); tier is coarse motivational chrome (six bands
 * across the entire XP runway). The dashboard rail still shows Level; the
 * stats page introduces tier as the bigger arc of progress.
 *
 * Voice rule (from .impeccable.md):
 *   Direct-positive on dashboard surfaces. Courthouse vocabulary banned —
 *   no "Sworn", "Regent", "Untouchable", "register", "ledger", "under oath".
 *
 * @module lib/tiers
 */

/**
 * Six tiers covering the full XP runway. Min/max are inclusive.
 * The last tier has Infinity max so any high-XP value resolves into it.
 *
 * @typedef {Object} Tier
 * @property {string} label    Bold motivational name, sentence-case.
 * @property {string} subtitle One-line direct-positive support.
 * @property {number} min      Inclusive lower bound (XP).
 * @property {number} max      Inclusive upper bound (XP). Infinity for the last band.
 */
export const TIERS = [
  { label: 'First marks',     subtitle: 'Just getting started',  min: 0,    max: 50 },
  { label: 'Habits forming',  subtitle: 'The chain begins',      min: 51,   max: 200 },
  { label: 'Steady',          subtitle: 'On track',              min: 201,  max: 500 },
  { label: 'Locked in',       subtitle: 'No negotiations',       min: 501,  max: 1000 },
  { label: 'Unbroken',        subtitle: 'Chain holds',           min: 1001, max: 2500 },
  { label: 'Iron',            subtitle: 'Chain proven',          min: 2501, max: Infinity },
];

/**
 * Resolve a user's current tier from their lifetime XP total.
 *
 * Returns the active tier, its zero-based index, the next tier (or null
 * when the user is in the top band), and a 0..1 progress fraction to the
 * next tier (1 when there is no next).
 *
 * @param {number} totalXp Lifetime XP. Negative or non-finite values clamp to 0.
 * @returns {{
 *   tier: Tier,
 *   index: number,
 *   next: Tier | null,
 *   progressToNext: number,
 *   xpToNext: number,
 * }}
 */
export function getCurrentTier(totalXp) {
  const xp = Number.isFinite(totalXp) && totalXp > 0 ? totalXp : 0;

  let index = 0;
  for (let i = 0; i < TIERS.length; i++) {
    if (xp >= TIERS[i].min && xp <= TIERS[i].max) {
      index = i;
      break;
    }
  }

  const tier = TIERS[index];
  const next = TIERS[index + 1] ?? null;
  const progressToNext = next
    ? Math.min(1, Math.max(0, (xp - tier.min) / (next.min - tier.min)))
    : 1;
  const xpToNext = next ? Math.max(0, next.min - xp) : 0;

  return { tier, index, next, progressToNext, xpToNext };
}
