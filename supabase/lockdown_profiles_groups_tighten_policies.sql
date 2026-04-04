-- ============================================================
-- SECURITY LOCKDOWN: Profiles, groups, and all policies
-- Applied 2026-03-29
-- ============================================================

-- FIX 1: PROFILES — restrict to self + group members + partners
DROP POLICY "Profiles are viewable by authenticated users" ON profiles;
CREATE POLICY "Users can view relevant profiles" ON profiles
  FOR SELECT TO authenticated
  USING (
    id = (SELECT auth.uid())
    OR id IN (
      SELECT gm2.user_id FROM group_members gm1
      JOIN group_members gm2 ON gm1.group_id = gm2.group_id
      WHERE gm1.user_id = (SELECT auth.uid())
    )
    OR id IN (
      SELECT CASE
        WHEN user1_id = (SELECT auth.uid()) THEN user2_id
        ELSE user1_id
      END
      FROM accountability_partnerships
      WHERE user1_id = (SELECT auth.uid()) OR user2_id = (SELECT auth.uid())
    )
  );

-- FIX 2: GROUPS — remove broad invite_code visibility
DROP POLICY "Users can view groups" ON groups;
CREATE POLICY "Users can view own and member groups" ON groups
  FOR SELECT TO authenticated
  USING (
    created_by = (SELECT auth.uid())
    OR id IN (SELECT get_user_group_ids((SELECT auth.uid())))
  );

-- Secure RPC for /join/[code] invite flow
CREATE OR REPLACE FUNCTION public.get_group_by_invite_code(p_invite_code text)
RETURNS TABLE(id uuid, name text, description text, created_by uuid, invite_code text, created_at timestamptz)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Unauthorized: must be authenticated';
  END IF;
  IF length(p_invite_code) > 20 THEN
    RAISE EXCEPTION 'Invalid invite code';
  END IF;
  RETURN QUERY
  SELECT g.id, g.name, g.description, g.created_by, g.invite_code, g.created_at
  FROM public.groups g
  WHERE g.invite_code = p_invite_code
  LIMIT 1;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.get_group_by_invite_code(text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_group_by_invite_code(text) FROM public;
GRANT EXECUTE ON FUNCTION public.get_group_by_invite_code(text) TO authenticated;

-- FIX 3: All remaining policies switched from {public} to {authenticated}
-- (50 policies total — see migration history for full DDL)
