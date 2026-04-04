-- ============================================================
-- SECURITY HARDENING: Revoke dangerous grants & tighten RLS
-- Applied 2026-03-29
-- ============================================================

-- 1. CRITICAL: Revoke TRUNCATE from authenticated on ALL tables
--    TRUNCATE bypasses RLS entirely — any logged-in user could wipe tables
REVOKE TRUNCATE ON ALL TABLES IN SCHEMA public FROM authenticated;
REVOKE TRUNCATE ON ALL TABLES IN SCHEMA public FROM anon;

-- 2. HIGH: Revoke TRIGGER from authenticated on all tables
--    Prevents users from creating malicious triggers
REVOKE TRIGGER ON ALL TABLES IN SCHEMA public FROM authenticated;
REVOKE TRIGGER ON ALL TABLES IN SCHEMA public FROM anon;

-- 3. Revoke REFERENCES (not needed for app functionality)
REVOKE REFERENCES ON ALL TABLES IN SCHEMA public FROM authenticated;
REVOKE REFERENCES ON ALL TABLES IN SCHEMA public FROM anon;

-- 4. MEDIUM: Revoke EXECUTE on mark_overdue_pacts from anon
--    This function should only be callable by authenticated users or service_role (cron)
REVOKE EXECUTE ON FUNCTION public.mark_overdue_pacts() FROM anon;
REVOKE EXECUTE ON FUNCTION public.mark_overdue_pacts() FROM public;

--    Revoking from `public` also strips access from `authenticated` (which inherits
--    from `public`). Grant it back explicitly so the app's supabase.rpc() calls
--    from dashboard/pacts pages continue to work.
GRANT EXECUTE ON FUNCTION public.mark_overdue_pacts() TO authenticated;

-- 5. Clean up stale grants on user_profiles (table no longer exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'user_profiles') THEN
    EXECUTE 'REVOKE ALL ON public.user_profiles FROM authenticated';
    EXECUTE 'REVOKE ALL ON public.user_profiles FROM anon';
  END IF;
  IF EXISTS (SELECT 1 FROM pg_views WHERE schemaname = 'public' AND viewname = 'user_profiles') THEN
    EXECUTE 'REVOKE ALL ON public.user_profiles FROM authenticated';
    EXECUTE 'REVOKE ALL ON public.user_profiles FROM anon';
  END IF;
END $$;

-- 6. Fix function search_path vulnerabilities (should be '' not 'public')
--    Mutable search_path allows schema injection attacks on SECURITY DEFINER functions
ALTER FUNCTION public.notify_on_reaction() SET search_path TO '';
ALTER FUNCTION public.award_xp(uuid, text, integer, jsonb) SET search_path TO '';
ALTER FUNCTION public.mark_all_notifications_read(uuid) SET search_path TO '';

-- 7. Revoke excess DELETE grants on tables with no DELETE policy
--    These tables have DELETE granted to authenticated but no RLS DELETE policy,
--    meaning any logged-in user could delete any row in these tables.
REVOKE DELETE ON public.xp_events FROM authenticated;
REVOKE DELETE ON public.activity_log FROM authenticated;
REVOKE DELETE ON public.focus_sessions FROM authenticated;
REVOKE DELETE ON public.reminder_logs FROM authenticated;
REVOKE DELETE ON public.user_onboarding FROM authenticated;
REVOKE DELETE ON public.user_achievements FROM authenticated;
REVOKE DELETE ON public.profiles FROM authenticated;
REVOKE DELETE ON public.nudges FROM authenticated;

-- 8. Tighten create_notification — restrict to self or group members
CREATE OR REPLACE FUNCTION public.create_notification(
  p_user_id uuid,
  p_type text,
  p_title text,
  p_message text,
  p_metadata jsonb DEFAULT NULL::jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
DECLARE
  v_id UUID;
  v_caller UUID;
BEGIN
  v_caller := auth.uid();
  IF v_caller IS NULL THEN
    RAISE EXCEPTION 'Unauthorized: must be authenticated';
  END IF;

  -- Allow self-notifications OR notifications to group-mates only
  IF v_caller != p_user_id AND NOT EXISTS (
    SELECT 1 FROM public.group_members gm1
    JOIN public.group_members gm2 ON gm1.group_id = gm2.group_id
    WHERE gm1.user_id = v_caller AND gm2.user_id = p_user_id
  ) THEN
    RAISE EXCEPTION 'Unauthorized: can only notify self or group members';
  END IF;

  -- Input length limits to prevent abuse
  IF length(p_title) > 200 THEN
    RAISE EXCEPTION 'Notification title too long (max 200 chars)';
  END IF;
  IF length(p_message) > 1000 THEN
    RAISE EXCEPTION 'Notification message too long (max 1000 chars)';
  END IF;

  INSERT INTO public.notifications (user_id, type, title, message, metadata)
  VALUES (p_user_id, p_type, p_title, p_message, p_metadata)
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;
