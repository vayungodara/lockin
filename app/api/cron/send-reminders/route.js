import { createClient } from '@supabase/supabase-js';
import { sendReminderEmail } from '@/lib/email';

// Create Supabase client with service role (lazy-loaded)
function getSupabaseClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
}

export async function GET(request) {
  // Verify the request is from Vercel Cron or has correct secret
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = getSupabaseClient();

  try {
    // Query pacts needing reminders
    const { data: pacts, error: queryError } = await supabase
      .from('pacts_needing_reminders')
      .select('*');

    if (queryError) {
      console.error('Query error:', queryError);
      return Response.json({ error: 'Internal server error' }, { status: 500 });
    }

    if (!pacts || pacts.length === 0) {
      return Response.json({ message: 'No reminders to send', sent: 0 });
    }

    const results = {
      sent: 0,
      failed: 0,
      errors: [],
    };

    // Send reminders for each pact
    for (const pact of pacts) {
      const { pact_id, pact_title, deadline, user_id, user_email, user_name } = pact;

      // Send email
      const emailResult = await sendReminderEmail({
        to: user_email,
        pactTitle: pact_title,
        deadline,
        userName: user_name,
      });

      if (emailResult.success) {
        // Log the sent reminder
        const { error: logError } = await supabase
          .from('reminder_logs')
          .insert({
            pact_id,
            user_id,
            reminder_type: '24h_before',
            email_id: emailResult.emailId,
          });

        if (logError) {
          console.error('Failed to log reminder:', logError);
          // Don't fail the whole operation, just note it
          results.errors.push(`Log failed for pact ${pact_id}: ${logError.message}`);
        }

        results.sent++;
      } else {
        results.failed++;
        results.errors.push(`Failed to send to ${user_email}: ${emailResult.error}`);
      }
    }

    return Response.json({
      message: `Processed ${pacts.length} reminders`,
      ...results,
    });
  } catch (err) {
    console.error('Cron error:', err);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Also support POST for manual testing
export async function POST(request) {
  return GET(request);
}
