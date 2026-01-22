-- =====================================================
-- LockIn Security Fixes - COMPLETE
-- Run this ENTIRE script in your Supabase SQL Editor
-- Date: January 2026
-- =====================================================

-- =====================================================
-- FIX 1: mark_overdue_pacts search_path vulnerability
-- This fixes the "role mutable search_path" warning
-- =====================================================

CREATE OR REPLACE FUNCTION public.mark_overdue_pacts()
RETURNS void
LANGUAGE sql
SECURITY INVOKER
SET search_path = pg_catalog, public, pg_temp
AS $$
  UPDATE public.pacts
  SET status = 'missed'
  WHERE user_id = auth.uid()
    AND status = 'active'
    AND deadline < now();
$$;

-- =====================================================
-- FIX 2: Create proper profiles TABLE (not view)
-- This avoids SECURITY DEFINER warnings on views
-- =====================================================

-- Drop the problematic view first
DROP VIEW IF EXISTS public.user_profiles;

-- Create a proper profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Profiles are viewable by authenticated users" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;

-- Everyone authenticated can view profiles (needed for activity feed)
CREATE POLICY "Profiles are viewable by authenticated users" 
  ON public.profiles FOR SELECT 
  TO authenticated 
  USING (true);

-- Users can only update their own profile
CREATE POLICY "Users can update own profile" 
  ON public.profiles FOR UPDATE 
  TO authenticated 
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Users can insert their own profile
CREATE POLICY "Users can insert own profile" 
  ON public.profiles FOR INSERT 
  TO authenticated 
  WITH CHECK (auth.uid() = id);

-- =====================================================
-- FIX 3: Sync existing users to profiles table
-- =====================================================

INSERT INTO public.profiles (id, full_name, avatar_url, created_at)
SELECT 
  id,
  COALESCE(raw_user_meta_data->>'full_name', raw_user_meta_data->>'name', 'User'),
  raw_user_meta_data->>'avatar_url',
  created_at
FROM auth.users
ON CONFLICT (id) DO UPDATE SET
  full_name = EXCLUDED.full_name,
  avatar_url = EXCLUDED.avatar_url,
  updated_at = NOW();

-- =====================================================
-- FIX 4: Auto-sync new users trigger
-- =====================================================

-- Function to handle new user signups (with secure search_path)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER 
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url, created_at)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', 'User'),
    NEW.raw_user_meta_data->>'avatar_url',
    NEW.created_at
  )
  ON CONFLICT (id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    avatar_url = EXCLUDED.avatar_url,
    updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Create trigger on auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT OR UPDATE ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =====================================================
-- FIX 5: Backward-compatible user_profiles view
-- =====================================================

CREATE OR REPLACE VIEW public.user_profiles AS
SELECT id, full_name, avatar_url, created_at
FROM public.profiles;

-- Grant access only to authenticated users (NO anonymous access)
REVOKE ALL ON public.user_profiles FROM anon;
REVOKE ALL ON public.user_profiles FROM public;
GRANT SELECT ON public.user_profiles TO authenticated;

-- Also grant on the underlying table
REVOKE ALL ON public.profiles FROM anon;
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;

-- =====================================================
-- FIX 6: Secure activity_log RLS (remove USING true)
-- =====================================================

-- Drop insecure policies
DROP POLICY IF EXISTS "Users can view all activity" ON activity_log;
DROP POLICY IF EXISTS "Users can view relevant activity" ON activity_log;

-- New secure policy: Users can see their own + group activities only
CREATE POLICY "Users can view relevant activity" ON activity_log
  FOR SELECT 
  TO authenticated
  USING (
    auth.uid() = user_id 
    OR 
    group_id IN (
      SELECT group_id FROM group_members WHERE user_id = auth.uid()
    )
  );

-- =====================================================
-- FIX 7: Secure activity_reactions RLS
-- =====================================================

-- Drop insecure policies
DROP POLICY IF EXISTS "Anyone can view reactions" ON activity_reactions;
DROP POLICY IF EXISTS "Users can view relevant reactions" ON activity_reactions;

-- New secure policy: Users can see reactions on activities they can see
CREATE POLICY "Users can view relevant reactions" ON activity_reactions
  FOR SELECT 
  TO authenticated
  USING (
    activity_id IN (
      SELECT id FROM activity_log WHERE
        auth.uid() = user_id 
        OR 
        group_id IN (
          SELECT group_id FROM group_members WHERE user_id = auth.uid()
        )
    )
  );

-- =====================================================
-- FIX 8: Ensure focus_sessions update policy exists
-- =====================================================

DROP POLICY IF EXISTS "Users can update own focus sessions" ON focus_sessions;

CREATE POLICY "Users can update own focus sessions" ON focus_sessions
  FOR UPDATE 
  TO authenticated
  USING (auth.uid() = user_id);

-- =====================================================
-- VERIFICATION QUERIES (run after to confirm)
-- =====================================================

-- Check search_path is set on mark_overdue_pacts:
-- SELECT proconfig FROM pg_proc WHERE proname = 'mark_overdue_pacts';
-- Should show: {search_path=pg_catalog, public, pg_temp}

-- Check profiles table exists:
-- SELECT * FROM public.profiles LIMIT 5;

-- Check activity_log policies are secure:
-- SELECT policyname, qual FROM pg_policies WHERE tablename = 'activity_log';

-- =====================================================
-- SUCCESS! All security fixes applied.
-- =====================================================
