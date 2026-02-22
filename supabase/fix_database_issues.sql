-- ============================================================================
-- DATABASE FIXES: RLS performance, missing indexes, notification types
-- Run this in Supabase SQL Editor
-- ============================================================================

-- ============================================================================
-- 1. FIX RLS auth_rls_initplan WARNINGS ON xp_events & user_achievements
--    These 3 policies use auth.uid() instead of (SELECT auth.uid()),
--    causing per-row re-evaluation instead of once-per-query.
-- ============================================================================

-- xp_events: SELECT policy
DROP POLICY IF EXISTS "Users can view own xp events" ON public.xp_events;
CREATE POLICY "Users can view own xp events" ON public.xp_events
  FOR SELECT TO authenticated USING (user_id = (SELECT auth.uid()));

-- user_achievements: SELECT policy
DROP POLICY IF EXISTS "Users can view own achievements" ON public.user_achievements;
CREATE POLICY "Users can view own achievements" ON public.user_achievements
  FOR SELECT TO authenticated USING (user_id = (SELECT auth.uid()));

-- user_achievements: INSERT policy
DROP POLICY IF EXISTS "Users can insert own achievements" ON public.user_achievements;
CREATE POLICY "Users can insert own achievements" ON public.user_achievements
  FOR INSERT TO authenticated WITH CHECK (user_id = (SELECT auth.uid()));


-- ============================================================================
-- 2. DROP DUPLICATE INDEX ON user_achievements
--    idx_achievements_user_id and idx_user_achievements_user_id are identical
-- ============================================================================

DROP INDEX IF EXISTS public.idx_achievements_user_id;


-- ============================================================================
-- 3. RECREATE activity_log.user_id INDEX
--    Dropped by performance_fixes.sql (as a duplicate) but the kept index
--    may not have existed. Recreate to ensure activity feed RLS is fast.
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_activity_log_user_id ON public.activity_log(user_id);


-- ============================================================================
-- 4. ADD MISSING FOREIGN KEY INDEXES
--    These columns are used in JOINs and RLS policies but have no index.
-- ============================================================================

-- Note: performance_fixes.sql was never run, so include those indexes too
CREATE INDEX IF NOT EXISTS idx_tasks_owner_id ON public.tasks(owner_id);
CREATE INDEX IF NOT EXISTS idx_tasks_created_by ON public.tasks(created_by);
CREATE INDEX IF NOT EXISTS idx_groups_created_by ON public.groups(created_by);
CREATE INDEX IF NOT EXISTS idx_focus_sessions_group_id ON public.focus_sessions(group_id);
CREATE INDEX IF NOT EXISTS idx_activity_comments_user_id ON public.activity_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_reactions_user_id ON public.activity_reactions(user_id);
CREATE INDEX IF NOT EXISTS idx_accountability_partnerships_requested_by ON public.accountability_partnerships(requested_by);
CREATE INDEX IF NOT EXISTS idx_group_challenges_created_by ON public.group_challenges(created_by);
CREATE INDEX IF NOT EXISTS idx_group_challenges_winner ON public.group_challenges(winner_user_id);
CREATE INDEX IF NOT EXISTS idx_reminder_logs_user_id ON public.reminder_logs(user_id);


-- ============================================================================
-- 5. UPDATE create_notification FUNCTION TYPE ALLOWLIST
--    The DB function hardcodes 9 types but the app uses 17.
--    Remove the check entirely since the app does direct inserts anyway
--    and the type validation is better handled at the application layer.
-- ============================================================================

CREATE OR REPLACE FUNCTION create_notification(
  p_user_id UUID,
  p_type TEXT,
  p_title TEXT,
  p_message TEXT,
  p_metadata JSONB DEFAULT '{}'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id UUID;
BEGIN
  -- Validate text lengths
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


-- ============================================================================
-- DONE! Verify by re-running Supabase advisors.
-- ============================================================================
