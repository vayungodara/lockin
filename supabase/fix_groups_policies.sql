DROP POLICY IF EXISTS "Users can view groups" ON public.groups;
DROP POLICY IF EXISTS "Anyone can find groups by invite code" ON public.groups;
DROP POLICY IF EXISTS "Authenticated users can find groups by invite code" ON public.groups;

CREATE POLICY "Users can view groups" ON public.groups
  FOR SELECT USING (
    created_by = (SELECT auth.uid())
    OR id IN (SELECT get_user_group_ids((SELECT auth.uid())))
    OR invite_code IS NOT NULL
  );
