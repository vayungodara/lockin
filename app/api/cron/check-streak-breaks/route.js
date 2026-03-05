import { createClient } from '@supabase/supabase-js';
import { createNotification, NOTIFICATION_TYPES } from '@/lib/notifications';

function getSupabaseClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
}

export async function GET(request) {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

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

    // Send notifications and activity logs (still per-user for custom messages)
    const notificationPromises = profiles.map(profile =>
      createNotification(
        supabase,
        profile.id,
        NOTIFICATION_TYPES.STREAK_BROKEN,
        'Streak Broken',
        `Your ${profile.current_streak}-day streak has ended. Start a new one today!`,
        { brokenStreak: profile.current_streak }
      ).catch(err => console.error(`Notification error for ${profile.id}:`, err))
    );

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

    const activityPromise = activityEntries.length > 0
      ? supabase.from('activity_log').insert(activityEntries)
      : Promise.resolve();

    await Promise.all([...notificationPromises, activityPromise]);

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
