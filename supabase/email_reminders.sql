-- Email Reminders Schema for LockIn
-- Run this in Supabase SQL Editor

-- Table to track sent reminders (prevents duplicates)
CREATE TABLE IF NOT EXISTS reminder_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pact_id UUID NOT NULL REFERENCES pacts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reminder_type TEXT NOT NULL CHECK (reminder_type IN ('24h_before')),
  sent_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  email_id TEXT, -- Resend email ID for tracking
  UNIQUE(pact_id, reminder_type)
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_reminder_logs_pact_id ON reminder_logs(pact_id);
CREATE INDEX IF NOT EXISTS idx_reminder_logs_user_id ON reminder_logs(user_id);

-- RLS policies (users can see their own reminder logs)
ALTER TABLE reminder_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own reminder logs"
  ON reminder_logs FOR SELECT
  USING (auth.uid() = user_id);

-- View to find pacts needing 24h reminders
-- This view is used by the cron job (service role bypasses RLS)
CREATE OR REPLACE VIEW pacts_needing_reminders AS
SELECT
  p.id AS pact_id,
  p.title AS pact_title,
  p.deadline,
  p.user_id,
  u.email AS user_email,
  pr.full_name AS user_name
FROM pacts p
JOIN auth.users u ON u.id = p.user_id
LEFT JOIN profiles pr ON pr.id = p.user_id
LEFT JOIN reminder_logs rl ON rl.pact_id = p.id AND rl.reminder_type = '24h_before'
WHERE
  -- Pact is not completed (completed_at is NULL means not done)
  p.completed_at IS NULL
  -- Deadline is between now and 24 hours from now
  AND p.deadline > now()
  AND p.deadline <= now() + interval '24 hours'
  -- No reminder has been sent yet
  AND rl.id IS NULL;

-- SECURITY: Only service_role should access this view (used by cron job)
-- Revoke access from public/anon/authenticated to prevent email exposure
REVOKE ALL ON pacts_needing_reminders FROM public;
REVOKE ALL ON pacts_needing_reminders FROM anon;
REVOKE ALL ON pacts_needing_reminders FROM authenticated;

-- Grant access ONLY to service role
GRANT SELECT ON pacts_needing_reminders TO service_role;
