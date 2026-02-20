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

    let broken = 0;
    for (const profile of profiles || []) {
      const brokenStreak = profile.current_streak;

      // Reset streak
      await supabase
        .from('profiles')
        .update({ current_streak: 0 })
        .eq('id', profile.id);

      // Notify user
      await createNotification(
        supabase,
        profile.id,
        NOTIFICATION_TYPES.STREAK_BROKEN,
        'Streak Broken',
        `Your ${brokenStreak}-day streak has ended. Start a new one today!`,
        { brokenStreak }
      );

      // Post to group feeds so members can see
      const { data: memberships } = await supabase
        .from('group_members')
        .select('group_id')
        .eq('user_id', profile.id);

      for (const membership of memberships || []) {
        // Use service role insert directly since logActivity requires auth context
        await supabase
          .from('activity_log')
          .insert({
            user_id: profile.id,
            group_id: membership.group_id,
            action: 'streak_broken',
            metadata: { streak_length: brokenStreak }
          });
      }

      broken++;
    }

    return Response.json({ message: `Processed ${broken} broken streaks` });
  } catch (err) {
    console.error('Cron error:', err);
    return Response.json({ error: 'Internal error' }, { status: 500 });
  }
}

export async function POST(request) {
  return GET(request);
}
