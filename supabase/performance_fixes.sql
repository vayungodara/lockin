-- ============================================================================
-- SUPABASE PERFORMANCE FIXES
-- Fixes 46 linting warnings: auth_rls_initplan, duplicate policies, duplicate indexes
-- Run this in Supabase SQL Editor
-- ============================================================================

-- ============================================================================
-- PART 1: DROP DUPLICATE INDEXES (3 warnings)
-- ============================================================================

-- activity_log has duplicate indexes for created_at, group_id, user_id
DROP INDEX IF EXISTS public.activity_log_created_at_idx;
DROP INDEX IF EXISTS public.activity_log_group_id_idx;
DROP INDEX IF EXISTS public.activity_log_user_id_idx;
-- Keep: idx_activity_log_created_at, idx_activity_log_group_id, idx_activity_log_user_id


-- ============================================================================
-- PART 2: DROP DUPLICATE POLICIES (14 warnings)
-- ============================================================================

-- activity_log: Drop old duplicate policies
DROP POLICY IF EXISTS "Users can insert own activity" ON public.activity_log;
DROP POLICY IF EXISTS "activity_log_insert" ON public.activity_log;
DROP POLICY IF EXISTS "Users can view relevant activity" ON public.activity_log;
DROP POLICY IF EXISTS "activity_log_select" ON public.activity_log;

-- focus_sessions: Drop overlapping policies
DROP POLICY IF EXISTS "Users can manage own focus sessions" ON public.focus_sessions;
DROP POLICY IF EXISTS "Users can view own focus sessions" ON public.focus_sessions;
DROP POLICY IF EXISTS "Users can insert own focus sessions" ON public.focus_sessions;
DROP POLICY IF EXISTS "Users can update own focus sessions" ON public.focus_sessions;


-- ============================================================================
-- PART 3: RECREATE ALL RLS POLICIES WITH (SELECT auth.uid())
-- ============================================================================

-- ----------------------------------------------------------------------------
-- PACTS TABLE (4 policies)
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Users can view own pacts" ON public.pacts;
DROP POLICY IF EXISTS "Users can create own pacts" ON public.pacts;
DROP POLICY IF EXISTS "Users can update own pacts" ON public.pacts;
DROP POLICY IF EXISTS "Users can delete own pacts" ON public.pacts;

CREATE POLICY "Users can view own pacts" ON public.pacts
  FOR SELECT USING (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can create own pacts" ON public.pacts
  FOR INSERT WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can update own pacts" ON public.pacts
  FOR UPDATE USING (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can delete own pacts" ON public.pacts
  FOR DELETE USING (user_id = (SELECT auth.uid()));


-- ----------------------------------------------------------------------------
-- GROUPS TABLE (4 policies)
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Users can view groups" ON public.groups;
DROP POLICY IF EXISTS "Users can create groups" ON public.groups;
DROP POLICY IF EXISTS "Group owners can update their groups" ON public.groups;
DROP POLICY IF EXISTS "Group owners can delete their groups" ON public.groups;

CREATE POLICY "Users can view groups" ON public.groups
  FOR SELECT USING (
    created_by = (SELECT auth.uid())
    OR id IN (
      SELECT group_id FROM public.group_members 
      WHERE user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "Users can create groups" ON public.groups
  FOR INSERT WITH CHECK (created_by = (SELECT auth.uid()));

CREATE POLICY "Group owners can update their groups" ON public.groups
  FOR UPDATE USING (created_by = (SELECT auth.uid()));

CREATE POLICY "Group owners can delete their groups" ON public.groups
  FOR DELETE USING (created_by = (SELECT auth.uid()));


-- ----------------------------------------------------------------------------
-- GROUP_MEMBERS TABLE (3 policies)
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Users can view group memberships" ON public.group_members;
DROP POLICY IF EXISTS "Users can join groups" ON public.group_members;
DROP POLICY IF EXISTS "Users can leave groups" ON public.group_members;

CREATE POLICY "Users can view group memberships" ON public.group_members
  FOR SELECT USING (
    user_id = (SELECT auth.uid())
    OR group_id IN (
      SELECT group_id FROM public.group_members 
      WHERE user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "Users can join groups" ON public.group_members
  FOR INSERT WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can leave groups" ON public.group_members
  FOR DELETE USING (user_id = (SELECT auth.uid()));


-- ----------------------------------------------------------------------------
-- TASKS TABLE (4 policies)
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Users can view tasks in their groups" ON public.tasks;
DROP POLICY IF EXISTS "Group members can create tasks" ON public.tasks;
DROP POLICY IF EXISTS "Task owners and creators can update tasks" ON public.tasks;
DROP POLICY IF EXISTS "Task owners and group owners can delete tasks" ON public.tasks;

CREATE POLICY "Users can view tasks in their groups" ON public.tasks
  FOR SELECT USING (
    group_id IN (
      SELECT group_id FROM public.group_members 
      WHERE user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "Group members can create tasks" ON public.tasks
  FOR INSERT WITH CHECK (
    group_id IN (
      SELECT group_id FROM public.group_members 
      WHERE user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "Task owners and creators can update tasks" ON public.tasks
  FOR UPDATE USING (
    owner_id = (SELECT auth.uid())
    OR created_by = (SELECT auth.uid())
    OR group_id IN (
      SELECT id FROM public.groups 
      WHERE created_by = (SELECT auth.uid())
    )
  );

CREATE POLICY "Task owners and group owners can delete tasks" ON public.tasks
  FOR DELETE USING (
    owner_id = (SELECT auth.uid())
    OR group_id IN (
      SELECT id FROM public.groups 
      WHERE created_by = (SELECT auth.uid())
    )
  );


-- ----------------------------------------------------------------------------
-- ACTIVITY_LOG TABLE (consolidated: 1 SELECT + 1 INSERT policy)
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "activity_log_select" ON public.activity_log;
DROP POLICY IF EXISTS "activity_log_insert" ON public.activity_log;

CREATE POLICY "activity_log_select" ON public.activity_log
  FOR SELECT USING (
    user_id = (SELECT auth.uid())
    OR group_id IN (
      SELECT group_id FROM public.group_members 
      WHERE user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "activity_log_insert" ON public.activity_log
  FOR INSERT WITH CHECK (user_id = (SELECT auth.uid()));


-- ----------------------------------------------------------------------------
-- ACTIVITY_REACTIONS TABLE (3 policies)
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Users can view relevant reactions" ON public.activity_reactions;
DROP POLICY IF EXISTS "Users can add reactions" ON public.activity_reactions;
DROP POLICY IF EXISTS "Users can remove their reactions" ON public.activity_reactions;

CREATE POLICY "Users can view relevant reactions" ON public.activity_reactions
  FOR SELECT USING (
    activity_id IN (
      SELECT id FROM public.activity_log
      WHERE user_id = (SELECT auth.uid())
      OR group_id IN (
        SELECT group_id FROM public.group_members 
        WHERE user_id = (SELECT auth.uid())
      )
    )
  );

CREATE POLICY "Users can add reactions" ON public.activity_reactions
  FOR INSERT WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can remove their reactions" ON public.activity_reactions
  FOR DELETE USING (user_id = (SELECT auth.uid()));


-- ----------------------------------------------------------------------------
-- FOCUS_SESSIONS TABLE (consolidated: SELECT + INSERT + UPDATE)
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "focus_sessions_select" ON public.focus_sessions;
DROP POLICY IF EXISTS "focus_sessions_insert" ON public.focus_sessions;
DROP POLICY IF EXISTS "focus_sessions_update" ON public.focus_sessions;

CREATE POLICY "focus_sessions_select" ON public.focus_sessions
  FOR SELECT USING (user_id = (SELECT auth.uid()));

CREATE POLICY "focus_sessions_insert" ON public.focus_sessions
  FOR INSERT WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "focus_sessions_update" ON public.focus_sessions
  FOR UPDATE USING (user_id = (SELECT auth.uid()));


-- ----------------------------------------------------------------------------
-- PROFILES TABLE (2 policies)
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (id = (SELECT auth.uid()));

CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (id = (SELECT auth.uid()));


-- ============================================================================
-- PART 4: ADD MISSING INDEXES FOR FOREIGN KEYS (3 warnings)
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_focus_sessions_group_id ON public.focus_sessions(group_id);
CREATE INDEX IF NOT EXISTS idx_groups_created_by ON public.groups(created_by);
CREATE INDEX IF NOT EXISTS idx_tasks_created_by ON public.tasks(created_by);


-- ============================================================================
-- DONE!
-- ============================================================================
