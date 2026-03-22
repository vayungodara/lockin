import { createClient } from '@supabase/supabase-js';

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
  const results = { overduePacts: 0, orphanedSessions: 0, errors: [] };

  // 1. Mark overdue active pacts as missed
  try {
    const { data: overdue, error } = await supabase
      .from('pacts')
      .update({ status: 'missed' })
      .eq('status', 'active')
      .lt('deadline', new Date().toISOString())
      .eq('is_recurring', false)
      .select('id');

    if (error) throw error;
    results.overduePacts = overdue?.length || 0;
  } catch (err) {
    console.error('Error marking overdue pacts:', err);
    results.errors.push(`Overdue pacts: ${err.message}`);
  }

  // 2. Auto-close orphaned focus sessions (started > duration + 30min ago, no ended_at)
  try {
    const { data: orphaned, error: fetchError } = await supabase
      .from('focus_sessions')
      .select('id, started_at, duration_minutes')
      .is('ended_at', null)
      .lt('started_at', new Date(Date.now() - 60 * 60 * 1000).toISOString()); // started > 1hr ago

    if (fetchError) throw fetchError;

    if (orphaned && orphaned.length > 0) {
      // Batch upsert: compute ended_at for each session, then write all at once
      const updates = orphaned.map(session => ({
        id: session.id,
        ended_at: new Date(
          new Date(session.started_at).getTime() + session.duration_minutes * 60 * 1000
        ).toISOString(),
      }));

      const { error: upsertError } = await supabase
        .from('focus_sessions')
        .upsert(updates, { onConflict: 'id', ignoreDuplicates: false });

      if (upsertError) throw upsertError;
      results.orphanedSessions = orphaned.length;
    }
  } catch (err) {
    console.error('Error closing orphaned sessions:', err);
    results.errors.push(`Orphaned sessions: ${err.message}`);
  }

  return Response.json({
    message: `Marked ${results.overduePacts} overdue pacts, closed ${results.orphanedSessions} orphaned sessions`,
    ...results,
  });
}

export async function POST(request) {
  return GET(request);
}
