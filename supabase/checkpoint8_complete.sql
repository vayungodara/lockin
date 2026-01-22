-- =====================================================
-- LockIn Checkpoint 8 - Complete Schema Update
-- Run this ENTIRE script in your Supabase SQL Editor
-- =====================================================

-- =====================================================
-- 1. RECURRING PACTS - Add columns to pacts table
-- =====================================================

-- Add is_recurring column
ALTER TABLE pacts ADD COLUMN IF NOT EXISTS is_recurring BOOLEAN DEFAULT false;

-- Add recurrence_type column with validation
ALTER TABLE pacts ADD COLUMN IF NOT EXISTS recurrence_type TEXT;

-- Add check constraint for recurrence_type (if not exists)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'pacts_recurrence_type_check'
  ) THEN
    ALTER TABLE pacts ADD CONSTRAINT pacts_recurrence_type_check 
      CHECK (recurrence_type IS NULL OR recurrence_type IN ('daily', 'weekly', 'weekdays'));
  END IF;
END $$;

-- Add completed_at column for tracking when pacts were completed
ALTER TABLE pacts ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ;

-- =====================================================
-- 2. ACTIVITY REACTIONS - New table for emoji reactions
-- =====================================================

-- Create the activity_reactions table
CREATE TABLE IF NOT EXISTS activity_reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  activity_id UUID NOT NULL REFERENCES activity_log(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reaction TEXT NOT NULL CHECK (reaction IN ('fire', 'clap', 'strong', 'yikes', 'love')),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(activity_id, user_id, reaction)
);

-- Enable RLS on activity_reactions
ALTER TABLE activity_reactions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to avoid conflicts on re-run)
DROP POLICY IF EXISTS "Users can add reactions" ON activity_reactions;
DROP POLICY IF EXISTS "Users can remove their reactions" ON activity_reactions;
DROP POLICY IF EXISTS "Anyone can view reactions" ON activity_reactions;

-- Users can insert their own reactions
CREATE POLICY "Users can add reactions" ON activity_reactions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can delete their own reactions
CREATE POLICY "Users can remove their reactions" ON activity_reactions
  FOR DELETE USING (auth.uid() = user_id);

-- Users can view reactions on activities they can access (SECURE)
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

-- Create indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_activity_reactions_activity_id ON activity_reactions(activity_id);
CREATE INDEX IF NOT EXISTS idx_activity_reactions_user_id ON activity_reactions(user_id);

-- =====================================================
-- 3. VERIFY focus_sessions table exists (needed for Heatmap)
-- =====================================================

-- Create focus_sessions table if it doesn't exist
CREATE TABLE IF NOT EXISTS focus_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  duration_minutes INTEGER NOT NULL DEFAULT 25,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ended_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on focus_sessions if not already enabled
ALTER TABLE focus_sessions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own focus sessions" ON focus_sessions;
DROP POLICY IF EXISTS "Users can insert own focus sessions" ON focus_sessions;

-- Users can view their own focus sessions
CREATE POLICY "Users can view own focus sessions" ON focus_sessions
  FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own focus sessions
CREATE POLICY "Users can insert own focus sessions" ON focus_sessions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_focus_sessions_user_id ON focus_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_focus_sessions_started_at ON focus_sessions(started_at);

-- =====================================================
-- 4. VERIFY activity_log table exists (needed for Reactions)
-- =====================================================

-- Create activity_log table if it doesn't exist
CREATE TABLE IF NOT EXISTS activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  group_id UUID REFERENCES groups(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on activity_log if not already enabled
ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view all activity" ON activity_log;
DROP POLICY IF EXISTS "Users can insert own activity" ON activity_log;

-- Users can view their own activity + group activities (SECURE)
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

-- Users can insert their own activity
CREATE POLICY "Users can insert own activity" ON activity_log
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_activity_log_user_id ON activity_log(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_log_group_id ON activity_log(group_id);
CREATE INDEX IF NOT EXISTS idx_activity_log_created_at ON activity_log(created_at DESC);

-- =====================================================
-- VERIFICATION QUERIES
-- Run these after applying schema to confirm success
-- =====================================================

-- Check pacts table has new columns:
-- SELECT column_name, data_type, is_nullable 
-- FROM information_schema.columns 
-- WHERE table_name = 'pacts' 
-- AND column_name IN ('is_recurring', 'recurrence_type', 'completed_at');

-- Check activity_reactions table exists:
-- SELECT table_name FROM information_schema.tables 
-- WHERE table_name = 'activity_reactions';

-- Check focus_sessions table exists:
-- SELECT table_name FROM information_schema.tables 
-- WHERE table_name = 'focus_sessions';

-- List all RLS policies on activity_reactions:
-- SELECT policyname, cmd FROM pg_policies 
-- WHERE tablename = 'activity_reactions';

-- =====================================================
-- SUCCESS! Checkpoint 8 schema is now complete.
-- =====================================================
