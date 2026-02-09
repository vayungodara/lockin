-- Helper function: get_user_group_ids
-- Returns all group IDs that a user is a member of.
-- Referenced by fix_groups_policies.sql and task_permissions_fix.sql.

-- Already exists in production with param name 'uid'.
-- Kept here for reference / fresh deployments.
CREATE OR REPLACE FUNCTION get_user_group_ids(uid UUID)
RETURNS SETOF UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT group_id
  FROM group_members
  WHERE user_id = uid;
$$;
