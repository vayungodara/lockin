-- Allow the browser client to read active witness focus sessions for users
-- who share at least one group with the authenticated viewer.

CREATE OR REPLACE FUNCTION public.has_shared_group_with_auth_user(p_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.group_members viewer
    JOIN public.group_members peer ON peer.group_id = viewer.group_id
    WHERE viewer.user_id = auth.uid()
      AND peer.user_id = p_user_id
  );
$$;

REVOKE ALL ON FUNCTION public.has_shared_group_with_auth_user(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.has_shared_group_with_auth_user(uuid) TO authenticated;

DROP POLICY IF EXISTS "focus_sessions_select_shared_group" ON public.focus_sessions;

CREATE POLICY "focus_sessions_select_shared_group" ON public.focus_sessions
  FOR SELECT TO authenticated
  USING (
    user_id = (SELECT auth.uid())
    OR public.has_shared_group_with_auth_user(user_id)
  );
