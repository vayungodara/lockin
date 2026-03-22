import { createClient } from '@supabase/supabase-js';
import { NOTIFICATION_TYPES } from '@/lib/notifications';

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

    if (!profiles || profiles.length === 0) {
      return Response.json({ message: 'Sent 0 risk alerts' });
    }

    const profileIds = profiles.map(p => p.id);

    // Batch fetch: find all users who already got a streak-at-risk notification today
    const { data: existingNotifs } = await supabase
      .from('notifications')
      .select('user_id')
      .in('user_id', profileIds)
      .eq('type', NOTIFICATION_TYPES.STREAK_AT_RISK)
      .gte('created_at', `${today}T00:00:00Z`);

    const alreadyNotified = new Set((existingNotifs || []).map(n => n.user_id));

    // Filter to only users who haven't been notified yet
    const profilesToNotify = profiles.filter(p => !alreadyNotified.has(p.id));

    if (profilesToNotify.length === 0) {
      return Response.json({ message: 'Sent 0 risk alerts' });
    }

    // Batch insert all notifications at once
    const notificationRows = profilesToNotify.map(profile => ({
      user_id: profile.id,
      type: NOTIFICATION_TYPES.STREAK_AT_RISK,
      title: 'Streak at Risk!',
      message: `Your ${profile.current_streak}-day streak will break if you don't complete a pact today!`,
      metadata: { streak: profile.current_streak }
    }));

    const { error: insertError } = await supabase
      .from('notifications')
      .insert(notificationRows);

    if (insertError) throw insertError;

    const riskSent = profilesToNotify.length;

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
