-- =====================================================
-- LockIn Security Patch v2 - COMPLETE FIX
-- Run this ENTIRE script in Supabase SQL Editor
-- This replaces the previous security_patch.sql
-- =====================================================

-- =====================================================
-- STEP 1: Create a proper profiles TABLE (not view)
-- This avoids the SECURITY DEFINER warning on views
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
-- STEP 2: Sync existing users to profiles table
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
-- STEP 3: Create trigger to auto-sync new users
-- =====================================================

-- Function to handle new user signups
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
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
-- STEP 4: Create a backward-compatible view alias
-- This ensures existing code still works
-- =====================================================

CREATE OR REPLACE VIEW public.user_profiles AS
SELECT id, full_name, avatar_url, created_at
FROM public.profiles;

-- Grant access only to authenticated users
REVOKE ALL ON public.user_profiles FROM anon;
REVOKE ALL ON public.user_profiles FROM public;
GRANT SELECT ON public.user_profiles TO authenticated;

-- Also grant on the underlying table
REVOKE ALL ON public.profiles FROM anon;
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;

-- =====================================================
-- STEP 5: Fix activity_log RLS
-- =====================================================

DROP POLICY IF EXISTS "Users can view all activity" ON activity_log;
DROP POLICY IF EXISTS "Users can view relevant activity" ON activity_log;

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
-- STEP 6: Fix activity_reactions RLS
-- =====================================================

DROP POLICY IF EXISTS "Anyone can view reactions" ON activity_reactions;
DROP POLICY IF EXISTS "Users can view relevant reactions" ON activity_reactions;

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
-- VERIFICATION - Run these after to confirm
-- =====================================================

-- Check profiles table exists:
-- SELECT * FROM public.profiles LIMIT 5;

-- Check user_profiles view works:
-- SELECT * FROM public.user_profiles LIMIT 5;

-- Check no SECURITY DEFINER warning on view:
-- The view now queries public.profiles (with RLS), not auth.users directly

-- =====================================================
-- SUCCESS! Security issues resolved.
-- =====================================================
