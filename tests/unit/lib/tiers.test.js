import { describe, it, expect } from 'vitest';
import { TIERS, getCurrentTier } from '@/lib/tiers';

describe('TIERS', () => {
  it('has six tiers in ascending order', () => {
    expect(TIERS).toHaveLength(6);
    for (let i = 1; i < TIERS.length; i++) {
      expect(TIERS[i].min).toBeGreaterThan(TIERS[i - 1].min);
    }
  });

  it('the last tier has an Infinity ceiling', () => {
    expect(TIERS[TIERS.length - 1].max).toBe(Infinity);
  });

  it('uses direct-positive labels (no courthouse vocabulary)', () => {
    const banned = ['sworn', 'regent', 'untouchable', 'apprentice', 'novice', 'witness', 'ledger', 'register'];
    for (const tier of TIERS) {
      const haystack = `${tier.label} ${tier.subtitle}`.toLowerCase();
      for (const word of banned) {
        expect(haystack).not.toContain(word);
      }
    }
  });
});

describe('getCurrentTier', () => {
  it('places 0 XP in the first tier', () => {
    const { tier, index, next, progressToNext } = getCurrentTier(0);
    expect(index).toBe(0);
    expect(tier.label).toBe('First marks');
    expect(next?.label).toBe('Habits forming');
    expect(progressToNext).toBe(0);
  });

  it('places 50 XP in the first tier (inclusive max)', () => {
    expect(getCurrentTier(50).index).toBe(0);
  });

  it('places 51 XP in the second tier (inclusive min)', () => {
    expect(getCurrentTier(51).index).toBe(1);
  });

  it('places 742 XP in "Locked in"', () => {
    const { tier, next, xpToNext } = getCurrentTier(742);
    expect(tier.label).toBe('Locked in');
    expect(next?.label).toBe('Unbroken');
    expect(xpToNext).toBe(259);
  });

  it('saturates at the top tier with no next', () => {
    const { tier, index, next, progressToNext, xpToNext } = getCurrentTier(99999);
    expect(tier.label).toBe('Iron');
    expect(index).toBe(5);
    expect(next).toBeNull();
    expect(progressToNext).toBe(1);
    expect(xpToNext).toBe(0);
  });

  it('returns a 0..1 progressToNext for partial bands', () => {
    // 100 XP into the "Habits forming" band [51..200] = (100-51)/(201-51) = 49/150 ≈ 0.327
    const { progressToNext } = getCurrentTier(100);
    expect(progressToNext).toBeGreaterThan(0.3);
    expect(progressToNext).toBeLessThan(0.4);
  });

  it('handles negative or NaN gracefully (clamps to first tier)', () => {
    expect(getCurrentTier(-50).index).toBe(0);
    expect(getCurrentTier(NaN).index).toBe(0);
    expect(getCurrentTier(undefined).index).toBe(0);
  });
});
