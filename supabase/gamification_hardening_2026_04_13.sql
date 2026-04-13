-- Gamification hardening (applied to production 2026-04-13 via Supabase migrations)
-- These were previously missing from /supabase/ causing reviewer feedback
-- that the client code called RPCs with no source-of-truth in the repo.
--
-- Includes:
--   - protect_gamification_columns trigger bypass pattern (app.skip_gamification_trigger)
--   - award_xp with allowlist (pact/focus/task/streak/onboarding + streak_freeze_milestone_*)
--   - update_streak_activity(uuid, int, int, date)    — streak writes via SECURITY DEFINER
--   - consume_streak_freeze(uuid, date)               — decrement freezes + mark activity
--   - award_streak_freeze(uuid, int, int)             — milestone freeze reward
--   - notify_partner(uuid[], text, text, text, jsonb) — bypass WITH CHECK(auth.uid() = user_id)
--                                                       for recipients in accepted partnerships

-- 1. Trigger bypass — the `protect_gamification_columns` trigger fires on
-- every UPDATE to the profiles table. SECURITY DEFINER functions set
-- `app.skip_gamification_trigger = true` (transaction-local) before their
-- UPDATEs so the trigger allows them through.
DROP TRIGGER IF EXISTS protect_gamification_cols ON public.profiles;

CREATE TRIGGER protect_gamification_cols
BEFORE UPDATE ON public.profiles
FOR EACH ROW
WHEN (
  current_setting('app.skip_gamification_trigger', true) IS DISTINCT FROM 'true'
  AND current_setting('role'::text, true) IS DISTINCT FROM 'service_role'::text
)
EXECUTE FUNCTION public.protect_gamification_columns();

-- 2. award_xp — the sole XP write path. Allowlists event types and caps amount.
CREATE OR REPLACE FUNCTION public.award_xp(
  p_user_id uuid,
  p_event_type text,
  p_xp_amount integer,
  p_metadata jsonb DEFAULT NULL::jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
DECLARE
  v_new_total INTEGER;
  v_new_level INTEGER;
BEGIN
  IF auth.uid() IS NULL OR auth.uid() != p_user_id THEN
    RAISE EXCEPTION 'Unauthorized: caller must match target user';
  END IF;

  IF p_xp_amount > 50 OR p_xp_amount < -50 THEN
    RAISE EXCEPTION 'Invalid XP amount: must be between -50 and 50';
  END IF;

  IF p_event_type NOT IN (
    'pact_completed', 'pact_completed_early', 'pact_completed_reverted',
    'focus_session_completed', 'task_completed', 'streak_day',
    'comment_posted', 'reaction_given',
    'onboarding_pact', 'onboarding_focus', 'onboarding_group', 'onboarding_momentum'
  ) AND p_event_type NOT LIKE 'streak_freeze_milestone_%' THEN
    RAISE EXCEPTION 'Invalid event type: %', p_event_type;
  END IF;

  INSERT INTO public.xp_events (user_id, event_type, xp_gained, metadata)
  VALUES (p_user_id, p_event_type, p_xp_amount, p_metadata);

  PERFORM set_config('app.skip_gamification_trigger', 'true', true);

  UPDATE public.profiles
  SET total_xp = GREATEST(0, COALESCE(total_xp, 0) + p_xp_amount)
  WHERE id = p_user_id
  RETURNING total_xp INTO v_new_total;

  v_new_level := FLOOR(COALESCE(v_new_total, 0) / 100.0) + 1;

  UPDATE public.profiles
  SET level = v_new_level
  WHERE id = p_user_id;
END;
$$;

-- 3. update_streak_activity — write the streak columns (previously blocked by
-- the protect_gamification_columns trigger on direct client UPDATEs).
CREATE OR REPLACE FUNCTION public.update_streak_activity(
  p_user_id uuid,
  p_current_streak integer,
  p_longest_streak integer,
  p_last_activity_date date
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
BEGIN
  IF auth.uid() IS NULL OR auth.uid() != p_user_id THEN
    RAISE EXCEPTION 'Unauthorized: caller must match target user';
  END IF;

  IF p_current_streak < 0 OR p_current_streak > 10000 THEN
    RAISE EXCEPTION 'Invalid current_streak';
  END IF;

  IF p_longest_streak < 0 OR p_longest_streak > 10000 THEN
    RAISE EXCEPTION 'Invalid longest_streak';
  END IF;

  IF p_last_activity_date > CURRENT_DATE + INTERVAL '1 day' THEN
    RAISE EXCEPTION 'last_activity_date cannot be in the future';
  END IF;

  PERFORM set_config('app.skip_gamification_trigger', 'true', true);

  UPDATE public.profiles
  SET current_streak = p_current_streak,
      longest_streak = GREATEST(COALESCE(longest_streak, 0), p_longest_streak),
      last_activity_date = p_last_activity_date
  WHERE id = p_user_id;
END;
$$;

-- 4. consume_streak_freeze — decrement pool, stamp cooldown, save today's activity.
CREATE OR REPLACE FUNCTION public.consume_streak_freeze(
  p_user_id uuid,
  p_today date DEFAULT CURRENT_DATE
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
DECLARE
  v_remaining INTEGER;
BEGIN
  IF auth.uid() IS NULL OR auth.uid() != p_user_id THEN
    RAISE EXCEPTION 'Unauthorized: caller must match target user';
  END IF;

  IF p_today > CURRENT_DATE + INTERVAL '1 day' THEN
    RAISE EXCEPTION 'today cannot be in the future';
  END IF;

  SELECT streak_freezes_remaining INTO v_remaining
  FROM public.profiles WHERE id = p_user_id;

  IF v_remaining IS NULL OR v_remaining <= 0 THEN
    RETURN jsonb_build_object('success', false, 'error', 'No freezes available');
  END IF;

  PERFORM set_config('app.skip_gamification_trigger', 'true', true);

  UPDATE public.profiles
  SET streak_freezes_remaining = streak_freezes_remaining - 1,
      streak_freeze_last_used = NOW(),
      streak_freeze_used_this_week = true,
      last_activity_date = p_today
  WHERE id = p_user_id;

  RETURN jsonb_build_object('success', true, 'freezesRemaining', v_remaining - 1);
END;
$$;

-- 5. award_streak_freeze — milestone reward (7/14/30-day streaks).
CREATE OR REPLACE FUNCTION public.award_streak_freeze(
  p_user_id uuid,
  p_amount integer DEFAULT 1,
  p_max_capacity integer DEFAULT 3
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
DECLARE
  v_new_remaining INTEGER;
BEGIN
  IF auth.uid() IS NULL OR auth.uid() != p_user_id THEN
    RAISE EXCEPTION 'Unauthorized: caller must match target user';
  END IF;

  IF p_amount <= 0 OR p_amount > 3 THEN
    RAISE EXCEPTION 'Invalid award amount';
  END IF;

  IF p_max_capacity < 1 OR p_max_capacity > 10 THEN
    RAISE EXCEPTION 'Invalid max capacity';
  END IF;

  PERFORM set_config('app.skip_gamification_trigger', 'true', true);

  UPDATE public.profiles
  SET streak_freezes_remaining = LEAST(
    p_max_capacity,
    COALESCE(streak_freezes_remaining, 0) + p_amount
  )
  WHERE id = p_user_id
  RETURNING streak_freezes_remaining INTO v_new_remaining;

  RETURN jsonb_build_object('success', true, 'freezesRemaining', v_new_remaining);
END;
$$;

-- 6. notify_partner — send notifications to validated partnership recipients,
-- bypassing the notifications WITH CHECK(auth.uid() = user_id) policy.
CREATE OR REPLACE FUNCTION public.notify_partner(
  p_recipients uuid[],
  p_type text,
  p_title text,
  p_message text,
  p_metadata jsonb DEFAULT '{}'::jsonb
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
DECLARE
  v_caller uuid;
  v_recipient uuid;
  v_valid_recipients uuid[] := ARRAY[]::uuid[];
  v_inserted integer := 0;
BEGIN
  v_caller := auth.uid();
  IF v_caller IS NULL THEN
    RAISE EXCEPTION 'Unauthorized: no active session';
  END IF;

  IF p_type IS NULL OR length(p_type) = 0 OR length(p_type) > 100 THEN
    RAISE EXCEPTION 'Invalid notification type';
  END IF;

  IF p_title IS NULL OR length(p_title) > 200 THEN
    RAISE EXCEPTION 'Invalid title';
  END IF;

  FOREACH v_recipient IN ARRAY p_recipients LOOP
    IF EXISTS (
      SELECT 1 FROM public.accountability_partnerships ap
      WHERE ap.status = 'accepted'
        AND ((ap.user1_id = v_caller AND ap.user2_id = v_recipient)
          OR (ap.user2_id = v_caller AND ap.user1_id = v_recipient))
    ) THEN
      v_valid_recipients := v_valid_recipients || v_recipient;
    END IF;
  END LOOP;

  IF array_length(v_valid_recipients, 1) IS NULL THEN
    RETURN 0;
  END IF;

  INSERT INTO public.notifications (user_id, type, title, message, metadata)
  SELECT unnest(v_valid_recipients), p_type, p_title, p_message, p_metadata;

  GET DIAGNOSTICS v_inserted = ROW_COUNT;
  RETURN v_inserted;
END;
$$;

-- Grants — keep executable by the authenticated role; RLS and auth checks
-- inside each function re-validate the caller.
GRANT EXECUTE ON FUNCTION public.award_xp(uuid, text, integer, jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_streak_activity(uuid, integer, integer, date) TO authenticated;
GRANT EXECUTE ON FUNCTION public.consume_streak_freeze(uuid, date) TO authenticated;
GRANT EXECUTE ON FUNCTION public.award_streak_freeze(uuid, integer, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.notify_partner(uuid[], text, text, text, jsonb) TO authenticated;
