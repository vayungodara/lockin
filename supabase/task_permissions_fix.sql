-- Task Permissions Fix
-- Aligns RLS policies with UI logic:
--   - UPDATE: owner_id, created_by, or group owner
--   - DELETE: created_by or group owner (NOT owner_id)

-- Use helper function to avoid recursion
DROP FUNCTION IF EXISTS is_group_owner(uuid);
CREATE OR REPLACE FUNCTION is_group_owner(gid uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM groups 
    WHERE id = gid AND created_by = auth.uid()
  );
$$;

-- ----------------------------------------------------------------------------
-- TASKS TABLE - Updated policies
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Users can view tasks in their groups" ON public.tasks;
DROP POLICY IF EXISTS "Group members can create tasks" ON public.tasks;
DROP POLICY IF EXISTS "Task owners and creators can update tasks" ON public.tasks;
DROP POLICY IF EXISTS "Task owners and group owners can delete tasks" ON public.tasks;

-- SELECT: Any group member can view tasks
CREATE POLICY "Users can view tasks in their groups" ON public.tasks
  FOR SELECT USING (
    group_id IN (SELECT get_user_group_ids((SELECT auth.uid())))
  );

-- INSERT: Any group member can create tasks
CREATE POLICY "Group members can create tasks" ON public.tasks
  FOR INSERT WITH CHECK (
    created_by = (SELECT auth.uid())
    AND group_id IN (SELECT get_user_group_ids((SELECT auth.uid())))
  );

-- UPDATE: Task owner (assignee), task creator, or group owner can update
CREATE POLICY "Task owners and creators can update tasks" ON public.tasks
  FOR UPDATE USING (
    owner_id = (SELECT auth.uid())
    OR created_by = (SELECT auth.uid())
    OR is_group_owner(group_id)
  );

-- DELETE: Task creator or group owner can delete (NOT assignee)
CREATE POLICY "Task creators and group owners can delete tasks" ON public.tasks
  FOR DELETE USING (
    created_by = (SELECT auth.uid())
    OR is_group_owner(group_id)
  );
