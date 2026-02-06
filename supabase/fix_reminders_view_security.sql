-- Fix for pacts_needing_reminders view security warnings
-- Run this if you already deployed email_reminders.sql before the fix
--
-- Issues fixed:
-- 1. Exposed Auth Users - view was accessible to anon/authenticated
-- 2. Security Definer View - now properly restricted to service_role only

-- Revoke access from public/anon/authenticated to prevent email exposure
REVOKE ALL ON pacts_needing_reminders FROM public;
REVOKE ALL ON pacts_needing_reminders FROM anon;
REVOKE ALL ON pacts_needing_reminders FROM authenticated;

-- Ensure service_role has access (for cron job)
GRANT SELECT ON pacts_needing_reminders TO service_role;
