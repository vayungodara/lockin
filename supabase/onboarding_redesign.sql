-- Onboarding redesign: First Week Challenge
-- Run in Supabase SQL Editor

-- Add new columns to user_onboarding
ALTER TABLE public.user_onboarding
  ADD COLUMN IF NOT EXISTS has_built_momentum BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS onboarding_completed_at TIMESTAMPTZ DEFAULT NULL;

-- One-time migration: reset dismissed state so existing users see the new checklist
-- Only resets users who dismissed the old modal but never completed onboarding
UPDATE public.user_onboarding
  SET onboarding_dismissed = false
  WHERE onboarding_dismissed = true
    AND onboarding_completed_at IS NULL;

-- RLS policies for user_onboarding (safe — checks existence first)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_onboarding' AND policyname = 'Users can view own onboarding') THEN
    CREATE POLICY "Users can view own onboarding" ON public.user_onboarding FOR SELECT USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_onboarding' AND policyname = 'Users can update own onboarding') THEN
    CREATE POLICY "Users can update own onboarding" ON public.user_onboarding FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_onboarding' AND policyname = 'Users can insert own onboarding') THEN
    CREATE POLICY "Users can insert own onboarding" ON public.user_onboarding FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- Prevent double XP awards for onboarding steps
CREATE UNIQUE INDEX IF NOT EXISTS idx_xp_events_onboarding_unique
  ON public.xp_events (user_id, event_type)
  WHERE event_type LIKE 'onboarding_%';
