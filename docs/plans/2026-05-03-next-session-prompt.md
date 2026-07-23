Three jobs on branch `redesign/2026-05-02-navbar-dashboard`. Wave 1–4 already shipped (dashboard rebuild + other auth routes + cleanup + landing token sweep). 29+ commits.

═══════════════════════════════════════════════════════════════════
JOB 1 — Carve out /dashboard/profile as the editorial ledger
═══════════════════════════════════════════════════════════════════

Move tier ladder + achievements from /dashboard/stats to a new dedicated /dashboard/profile page so YOUR RECORD reads as full-page editorial commitment instead of a crowded § among five.

Reference visual treatment: /tmp/lockin-test/app/app/profile/page.tsx — read in full. DO NOT copy any courthouse vocabulary (`sworn`, `under oath`, `public record`, `on the record`, `regent`, `untouchable`, `apprentice`, `novice`, `witness`, `filed`, `register`). Banned per .impeccable.md.

Tier labels (already in lib/tiers.js): First marks / Habits forming / Steady / Locked in / Unbroken / Iron. Keep them.

/dashboard/profile structure:
- Header: § Your record (11px tracked uppercase caption)
- Avatar block: WitnessTile size="lg" (96px), display name in display-editorial serif, "Locked in since DD MMM YYYY" subtitle
- § 01 TIER: current tier label MONUMENTAL serif (clamp 96px–200px), subtitle display-editorial italic, progress bar to next tier with "X to {next}", 6-tier ladder rendered tall (label + subtitle + threshold + earned check per row). Current row inverted (yellow bg + ink text). Locked rows muted.
- § 02 STREAK: streak number monumental serif, best streak, kept-rate, missed count (moved from current stats page)
- § 03 ACHIEVEMENTS: earned ones as 180px-tall editorial cards — JetBrains Mono index "Achievement #04", title in display-editorial, earned date in JetBrains Mono, caption in Host Grotesk, optional rotated yellow stamp glyph in corner. Locked in a "Not yet" section, dashed-outlined, muted.
- Footer: total stats line in JetBrains Mono — "12 pacts kept · 47 sessions · 12-day streak"

Then SLIM /dashboard/stats to pure analytics:
- § Stats header
- § 01 Activity: MonthlyCalendar heatmap (preserve)
- § 02 Sessions: totals + 7/30-day bar chart + recent list
- § 03 Pacts: kept rate + completion-by-day
- § 04 Streaks: streak history timeline + freeze status

DashboardNav: avatar routes to /dashboard/profile (currently routes to settings). Settings stays accessible via a small gear button OR keep the "Profile" nav link pointing at settings — your call. Lean: avatar → profile, "Settings" nav link still goes to settings.

═══════════════════════════════════════════════════════════════════
JOB 2 — Sweep remaining old-design surfaces
═══════════════════════════════════════════════════════════════════

Vayun has noticed notifications + other elements still showing old purple chrome.

Run this first:
  grep -rn "#6366f1\|#5B5EF5\|#7C4DFF\|#E040CB\|gradient-primary\|--accent-primary-rgb\|backdrop-filter: blur" app/dashboard components | grep -v "indigo-legacy\|streakCelebration\|/* legacy"

Likely culprits to investigate:
1. NotificationBell + dropdown panel (still indigo)
2. components/Toast.js — restyle to ink cascade + direct-positive voice
3. CreatePactModal / EditPactModal / any other modal — re-grep, Wave 1 D1 missed some
4. Dropdowns / select menus
5. components/OnboardingChecklist.js + onboarding pages — direct-positive voice, NOT confrontational-wry (wry is marketing-only)
6. Anything else the grep surfaces

Categorize each finding (decorative leak fix / legacy ink path keep / level-up easter-egg keep) and dispatch parallel agents with file ownership boundaries.

═══════════════════════════════════════════════════════════════════
JOB 3 — Deprecate the 7-accent system, route everything through ink
═══════════════════════════════════════════════════════════════════

The retired indigo→purple→magenta gradient is still the LIVE runtime mechanism for the old 7-accent system. lib/accentColors.js mutates --accent-primary + --gradient-primary based on user's accent choice. The 5-ink system (lockin-ink localStorage) shipped in Wave 1 was meant to supersede this. They currently coexist.

Audit all consumers of --accent-primary, --accent-primary-rgb, --gradient-primary, .text-gradient, .btn-primary, .card-glow, .badge-gradient (~49 components per Wave 4 estimate). Route each through --stamp-yellow (cascades via [data-ink]) or appropriate flat ink/stamp tokens.

Delete lib/accentColors.js, the accent boot script in app/layout.js, the --gradient-primary token in app/globals.css. Migrate any localStorage 'lockin-accent' reads to 'lockin-ink' (migration logic already exists from Wave 1 ink picker in app/layout.js boot script).

~1 day, parallel-dispatchable, mechanical swaps.

═══════════════════════════════════════════════════════════════════
ANCHOR + RULES
═══════════════════════════════════════════════════════════════════

Read /Users/vayun/projects/lockin/.impeccable.md IN FULL before any code. Voice rules, ink cascade list, absolute bans (no border-left/right ≥ 2px, no gradient text, no glass on non-modal, no courthouse vocab).

Voice on dashboard: direct-positive, NOT confrontational-wry. Wry is marketing-only (landing, sign-in, share, FAQ).

Five inks cascade --stamp-yellow across personal-identity surfaces. Semantic resolution colors (KEPT moss / MISSED red / LOCKED IN carbon) stay fixed.

Process:
1. Use lockin-frontend agent for ALL UI implementation. Never edit components manually except trivial one-line fixes.
2. Use /codex:rescue for any backend/Supabase work.
3. Dispatch parallel where files don't overlap.
4. Verify each surface visually via Playwright MCP (light + dark, 1440 + 390).
5. Each agent commits its own work with a focused message.
6. After everything lands, run /impeccable critique on /dashboard against the spec to confirm no findings remain.

References:
- Spec: docs/superpowers/specs/2026-05-02-dashboard-editorial-stamps-design.md
- Wave 1 plan pattern: docs/superpowers/plans/2026-05-02-dashboard-wave-1.md
- /tmp/lockin-test for visual reference (already cloned)
- Both dev servers should be running: lockin on :3000, lockin-test on :3331

User preferences (from prior session):
- Batch execution + parallel agents. Don't ask which one first; propose full scope and dispatch.
- Never merge PRs without explicit approval.
- Use Opus 4.6 or 4.7 for all subagents.

First step: run the grep audit from Job 2, then propose a parallel-dispatch plan covering Job 1 + the fixable Job 2 findings. Job 3 can be a follow-up session — flag if Vayun wants it bundled in.
