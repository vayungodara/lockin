# Onboarding Redesign: First Week Challenge

**Date:** 2026-03-23
**Status:** Draft
**Author:** Vayun + Claude

## Problem

The current onboarding is a 3-step modal wizard (`OnboardingModal.js`) with a critical bug: **no code anywhere marks steps as complete**. The `has_created_pact`, `has_joined_group`, and `has_used_focus_timer` fields in `user_onboarding` are never set to `true`. Users either get stuck in an infinite loop (modal reopens at Step 0 every page load) or dismiss permanently with no way to reopen.

## Solution

Replace the modal wizard with a persistent **"First Week Challenge" card** on the dashboard. Frame onboarding as a gamified quest with XP rewards. Steps are auto-detected from real user actions (no manual "mark done" buttons). The final step requires a 2-day streak, forcing a return visit — the #1 predictor of long-term retention.

## Design

### Card Placement

- Top of dashboard, above `DailySummaryCard`
- Component: `OnboardingChecklist.js` + `OnboardingChecklist.module.css`
- Rendered in `DashboardClient.js` — only when `onboarding_completed_at IS NULL`
- Card is not dismissible until at least 1 step is done (soft persistence)
- If `onboarding_completed_at` is set, skip rendering entirely (never show to fully-complete users)

### Steps

| # | Title | Description | XP | Detection |
|---|-------|-------------|-----|-----------|
| 1 | Make a Pact | Create your first commitment | +25 | `pacts` table has any row for user |
| 2 | Lock In | Complete a focus session | +30 | `focus_sessions` has row with `ended_at IS NOT NULL` for user |
| 3 | Join the Squad | Join or create a group | +20 | `group_members` has row for user |
| 4 | Build Momentum | Hit a 2-day streak | +50 | `profiles.current_streak >= 2` |

Steps can be completed in any order. Step 4 is the retention hook — requires coming back the next day.

### Visual Design

- Card background: `var(--surface-1)` with subtle accent gradient left border (3px, `var(--accent-primary)`)
- Header: "Your First Week Challenge" with a circular progress ring (SVG `<circle>` using `stroke-dasharray`/`stroke-dashoffset`, 0/4 to 4/4)
- Each step row:
  - Incomplete: icon + title + description + action button (links to relevant page/modal)
  - Complete: checkmark icon + title (muted) + "+25 XP" badge with `celebrationBounce` animation
- Action buttons: "Create a Pact" calls `requestCreatePact()` (existing event bridge), "Start Focusing" navigates to `/dashboard/focus`, "Browse Groups" navigates to `/dashboard/groups`, Step 4 has no action button (auto-detected)
- Completing a step: the row animates with `fadeInScale`, XP badge appears, confetti micro-burst via `lib/confetti.js`
- All 4 complete: full confetti celebration, "Achievement Unlocked: Onboarding Complete" toast (new achievement `onboarding_complete`, NOT repurposing `first_pact`), card transforms to success message ("You're all set! LockIn is yours."), fades out after 5 seconds
- Fade-out timeout: use `useRef` + `clearTimeout` in `useEffect` cleanup to prevent setState on unmounted component
- Respects `prefersReducedMotion()` — skip animations

### Data Model Changes

**Migration file: `supabase/onboarding_redesign.sql`**

```sql
-- Add new columns to user_onboarding
ALTER TABLE public.user_onboarding
  ADD COLUMN IF NOT EXISTS has_built_momentum BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS onboarding_completed_at TIMESTAMPTZ DEFAULT NULL;

-- Reset onboarding_dismissed for all users (no longer used for visibility)
-- Old dismissed users will see the new checklist, which is intentional
UPDATE public.user_onboarding SET onboarding_dismissed = false;

-- Ensure RLS policies exist for user_onboarding
CREATE POLICY IF NOT EXISTS "Users can view own onboarding"
  ON public.user_onboarding FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Users can update own onboarding"
  ON public.user_onboarding FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Users can insert own onboarding"
  ON public.user_onboarding FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Prevent double XP awards for onboarding steps
-- (user_id + event_type must be unique for onboarding events)
CREATE UNIQUE INDEX IF NOT EXISTS idx_xp_events_onboarding_unique
  ON public.xp_events (user_id, event_type)
  WHERE event_type LIKE 'onboarding_%';
```

### Auto-Detection Logic

`checkOnboardingProgress()` in `lib/onboarding.js` queries the database for real evidence:

```javascript
async function checkOnboardingProgress(supabase, userId) {
  try {
    const [pacts, sessions, groups, profile] = await Promise.all([
      supabase.from('pacts').select('id').eq('user_id', userId).limit(1),
      supabase.from('focus_sessions').select('id').eq('user_id', userId).not('ended_at', 'is', null).limit(1),
      supabase.from('group_members').select('group_id').eq('user_id', userId).limit(1),
      supabase.from('profiles').select('current_streak').eq('id', userId).single(),
    ]);

    // If any query errored, return null — caller shows loading/retry state
    if (pacts.error || sessions.error || groups.error || profile.error) {
      console.error('Onboarding check failed:', { pacts: pacts.error, sessions: sessions.error, groups: groups.error, profile: profile.error });
      return null;
    }

    return {
      has_created_pact: (pacts.data?.length ?? 0) > 0,
      has_joined_group: (groups.data?.length ?? 0) > 0,
      has_used_focus_timer: (sessions.data?.length ?? 0) > 0,
      has_built_momentum: (profile.data?.current_streak ?? 0) >= 2,
    };
  } catch (err) {
    console.error('Onboarding check error:', err);
    return null;
  }
}
```

Runs on dashboard mount. The component shows a loading state while this is in flight. If it returns `null`, the checklist card is hidden (fail-open — don't block the dashboard).

Results are compared against the `user_onboarding` row — any newly-completed steps trigger `completeOnboardingStep()` which:
1. Updates the boolean field in `user_onboarding`
2. Awards XP via `awardXP()` (protected by the unique index — insert fails silently on duplicate)
3. If all 4 steps now complete, sets `onboarding_completed_at = now()`

**Row creation for new users:** `checkOnboardingProgress` first does a `maybeSingle()` on `user_onboarding`. If no row exists, it upserts a fresh row with all fields `false` before running the detection queries.

### XP Integration

Add to `XP_REWARDS` in `lib/gamification.js`:

```javascript
ONBOARDING_PACT: 25,
ONBOARDING_FOCUS: 30,
ONBOARDING_GROUP: 20,
ONBOARDING_MOMENTUM: 50,
```

XP event types: `onboarding_pact`, `onboarding_focus`, `onboarding_group`, `onboarding_momentum`.

Idempotency: the `idx_xp_events_onboarding_unique` partial unique index prevents double-awarding. The `awardXP` call wraps the insert — if the unique constraint rejects it, the XP was already awarded. No client-side check needed.

### Achievement Integration

Add a NEW achievement `onboarding_complete` in `lib/gamification.js`:
- Name: "Challenge Accepted"
- Description: "Complete the First Week Challenge"
- Trigger: all 4 `user_onboarding` booleans are `true`

Do NOT repurpose the existing `first_pact` / "First Steps" achievement — that one stays as-is, triggered by `checkPactAchievements` when `totalCompleted >= 1`.

### Settings Integration

Add a "Restart Onboarding" button in `SettingsPageClient.js` under a new "Help" section. Resets all `user_onboarding` fields to `false`, sets `onboarding_dismissed = false`, and clears `onboarding_completed_at`. Does NOT delete associated `xp_events` (XP is kept).

### Real-Time Updates

The checklist re-checks progress on:
1. **`pact-created` CustomEvent** — already fired by `DashboardClient.js` (Step 1)
2. **`focus-session-completed` CustomEvent** — NEW: add `window.dispatchEvent(new CustomEvent('focus-session-completed'))` in `FocusContext.js` `endFocusSession()` after the Supabase update (Step 2)
3. **`visibilitychange`** — re-run `checkOnboardingProgress` when tab becomes visible (catches Step 3 group joins and Step 4 streak changes)

### Cleanup

- Delete `OnboardingModal.js` and `OnboardingModal.module.css` entirely
- Remove `OnboardingModal` render from `DashboardClient.js`
- **KEEP** the `requestCreatePact` / `open-create-pact` event bridge — it's used by the Cmd+N keyboard shortcut and the dashboard header button. The checklist's "Create a Pact" CTA reuses this same bridge.

## Files to Create

| File | Purpose |
|------|---------|
| `components/OnboardingChecklist.js` | New checklist card component |
| `components/OnboardingChecklist.module.css` | Styling |
| `lib/onboarding.js` | `checkOnboardingProgress()`, `completeOnboardingStep()`, row creation |
| `supabase/onboarding_redesign.sql` | Migration: new columns, RLS policies, XP unique index |

## Files to Modify

| File | Change |
|------|--------|
| `app/dashboard/DashboardClient.js` | Replace `OnboardingModal` with `OnboardingChecklist`, add event listeners |
| `app/dashboard/settings/SettingsPageClient.js` | Add "Restart Onboarding" button in Help section |
| `lib/gamification.js` | Add `XP_REWARDS.ONBOARDING_*` keys, add `onboarding_complete` achievement |
| `lib/FocusContext.js` | Dispatch `focus-session-completed` CustomEvent in `endFocusSession()` |

## Files to Delete

| File | Reason |
|------|--------|
| `components/OnboardingModal.js` | Replaced by OnboardingChecklist |
| `components/OnboardingModal.module.css` | Replaced by OnboardingChecklist |

## Success Criteria

1. New users see the challenge card on first dashboard visit
2. Steps auto-complete when the user performs the action (no manual marking)
3. XP is awarded exactly once per step (enforced by DB unique index)
4. Step 4 (2-day streak) requires returning the next day
5. Card disappears after all 4 steps + celebration
6. "Restart Onboarding" works in Settings
7. No regression: Cmd+N shortcut, header "New Pact" button, focus timer, groups all work unchanged
8. Loading state while checking progress; fail-open if Supabase is unreachable

## Out of Scope

- Contextual tooltips (Driver.js) — can be added later
- Personalization wizard (role/use-case questions) — future enhancement
- Email nudges for incomplete onboarding — future enhancement
