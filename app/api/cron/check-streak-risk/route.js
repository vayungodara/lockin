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
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const twoDaysAgo = new Date(Date.now() - 2 * 86400000).toISOString().split('T')[0];

    // Find all users with active streaks who haven't been active today
    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('id, current_streak, last_activity_date')
      .gt('current_streak', 0)
      .lt('last_activity_date', today);

    if (error) throw error;

    let riskSent = 0;
    let broken = 0;

    for (const profile of profiles || []) {
      const lastActivity = profile.last_activity_date;

      if (lastActivity < twoDaysAgo) {
        // Streak is broken — inactive for 2+ days (timezone buffer)
        const brokenStreak = profile.current_streak;

        await supabase
          .from('profiles')
          .update({ current_streak: 0 })
          .eq('id', profile.id);

        await createNotification(
          supabase,
          profile.id,
          NOTIFICATION_TYPES.STREAK_BROKEN,
          'Streak Broken',
          `Your ${brokenStreak}-day streak has ended. Start a new one today!`,
          { brokenStreak }
        );

        // Post to group feeds
        const { data: memberships } = await supabase
          .from('group_members')
          .select('group_id')
          .eq('user_id', profile.id);

        for (const membership of memberships || []) {
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
      } else if (lastActivity >= twoDaysAgo && lastActivity < today) {
        // Streak at risk — last active yesterday or day before (still saveable)
        await createNotification(
          supabase,
          profile.id,
          NOTIFICATION_TYPES.STREAK_AT_RISK,
          'Streak at Risk!',
          `Your ${profile.current_streak}-day streak will break if you don't complete a pact today!`,
          { streak: profile.current_streak }
        );
        riskSent++;
      }
    }

    return Response.json({
      message: `Sent ${riskSent} risk alerts, broke ${broken} streaks`
    });
  } catch (err) {
    console.error('Cron error:', err);
    return Response.json({ error: 'Internal error' }, { status: 500 });
  }
}

export async function POST(request) {
  return GET(request);
}
