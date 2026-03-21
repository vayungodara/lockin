-- Streak Freeze Redesign: Pool-Based System
-- Instead of 1 free freeze per week forever, freezes must be EARNED.
-- Everyone starts with 2, earns more at streak milestones (7, 14, 30 days).
-- 3-day cooldown between uses. Max pool size: 5.

-- Add new columns for pool-based freeze system
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS streak_freezes_remaining INTEGER DEFAULT 2,
  ADD COLUMN IF NOT EXISTS streak_freeze_last_used TIMESTAMPTZ;

-- Set existing users to 2 freezes if column was just created
UPDATE profiles
SET streak_freezes_remaining = 2
WHERE streak_freezes_remaining IS NULL;

-- Add a constraint so freezes can't go negative or above 5
ALTER TABLE profiles
  ADD CONSTRAINT streak_freezes_range
  CHECK (streak_freezes_remaining >= 0 AND streak_freezes_remaining <= 5);

-- Note: Old columns (streak_freeze_used_this_week, streak_freeze_last_reset)
-- are kept for backward compatibility. The app code now uses the new columns.
-- They can be dropped in a future migration once the new system is stable.
