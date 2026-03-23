import { createClient } from '@supabase/supabase-js';
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
      // Batch upsert: compute ended_at for each session, capped at expected end time.
      // Abandoned sessions should not inflate duration beyond what was configured.
      const now = new Date();
      const updates = orphaned.map(session => {
        const expectedEnd = new Date(
          new Date(session.started_at).getTime() + session.duration_minutes * 60 * 1000
        );
        return {
          id: session.id,
          ended_at: new Date(Math.min(now.getTime(), expectedEnd.getTime())).toISOString(),
        };
      });

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
