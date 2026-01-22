-- =====================================================
-- LockIn Security Patch - Run BEFORE Launch
-- Run this ENTIRE script in your Supabase SQL Editor
-- =====================================================

-- =====================================================
-- 1. FIX user_profiles VIEW - Remove email, restrict to authenticated
-- =====================================================

-- Drop existing view and recreate without email
DROP VIEW IF EXISTS public.user_profiles;

CREATE VIEW public.user_profiles AS
SELECT 
  id,
  COALESCE(raw_user_meta_data->>'full_name', raw_user_meta_data->>'name', 'User') as full_name,
  raw_user_meta_data->>'avatar_url' as avatar_url,
  created_at
FROM auth.users;

-- Revoke access from anonymous users (security fix)
REVOKE ALL ON public.user_profiles FROM anon;

-- Only authenticated users can view profiles
GRANT SELECT ON public.user_profiles TO authenticated;

-- =====================================================
-- 2. FIX activity_log RLS - Restrict visibility
-- =====================================================

-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Users can view all activity" ON activity_log;
DROP POLICY IF EXISTS "Users can view relevant activity" ON activity_log;

-- New policy: Users can see their own activity + activity from groups they belong to
CREATE POLICY "Users can view relevant activity" ON activity_log
  FOR SELECT USING (
    auth.uid() = user_id 
    OR 
    group_id IN (
      SELECT group_id FROM group_members WHERE user_id = auth.uid()
    )
    OR
    group_id IS NULL  -- Public personal pacts (no group)
  );

-- =====================================================
-- 3. FIX activity_reactions RLS - Match activity_log visibility
-- =====================================================

-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Anyone can view reactions" ON activity_reactions;
DROP POLICY IF EXISTS "Users can view relevant reactions" ON activity_reactions;

-- New policy: Users can see reactions on activities they can see
CREATE POLICY "Users can view relevant reactions" ON activity_reactions
  FOR SELECT USING (
    activity_id IN (
      SELECT id FROM activity_log WHERE
        auth.uid() = user_id 
        OR 
        group_id IN (
          SELECT group_id FROM group_members WHERE user_id = auth.uid()
        )
        OR
        group_id IS NULL
    )
  );

-- =====================================================
-- VERIFICATION QUERIES
-- Run these after applying to confirm success
-- =====================================================

-- Check user_profiles no longer has email column:
-- SELECT column_name FROM information_schema.columns 
-- WHERE table_name = 'user_profiles';

-- Check activity_log policies:
-- SELECT policyname, cmd, qual FROM pg_policies 
-- WHERE tablename = 'activity_log';

-- Test as anonymous user (should fail):
-- SET ROLE anon;
-- SELECT * FROM user_profiles LIMIT 1;
-- RESET ROLE;

-- =====================================================
-- SUCCESS! Security patch applied.
-- =====================================================
