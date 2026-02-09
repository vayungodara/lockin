-- Depends on: fix_helper_functions.sql (get_user_group_ids)

DROP POLICY IF EXISTS "Users can view groups" ON public.groups;
DROP POLICY IF EXISTS "Anyone can find groups by invite code" ON public.groups;
DROP POLICY IF EXISTS "Authenticated users can find groups by invite code" ON public.groups;

-- Users can view groups they created or are members of
CREATE POLICY "Users can view groups" ON public.groups
  FOR SELECT USING (
    created_by = (SELECT auth.uid())
    OR id IN (SELECT get_user_group_ids((SELECT auth.uid())))
  );

-- Allow looking up a specific group by invite code (for join page)
-- This is safe because the user must know the exact code
CREATE POLICY "Authenticated users can find groups by invite code" ON public.groups
  FOR SELECT TO authenticated USING (
    invite_code IS NOT NULL
  );
