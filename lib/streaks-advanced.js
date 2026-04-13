/**
 * Advanced streak management — pool-based freezes, milestones, risk detection
 *
 * Freeze system: Users start with 2 freezes. More are earned at streak
 * milestones (7, 14, 30 days). Max pool: 5. Cooldown: 3 days between uses.
 */
import { formatDateInTimezone, getHourInTimezone } from '@/lib/streaks';

const STREAK_MILESTONES = [7, 14, 30, 60, 90, 180, 365];

// Streak milestones that award a freeze
const FREEZE_REWARD_MILESTONES = [7, 14, 30];

// Max freezes a user can hold
const MAX_FREEZES = 5;

// Minimum days between freeze uses
export const FREEZE_COOLDOWN_DAYS = 3;

/**
 * Check if the user's streak is at risk (no activity today, past 6pm local).
 *
 * Returns atRisk=true only when the streak is still saveable (last activity
 * was yesterday). If last activity was 2+ days ago the streak is already
 * broken — we return streak: 0 so the UI stops showing the stale banner.
 *
 * @param {object} supabase
 * @param {string} userId
 * @param {string} [timezone='UTC'] - IANA timezone for the 6pm check and date comparison
 */
export async function checkStreakAtRisk(supabase, userId, timezone = 'UTC') {
  try {
    const now = new Date();

    // Use the user's local hour instead of the server/browser hour
    const userHour = getHourInTimezone(now, timezone);
    if (userHour < 18) return { atRisk: false, streak: 0 };

    const { data: profile } = await supabase
      .from('profiles')
      .select('current_streak, last_activity_date')
      .eq('id', userId)
      .single();

    if (!profile || !profile.current_streak) return { atRisk: false, streak: 0 };

    // Compare dates in the user's timezone
    const todayLocal = formatDateInTimezone(now, timezone);
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayLocal = formatDateInTimezone(yesterday, timezone);

    const lastActivity = profile.last_activity_date;

    // Active today — not at risk
    if (lastActivity === todayLocal) {
      return { atRisk: false, streak: profile.current_streak };
    }

    // Active yesterday — at risk but still saveable
    if (lastActivity === yesterdayLocal) {
      return { atRisk: true, streak: profile.current_streak };
    }

    // Older than yesterday — streak is already broken, not "at risk"
    return { atRisk: false, streak: 0 };
  } catch (err) {
    console.error('Error checking streak risk:', err);
    return { atRisk: false, streak: 0 };
  }
}

/**
 * Use a streak freeze from the user's pool.
 *
 * Rules:
 * - Must have freezes remaining (streak_freezes_remaining > 0)
 * - Must wait 3+ days since last use (cooldown)
 * - Must have an active streak to protect
 *
 * On success: decrements pool, sets last_activity_date to today (saves streak).
 *
 * @param {object} supabase
 * @param {string} [timezone='UTC'] - IANA timezone used to determine "today"
 */
export async function applyStreakFreeze(supabase, timezone = 'UTC') {
  try {
    const { data: authData } = await supabase.auth.getUser();
    const userId = authData?.user?.id;
    if (!userId) return { success: false, freezesRemaining: 0, error: 'Not authenticated' };

    const { data: profile } = await supabase
      .from('profiles')
      .select('streak_freezes_remaining, streak_freeze_last_used, current_streak')
      .eq('id', userId)
      .single();

    if (!profile) return { success: false, freezesRemaining: 0, error: 'Profile not found' };

    // Must have an active streak
    if (!profile.current_streak || profile.current_streak === 0) {
      return { success: false, freezesRemaining: profile.streak_freezes_remaining || 0, error: 'No active streak to freeze' };
    }

    // Check pool
    const remaining = profile.streak_freezes_remaining || 0;
    if (remaining <= 0) {
      return { success: false, freezesRemaining: 0, error: 'No freezes remaining. Earn more by hitting streak milestones!' };
    }

    // Check cooldown (3 days between uses)
    if (profile.streak_freeze_last_used) {
      const lastUsed = new Date(profile.streak_freeze_last_used);
      const now = new Date();
      const daysSinceUse = (now - lastUsed) / (1000 * 60 * 60 * 24);
      if (daysSinceUse < FREEZE_COOLDOWN_DAYS) {
        const daysLeft = Math.ceil(FREEZE_COOLDOWN_DAYS - daysSinceUse);
        return {
          success: false,
          freezesRemaining: remaining,
          error: `Cooldown active — wait ${daysLeft} more day${daysLeft !== 1 ? 's' : ''}`
        };
      }
    }

    // Use the freeze via RPC (bypasses the gamification-column trigger).
    // The RPC atomically decrements the pool, stamps cooldown, and marks
    // today's activity (in the user's timezone) to save the streak.
    const today = formatDateInTimezone(new Date(), timezone);
    const { data, error } = await supabase.rpc('consume_streak_freeze', {
      p_user_id: userId,
      p_today: today,
    });

    if (error) throw error;

    // RPC may return { success, freezesRemaining } or { success: false, error }
    if (data && data.success === false) {
      return {
        success: false,
        freezesRemaining: typeof data.freezesRemaining === 'number' ? data.freezesRemaining : remaining,
        error: data.error || 'Failed to use streak freeze.',
      };
    }

    const newRemaining = typeof data?.freezesRemaining === 'number' ? data.freezesRemaining : Math.max(0, remaining - 1);
    return { success: true, freezesRemaining: newRemaining, error: null };
  } catch (err) {
    console.error('Error using streak freeze:', err);
    return { success: false, freezesRemaining: 0, error: 'Failed to use streak freeze. Please try again.' };
  }
}

/**
 * Get the current freeze status for a user.
 *
 * Returns:
 * - available: can the user use a freeze right now?
 * - freezesRemaining: how many in the pool
 * - cooldownEnds: Date when cooldown expires (null if no cooldown)
 * - nextFreezeEarned: human-readable hint for next freeze reward
 */
export async function getStreakFreezeStatus(supabase, userId) {
  try {
    const { data: profile } = await supabase
      .from('profiles')
      .select('streak_freezes_remaining, streak_freeze_last_used, current_streak')
      .eq('id', userId)
      .single();

    if (!profile) {
      return { available: false, freezesRemaining: 0, cooldownEnds: null, nextFreezeEarned: null };
    }

    const remaining = profile.streak_freezes_remaining || 0;
    let cooldownEnds = null;
    let onCooldown = false;

    // Check cooldown
    if (profile.streak_freeze_last_used) {
      const lastUsed = new Date(profile.streak_freeze_last_used);
      const cooldownEnd = new Date(lastUsed.getTime() + FREEZE_COOLDOWN_DAYS * 24 * 60 * 60 * 1000);
      if (cooldownEnd > new Date()) {
        onCooldown = true;
        cooldownEnds = cooldownEnd;
      }
    }

    // Figure out the next milestone that awards a freeze
    const streak = profile.current_streak || 0;
    let nextFreezeEarned = null;
    for (const milestone of FREEZE_REWARD_MILESTONES) {
      if (streak < milestone) {
        nextFreezeEarned = `Reach a ${milestone}-day streak`;
        break;
      }
    }

    return {
      available: remaining > 0 && !onCooldown,
      freezesRemaining: remaining,
      cooldownEnds,
      nextFreezeEarned,
    };
  } catch (err) {
    console.error('Error getting freeze status:', err);
    return { available: false, freezesRemaining: 0, cooldownEnds: null, nextFreezeEarned: null };
  }
}

/**
 * Award a streak freeze to a user (capped at MAX_FREEZES).
 *
 * Called internally when hitting streak milestones.
 * reason is a short string for logging, e.g. "7-day streak milestone".
 */
export async function awardStreakFreeze(supabase, userId, reason) {
  try {
    const { data: profile } = await supabase
      .from('profiles')
      .select('streak_freezes_remaining')
      .eq('id', userId)
      .single();

    if (!profile) return { success: false, error: 'Profile not found' };

    const current = profile.streak_freezes_remaining || 0;
    if (current >= MAX_FREEZES) {
      return { success: true, freezesRemaining: current, capped: true };
    }

    const { data: rpcData, error } = await supabase.rpc('award_streak_freeze', {
      p_user_id: userId,
      p_amount: 1,
      p_max_capacity: MAX_FREEZES,
    });

    if (error) throw error;

    const newRemaining = rpcData?.freezesRemaining ?? Math.min(current + 1, MAX_FREEZES);

    // Send a notification so the user knows they earned a freeze
    try {
      const { createNotification, NOTIFICATION_TYPES } = await import('@/lib/notifications');
      await createNotification(
        supabase,
        userId,
        NOTIFICATION_TYPES.STREAK_MILESTONE,
        'Streak Freeze Earned!',
        `You earned a streak freeze for: ${reason}. You now have ${newRemaining}.`,
        { freezesRemaining: newRemaining, reason }
      );
    } catch (notifErr) {
      // Notification failure shouldn't block the freeze award
      console.error('Error sending freeze notification:', notifErr);
    }

    return { success: true, freezesRemaining: newRemaining, capped: false };
  } catch (err) {
    console.error('Error awarding streak freeze:', err);
    return { success: false, error: err.message };
  }
}

/**
 * Update profile streak data after pact completion.
 *
 * Also awards freeze rewards at milestones (7, 14, 30 days).
 * Only awards if the streak just hit the milestone (prevents double awards).
 *
 * @param {object} supabase
 * @param {string} userId
 * @param {number} currentStreak
 * @param {number} calculatedLongestStreak
 * @param {string} [timezone='UTC'] - IANA timezone for determining "today"
 */
export async function updateStreakOnCompletion(supabase, userId, currentStreak, calculatedLongestStreak, timezone = 'UTC') {
  try {
    const today = formatDateInTimezone(new Date(), timezone);

    const { data: profile } = await supabase
      .from('profiles')
      .select('longest_streak')
      .eq('id', userId)
      .single();

    const longestStreak = Math.max(profile?.longest_streak || 0, currentStreak, calculatedLongestStreak || 0);

    // Write streak columns via RPC — the protect_gamification_columns trigger
    // blocks direct UPDATEs to these fields from non-service_role sessions.
    // The RPC sets the skip-trigger flag before writing.
    const { error } = await supabase.rpc('update_streak_activity', {
      p_user_id: userId,
      p_current_streak: currentStreak,
      p_longest_streak: longestStreak,
      p_last_activity_date: today, // already YYYY-MM-DD from formatDateInTimezone
    });

    if (error) throw error;

    // Check milestone notifications
    await checkStreakMilestone(supabase, userId, currentStreak);

    // Award freeze at milestones (only when streak exactly hits the number).
    // Idempotency: this function can run multiple times on a milestone day
    // (e.g. user completes 3 pacts on day 7). We log the award as an
    // xp_events row with a distinctive event_type, then check before
    // awarding to prevent duplicate freezes.
    if (FREEZE_REWARD_MILESTONES.includes(currentStreak)) {
      const eventType = `streak_freeze_milestone_${currentStreak}`;
      const { data: existing, error: lookupErr } = await supabase
        .from('xp_events')
        .select('id')
        .eq('user_id', userId)
        .eq('event_type', eventType)
        .limit(1)
        .maybeSingle();

      if (lookupErr) {
        // Fail closed on the award side if the idempotency lookup breaks —
        // better to skip a legitimate award than risk duplicates.
        console.error('Milestone freeze idempotency check failed:', lookupErr);
      } else if (!existing) {
        const awardResult = await awardStreakFreeze(supabase, userId, `${currentStreak}-day streak milestone`);
        if (awardResult?.success) {
          // Record the award as an idempotency marker. Route through
          // awardXP → `award_xp` RPC (SECURITY DEFINER) so the insert bypasses
          // the xp_events RLS policy (no client INSERT policy exists). The
          // RPC accepts `streak_freeze_milestone_*` via prefix allowlist.
          // xp_amount is 0 — this is a marker row, no actual XP is granted.
          // Failure to log the marker is non-fatal but will allow a
          // duplicate on re-run.
          try {
            const { awardXP } = await import('@/lib/gamification');
            await awardXP(supabase, userId, eventType, 0, {
              milestone: currentStreak,
              freezesRemaining: awardResult.freezesRemaining,
              awardedAt: new Date().toISOString(),
            });
          } catch (logErr) {
            console.error('Failed to log milestone freeze marker:', logErr);
          }
        }
      }
    }

    return { success: true };
  } catch (err) {
    console.error('Error updating streak:', err);
    return { success: false, error: err };
  }
}

/**
 * Send milestone notification if streak hits a milestone number
 */
async function checkStreakMilestone(supabase, userId, streak) {
  if (!STREAK_MILESTONES.includes(streak)) return;

  try {
    const { createNotification, NOTIFICATION_TYPES } = await import('@/lib/notifications');
    await createNotification(
      supabase,
      userId,
      NOTIFICATION_TYPES.STREAK_MILESTONE,
      `${streak}-Day Streak!`,
      `You've maintained a ${streak}-day streak. Keep going!`,
      { streak }
    );
  } catch (err) {
    console.error('Error sending milestone notification:', err);
  }
}
