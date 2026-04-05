import { describe, it, expect } from 'vitest';
import {
  XP_REWARDS,
  getLevelFromXP,
  getProgressToNextLevel,
  ACHIEVEMENTS,
  awardXP,
  getUserAchievements,
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

  it('includes the onboarding_complete achievement', () => {
    expect(ACHIEVEMENTS).toHaveProperty('onboarding_complete');
    expect(ACHIEVEMENTS.onboarding_complete.name).toBe('Challenge Accepted');
  });
});

describe('awardXP', () => {
  it('returns success when rpc succeeds', async () => {
    const { supabase } = createMockSupabase();
    supabase.rpc.mockResolvedValue({ data: null, error: null });

    const result = await awardXP(supabase, 'user-1', 'PACT_COMPLETED', 10);
    expect(result).toEqual({ success: true });
    expect(supabase.rpc).toHaveBeenCalledWith('award_xp', {
      p_user_id: 'user-1',
      p_event_type: 'PACT_COMPLETED',
      p_xp_amount: 10,
      p_metadata: {},
    });
  });

  it('returns failure when rpc returns an error', async () => {
    const { supabase } = createMockSupabase();
    supabase.rpc.mockResolvedValue({ data: null, error: { message: 'RPC failed' } });

    const result = await awardXP(supabase, 'user-1', 'PACT_COMPLETED', 10);
    expect(result.success).toBe(false);
    expect(result.error).toBe('RPC failed');
  });

  it('passes custom metadata to rpc', async () => {
    const { supabase } = createMockSupabase();
    supabase.rpc.mockResolvedValue({ data: null, error: null });

    await awardXP(supabase, 'user-1', 'PACT_COMPLETED', 10, { bonus: true });
    expect(supabase.rpc).toHaveBeenCalledWith('award_xp', {
      p_user_id: 'user-1',
      p_event_type: 'PACT_COMPLETED',
      p_xp_amount: 10,
      p_metadata: { bonus: true },
    });
  });
});

describe('getUserAchievements', () => {
  it('returns enriched achievements with unlock status', async () => {
    const { supabase, builder } = createMockSupabase();
    builder.mockReturnValue({
      data: [
        { achievement_key: 'first_pact', unlocked_at: '2024-06-10T00:00:00Z' },
      ],
      error: null,
    });

    const result = await getUserAchievements(supabase, 'user-1');
    expect(result.error).toBeNull();
    expect(result.data.length).toBe(Object.keys(ACHIEVEMENTS).length);

    const firstPact = result.data.find((a) => a.key === 'first_pact');
    expect(firstPact.unlocked).toBe(true);
    expect(firstPact.unlockedAt).toBe('2024-06-10T00:00:00Z');

    const streak7 = result.data.find((a) => a.key === 'streak_7');
    expect(streak7.unlocked).toBe(false);
    expect(streak7.unlockedAt).toBeUndefined();
  });

  it('returns empty data on DB error', async () => {
    const { supabase, builder } = createMockSupabase();
    builder.mockReturnValue({ data: null, error: { message: 'DB error' } });

    const result = await getUserAchievements(supabase, 'user-1');
    expect(result.data).toEqual([]);
    expect(result.error).toBeTruthy();
  });

  it('handles no unlocked achievements', async () => {
    const { supabase, builder } = createMockSupabase();
    builder.mockReturnValue({ data: [], error: null });

    const result = await getUserAchievements(supabase, 'user-1');
    expect(result.error).toBeNull();
    result.data.forEach((a) => {
      expect(a.unlocked).toBe(false);
    });
  });
});
