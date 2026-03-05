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
    const today = new Date().toISOString().split('T')[0];
    const twoDaysAgo = new Date(Date.now() - 2 * 86400000).toISOString().split('T')[0];

    // Find users with active streaks who haven't been active today
    // but whose streak is NOT yet broken (active yesterday or day before)
    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('id, current_streak, last_activity_date')
      .gt('current_streak', 0)
      .gte('last_activity_date', twoDaysAgo)
      .lt('last_activity_date', today);

    if (error) throw error;

    let riskSent = 0;

    for (const profile of profiles || []) {
      // Deduplicate: check if we already sent a streak-at-risk notification today
      const { data: existing } = await supabase
        .from('notifications')
        .select('id')
        .eq('user_id', profile.id)
        .eq('type', NOTIFICATION_TYPES.STREAK_AT_RISK)
        .gte('created_at', `${today}T00:00:00Z`)
        .limit(1);

      if (existing && existing.length > 0) continue;

      const { error: notifError } = await createNotification(
        supabase,
        profile.id,
        NOTIFICATION_TYPES.STREAK_AT_RISK,
        'Streak at Risk!',
        `Your ${profile.current_streak}-day streak will break if you don't complete a pact today!`,
        { streak: profile.current_streak }
      );

      if (notifError) {
        console.error(`Failed to notify user ${profile.id}:`, notifError);
      } else {
        riskSent++;
      }
    }

    return Response.json({
      message: `Sent ${riskSent} risk alerts`
    });
  } catch (err) {
    console.error('Cron error:', err);
    return Response.json({ error: 'Internal error' }, { status: 500 });
  }
}

export async function POST(request) {
  return GET(request);
}
