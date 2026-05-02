# Dashboard Wave 1 — Authenticated dashboard rebuild — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild the authenticated `/dashboard` route with the editorial-stamps direction — sticky top nav (replacing the sidebar), § sectional rhythm, live witnesses board — using existing Supabase data flows. Real auth, real data, no demo route.

**Architecture:** Top-nav-driven single-column layout. Sections compose new and restyled components: `DashboardNav` (NEW) + `TodayBar` (existing, restyle) + PactCard grid (existing) + `Witnesses` (NEW) + `ActivityFeed` (refactor) + `MonthlyCalendar` (restyle) + Achievements rail (extracted from inline). Sidebar/MobileNav stay in repo until Wave 3 final pass; just stop importing them.

**Tech Stack:** Next.js 16 (App Router), React 19, JS only, CSS Modules, Framer Motion, Supabase JS, Phosphor icons (existing).

**Spec:** `docs/superpowers/specs/2026-05-02-dashboard-editorial-stamps-design.md`

**Branch:** `redesign/2026-05-02-navbar-dashboard` (current).

**Agent assignments:**
- Frontend (UI, components, layout, CSS, motion) → `lockin-frontend` agent
- Backend (Supabase queries, RLS, hooks against new data) → `/codex:rescue`

**Verification primitives (used per task):**
- Visual: Playwright MCP (`mcp__plugin_playwright_playwright__*`) — `browser_navigate`, `browser_resize`, `browser_take_screenshot`, `browser_console_messages`
- Sizes: 1440×900, 1024×768, 390×844 (mobile)
- Themes: light + dark (toggle `data-theme="dark"` on `<html>`)
- Inks: at least Highlighter (default) + RedPen for cascade verification
- Dev server: already running on `http://localhost:3000`

---

## Task 0 — Backend: Witnesses data hook (codex:rescue)

**Why first:** Task A2 (Witnesses component) needs a query for "active focus sessions of users in any of the current user's groups." The existing focus_sessions queries are user-scoped — none expose group-mate live sessions. Surfacing this to codex prevents the frontend agent from improvising a Supabase query and possibly violating RLS.

**Files:**
- Create or extend: `lib/witnesses.js` (new file, or add to `lib/streaks-advanced.js` if a similar utility lives there — codex's call)
- Read for context: `lib/FocusContext.js:116-261` (existing focus_sessions usage), `app/dashboard/groups/[id]/GroupDetailClient.js:72` (group-scoped query example), `supabase/` (RLS policies if present)

**Scope:**
- Provide a function `getActiveWitnesses(userId)` that returns: an array of `{ user_id, name, avatar_url, started_at, duration_minutes, group_id, group_name, progress_pct }` for any focus session currently in-progress (`ended_at IS NULL` AND `started_at` within last 6 hours) belonging to a member of any group the current user is also a member of. Exclude the current user's own sessions.
- Write SQL through Supabase client; use joins or a view if cleaner. RLS must allow the current user to read group members' focus_sessions only when they share a group.
- If RLS doesn't currently allow the read, codex authors a migration and applies it via Supabase MCP if the user approves cost — flag before applying.
- Return empty array on no-data, never null.
- The function is called from a React effect inside `Witnesses.js` — no realtime subscription required for Wave 1 (poll-on-mount + 30s interval is fine; realtime is a Wave 4 polish item).

**Steps:**

- [ ] **Step 0.1 — Dispatch /codex:rescue with the task**

```
Task: Build a getActiveWitnesses(userId) helper in lib/witnesses.js (or
extend lib/streaks-advanced.js) that returns the active focus sessions
of users who share at least one group with the current user. Reference
spec at docs/superpowers/specs/2026-05-02-dashboard-editorial-stamps-design.md
section 4.1 + section 5 (Witnesses row) + section 10 (last bullet).

Existing focus_sessions query patterns: lib/FocusContext.js:116-261,
app/dashboard/groups/[id]/GroupDetailClient.js:72,
app/dashboard/stats/StatsPageClient.js:73-82.

Constraints: respect RLS, no schema changes unless absolutely necessary,
return empty array on no data, never null. If a migration is needed,
flag for confirmation before applying via Supabase MCP.

Return: the file path of the new helper and a one-line example of how
to call it from a React component.
```

- [ ] **Step 0.2 — Verify the helper**

Read the file codex created. Confirm:
- Default export or named export `getActiveWitnesses`
- Returns the documented shape
- No service-role client used (frontend hook will use the browser client)
- Empty array on no data

- [ ] **Step 0.3 — Commit (codex's commit, just review)**

Codex commits its own work; verify the commit message follows project conventions.

---

## Task A1 — DashboardNav (lockin-frontend)

**Files:**
- Create: `components/DashboardNav.js`
- Create: `components/DashboardNav.module.css`
- Read for context: `components/NavbarLanding.js`, `components/NavbarLanding.module.css` (sticky pattern + token usage), `/tmp/lockin-test/components/nav.tsx` (target structure), `app/globals.css` (tokens), `components/Sidebar.js` (what it currently does — XP ring, level badge, accent picker, sign-out), `components/NavMarker.js` (hover swipe)

**Scope:**

Sticky top nav for `/dashboard/*`. Mounts inside DashboardLayout (Task C1) instead of the existing sidebar.

Structure (left → right at ≥768px):
1. **Logo** — `<Link href="/dashboard">`. 14px yellow rotated square (`background: var(--stamp-yellow); transform: rotate(-8deg); border-radius: 2px;`) + "LockIn." with yellow `.` flourish. Same wordmark spec as NavbarLanding.
2. **Status pill** (≥1024px only): live time string + 6px stamp-green dot pulsing. Format: `Wed · 02 May · 14:23`. Uppercase 11px tracked. Use `useEffect` + `setInterval(60000)`. **Optional polish — drop if it adds complexity.**
3. **Section nav** (centered, flex 1): six links `Today` (`/dashboard`), `Pacts` (`/dashboard/pacts`), `Groups` (`/dashboard/groups`), `Focus` (`/dashboard/focus`), `Feed` (`/dashboard/feed` — note: this route doesn't exist yet, point at `/dashboard` for now and TODO note in code), `Profile` (`/dashboard/settings`).
   - Active state via `usePathname() && pathname.startsWith(href)`. Active = `--landing-ink` text + 2px highlighter underline beneath text (inset 12px from each edge).
   - Hover = NavMarker swipe. Calmer than landing — shorter sweep, lower amplitude. Pass a `variant="calm"` prop to NavMarker if needed; if NavMarker doesn't support a calm variant, add it (small CSS toggle).
4. **Right cluster:**
   - Rank chip (≥1024px only): `Highlighter · 1280m` style. 11px uppercase tracked. 1px border, 2px radius, low padding. Read XP/Level via existing helpers (`lib/gamification.js`).
   - Lock In button: outline `--stamp-blue` border, 4px radius, low padding, pulse-dot. Routes to `/dashboard/focus`.
   - Ink picker placeholder: 28×28 square with a 12×12 yellow rotated inner square. Click does nothing yet — Wave 3 wires it up. Add `aria-label="Change ink (coming soon)"` and `disabled` if it visually reads better; tooltip optional.
   - Avatar: `WitnessTile` component (existing) at `size="sm"` — links to `/dashboard/settings`.
5. **Mobile (≤768px):** logo + hamburger button (3 horizontal bars, 22×22). Tapping hamburger toggles a flat menu drawer below the bar with: section links (full-width rows), Lock In button, Sign out button. Sign out calls `supabase.auth.signOut()` then `router.push('/')`.

**Sticky behavior:** `position: sticky; top: 0; z-index: 30;` Background `color-mix(in oklch, var(--bg-primary) 95%, transparent)`. `backdrop-filter: blur(12px)`. Bottom border `1px solid var(--border-subtle)`. Same height as landing nav: 60px desktop, 56px mobile. `max-width: 1400px` inner container with 40px / 20px horizontal padding.

**Voice:** Section labels Title Case (`Today`, `Pacts`, etc.). CTA `Lock in`.

**Steps:**

- [ ] **A1.1 — Read context** (NavbarLanding, Sidebar, NavMarker, lockin-test nav.tsx). Note the differences: lockin-test uses Tailwind, ours uses CSS Modules.

- [ ] **A1.2 — Create DashboardNav.js** with the structure above. Use existing Supabase client for sign-out. Use `usePathname` from `next/navigation`. Use `WitnessTile` from `@/components/UserAvatar`.

- [ ] **A1.3 — Create DashboardNav.module.css.** Tokens only: `--bg-primary`, `--border-subtle`, `--landing-ink` / `--text-primary` (whichever the dashboard scope uses — read app/globals.css), `--stamp-yellow`, `--stamp-blue`, `--stamp-green`. Light + dark variants both must work.

- [ ] **A1.4 — Verify (Playwright MCP):**
  - Navigate `http://localhost:3000/dashboard` (auth required — assume signed-in session; if not signed in, sign in via Google OAuth or use a test session).
  - Resize 1440×900. Screenshot. Confirm logo + nav links + rank chip + Lock In + ink button + avatar all visible.
  - Hover each nav link in turn. Screenshot the hover state. Confirm NavMarker swipe animates.
  - Click Pacts. Verify URL changes; active underline moves under Pacts link.
  - Resize 1024×768. Screenshot. Status pill should disappear, rank chip stays.
  - Resize 390×844. Screenshot. Hamburger visible, all desktop links hidden. Tap hamburger, screenshot menu open. Tap a link, screenshot menu closed and navigation happened.
  - Toggle dark mode. Screenshot at 1440. Bar reads inverted-paper.
  - `browser_console_messages` — no errors.

- [ ] **A1.5 — Commit:**

```bash
git add components/DashboardNav.js components/DashboardNav.module.css
git commit -m "feat(dashboard-nav): add sticky top-nav DashboardNav component"
```

---

## Task A2 — Witnesses (lockin-frontend)

**Files:**
- Create: `components/Witnesses.js`
- Create: `components/Witnesses.module.css`
- Read for context: `components/UserAvatar.js` (WitnessTile), `lib/animations.js` (entrance presets), the new helper from Task 0
- Depends on Task 0 helper

**Scope:**

Live focus-session board — what your friends are doing right now. Renders inside `§ 02 — Witnesses now` section of the dashboard.

Structure:
- Empty state: caption "Nobody locked in right now." in 13px uppercase 0.18em tracking, ink-light color.
- Populated state: vertical list of WitnessTile rows. Each row:
  - WitnessTile (existing UserAvatar component) at `size="md"`.
  - Right of avatar: name (Host Grotesk 14px 600), focus-session minutes (`14m / 50m` tabular JetBrains Mono 12px), progress bar 4px tall, `--stamp-blue` fill, animates width.
  - Far right: muted timestamp `started 14:09` JetBrains Mono 11px.
- Max 5 rows visible; "and 3 more" link if more exist.
- Refresh every 30 seconds via setInterval; cleanup on unmount.

**Steps:**

- [ ] **A2.1 — Wait for Task 0 to land.** If not done, halt and surface to orchestrator.

- [ ] **A2.2 — Create Witnesses.js.** Use `'use client'`. Import the helper from Task 0. Use `useEffect` for initial fetch + 30s interval. Use existing `createClient` from `@/lib/supabase/client`.

- [ ] **A2.3 — Create Witnesses.module.css.** Vertical list, even spacing, no borders between rows (use `gap` on the container). Progress bar uses `--stamp-blue` fill on `--surface-2` track.

- [ ] **A2.4 — Verify (Playwright MCP):**
  - Mount preview: load any dashboard page that includes Witnesses (will be added by Task C2; until then mount in a temp test page or visually verify via the integration task).
  - **If integration not yet wired:** verify the component renders correctly via a visual sanity check on a temp `app/dashboard/_witnesses-debug/page.js` or by running it inline in DashboardClient if Task C2 has landed.
  - Verify empty state renders when no active witnesses.
  - Verify populated state renders 5 max with progress bars filling correctly.
  - Console clean.

- [ ] **A2.5 — Commit:**

```bash
git add components/Witnesses.js components/Witnesses.module.css
git commit -m "feat(witnesses): add live focus-session board"
```

---

## Task B1 — TodayBar token sweep (lockin-frontend)

**Files:**
- Modify: `components/TodayBar.js`
- Modify: `components/TodayBar.module.css`
- Read: `app/globals.css` (token names), `.impeccable.md` (TodayBar role description)

**Scope:**

Existing TodayBar already has the right structure (streak number, pact count, focus time today, streak-risk warning). Refresh tokens to OKLCH cream palette + ink cascade.

Specifically:
- Streak number uses `var(--font-display-editorial)` (system serif). Size: clamp(72px, 10vw, 128px). Weight 400. Letter-spacing -0.025em.
- Streak-risk warning uses `CLOSES SOON` `StatusChip` style if `at_risk === true` (reuse the chip pattern from PactCard if a shared `StatusChip` component doesn't exist; if creating a new one, name it `components/StatusChip.js` per `.impeccable.md` component vocabulary).
- Pact count + focus time today: Host Grotesk, single line, separated by `·` middots.
- All colors via tokens — no hex. Replace any surviving `#6366f1` with `var(--stamp-yellow)` or appropriate.
- Sweep brand-gradient leaks (`linear-gradient(135deg, #5B5EF5...)`) — replace with flat `--landing-ink` or `--stamp-yellow` per role.

**Steps:**

- [ ] **B1.1 — Read TodayBar.js + .module.css** to inventory current tokens / hex colors.

- [ ] **B1.2 — Replace tokens** in both files. Confirm `data-ink="redpen"` on `<html>` recolors any cascade-aware accent in TodayBar.

- [ ] **B1.3 — If creating StatusChip:** new file `components/StatusChip.js` + `.module.css`. Variants `kept | missed | closesSoon | pending | inProgress`. Used here and elsewhere. **YAGNI: only create if TodayBar specifically uses it; if not, skip until a later task needs it.**

- [ ] **B1.4 — Verify (Playwright MCP):** screenshot dashboard at 1440 light + dark, mobile 390. Visually confirm streak number is monumental serif, no purple gradient survives, ink cascade works (toggle `data-ink="redpen"` via `localStorage.setItem('lockin-ink', 'redpen'); location.reload()`).

- [ ] **B1.5 — Commit:**

```bash
git add components/TodayBar.js components/TodayBar.module.css \
       $([ -f components/StatusChip.js ] && echo components/StatusChip.js components/StatusChip.module.css)
git commit -m "feat(today-bar): editorial-stamps token sweep + monumental serif streak"
```

---

## Task B2 — ActivityFeed refactor (lockin-frontend)

**Files:**
- Modify: `components/ActivityFeed.js`
- Modify: `components/ActivityFeed.module.css`
- Read: `components/Stamp.js`, `components/UserAvatar.js`, `components/ActivityItem.js` (existing row), `lib/activity.js`, `lib/reactions.js`, `lib/comments.js`

**Scope:**

Refactor activity feed rows to editorial direction. Each row:
- WitnessTile avatar (`size="sm"`)
- Activity copy: `<Name> <verb> <target>` — name in 600 weight, verb + target neutral
- Inline `Stamp` (small variant, `size="sm"`, no slam animation in feed) for kept/missed entries
- JetBrains Mono timestamp at far right (`14:23`)
- Reactions: existing emoji-row pattern, kept
- Comments: collapsed to `[ 3 comments → ]` link by default; expandable to inline thread

Empty state: `Nothing yet. Add your first pact.`

Voice: direct-positive, concrete. `Maya kept #88` not `Maya completed pact #88!`. `Theo locked in — 50m`.

**Steps:**

- [ ] **B2.1 — Read ActivityFeed.js + ActivityItem.js + lib/activity.js** to inventory existing row types and reaction patterns.

- [ ] **B2.2 — Refactor row markup.** Keep the existing data-fetching + reaction + comment hookups. Only the row's visual structure changes.

- [ ] **B2.3 — Update CSS module** to match.

- [ ] **B2.4 — Verify (Playwright MCP):**
  - Dashboard at 1440. Screenshot the activity section. Rows should read like editorial diary entries.
  - Click an emoji reaction; verify reaction count updates.
  - Click a comments link; verify thread expands inline.
  - Mobile 390. Screenshot. Rows wrap reasonably.
  - Dark mode. Screenshot.
  - Console clean.

- [ ] **B2.5 — Commit:**

```bash
git add components/ActivityFeed.js components/ActivityFeed.module.css
git commit -m "feat(activity-feed): editorial row refactor with inline stamps + tight timestamps"
```

---

## Task B3 — MonthlyCalendar / heatmap restyle (lockin-frontend)

**Files:**
- Modify: `components/MonthlyCalendar.js` (read first — structure may already be fine)
- Modify: `components/MonthlyCalendar.module.css`
- Read: `app/globals.css` (ink token), `.impeccable.md` § Personal section (heatmap intensity bullet)

**Scope:**

Heatmap tile color follows ink cascade. Currently uses fixed indigo (`#6366f1` or similar). Replace with `oklch(L C 97 / opacity)` where L/C derive from `--stamp-yellow`'s OKLCH components (or use `color-mix(in oklch, var(--stamp-yellow) <opacity>, transparent)` for simplicity if browser support is fine — it is).

Tile fill scale (5 steps based on activity count):
- 0 events: `color-mix(in oklch, var(--ink-300) 30%, transparent)` (faint paper texture)
- 1-2 events: `color-mix(in oklch, var(--stamp-yellow) 30%, transparent)`
- 3-4: 55%
- 5-6: 75%
- 7+: 100%

Verify legibility in dark mode — cream-on-dark heatmap should still be readable. May need different opacity scale for dark.

**Steps:**

- [ ] **B3.1 — Read MonthlyCalendar.js + .module.css.** Inventory current fill logic.

- [ ] **B3.2 — Update CSS** to use the new fill scale. If JS computes the fill class, update there too.

- [ ] **B3.3 — Verify (Playwright MCP):**
  - Dashboard heatmap section at 1440 light. Screenshot. Tiles read as warm yellow paper.
  - Switch ink to `redpen` via localStorage. Reload. Screenshot. Tiles now red-pen colored.
  - Dark mode + Highlighter. Screenshot. Tiles still legible.

- [ ] **B3.4 — Commit:**

```bash
git add components/MonthlyCalendar.js components/MonthlyCalendar.module.css
git commit -m "feat(heatmap): ink-cascade-aware tile fill via color-mix"
```

---

## Task C1 — DashboardLayout: drop Sidebar, mount DashboardNav (lockin-frontend, sequential after A1)

**Files:**
- Modify: `app/dashboard/DashboardLayout.js`
- Read: existing layout to inventory what Sidebar provides (XP ring, level badge, accent picker, sign-out, keyboard shortcut hint). Verify each lives somewhere in the new DashboardNav (XP/Level on rank chip, sign-out in mobile menu, accent picker becomes ink picker — Wave 3, keyboard shortcut hint dropped or moved to settings).

**Scope:**

Replace `<Sidebar />` import with `<DashboardNav />`. Keep `<MobileNav />` import-stripped (the new DashboardNav has its own mobile drawer).

Layout becomes:
```jsx
<div className={styles.shell}>
  <DashboardNav user={user} />
  <main className={styles.main}>{children}</main>
</div>
```

Update `DashboardLayout.module.css` (which is `app/dashboard/loading.module.css` or shared with Dashboard.module.css — verify path) — remove sidebar grid columns; main becomes single column with `max-width: 1400px` centered + horizontal padding.

**Steps:**

- [ ] **C1.1 — Read DashboardLayout.js (127 lines).** Identify what Sidebar/MobileNav currently render; confirm they don't expose props critical to children.

- [ ] **C1.2 — Drop Sidebar + MobileNav imports + render.** Mount `<DashboardNav user={user} />` instead.

- [ ] **C1.3 — Update DashboardLayout.module.css** (or whichever module owns `shell` / `main`): remove sidebar grid; main = single column, max-width 1400px.

- [ ] **C1.4 — Verify (Playwright MCP):**
  - Navigate `/dashboard`. Screenshot at 1440 + 390.
  - Confirm sidebar is gone, top nav is sticky.
  - Click each nav link, confirm routing works.
  - Console clean (no errors from removed Sidebar imports).

- [ ] **C1.5 — Commit:**

```bash
git add app/dashboard/DashboardLayout.js app/dashboard/Dashboard.module.css
# If DashboardLayout.module.css exists separately, add it too
git commit -m "feat(dashboard-layout): drop sidebar, mount DashboardNav"
```

---

## Task C2 — DashboardClient sectional rebuild (lockin-frontend, sequential after C1 + B1/B2/B3 + A2)

**Files:**
- Rewrite: `app/dashboard/DashboardClient.js`
- Read: existing DashboardClient (305 lines) to inventory data flows + which queries it owns.

**Scope:**

Replace the current dashboard composition with the structure from spec §3.2:

```jsx
<>
  <TodayBar ... />
  <SectionHeader number="01" title="Today's pacts" />
  <PactGrid pacts={pacts} />
  <div className={styles.mosaic2}>
    <section>
      <SectionHeader number="02" title="Witnesses now" />
      <Witnesses />
    </section>
    <section>
      <SectionHeader number="03" title="Activity" />
      <ActivityFeed ... />
    </section>
  </div>
  <div className={styles.mosaic2}>
    <section>
      <SectionHeader number="04" title="Stats" />
      <MonthlyCalendar ... />
      <StreakBlock ... />     {/* may be inline; existing component or composed here */}
    </section>
    <section>
      <SectionHeader number="05" title="Achievements" />
      <AchievementsRail ... />  {/* may be inline; existing component or composed here */}
    </section>
  </div>
</>
```

`mosaic2` is a CSS Module class: `display: grid; grid-template-columns: 1fr 1fr; gap: 40px;` at ≥1024px, falls back to single column below.

Vertical rhythm between sections: `gap: 80px` (desktop) / `48px` (mobile) on the parent flex/grid container. SectionHeader has its own internal spacing.

Achievements rail extraction: if not already a standalone component, extract to `components/AchievementsRail.js` + `.module.css`. Same for any inline streak/stats blocks that need to live in `§ 04`. Keep extractions minimal — only extract if the rebuild requires shared structure.

PactGrid is composed inline (not a separate component) — it's `<div className={styles.pactGrid}>{pacts.map(p => <PactCard key={p.id} {...p} />)}</div>` with `display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 16px;`.

**Steps:**

- [ ] **C2.1 — Read DashboardClient.js (305 lines).** Map the current data flows (which hooks, which queries, which props pass to which child). Confirm none of them break when we change composition.

- [ ] **C2.2 — Rewrite the JSX** to the structure above. Keep all data-fetching hooks intact. Replace ActivityFeed + MonthlyCalendar usages with the new restyled versions (already updated by B2 + B3 — same import paths, no changes needed).

- [ ] **C2.3 — Add SectionHeader at every § seam.** Pass `number="01"`, `title="Today's pacts"`, etc. Caption prop (eg `caption="LIVE"`) optional per section.

- [ ] **C2.4 — Update or create `app/dashboard/Dashboard.module.css`** with the new `.mosaic2`, `.pactGrid`, `.shell`, `.main` rules. Single source of truth for dashboard composition.

- [ ] **C2.5 — Extract inline blocks if needed.** Only if the rebuild requires it:
  - `components/AchievementsRail.js` (if achievements were inline) — read existing inline JSX, extract verbatim, restyle to editorial direction inside the new file.
  - `components/StreakBlock.js` similar (only if needed).

- [ ] **C2.6 — Verify (Playwright MCP):**
  - `/dashboard` at 1440 light. Screenshot. All sections render in order. No layout breaks.
  - Click a pact → confirm it opens edit modal (existing flow).
  - Mark a pact kept → confirm Stamp slams + confetti fires + activity feed updates.
  - Toggle dark mode. Screenshot.
  - Resize 1024 → 768 → 390. Screenshot at each. Mosaic stacks correctly, pact grid wraps.
  - Console clean. No hydration warnings.

- [ ] **C2.7 — Commit:**

```bash
git add app/dashboard/DashboardClient.js app/dashboard/Dashboard.module.css \
       $([ -f components/AchievementsRail.js ] && echo components/AchievementsRail.js components/AchievementsRail.module.css) \
       $([ -f components/StreakBlock.js ] && echo components/StreakBlock.js components/StreakBlock.module.css)
git commit -m "feat(dashboard): sectional rebuild — § 01 pacts / 02 witnesses / 03 activity / 04 stats / 05 achievements"
```

---

## Task D1 — Wave 1 verification + indigo-leak audit (lockin-frontend)

**Files:**
- Read-only across `app/dashboard/` and `components/` for indigo-color audit
- Modify: any file with surviving `#6366f1` / `#5B5EF5` / brand-gradient leaks

**Scope:**

Final verification of Wave 1. Two parts:

**Part 1 — Visual audit at 1440 / 1024 / 390 in light + dark, with at least 3 inks (Highlighter, Red Pen, Carbon Copy):**
- `/dashboard` (the rebuilt page)
- `/dashboard/pacts` (untouched in Wave 1, but verify the new top nav reads correctly above it)
- `/dashboard/focus`, `/dashboard/groups`, `/dashboard/settings` — at minimum verify the DashboardNav looks correct above them; their content is Wave 2.

**Part 2 — Indigo-leak audit:**
- `grep -rn "#6366f1\|#5B5EF5\|#7C4DFF\|#E040CB\|gradient.*indigo\|gradient-primary" app/dashboard components`
- Replace any survivors with `var(--stamp-yellow)`, flat `var(--landing-ink)`, or remove if decorative.
- Skip `/lockin-ios/` and the legacy `indigo-legacy` ink path.

**Steps:**

- [ ] **D1.1 — Visual audit.** Take screenshots of `/dashboard` at all 6 sizes-themes-inks combos. File paths under `.playwright-mcp/wave1-d1-*.png`. Flag any obvious bugs.

- [ ] **D1.2 — Console audit.** `browser_console_messages` after navigating each dashboard route. No errors related to Wave 1 changes. Hydration warnings = bugs.

- [ ] **D1.3 — Indigo grep.** Run the grep above. List survivors. Categorize each: decorative leak (replace), legacy ink path (keep), level-up easter-egg (keep, document).

- [ ] **D1.4 — Replace decorative leaks.** Edit each survivor inline. Token-only replacements.

- [ ] **D1.5 — Commit:**

```bash
git add -A   # only files touched by D1.4
git commit -m "fix(dashboard): sweep surviving indigo / brand-gradient leaks"
```

- [ ] **D1.6 — Wave 1 done check.** Confirm acceptance criteria from spec §9 that fall in Wave 1 scope:
  - [x] `/dashboard` renders with real data, all flows work
  - [x] DashboardNav sticky on all dashboard routes
  - [x] Sidebar.js + MobileNav.js no longer imported in `/app/dashboard` (verify via grep — the files still exist but aren't imported)
  - [x] Light + dark mode both work
  - [x] Visual parity at all sizes
  - [x] Keyboard shortcuts still work
  - [x] No surviving indigo gradients (outside legacy ink + level-up easter-egg)

The remaining acceptance criteria (ink picker live cascade, migration logic, full WCAG sweep across all dashboard surfaces) belong to Wave 2 + 3. Do not check them off here.

---

## Self-review — Wave 1 plan

**Spec coverage:** Wave 1 in the spec covers: rebuild authenticated `/dashboard`, drop sidebar, sticky top nav, sectional rhythm, witnesses board, ink-cascade-aware data viz, real Supabase data preserved. Each maps to a task above.

**Placeholder scan:**
- "TODO: route doesn't exist yet" in Task A1 (Feed link → `/dashboard`). Acknowledged limitation, not a placeholder for a missing implementation; documented inline.
- "TBD pending Vayun confirmation" — none in Wave 1.
- "Add error handling" — only mentioned for the new helper in Task 0, where codex makes the call.

**Type/name consistency:**
- `getActiveWitnesses(userId)` in Task 0 → consumed by Witnesses.js in Task A2 ✓
- `DashboardNav` referenced in Task C1 (mount) ✓
- `Witnesses` referenced in Task C2 (mount in § 02) ✓
- `SectionHeader` (existing component) used in Task C2 — verify props match the existing API by reading `components/SectionHeader.js` before C2.3.

**Scope check:** Wave 1 is a single coherent unit (rebuild one page + its layout chrome). Wave 2 (other auth routes) and Wave 3 (ink picker + cleanup) get their own plans after Wave 1 lands.

**Ambiguity:**
- StatusChip extraction (B1.3): YAGNI'd — only extract if TodayBar specifically needs it.
- Ink picker placeholder in DashboardNav (A1.4 right cluster): renders the button, click does nothing yet. Wave 3 wires the panel.

Plan complete. Saved to `docs/superpowers/plans/2026-05-02-dashboard-wave-1.md`.
