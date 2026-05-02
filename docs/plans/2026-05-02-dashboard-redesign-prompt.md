# LockIn — Navbar Swap + Dashboard Redesign

**Paste this entire file into a fresh Claude Code session.**

## Context

The landing page was reimagined in the previous session on branch
`redesign/2026-04-19-editorial-stamps` (port of lockin-test's structure with
LockIn voice — Stamp + SectionHeader + UserAvatar + Ticker + opaque
highlighter + ink cascade). Two pieces remain:

1. **Navbar swap** — replace the dynamic-island collapse pattern with
   lockin-test's always-visible sticky bar. Cleaner, more discoverable,
   matches the editorial restraint of the rest of the landing.
2. **Dashboard redesign** — extend editorial-with-stamps to the product:
   public demo dashboard first (like lockin-test's `/app/dashboard`), then
   redesign the actual authenticated dashboard.

**New PR, new branch.** Don't reuse `redesign/2026-04-19-editorial-stamps`.

---

## First steps (mandatory, before any code)

1. Read `/Users/vayun/projects/lockin/.impeccable.md` — the anchor. Note:
   - Voice split: **direct-positive on dashboard**, NOT confrontational-wry
     (that's marketing-only)
   - Fonts: `ui-serif, Georgia, 'Times New Roman', serif` display +
     Host Grotesk body + JetBrains Mono mono
   - Ink cascade via `[data-ink]` on `<html>` remaps `--stamp-yellow`
   - Semantic resolution colors (KEPT green, MISSED red, LOCKED IN blue)
     stay fixed
   - Glass modals-only; bright white modals-only; dark mode = inverted paper
   - Highlighter: opaque yellow at ~16% font-height, sits behind text via
     `z-index: -1 + isolation: isolate`. NO underline, NO skew on hero text.
2. Read `~/.claude/projects/-Users-vayun-projects-lockin/memory/project_lockin_test_evaluation.md`
3. Read `/tmp/lockin-test/app/app/dashboard/page.tsx` + sibling pages
   (`pacts`, `focus`, `groups`, `feed`, `profile`) as the structural reference.
4. Read existing production dashboard at `/Users/vayun/projects/lockin/app/dashboard/`
   and components (`TodayBar`, `PactCard`, `Sidebar`, `MobileNav`,
   `ActivityFeed`, `Stamp`, `SectionHeader`, `UserAvatar`, `NavMarker`,
   `Ticker`).
5. Start both dev servers: `cd /tmp/lockin-test && npm run dev` (3331)
   and `npm run dev` (3000) for side-by-side compare.

---

## Wave 0 — Navbar swap (do this BEFORE the dashboard work)

The current `components/NavbarLanding.js` uses a dynamic-island pattern —
sticky pill that collapses on scroll past 80px and expands to a nav popover
on click. Reasons to retire it:

- Hides nav items behind a click → friction on a top-to-bottom editorial page
- Doesn't match lockin-test's pattern (always-visible sticky bar)
- Click-to-expand is a hidden interaction → discoverability gap
- `useScroll` + `useMotionValueEvent` + click-outside handler + `isExpanded`
  state is a lot of code for a gimmick that competes with the editorial
  restraint of the rest of the page
- Brand-moment fatigue — every editorial landing now has scroll gimmicks;
  lockin-test deliberately doesn't, reads more confident

**What to ship:**

- Replace `NavbarLanding.js` + `NavbarLanding.module.css` with a
  lockin-test-style sticky bar:
  - Always visible (no collapse, no expand-on-click)
  - Logo (yellow rotated square + "LockIn") on the left
  - Nav links centered or left-aligned: `How it works`, `The system`,
    `Witnesses`, `Objections` (mirror lockin-test's anchor links to
    `#features`, `#how-it-works`, `#witnesses`, `#objections` based on
    section IDs in `LandingPageClient.js`)
  - `Sign in` text link + `Start a pact →` flat ink-dark CTA on the right
  - Thin `border-bottom: 1px solid var(--ink-300)` on a `--ink-050`
    background
  - Optional: subtle padding shrink on scroll (e.g. height 64px → 56px) —
    keeps the bar always visible, just thins
- Keep `NavMarker` hover swipe behavior on each nav link (already works,
  same SVG + marker-roughen filter)
- Remove `useScroll`, `useMotionValueEvent`, `isExpanded`, `isPill`,
  click-outside handler from the old component
- Remove the "System" theme-toggle pill (already removed earlier)
- On mobile (≤768px), collapse to a simple hamburger that drops a flat
  list — no pill animation

**Voice on the navbar links**: lowercase per lockin-test (`How it works`,
`Witnesses`) is on-brand. Title Case (`Start a Pact →`) for the CTA.

Verify in browser at 1440px and 390px. Test hover on each nav link
(NavMarker should still animate). Test scroll past 200px (bar should
stay, just thin slightly).

---

## Wave 0.5 — Brainstorm with the user (mandatory)

After Wave 0 lands and before starting Wave 1, run
`/superpowers:brainstorming` (or use the `impeccable:shape` skill) to
brainstorm with the user on:

1. **Public demo dashboard** — what's the route? `/preview/dashboard`?
   `/demo`? Should it require email gate? What mock data fidelity?
2. **Authenticated dashboard structure** — keep the current 5-section
   layout (TodayBar / pacts / focus / activity / stats) or restructure
   to match lockin-test's mosaic exactly?
3. **Sidebar fate** — lockin-test has no sidebar (single-column dashboard
   with sticky top nav). Current LockIn has a 72/260px Arc-style sidebar.
   Keep, kill, or restructure?
4. **5-ink picker UI** — where does it live (settings page, header
   dropdown, profile)? When does the user discover it?

Don't start Wave 1 until the user answers these. The dashboard wave is
big — alignment up front saves rework.

---

## Wave 1 — Public demo dashboard

After brainstorm answers are locked in, build a publicly viewable demo
dashboard at the route the user picked. Mock data, no auth, no Supabase
calls. Port lockin-test's `/app/dashboard/page.tsx` structure:

- Hero strip: "You have N open pacts. One closes in under four hours.
  Your group has X people locked in right now."
- Live witnesses board (right aside): focus session cards with progress
  bars
- `§ 01 — Today's pacts` grid: open pacts using existing `PactCard` +
  `Stamp`
- `§ 02 — Activity` ticker / feed using existing `Ticker`
- `§ 03 — Stats` heatmap + streak number + personal best
- `§ 04 — Achievements` rail of earned + locked seals (kept original
  "Achievement" label, not "Seal")

Voice **direct-positive** throughout — "You have 3 pacts due today" /
"Locked in 45m" / "12-day streak, personal best 17". NO confrontational-wry
copy on dashboard ("Stop lying to yourself" / "Three moves. No loopholes."
live on marketing only).

---

## Wave 2 — Authenticated dashboard redesign

Rewrite `app/dashboard/page.js` + `DashboardClient.js` to use the same
editorial-with-stamps direction with real Supabase data + auth. Same
structure as Wave 1, real data instead of mocks.

---

## Wave 3 — Other auth routes

Apply the same treatment to `/dashboard/pacts`, `/dashboard/groups`,
`/dashboard/focus`, `/dashboard/stats`, `/dashboard/settings`. Lockin-test
has reference layouts for each — port structure, LockIn-ify voice, use
existing components.

---

## Wave 4 — Ink-picker UI migration

The 5-ink cascade mechanism is live (`[data-ink]` reads
`localStorage.lockin-ink`). But the existing 7-accent picker
(`ThemeToggle`) still writes `localStorage.lockin-accent`. Build a new
ink-picker UI in settings (or the location decided in brainstorm) that
writes `lockin-ink` to one of `highlighter | redpen | carbon | moss |
indigo-legacy`. Optionally migrate users from old 7-accent localStorage
keys to closest 5-ink equivalent on first load.

---

## Wave 5 — Audit pass

`/critique` + `/audit` + `/polish` on the dashboard. Address findings.
Commit + open PR.

---

## Existing components to reuse (do NOT re-implement)

- `Stamp.js` — kept/missed/locked-in/pending variants, slam animation
- `SectionHeader.js` — `§ 01 — Title` editorial spine
- `UserAvatar.js` — witness-tile default, `showPhoto` opt-in
- `PactCard.js` — single-signal urgency, uses Stamp internally
- `Ticker.js` — horizontal scrolling activity feed
- `NavMarker.js` — landing-only hover swipe (don't use on dashboard nav)
- Animation presets in `lib/animations.js`: `stampSlam`, `stampSlamClean`,
  `rewardPop`, `achievementIn`

## Dispatch strategy

Use the `lockin-frontend` agent (already installed at
`.claude/agents/lockin-frontend.md`). For independent files, dispatch
in parallel. The agent reads `.impeccable.md` automatically.

## Hard constraints

- JavaScript + CSS Modules only. No TypeScript. No Tailwind. No CSS-in-JS.
- Impeccable absolute bans: no `border-left/right ≥ 2px`, no
  `background-clip: text` + gradient anywhere.
- Keep XP / Level / Streak / Achievement product labels (not
  Marks/Ranks/Seals).
- Keep confetti on pact completion + streak-celebration animations.
- Sweep any surviving `#6366f1` / indigo brand-gradient leaks in dashboard
  components — landing waves left dashboard untouched.
- Dashboard supports BOTH light and dark mode (landing is light-only).
  Dark mode = inverted paper, NOT dark-SaaS.

## Reference paths

- Anchor: `/Users/vayun/projects/lockin/.impeccable.md`
- Agent spec: `.claude/agents/lockin-frontend.md` (live)
- Landing done: `components/LandingPageClient.js`, `app/page.module.css`,
  `components/Ticker.js`, `components/NavMarker.js`,
  `components/NavbarLanding.js` (will be replaced in Wave 0)
- Lockin-test reference: `/tmp/lockin-test/app/app/*/page.tsx`
- Memory index: `~/.claude/projects/-Users-vayun-projects-lockin/memory/MEMORY.md`

## Sequence summary

1. Wave 0 → swap navbar to sticky bar
2. Wave 0.5 → brainstorm dashboard direction with user (4 questions above)
3. Wave 1 → public demo dashboard
4. Wave 2 → authenticated dashboard
5. Wave 3 → other auth routes
6. Wave 4 → ink-picker UI
7. Wave 5 → critique + audit + polish

Don't skip the brainstorm. Dashboard is too big to start without alignment.
