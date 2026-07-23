-- LockIn — Security Hardening
-- Reviewed against LIVE DB grants + pg_policies (project muhklpbzdecfscrrwhdr) on 2026-05-27.
-- Idempotent: every change is existence-guarded and safe to re-run.
--
-- Clears these Supabase security-advisor findings:
--   * 0028 anon_security_definer_function_executable   (5 funcs) -> FULLY CLEARED
--   * 0011 function_search_path_mutable                (1 func)  -> CLEARED
--   * 0029 authenticated_security_definer_function_executable    -> CLEARED for the 3 UNUSED funcs;
--          the other 9 are INTENTIONALLY authenticated-callable (see footer) and left as-is.
--
-- MANUAL (not SQL): enable Leaked Password Protection (HaveIBeenPwned) at
--   Supabase Dashboard > Authentication > Providers > Password.
-- SEPARATE FINDING (out of scope here): public bucket "screenshots" broad SELECT policy (lint 0025).
--
-- CRITICAL CORRECTION vs. the auto-drafted version:
--   get_user_group_ids / is_group_owner / has_shared_group_with_auth_user are referenced by
--   RLS policies on groups, group_members, tasks, focus_sessions for the `authenticated` role.
--   A function called inside an RLS policy expression requires EXECUTE for the *querying* role
--   (SECURITY DEFINER governs the body's context, NOT the caller's right to invoke). Revoking
--   authenticated EXECUTE from these would make those tables unreadable/unwritable for every
--   signed-in user. Therefore authenticated is PRESERVED on them; only anon is removed.

-- ===========================================================================
-- 1. anon-callable SECURITY DEFINER functions (advisor lint 0028) -> drop anon + PUBLIC.
--    Each is either an authenticated client RPC or an authenticated RLS helper; authenticated kept.
-- ===========================================================================
DO $hardening$
BEGIN
  -- award_streak_freeze -- client RPC: lib/streaks-advanced.js:232
  IF to_regprocedure('public.award_streak_freeze(uuid, integer, integer)') IS NOT NULL THEN
    REVOKE EXECUTE ON FUNCTION public.award_streak_freeze(uuid, integer, integer) FROM anon, PUBLIC;
    GRANT  EXECUTE ON FUNCTION public.award_streak_freeze(uuid, integer, integer) TO authenticated;
  END IF;

  -- consume_streak_freeze -- client RPC: lib/streaks-advanced.js:130
  IF to_regprocedure('public.consume_streak_freeze(uuid, date)') IS NOT NULL THEN
    REVOKE EXECUTE ON FUNCTION public.consume_streak_freeze(uuid, date) FROM anon, PUBLIC;
    GRANT  EXECUTE ON FUNCTION public.consume_streak_freeze(uuid, date) TO authenticated;
  END IF;

  -- notify_partner -- client RPC: lib/partnerships.js:279
  IF to_regprocedure('public.notify_partner(uuid[], text, text, text, jsonb)') IS NOT NULL THEN
    REVOKE EXECUTE ON FUNCTION public.notify_partner(uuid[], text, text, text, jsonb) FROM anon, PUBLIC;
    GRANT  EXECUTE ON FUNCTION public.notify_partner(uuid[], text, text, text, jsonb) TO authenticated;
  END IF;

  -- update_streak_activity -- client RPC: lib/streaks-advanced.js:292
  IF to_regprocedure('public.update_streak_activity(uuid, integer, integer, date)') IS NOT NULL THEN
    REVOKE EXECUTE ON FUNCTION public.update_streak_activity(uuid, integer, integer, date) FROM anon, PUBLIC;
    GRANT  EXECUTE ON FUNCTION public.update_streak_activity(uuid, integer, integer, date) TO authenticated;
  END IF;

  -- has_shared_group_with_auth_user -- NOT a client RPC; used by RLS policy
  -- focus_sessions_select_shared_group (role authenticated). Remove anon only; KEEP authenticated.
  IF to_regprocedure('public.has_shared_group_with_auth_user(uuid)') IS NOT NULL THEN
    REVOKE EXECUTE ON FUNCTION public.has_shared_group_with_auth_user(uuid) FROM anon;
    GRANT  EXECUTE ON FUNCTION public.has_shared_group_with_auth_user(uuid) TO authenticated;
  END IF;
END;
$hardening$;

-- ===========================================================================
-- 2. Mutable search_path (advisor lint 0011).
--    Live body verified: only `NEW.<col> := OLD.<col>;` assignments + RETURN NEW.
--    No table/function references, so an empty search_path resolves nothing and is safe.
-- ===========================================================================
DO $hardening$
BEGIN
  IF to_regprocedure('public.protect_gamification_columns()') IS NOT NULL THEN
    ALTER FUNCTION public.protect_gamification_columns() SET search_path = '';
  END IF;
END;
$hardening$;

-- ===========================================================================
-- 3. Unused SECURITY DEFINER functions (advisor lint 0029) -> revoke every caller grant.
--    Verified zero references across web (lib/app/components), API routes, cron, iOS,
--    other DB functions, RLS policies, and triggers. Locking them down closes a
--    notification-spoofing / griefing vector with no app impact.
--    (service_role keeps EXECUTE for any future server-side use.)
-- ===========================================================================
DO $hardening$
BEGIN
  -- create_notification -- unused; open RPC would let any signed-in user forge notifications for others.
  IF to_regprocedure('public.create_notification(uuid, text, text, text, jsonb)') IS NOT NULL THEN
    REVOKE EXECUTE ON FUNCTION public.create_notification(uuid, text, text, text, jsonb) FROM authenticated, anon, PUBLIC;
  END IF;

  -- mark_all_notifications_read -- unused; open RPC would let any signed-in user clear others' notifications.
  IF to_regprocedure('public.mark_all_notifications_read(uuid)') IS NOT NULL THEN
    REVOKE EXECUTE ON FUNCTION public.mark_all_notifications_read(uuid) FROM authenticated, anon, PUBLIC;
  END IF;

  -- can_nudge_user -- unused read-only check.
  IF to_regprocedure('public.can_nudge_user(uuid)') IS NOT NULL THEN
    REVOKE EXECUTE ON FUNCTION public.can_nudge_user(uuid) FROM authenticated, anon, PUBLIC;
  END IF;
END;
$hardening$;

-- ===========================================================================
-- INTENTIONALLY LEFT UNCHANGED (advisor lint 0029 will keep listing these -- expected, not a regression):
--   * award_xp, get_group_by_invite_code                                  -- authenticated client RPCs
--   * award_streak_freeze, consume_streak_freeze, notify_partner,
--     update_streak_activity                                              -- authenticated client RPCs (kept in step 1)
--   * get_user_group_ids, is_group_owner, has_shared_group_with_auth_user -- authenticated RLS helpers (policies need EXECUTE)
-- Removing authenticated EXECUTE from any of these breaks the app. Properly silencing 0029 for the
-- RLS helpers would mean relocating them to a non-API schema and rewriting dependent policies --
-- deliberately deferred as higher-risk than the marginal benefit.
-- ===========================================================================
