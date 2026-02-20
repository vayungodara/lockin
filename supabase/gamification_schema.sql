-- =====================================================
-- LockIn Gamification Schema
-- Tracks: Streaks, XP, Levels, Achievements
-- Run this in Supabase SQL Editor (idempotent)
-- =====================================================

-- =====================================================
-- 1. PROFILES - Add gamification columns
-- =====================================================

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS current_streak INTEGER DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS longest_streak INTEGER DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS last_activity_date DATE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS total_xp INTEGER DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS level INTEGER DEFAULT 1;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS streak_freeze_used_this_week BOOLEAN DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS streak_freeze_last_reset TIMESTAMPTZ DEFAULT now();

-- =====================================================
-- 2. XP EVENTS - Log all XP awards
-- =====================================================

CREATE TABLE IF NOT EXISTS public.xp_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  xp_gained INTEGER NOT NULL DEFAULT 0,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.xp_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own xp events" ON public.xp_events;
CREATE POLICY "Users can view own xp events" ON public.xp_events
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_xp_events_user_id ON public.xp_events(user_id);

-- =====================================================
-- 3. USER ACHIEVEMENTS - Track unlocked achievements
-- =====================================================

CREATE TABLE IF NOT EXISTS public.user_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  achievement_key TEXT NOT NULL,
  unlocked_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, achievement_key)
);

ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own achievements" ON public.user_achievements;
CREATE POLICY "Users can view own achievements" ON public.user_achievements
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own achievements" ON public.user_achievements;
CREATE POLICY "Users can insert own achievements" ON public.user_achievements
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_user_achievements_user_id ON public.user_achievements(user_id);

-- =====================================================
-- 4. AWARD_XP - Atomic XP award function
-- =====================================================

CREATE OR REPLACE FUNCTION public.award_xp(
  p_user_id UUID,
  p_event_type TEXT,
  p_xp_amount INTEGER,
  p_metadata JSONB DEFAULT '{}'
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_new_total INTEGER;
  v_new_level INTEGER;
BEGIN
  INSERT INTO public.xp_events (user_id, event_type, xp_gained, metadata)
  VALUES (p_user_id, p_event_type, p_xp_amount, p_metadata);

  UPDATE public.profiles
  SET total_xp = COALESCE(total_xp, 0) + p_xp_amount
  WHERE id = p_user_id
  RETURNING total_xp INTO v_new_total;

  v_new_level := FLOOR(COALESCE(v_new_total, 0) / 100.0) + 1;

  UPDATE public.profiles
  SET level = v_new_level
  WHERE id = p_user_id;
END;
$function$;

-- =====================================================
-- SUCCESS! Gamification schema applied.
-- =====================================================
