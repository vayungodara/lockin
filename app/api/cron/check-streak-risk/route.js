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

    // Find users with active streaks who haven't done anything today
    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('id, current_streak, last_activity_date')
      .gt('current_streak', 0)
      .neq('last_activity_date', today);

    if (error) throw error;

    let sent = 0;
    for (const profile of profiles || []) {
      await createNotification(
        supabase,
        profile.id,
        NOTIFICATION_TYPES.STREAK_AT_RISK,
        'Streak at Risk!',
        `Your ${profile.current_streak}-day streak will break if you don't complete a pact today!`,
        { streak: profile.current_streak }
      );
      sent++;
    }

    return Response.json({ message: `Sent ${sent} streak risk alerts` });
  } catch (err) {
    console.error('Cron error:', err);
    return Response.json({ error: 'Internal error' }, { status: 500 });
  }
}

export async function POST(request) {
  return GET(request);
}
