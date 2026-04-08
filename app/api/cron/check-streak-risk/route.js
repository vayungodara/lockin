import { createClient } from '@supabase/supabase-js';
import { NOTIFICATION_TYPES } from '@/lib/notifications';
import { verifyCronSecret } from '@/lib/cronAuth';
import { formatDateInTimezone } from '@/lib/streaks';

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
    const now = new Date();

    // Fetch all profiles with active streaks — timezone filtering done in JS
    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('id, current_streak, last_activity_date, timezone')
      .gt('current_streak', 0)
      .not('last_activity_date', 'is', null);

    if (error) throw error;

    // Filter to at-risk profiles using each user's timezone
    const atRiskProfiles = (profiles || []).filter(p => {
      const tz = p.timezone || 'UTC';
      const localToday = formatDateInTimezone(now, tz);
      const localTwoDaysAgo = formatDateInTimezone(new Date(now.getTime() - 2 * 86400000), tz);
      return p.last_activity_date >= localTwoDaysAgo && p.last_activity_date < localToday;
    });

    if (atRiskProfiles.length === 0) {
      return Response.json({ message: 'Sent 0 risk alerts' });
    }

    const profileIds = atRiskProfiles.map(p => p.id);

    // Dedup: skip users already notified in the last 24 hours
    const oneDayAgo = new Date(now.getTime() - 86400000).toISOString();
    const { data: existingNotifs } = await supabase
      .from('notifications')
      .select('user_id')
      .in('user_id', profileIds)
      .eq('type', NOTIFICATION_TYPES.STREAK_AT_RISK)
      .gte('created_at', oneDayAgo);

    const alreadyNotified = new Set((existingNotifs || []).map(n => n.user_id));

    // Filter to only users who haven't been notified yet
    const profilesToNotify = atRiskProfiles.filter(p => !alreadyNotified.has(p.id));

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
