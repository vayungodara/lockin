# Onboarding Redesign: First Week Challenge — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the broken modal onboarding wizard with a gamified "First Week Challenge" checklist card that auto-detects step completion and awards XP.

**Architecture:** New `lib/onboarding.js` handles all DB queries and step completion logic. New `OnboardingChecklist` component renders a dashboard card with progress ring. Steps are auto-detected from existing tables (pacts, focus_sessions, group_members, profiles). XP idempotency enforced by a partial unique index on `xp_events`.

**Tech Stack:** Next.js 16 App Router, React 19, Supabase (client-side), CSS Modules, Framer Motion, canvas-confetti

**Spec:** `docs/superpowers/specs/2026-03-23-onboarding-redesign-design.md`

---

### Task 1: Database Migration

**Files:**
- Create: `supabase/onboarding_redesign.sql`

- [ ] **Step 1: Create migration file**

```sql
-- supabase/onboarding_redesign.sql
-- Onboarding redesign: add momentum tracking + completion timestamp

ALTER TABLE public.user_onboarding
  ADD COLUMN IF NOT EXISTS has_built_momentum BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS onboarding_completed_at TIMESTAMPTZ DEFAULT NULL;

-- Reset onboarding_dismissed so old users see the new checklist
UPDATE public.user_onboarding SET onboarding_dismissed = false;

-- RLS policies for user_onboarding (may already exist — IF NOT EXISTS handles it)
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
```

- [ ] **Step 2: Run migration against Supabase**

Run the SQL in Supabase SQL Editor (Dashboard > SQL Editor > paste > Run). Verify:
- `SELECT column_name FROM information_schema.columns WHERE table_name = 'user_onboarding';` shows `has_built_momentum` and `onboarding_completed_at`
- `SELECT * FROM pg_indexes WHERE indexname = 'idx_xp_events_onboarding_unique';` returns 1 row

- [ ] **Step 3: Commit**

```bash
git add supabase/onboarding_redesign.sql
git commit -m "db: add onboarding redesign migration — momentum column, completion timestamp, XP unique index"
```

---

### Task 2: Gamification Updates

**Files:**
- Modify: `lib/gamification.js` (lines 6-14 for XP_REWARDS, lines 48+ for ACHIEVEMENTS)

- [ ] **Step 1: Add onboarding XP reward constants**

In `lib/gamification.js`, add to `XP_REWARDS` object (after `REACTION_GIVEN: 1`):

```javascript
// Onboarding — First Week Challenge
ONBOARDING_PACT: 25,
ONBOARDING_FOCUS: 30,
ONBOARDING_GROUP: 20,
ONBOARDING_MOMENTUM: 50,
```

- [ ] **Step 2: Add onboarding_complete achievement**

Add to `ACHIEVEMENTS` object (after the last existing entry):

```javascript
onboarding_complete: {
  key: 'onboarding_complete',
  name: 'Challenge Accepted',
  description: 'Complete the First Week Challenge',
  icon: '🏆',
},
```

- [ ] **Step 3: Verify no lint errors**

Run: `npm run lint 2>&1 | tail -5`
Expected: 0 errors (existing warning is fine)

- [ ] **Step 4: Commit**

```bash
git add lib/gamification.js
git commit -m "feat: add onboarding XP rewards and Challenge Accepted achievement"
```

---

### Task 3: Onboarding Logic Library

**Files:**
- Create: `lib/onboarding.js`

- [ ] **Step 1: Create `lib/onboarding.js`**

```javascript
/**
 * Onboarding — First Week Challenge logic
 * Auto-detects step completion from existing tables.
 */

import { awardXP, XP_REWARDS } from '@/lib/gamification';

const ONBOARDING_STEPS = [
  { field: 'has_created_pact', xpType: 'onboarding_pact', xp: XP_REWARDS.ONBOARDING_PACT },
  { field: 'has_used_focus_timer', xpType: 'onboarding_focus', xp: XP_REWARDS.ONBOARDING_FOCUS },
  { field: 'has_joined_group', xpType: 'onboarding_group', xp: XP_REWARDS.ONBOARDING_GROUP },
  { field: 'has_built_momentum', xpType: 'onboarding_momentum', xp: XP_REWARDS.ONBOARDING_MOMENTUM },
];

/**
 * Fetch or create the user_onboarding row.
 * Returns the row data or null on error.
 */
export async function getOnboardingState(supabase, userId) {
  try {
    const { data, error } = await supabase
      .from('user_onboarding')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      console.error('Onboarding fetch error:', error);
      return null;
    }

    if (!data) {
      // New user — create row
      const { data: newRow, error: insertError } = await supabase
        .from('user_onboarding')
        .upsert({ user_id: userId }, { onConflict: 'user_id' })
        .select()
        .single();

      if (insertError) {
        console.error('Onboarding insert error:', insertError);
        return null;
      }
      return newRow;
    }

    return data;
  } catch (err) {
    console.error('Onboarding state error:', err);
    return null;
  }
}

/**
 * Detect which onboarding steps are actually complete by querying real data.
 * Returns { has_created_pact, has_joined_group, has_used_focus_timer, has_built_momentum } or null on error.
 */
export async function detectProgress(supabase, userId) {
  try {
    const [pacts, sessions, groups, profile] = await Promise.all([
      supabase.from('pacts').select('id').eq('user_id', userId).limit(1),
      supabase.from('focus_sessions').select('id').eq('user_id', userId).not('ended_at', 'is', null).limit(1),
      supabase.from('group_members').select('group_id').eq('user_id', userId).limit(1),
      supabase.from('profiles').select('current_streak').eq('id', userId).single(),
    ]);

    if (pacts.error || sessions.error || groups.error || profile.error) {
      console.error('Onboarding detection failed:', {
        pacts: pacts.error, sessions: sessions.error,
        groups: groups.error, profile: profile.error,
      });
      return null;
    }

    return {
      has_created_pact: (pacts.data?.length ?? 0) > 0,
      has_joined_group: (groups.data?.length ?? 0) > 0,
      has_used_focus_timer: (sessions.data?.length ?? 0) > 0,
      has_built_momentum: (profile.data?.current_streak ?? 0) >= 2,
    };
  } catch (err) {
    console.error('Onboarding detection error:', err);
    return null;
  }
}

/**
 * Sync detected progress with DB state.
 * Awards XP for any newly-completed steps.
 * Returns { updatedState, newlyCompleted[] } or null on error.
 */
export async function syncProgress(supabase, userId, dbState, detected) {
  const newlyCompleted = [];
  const updates = {};

  for (const step of ONBOARDING_STEPS) {
    if (!dbState[step.field] && detected[step.field]) {
      updates[step.field] = true;
      newlyCompleted.push(step);
    }
  }

  if (newlyCompleted.length === 0) {
    return { updatedState: dbState, newlyCompleted: [] };
  }

  // Check if all 4 steps are now complete
  const allComplete = ONBOARDING_STEPS.every(
    s => dbState[s.field] || detected[s.field]
  );
  if (allComplete) {
    updates.onboarding_completed_at = new Date().toISOString();
  }

  // Update DB
  const { error: updateError } = await supabase
    .from('user_onboarding')
    .update(updates)
    .eq('user_id', userId);

  if (updateError) {
    console.error('Onboarding sync error:', updateError);
    return null;
  }

  // Award XP for each newly completed step (unique index prevents doubles)
  for (const step of newlyCompleted) {
    await awardXP(supabase, userId, step.xpType, step.xp, { source: 'onboarding' });
  }

  return {
    updatedState: { ...dbState, ...updates },
    newlyCompleted,
  };
}

/**
 * Reset onboarding for a user (Settings > Restart Onboarding).
 */
export async function resetOnboarding(supabase, userId) {
  const { error } = await supabase
    .from('user_onboarding')
    .update({
      has_created_pact: false,
      has_joined_group: false,
      has_used_focus_timer: false,
      has_built_momentum: false,
      onboarding_dismissed: false,
      onboarding_completed_at: null,
    })
    .eq('user_id', userId);

  if (error) {
    console.error('Onboarding reset error:', error);
    return false;
  }
  return true;
}
```

- [ ] **Step 2: Verify lint passes**

Run: `npm run lint 2>&1 | tail -5`

- [ ] **Step 3: Commit**

```bash
git add lib/onboarding.js
git commit -m "feat: add onboarding logic library — detection, sync, XP awards, reset"
```

---

### Task 4: FocusContext Event Dispatch

**Files:**
- Modify: `lib/FocusContext.js` (line ~170, inside `handleTimerComplete`)

- [ ] **Step 1: Add focus-session-completed event**

In `lib/FocusContext.js`, inside `handleTimerComplete` callback, after `await endFocusSession(new Date())` (line 170), add:

```javascript
window.dispatchEvent(new CustomEvent('focus-session-completed'));
```

So lines 168-172 become:

```javascript
if (mode === 'work') {
  setSessionsCompleted((prev) => prev + 1);
  await endFocusSession(new Date());
  window.dispatchEvent(new CustomEvent('focus-session-completed'));
  setMode('break');
```

- [ ] **Step 2: Verify lint passes**

Run: `npm run lint 2>&1 | tail -5`

- [ ] **Step 3: Commit**

```bash
git add lib/FocusContext.js
git commit -m "feat: dispatch focus-session-completed event for onboarding detection"
```

---

### Task 5: OnboardingChecklist Component

**Files:**
- Create: `components/OnboardingChecklist.js`
- Create: `components/OnboardingChecklist.module.css`

- [ ] **Step 1: Create `components/OnboardingChecklist.module.css`**

```css
.card {
  background: var(--surface-1);
  border-radius: var(--radius-lg);
  border: 1px solid var(--border-subtle);
  border-left: 3px solid var(--accent-primary);
  padding: var(--space-5);
  margin-bottom: var(--space-4);
}

.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--space-4);
}

.headerLeft {
  display: flex;
  align-items: center;
  gap: var(--space-3);
}

.title {
  font-size: var(--text-lg);
  font-weight: var(--font-semibold);
  color: var(--text-primary);
  letter-spacing: -0.02em;
}

.progressRing {
  width: 40px;
  height: 40px;
  transform: rotate(-90deg);
}

.progressBg {
  fill: none;
  stroke: var(--border-subtle);
  stroke-width: 3;
}

.progressFill {
  fill: none;
  stroke: var(--accent-primary);
  stroke-width: 3;
  stroke-linecap: round;
  transition: stroke-dashoffset 0.6s var(--ease-out-quint);
}

.progressText {
  font-size: var(--text-xs);
  font-weight: var(--font-semibold);
  color: var(--text-secondary);
  text-anchor: middle;
  dominant-baseline: central;
}

.steps {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.step {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-3);
  border-radius: var(--radius-md);
  transition: background 0.15s ease;
}

.step:hover {
  background: var(--bg-hover);
}

.stepIcon {
  width: 32px;
  height: 32px;
  border-radius: var(--radius-full);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: var(--text-base);
  background: var(--bg-secondary);
  flex-shrink: 0;
}

.stepIconDone {
  background: var(--success-bg);
  color: var(--success);
}

.stepContent {
  flex: 1;
  min-width: 0;
}

.stepTitle {
  font-size: var(--text-sm);
  font-weight: var(--font-medium);
  color: var(--text-primary);
}

.stepTitleDone {
  color: var(--text-muted);
}

.stepDesc {
  font-size: var(--text-xs);
  color: var(--text-secondary);
  margin-top: 2px;
}

.stepAction {
  flex-shrink: 0;
}

.actionBtn {
  font-size: var(--text-xs);
  font-weight: var(--font-medium);
  color: var(--accent-primary);
  background: none;
  border: 1px solid var(--accent-primary);
  border-radius: var(--radius-md);
  padding: 6px 12px;
  cursor: pointer;
  transition: all 0.15s ease;
}

.actionBtn:hover {
  background: var(--accent-primary);
  color: white;
}

.xpBadge {
  font-size: var(--text-xs);
  font-weight: var(--font-semibold);
  color: var(--success);
  background: var(--success-bg);
  border-radius: var(--radius-full);
  padding: 4px 10px;
}

.dismissBtn {
  font-size: var(--text-xs);
  color: var(--text-muted);
  background: none;
  border: none;
  cursor: pointer;
  padding: var(--space-1) var(--space-2);
  margin-top: var(--space-3);
}

.dismissBtn:hover {
  color: var(--text-secondary);
}

.successCard {
  text-align: center;
  padding: var(--space-6);
}

.successTitle {
  font-size: var(--text-xl);
  font-weight: var(--font-bold);
  color: var(--text-primary);
  margin-bottom: var(--space-2);
}

.successDesc {
  font-size: var(--text-sm);
  color: var(--text-secondary);
}

.loading {
  padding: var(--space-4);
  text-align: center;
  color: var(--text-muted);
  font-size: var(--text-sm);
}
```

- [ ] **Step 2: Create `components/OnboardingChecklist.js`**

```javascript
'use client';

import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createClient } from '@/lib/supabase/client';
import { getOnboardingState, detectProgress, syncProgress } from '@/lib/onboarding';
import { XP_REWARDS } from '@/lib/gamification';
import { celebrationBounce, fadeInScale, prefersReducedMotion } from '@/lib/animations';
import { triggerConfetti, triggerCelebration } from '@/lib/confetti';
import { useToast } from '@/components/Toast';
import styles from './OnboardingChecklist.module.css';

const STEPS = [
  {
    field: 'has_created_pact',
    title: 'Make a Pact',
    description: 'Create your first commitment',
    icon: '🎯',
    actionLabel: 'Create a Pact',
    xp: XP_REWARDS.ONBOARDING_PACT,
    action: 'create-pact',
  },
  {
    field: 'has_used_focus_timer',
    title: 'Lock In',
    description: 'Complete a focus session',
    icon: '⏱️',
    actionLabel: 'Start Focusing',
    xp: XP_REWARDS.ONBOARDING_FOCUS,
    action: 'navigate',
    href: '/dashboard/focus',
  },
  {
    field: 'has_joined_group',
    title: 'Join the Squad',
    description: 'Join or create a group',
    icon: '👥',
    actionLabel: 'Browse Groups',
    xp: XP_REWARDS.ONBOARDING_GROUP,
    action: 'navigate',
    href: '/dashboard/groups',
  },
  {
    field: 'has_built_momentum',
    title: 'Build Momentum',
    description: 'Hit a 2-day streak',
    icon: '🔥',
    xp: XP_REWARDS.ONBOARDING_MOMENTUM,
    action: 'auto', // no button — auto-detected
  },
];

const CIRCUMFERENCE = 2 * Math.PI * 16; // radius=16 for 40px SVG

export default function OnboardingChecklist({ userId, onCreatePact }) {
  const [dbState, setDbState] = useState(null);
  const [loading, setLoading] = useState(true);
  const [allComplete, setAllComplete] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const fadeTimerRef = useRef(null);
  const supabase = useMemo(() => createClient(), []);
  const toast = useToast();

  const completedCount = dbState
    ? STEPS.filter(s => dbState[s.field]).length
    : 0;

  const checkAndSync = useCallback(async () => {
    if (!userId) return;

    const state = await getOnboardingState(supabase, userId);
    if (!state) { setLoading(false); return; }

    // Already completed — don't show
    if (state.onboarding_completed_at) {
      setAllComplete(true);
      setLoading(false);
      return;
    }

    const detected = await detectProgress(supabase, userId);
    if (!detected) {
      setDbState(state);
      setLoading(false);
      return;
    }

    const result = await syncProgress(supabase, userId, state, detected);
    if (!result) {
      setDbState(state);
      setLoading(false);
      return;
    }

    setDbState(result.updatedState);
    setLoading(false);

    // Celebrate newly completed steps
    for (const step of result.newlyCompleted) {
      if (!prefersReducedMotion()) triggerConfetti();
      const stepDef = STEPS.find(s => s.field === step.field);
      if (stepDef) {
        toast.success(`+${stepDef.xp} XP — ${stepDef.title} complete!`);
      }
    }

    // All 4 done?
    if (result.updatedState.onboarding_completed_at) {
      setAllComplete(true);
      if (!prefersReducedMotion()) triggerCelebration();
      toast.success('Achievement Unlocked: Challenge Accepted! 🏆');
      setShowSuccess(true);
      fadeTimerRef.current = setTimeout(() => setShowSuccess(false), 5000);
    }
  }, [userId, supabase, toast]);

  // Initial check on mount
  useEffect(() => {
    checkAndSync();
  }, [checkAndSync]);

  // Re-check on custom events and visibility change
  useEffect(() => {
    const handleEvent = () => checkAndSync();
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') checkAndSync();
    };

    window.addEventListener('pact-created', handleEvent);
    window.addEventListener('focus-session-completed', handleEvent);
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      window.removeEventListener('pact-created', handleEvent);
      window.removeEventListener('focus-session-completed', handleEvent);
      document.removeEventListener('visibilitychange', handleVisibility);
      if (fadeTimerRef.current) clearTimeout(fadeTimerRef.current);
    };
  }, [checkAndSync]);

  const handleAction = (step) => {
    if (step.action === 'create-pact' && onCreatePact) {
      onCreatePact();
    } else if (step.action === 'navigate' && step.href) {
      window.location.href = step.href;
    }
  };

  const handleDismiss = async () => {
    setDismissed(true);
    await supabase
      .from('user_onboarding')
      .update({ onboarding_dismissed: true })
      .eq('user_id', userId);
  };

  // Don't render if: loading failed (fail-open), already complete, or dismissed
  if (loading) return <div className={styles.loading}>Loading challenge...</div>;
  if (allComplete && !showSuccess) return null;
  if (dismissed) return null;
  if (!dbState) return null;

  // Soft persistence: can't dismiss until at least 1 step done
  const canDismiss = completedCount > 0;

  if (showSuccess) {
    return (
      <motion.div className={`${styles.card} ${styles.successCard}`} {...fadeInScale}>
        <div className={styles.successTitle}>You're all set! LockIn is yours. 🎉</div>
        <div className={styles.successDesc}>+125 XP earned from the First Week Challenge</div>
      </motion.div>
    );
  }

  const dashOffset = CIRCUMFERENCE - (completedCount / STEPS.length) * CIRCUMFERENCE;

  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <svg className={styles.progressRing} viewBox="0 0 40 40">
            <circle className={styles.progressBg} cx="20" cy="20" r="16" />
            <circle
              className={styles.progressFill}
              cx="20" cy="20" r="16"
              strokeDasharray={CIRCUMFERENCE}
              strokeDashoffset={dashOffset}
            />
            <text
              className={styles.progressText}
              x="20" y="20"
              transform="rotate(90 20 20)"
            >
              {completedCount}/{STEPS.length}
            </text>
          </svg>
          <span className={styles.title}>Your First Week Challenge</span>
        </div>
      </div>

      <div className={styles.steps}>
        <AnimatePresence>
          {STEPS.map((step) => {
            const done = dbState[step.field];
            return (
              <motion.div
                key={step.field}
                className={styles.step}
                layout
                {...(done ? celebrationBounce : {})}
              >
                <div className={`${styles.stepIcon} ${done ? styles.stepIconDone : ''}`}>
                  {done ? '✓' : step.icon}
                </div>
                <div className={styles.stepContent}>
                  <div className={`${styles.stepTitle} ${done ? styles.stepTitleDone : ''}`}>
                    {step.title}
                  </div>
                  {!done && <div className={styles.stepDesc}>{step.description}</div>}
                </div>
                <div className={styles.stepAction}>
                  {done ? (
                    <span className={styles.xpBadge}>+{step.xp} XP</span>
                  ) : step.action !== 'auto' ? (
                    <button className={styles.actionBtn} onClick={() => handleAction(step)}>
                      {step.actionLabel}
                    </button>
                  ) : null}
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {canDismiss && (
        <button className={styles.dismissBtn} onClick={handleDismiss}>
          Dismiss challenge
        </button>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Verify lint passes**

Run: `npm run lint 2>&1 | tail -5`

- [ ] **Step 4: Commit**

```bash
git add components/OnboardingChecklist.js components/OnboardingChecklist.module.css
git commit -m "feat: add OnboardingChecklist component — gamified First Week Challenge card"
```

---

### Task 6: Wire Up Dashboard

**Files:**
- Modify: `app/dashboard/DashboardClient.js` (lines 15, 432+)

- [ ] **Step 1: Replace OnboardingModal import with OnboardingChecklist**

In `app/dashboard/DashboardClient.js`:

Replace line 15:
```javascript
import OnboardingModal from '@/components/OnboardingModal';
```
with:
```javascript
import OnboardingChecklist from '@/components/OnboardingChecklist';
```

- [ ] **Step 2: Replace OnboardingModal render with OnboardingChecklist**

Find the `<OnboardingModal>` render (around line 432). Replace:
```javascript
<OnboardingModal userId={user?.id} onCreatePact={requestCreatePact} />
```
with:
```javascript
<OnboardingChecklist userId={user?.id} onCreatePact={requestCreatePact} />
```

Make sure `OnboardingChecklist` is placed ABOVE the `DailySummaryCard` in the JSX tree so it renders at the top of the dashboard.

- [ ] **Step 3: Verify lint and build pass**

Run: `npm run lint 2>&1 | tail -5`
Run: `npm run build 2>&1 | tail -5`

- [ ] **Step 4: Commit**

```bash
git add app/dashboard/DashboardClient.js
git commit -m "feat: replace OnboardingModal with OnboardingChecklist on dashboard"
```

---

### Task 7: Settings — Restart Onboarding

**Files:**
- Modify: `app/dashboard/settings/SettingsPageClient.js`

- [ ] **Step 1: Add Restart Onboarding button**

In `SettingsPageClient.js`, add a "Help" section at the bottom of the settings page (before the closing `</div>` of the page container). Import `resetOnboarding` from `@/lib/onboarding` and `createClient` from `@/lib/supabase/client`.

Add this section after the last existing settings section:

```javascript
{/* Help Section */}
<div className={styles.section}>
  <h3 className={styles.sectionTitle}>Help</h3>
  <div className={styles.settingRow}>
    <div className={styles.settingInfo}>
      <span className={styles.settingLabel}>Restart Onboarding</span>
      <span className={styles.settingDescription}>
        Show the First Week Challenge again on your dashboard
      </span>
    </div>
    <motion.button
      className="btn btn-secondary"
      whileHover={buttonHover}
      whileTap={buttonTap}
      onClick={async () => {
        const supabase = createClient();
        const success = await resetOnboarding(supabase, user?.id);
        if (success) {
          toast.success('Onboarding reset! Visit your dashboard to start the challenge.');
        } else {
          toast.error('Failed to reset onboarding. Try again.');
        }
      }}
    >
      Reset
    </motion.button>
  </div>
</div>
```

Add the imports at the top:
```javascript
import { resetOnboarding } from '@/lib/onboarding';
import { createClient } from '@/lib/supabase/client';
```

- [ ] **Step 2: Verify lint passes**

Run: `npm run lint 2>&1 | tail -5`

- [ ] **Step 3: Commit**

```bash
git add app/dashboard/settings/SettingsPageClient.js
git commit -m "feat: add Restart Onboarding button in Settings > Help"
```

---

### Task 8: Delete Old OnboardingModal

**Files:**
- Delete: `components/OnboardingModal.js`
- Delete: `components/OnboardingModal.module.css`

- [ ] **Step 1: Delete old files**

```bash
rm components/OnboardingModal.js components/OnboardingModal.module.css
```

- [ ] **Step 2: Verify no remaining imports**

Run: `grep -r "OnboardingModal" --include="*.js" --include="*.jsx" .`
Expected: 0 results (the import was already changed in Task 6)

- [ ] **Step 3: Verify build passes**

Run: `npm run build 2>&1 | tail -10`
Expected: Build succeeds with no errors

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "cleanup: delete OnboardingModal — replaced by OnboardingChecklist"
```

---

### Task 9: Integration Test

- [ ] **Step 1: Run full build**

Run: `npm run build 2>&1 | tail -10`
Expected: Build passes, all routes compile

- [ ] **Step 2: Run unit tests**

Run: `npx vitest run 2>&1 | tail -10`
Expected: All existing tests pass

- [ ] **Step 3: Run lint**

Run: `npm run lint 2>&1 | tail -5`
Expected: 0 errors

- [ ] **Step 4: Manual smoke test checklist**

Start dev server: `npm run dev`

Verify:
1. Dashboard shows "Your First Week Challenge" card for users with incomplete onboarding
2. Clicking "Create a Pact" opens the CreatePactModal (Cmd+N still works too)
3. After creating a pact, the card updates Step 1 to show checkmark + XP badge
4. "Start Focusing" navigates to /dashboard/focus
5. After completing a focus session and returning to dashboard, Step 2 updates
6. "Browse Groups" navigates to /dashboard/groups
7. Step 4 (Build Momentum) has no button — auto-detected
8. Settings > Help > "Reset" button works — card reappears on dashboard
9. Card is not dismissible until at least 1 step is done
10. Progress ring SVG animates correctly (0/4 to N/4)

- [ ] **Step 5: Final commit with all changes**

```bash
git add -A
git commit -m "feat: onboarding redesign — First Week Challenge with XP rewards

Replace broken modal wizard with persistent dashboard checklist card.
Steps auto-detect from real user actions (pacts, focus sessions, groups, streaks).
Awards 125 XP total across 4 steps. Step 4 (2-day streak) forces return visit.
Includes Settings > Restart Onboarding and achievement unlocks."
```
