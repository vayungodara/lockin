-- LockIn New Features Schema
-- Run this in your Supabase SQL Editor

-- =====================================================
-- 1. RECURRING PACTS - Add columns to pacts table
-- =====================================================

ALTER TABLE pacts ADD COLUMN IF NOT EXISTS is_recurring BOOLEAN DEFAULT false;
ALTER TABLE pacts ADD COLUMN IF NOT EXISTS recurrence_type TEXT CHECK (recurrence_type IN ('daily', 'weekly', 'weekdays'));
ALTER TABLE pacts ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ;

-- =====================================================
-- 2. ACTIVITY REACTIONS - New table for emoji reactions
-- =====================================================

CREATE TABLE IF NOT EXISTS activity_reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  activity_id UUID NOT NULL REFERENCES activity_log(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reaction TEXT NOT NULL CHECK (reaction IN ('fire', 'clap', 'strong', 'yikes', 'love')),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(activity_id, user_id, reaction)
);

-- Enable RLS
ALTER TABLE activity_reactions ENABLE ROW LEVEL SECURITY;

-- Users can insert/delete their own reactions
CREATE POLICY "Users can add reactions" ON activity_reactions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove their reactions" ON activity_reactions
  FOR DELETE USING (auth.uid() = user_id);

-- Everyone can view reactions
CREATE POLICY "Anyone can view reactions" ON activity_reactions
  FOR SELECT USING (true);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_activity_reactions_activity_id ON activity_reactions(activity_id);
CREATE INDEX IF NOT EXISTS idx_activity_reactions_user_id ON activity_reactions(user_id);

-- =====================================================
-- 3. STREAKS - Uses existing pacts.completed_at column
-- No additional tables needed - calculated in app
-- =====================================================

-- =====================================================
-- 4. HEATMAP - Uses existing data from:
--    - pacts.completed_at
--    - focus_sessions.started_at
-- No additional tables needed
-- =====================================================

-- =====================================================
-- VERIFICATION QUERIES (run after applying schema)
-- =====================================================

-- Check pacts table has new columns:
-- SELECT column_name, data_type FROM information_schema.columns 
-- WHERE table_name = 'pacts' AND column_name IN ('is_recurring', 'recurrence_type', 'completed_at');

-- Check activity_reactions table exists:
-- SELECT * FROM activity_reactions LIMIT 1;
