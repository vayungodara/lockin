/**
 * Gamification system — XP, Levels, Achievements
 */

// XP rewards for different actions
export const XP_REWARDS = {
  PACT_COMPLETED: 10,
  PACT_COMPLETED_EARLY: 15,
  FOCUS_SESSION_COMPLETED: 5,
  TASK_COMPLETED: 8,
  STREAK_DAY: 3,
  COMMENT_POSTED: 2,
  REACTION_GIVEN: 1,
};

export function getLevelFromXP(xp) {
  return Math.floor((xp || 0) / 100) + 1;
}

export function getProgressToNextLevel(currentXP) {
  const xp = currentXP || 0;
  return xp % 100;
}

/**
 * Award XP to a user (calls DB function)
 */
export async function awardXP(supabase, userId, eventType, xpAmount, metadata = {}) {
  try {
    const { error } = await supabase.rpc('award_xp', {
      p_user_id: userId,
      p_event_type: eventType,
      p_xp_amount: xpAmount,
      p_metadata: metadata
    });

    if (error) throw error;
    return { success: true };
  } catch (err) {
    console.error('Error awarding XP:', err);
    return { success: false, error: err };
  }
}

/**
 * Achievement definitions
 */
export const ACHIEVEMENTS = {
  first_pact: {
    key: 'first_pact',
    name: 'First Steps',
    description: 'Complete your first pact',
    icon: '🎯',
  },
  streak_7: {
    key: 'streak_7',
    name: 'Week Warrior',
    description: 'Maintain a 7-day streak',
    icon: '🔥',
  },
  streak_30: {
    key: 'streak_30',
    name: 'Monthly Master',
    description: 'Maintain a 30-day streak',
    icon: '💎',
  },
  pacts_10: {
    key: 'pacts_10',
    name: 'Getting Serious',
    description: 'Complete 10 pacts',
    icon: '💪',
  },
  pacts_50: {
    key: 'pacts_50',
    name: 'Half Century',
    description: 'Complete 50 pacts',
    icon: '⭐',
  },
  pacts_100: {
    key: 'pacts_100',
    name: 'Century Club',
    description: 'Complete 100 pacts',
    icon: '💯',
  },
  focus_10h: {
    key: 'focus_10h',
    name: 'Deep Work',
    description: 'Accumulate 10 hours of focus time',
    icon: '🧠',
  },
  team_player: {
    key: 'team_player',
    name: 'Team Player',
    description: 'Join your first group',
    icon: '🤝',
  },
  social_butterfly: {
    key: 'social_butterfly',
    name: 'Social Butterfly',
    description: 'React to 50 activities',
    icon: '🦋',
  },
  early_bird: {
    key: 'early_bird',
    name: 'Early Bird',
    description: 'Complete a pact more than 24 hours before deadline',
    icon: '🐦',
  },
};

/**
 * Unlock an achievement for a user
 */
export async function unlockAchievement(supabase, userId, achievementKey) {
  try {
    // Check if already unlocked
    const { data: existing } = await supabase
      .from('user_achievements')
      .select('id')
      .eq('user_id', userId)
      .eq('achievement_key', achievementKey)
      .maybeSingle();

    if (existing) return { success: true, alreadyUnlocked: true };

    const { error } = await supabase
      .from('user_achievements')
      .insert({ user_id: userId, achievement_key: achievementKey });

    if (error) throw error;

    // Send notification
    const achievement = ACHIEVEMENTS[achievementKey];
    if (achievement) {
      const { createNotification, NOTIFICATION_TYPES } = await import('@/lib/notifications');
      await createNotification(
        supabase,
        userId,
        NOTIFICATION_TYPES.ACHIEVEMENT_UNLOCKED,
        `${achievement.icon} ${achievement.name}`,
        achievement.description,
        { achievementKey }
      );
    }

    return { success: true, alreadyUnlocked: false };
  } catch (err) {
    console.error('Error unlocking achievement:', err);
    return { success: false, error: err };
  }
}

/**
 * Get user's achievements
 */
export async function getUserAchievements(supabase, userId) {
  try {
    const { data, error } = await supabase
      .from('user_achievements')
      .select('*')
      .eq('user_id', userId)
      .order('unlocked_at', { ascending: false });

    if (error) throw error;

    const unlockedKeys = (data || []).map(a => a.achievement_key);
    const achievements = Object.values(ACHIEVEMENTS).map(achievement => ({
      ...achievement,
      unlocked: unlockedKeys.includes(achievement.key),
      unlockedAt: data?.find(a => a.achievement_key === achievement.key)?.unlocked_at
    }));

    return { data: achievements, error: null };
  } catch (err) {
    console.error('Error fetching achievements:', err);
    return { data: [], error: err };
  }
}

/**
 * Check achievement conditions after a pact completion
 */
export async function checkPactAchievements(supabase, userId, totalCompleted, currentStreak) {
  const checks = [
    { count: 1, key: 'first_pact' },
    { count: 10, key: 'pacts_10' },
    { count: 50, key: 'pacts_50' },
    { count: 100, key: 'pacts_100' },
  ];

  for (const check of checks) {
    if (totalCompleted >= check.count) {
      await unlockAchievement(supabase, userId, check.key);
    }
  }

  // Streak achievements
  if (currentStreak >= 7) await unlockAchievement(supabase, userId, 'streak_7');
  if (currentStreak >= 30) await unlockAchievement(supabase, userId, 'streak_30');
}
