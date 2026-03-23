import { createClient } from '@supabase/supabase-js';
import { NOTIFICATION_TYPES } from '@/lib/notifications';
import { verifyCronSecret } from '@/lib/cronAuth';

function getSupabaseClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
}

export async function GET(request) {
  // Verify the request is from Vercel Cron using timing-safe comparison
  const { authorized, response } = verifyCronSecret(request);
  if (!authorized) return response;

  const supabase = getSupabaseClient();

  try {
    // Use a 2-day buffer to account for timezone differences.
    // A user in UTC-12 could have last_activity_date set to "yesterday" in UTC
    // even though it's still "today" in their local timezone.
    // With a 2-day buffer, we only break streaks for users who have been
    // inactive for at least 2 UTC days, ensuring no false breaks.
    const twoDaysAgo = new Date(Date.now() - 2 * 86400000).toISOString().split('T')[0];

    // Find users whose last activity was before 2 days ago (streak broken)
    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('id, current_streak, last_activity_date')
      .gt('current_streak', 0)
      .lt('last_activity_date', twoDaysAgo);

    if (error) throw error;

    if (!profiles || profiles.length === 0) {
      return Response.json({ message: 'No broken streaks' });
    }

    const profileIds = profiles.map(p => p.id);

    // Batch reset all streaks at once
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ current_streak: 0 })
      .in('id', profileIds);

    if (updateError) throw updateError;

    // Batch fetch all group memberships for affected users
    const { data: allMemberships } = await supabase
      .from('group_members')
      .select('user_id, group_id')
      .in('user_id', profileIds);

    // Batch insert all notifications in a single DB round-trip
    const notifications = profiles.map(profile => ({
      user_id: profile.id,
      type: NOTIFICATION_TYPES.STREAK_BROKEN,
      title: 'Streak Broken',
      message: `Your ${profile.current_streak}-day streak has ended. Start a new one today!`,
      metadata: { brokenStreak: profile.current_streak },
    }));

    // Build activity log entries in bulk
    const activityEntries = [];
    for (const profile of profiles) {
      const userMemberships = (allMemberships || []).filter(m => m.user_id === profile.id);
      for (const membership of userMemberships) {
        activityEntries.push({
          user_id: profile.id,
          group_id: membership.group_id,
          action: 'streak_broken',
          metadata: { streak_length: profile.current_streak }
        });
      }
    }

    const notificationPromise = notifications.length > 0
      ? supabase.from('notifications').insert(notifications).then(({ error: notifError }) => {
          if (notifError) console.error('Batch notification error:', notifError);
        })
      : Promise.resolve();

    const activityPromise = activityEntries.length > 0
      ? supabase.from('activity_log').insert(activityEntries).then(({ error: actError }) => {
          if (actError) console.error('Batch activity log error:', actError);
        })
      : Promise.resolve();

    await Promise.all([notificationPromise, activityPromise]);

    const broken = profiles.length;

    return Response.json({ message: `Processed ${broken} broken streaks` });
  } catch (err) {
    console.error('Cron error:', err);
    return Response.json({ error: 'Internal error' }, { status: 500 });
  }
}

export async function POST(request) {
  return GET(request);
}
