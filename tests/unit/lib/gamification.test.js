import { describe, it, expect } from 'vitest';
import {
  XP_REWARDS,
  getLevelFromXP,
  getProgressToNextLevel,
  ACHIEVEMENTS,
  awardXP,
  unlockAchievement,
  getUserAchievements,
  checkPactAchievements,
} from '@/lib/gamification';
import { createMockSupabase } from '../../setup/supabase-mock';

describe('getLevelFromXP', () => {
  it('returns level 1 for 0 XP', () => {
    expect(getLevelFromXP(0)).toBe(1);
  });

  it('returns level 1 for 99 XP', () => {
    expect(getLevelFromXP(99)).toBe(1);
  });

  it('returns level 2 for exactly 100 XP', () => {
    expect(getLevelFromXP(100)).toBe(2);
  });

  it('returns level 2 for 199 XP', () => {
    expect(getLevelFromXP(199)).toBe(2);
  });

  it('returns level 11 for 1000 XP', () => {
    expect(getLevelFromXP(1000)).toBe(11);
  });

  it('handles null/undefined gracefully', () => {
    expect(getLevelFromXP(null)).toBe(1);
    expect(getLevelFromXP(undefined)).toBe(1);
  });
});

describe('getProgressToNextLevel', () => {
  it('returns 0 for 0 XP', () => {
    expect(getProgressToNextLevel(0)).toBe(0);
  });

  it('returns 50 for 50 XP (halfway through level 1)', () => {
    expect(getProgressToNextLevel(50)).toBe(50);
  });

  it('returns 0 for exactly 100 XP (start of level 2)', () => {
    expect(getProgressToNextLevel(100)).toBe(0);
  });

  it('returns 25 for 125 XP', () => {
    expect(getProgressToNextLevel(125)).toBe(25);
  });

  it('handles null/undefined gracefully', () => {
    expect(getProgressToNextLevel(null)).toBe(0);
    expect(getProgressToNextLevel(undefined)).toBe(0);
  });
});

describe('XP_REWARDS', () => {
  it('has all expected reward types', () => {
    const expectedKeys = [
      'PACT_COMPLETED',
      'PACT_COMPLETED_EARLY',
      'FOCUS_SESSION_COMPLETED',
      'TASK_COMPLETED',
      'STREAK_DAY',
      'COMMENT_POSTED',
      'REACTION_GIVEN',
    ];
    expectedKeys.forEach((key) => {
      expect(XP_REWARDS).toHaveProperty(key);
    });
  });

  it('all reward values are positive numbers', () => {
    Object.values(XP_REWARDS).forEach((value) => {
      expect(typeof value).toBe('number');
      expect(value).toBeGreaterThan(0);
    });
  });

  it('early completion rewards more than normal completion', () => {
    expect(XP_REWARDS.PACT_COMPLETED_EARLY).toBeGreaterThan(XP_REWARDS.PACT_COMPLETED);
  });
});

describe('ACHIEVEMENTS', () => {
  it('has all expected achievement keys', () => {
    const expectedKeys = [
      'first_pact',
      'streak_7',
      'streak_30',
      'pacts_10',
      'pacts_50',
      'pacts_100',
      'focus_10h',
      'team_player',
      'social_butterfly',
      'early_bird',
    ];
    expectedKeys.forEach((key) => {
      expect(ACHIEVEMENTS).toHaveProperty(key);
    });
  });

  it('each achievement has required fields', () => {
    Object.values(ACHIEVEMENTS).forEach((achievement) => {
      expect(achievement).toHaveProperty('key');
      expect(achievement).toHaveProperty('name');
      expect(achievement).toHaveProperty('description');
      expect(achievement).toHaveProperty('icon');
      expect(typeof achievement.name).toBe('string');
      expect(typeof achievement.description).toBe('string');
    });
  });

  it('achievement keys match their object keys', () => {
    Object.entries(ACHIEVEMENTS).forEach(([objKey, achievement]) => {
      expect(achievement.key).toBe(objKey);
    });
  });
});

describe('awardXP', () => {
  it('returns success when RPC call succeeds', async () => {
    const { supabase } = createMockSupabase();
    supabase.rpc.mockResolvedValue({ data: null, error: null });

    const result = await awardXP(supabase, 'user-1', 'pact_completed', 10, { pactId: 'p1' });
    expect(result).toEqual({ success: true });
  });

  it('calls the award_xp RPC with the right arguments', async () => {
    const { supabase } = createMockSupabase();
    supabase.rpc.mockResolvedValue({ data: null, error: null });

    await awardXP(supabase, 'user-1', 'focus_session_completed', 5);
    expect(supabase.rpc).toHaveBeenCalledWith('award_xp', {
      p_user_id: 'user-1',
      p_event_type: 'focus_session_completed',
      p_xp_amount: 5,
      p_metadata: {},
    });
  });

  it('returns failure when RPC returns an error', async () => {
    const { supabase } = createMockSupabase();
    supabase.rpc.mockResolvedValue({ data: null, error: { message: 'rpc fail' } });

    const result = await awardXP(supabase, 'user-1', 'pact_completed', 10);
    expect(result.success).toBe(false);
    expect(result.error).toBe('rpc fail');
  });

  it('returns failure when RPC rejects', async () => {
    const { supabase } = createMockSupabase();
    supabase.rpc.mockRejectedValue(new Error('network down'));

    const result = await awardXP(supabase, 'user-1', 'pact_completed', 10);
    expect(result.success).toBe(false);
    expect(result.error).toBe('network down');
  });
});

describe('unlockAchievement', () => {
  it('returns alreadyUnlocked when the user already has the achievement', async () => {
    const { supabase, builder } = createMockSupabase();
    builder.mockReturnValue({ data: { id: 'ach-row-1' }, error: null });

    const result = await unlockAchievement(supabase, 'user-1', 'first_pact');
    expect(result.success).toBe(true);
    expect(result.alreadyUnlocked).toBe(true);
  });

  it('unlocks a new achievement when not yet unlocked', async () => {
    const { supabase, builder } = createMockSupabase();
    // existing check returns null data → not yet unlocked
    // insert call also returns null error → succeeds
    builder.mockReturnValue({ data: null, error: null });

    const result = await unlockAchievement(supabase, 'user-1', 'streak_7');
    expect(result.success).toBe(true);
    expect(result.alreadyUnlocked).toBe(false);
  });

  it('returns failure when insert errors', async () => {
    const { supabase, builder } = createMockSupabase();
    builder.mockReturnValue({ data: null, error: { message: 'insert failed' } });

    const result = await unlockAchievement(supabase, 'user-1', 'streak_7');
    expect(result.success).toBe(false);
    expect(result.error).toBe('insert failed');
  });
});

describe('getUserAchievements', () => {
  it('returns the full achievement list with unlock flags on success', async () => {
    const { supabase, builder } = createMockSupabase();
    builder.mockReturnValue({
      data: [
        { achievement_key: 'first_pact', unlocked_at: '2024-06-15T00:00:00Z' },
        { achievement_key: 'streak_7', unlocked_at: '2024-06-20T00:00:00Z' },
      ],
      error: null,
    });

    const result = await getUserAchievements(supabase, 'user-1');
    expect(result.error).toBeNull();
    expect(Array.isArray(result.data)).toBe(true);
    expect(result.data.length).toBe(Object.keys(ACHIEVEMENTS).length);

    const firstPact = result.data.find((a) => a.key === 'first_pact');
    const streak30 = result.data.find((a) => a.key === 'streak_30');
    expect(firstPact.unlocked).toBe(true);
    expect(firstPact.unlockedAt).toBe('2024-06-15T00:00:00Z');
    expect(streak30.unlocked).toBe(false);
  });

  it('returns every achievement as locked when the user has none', async () => {
    const { supabase, builder } = createMockSupabase();
    builder.mockReturnValue({ data: [], error: null });

    const result = await getUserAchievements(supabase, 'user-1');
    expect(result.error).toBeNull();
    result.data.forEach((a) => {
      expect(a.unlocked).toBe(false);
    });
  });

  it('returns empty data and the error on DB failure', async () => {
    const { supabase, builder } = createMockSupabase();
    builder.mockReturnValue({ data: null, error: { message: 'DB error' } });

    const result = await getUserAchievements(supabase, 'user-1');
    expect(result.data).toEqual([]);
    expect(result.error).toBeTruthy();
  });
});

describe('checkPactAchievements', () => {
  it('runs without throwing when thresholds are not met', async () => {
    const { supabase, builder } = createMockSupabase();
    builder.mockReturnValue({ data: { id: 'existing' }, error: null });

    await expect(
      checkPactAchievements(supabase, 'user-1', 0, 0)
    ).resolves.not.toThrow();
  });

  it('runs without throwing when thresholds are met', async () => {
    const { supabase, builder } = createMockSupabase();
    // pretend achievement already unlocked so unlockAchievement short-circuits
    builder.mockReturnValue({ data: { id: 'existing' }, error: null });

    await expect(
      checkPactAchievements(supabase, 'user-1', 100, 30)
    ).resolves.not.toThrow();
  });

  it('runs all streak and count unlocks in parallel without throwing', async () => {
    const { supabase, builder } = createMockSupabase();
    builder.mockReturnValue({ data: { id: 'existing' }, error: null });

    await expect(
      checkPactAchievements(supabase, 'user-1', 50, 7)
    ).resolves.not.toThrow();
  });
});
