/**
 * Onboarding — First Week Challenge logic
 * Auto-detects step completion from existing tables.
 */

import { awardXP, XP_REWARDS } from '@/lib/gamification';

const ONBOARDING_STEPS = [
  { field: 'has_created_pact', xpType: 'onboarding_pact', xp: XP_REWARDS.ONBOARDING_PACT },
  { field: 'has_used_focus_timer', xpType: 'onboarding_focus', xp: XP_REWARDS.ONBOARDING_FOCUS },
  { field: 'has_joined_group', xpType: 'onboarding_group', xp: XP_REWARDS.ONBOARDING_GROUP },
  { field: 'has_built_momentum', xpType: 'onboarding_momentum', xp: XP_REWARDS.ONBOARDING_MOMENTUM },
];

/**
 * Fetch or create the user_onboarding row.
 */
export async function getOnboardingState(supabase, userId) {
  if (!userId) return null;
  try {
    const { data, error } = await supabase
      .from('user_onboarding')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      console.error('Onboarding fetch error:', error);
      return null;
    }

    if (!data) {
      const { data: newRow, error: insertError } = await supabase
        .from('user_onboarding')
        .upsert({ user_id: userId }, { onConflict: 'user_id' })
        .select()
        .single();

      if (insertError) {
        console.error('Onboarding insert error:', insertError);
        return null;
      }
      return newRow;
    }

    return data;
  } catch (err) {
    console.error('Onboarding state error:', err);
    return null;
  }
}

/**
 * Detect which steps are actually complete by querying real data.
 */
export async function detectProgress(supabase, userId) {
  if (!userId) return null;
  try {
    const [pacts, sessions, groups, profile] = await Promise.all([
      supabase.from('pacts').select('id').eq('user_id', userId).limit(1),
      supabase.from('focus_sessions').select('id').eq('user_id', userId).not('ended_at', 'is', null).limit(1),
      supabase.from('group_members').select('group_id').eq('user_id', userId).limit(1),
      supabase.from('profiles').select('current_streak').eq('id', userId).single(),
    ]);

    if (pacts.error || sessions.error || groups.error || profile.error) {
      console.error('Onboarding detection failed:', {
        pacts: pacts.error, sessions: sessions.error,
        groups: groups.error, profile: profile.error,
      });
      return null;
    }

    return {
      has_created_pact: (pacts.data?.length ?? 0) > 0,
      has_joined_group: (groups.data?.length ?? 0) > 0,
      has_used_focus_timer: (sessions.data?.length ?? 0) > 0,
      has_built_momentum: (profile.data?.current_streak ?? 0) >= 2,
    };
  } catch (err) {
    console.error('Onboarding detection error:', err);
    return null;
  }
}

/**
 * Sync detected progress with DB state. Awards XP for newly completed steps.
 */
export async function syncProgress(supabase, userId, dbState, detected) {
  if (!userId) return null;
  const newlyCompleted = [];
  const updates = {};

  for (const step of ONBOARDING_STEPS) {
    if (!dbState[step.field] && detected[step.field]) {
      updates[step.field] = true;
      newlyCompleted.push(step);
    }
  }

  if (newlyCompleted.length === 0) {
    return { updatedState: dbState, newlyCompleted: [] };
  }

  const allComplete = ONBOARDING_STEPS.every(
    s => dbState[s.field] || detected[s.field]
  );
  if (allComplete) {
    updates.onboarding_completed_at = new Date().toISOString();
  }

  const { error: updateError } = await supabase
    .from('user_onboarding')
    .update(updates)
    .eq('user_id', userId);

  if (updateError) {
    console.error('Onboarding sync error:', updateError);
    return null;
  }

  for (const step of newlyCompleted) {
    const result = await awardXP(supabase, userId, step.xpType, step.xp, { source: 'onboarding' });
    step.xpAwarded = result?.success === true;
  }

  return {
    updatedState: { ...dbState, ...updates },
    newlyCompleted,
  };
}

/**
 * Reset onboarding for a user (Settings > Restart Onboarding).
 */
export async function resetOnboarding(supabase, userId) {
  if (!userId) return false;
  const { error } = await supabase
    .from('user_onboarding')
    .update({
      has_created_pact: false,
      has_joined_group: false,
      has_used_focus_timer: false,
      has_built_momentum: false,
      onboarding_dismissed: false,
      onboarding_completed_at: null,
    })
    .eq('user_id', userId);

  if (error) {
    console.error('Onboarding reset error:', error);
    return false;
  }
  return true;
}
