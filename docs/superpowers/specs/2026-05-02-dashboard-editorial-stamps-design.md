# Dashboard editorial-stamps redesign — design spec

**Status:** Approved 2026-05-02 (Vayun: A/A/A/A on Wave 0.5 brainstorm; demo dashboard scope dropped on second pass).
**Branch:** `redesign/2026-05-02-navbar-dashboard` (off `redesign/2026-04-19-editorial-stamps`, which carries the landing redesign and the new Stamp/SectionHeader/UserAvatar/NavMarker/Ticker components).
**Anchor:** `.impeccable.md` — voice (direct-positive on dashboard), ink cascade, OKLCH cream palette, system-serif display + Host Grotesk + JetBrains Mono, single-signal urgency, glass on modals only.

This spec covers Waves 1–3 of the dashboard redesign. Wave 0 (landing navbar swap) is already shipped on this branch. Wave 4 (audit/polish) is a follow-up pass, not in this spec.

---

## 1. Scope

Apply the editorial-stamps direction to the product. Same warm-paper feel, same rubber-stamp resolution mechanic, same § sectional rhythm — extended from marketing into the surfaces students use daily.

**In scope**
- Wave 1: Authenticated `/dashboard` rebuild with real Supabase data, new top-nav chrome, sectional rhythm.
- Wave 2: `/dashboard/pacts`, `/dashboard/groups`, `/dashboard/focus`, `/dashboard/stats`, `/dashboard/settings` ported to the editorial direction.
- Wave 3: Ink-picker UI in the header (and accessible from settings) writing `lockin-ink` to localStorage; one-time migration from old `lockin-accent` keys.

**Out of scope**
- Public demo dashboard at `/preview` — dropped 2026-05-02 after second pass. Maintenance cost too high for a solo project; sign-in friction is already minimal (Google OAuth, one click). If a try-before-sign-in flow is wanted later, build it after the real dashboard exists.
- Wave 4 audit/polish — separate session.
- Backend / API changes (no DB migrations, no new endpoints).
- iOS app (`/lockin-ios/`) — independent track.
- Performance tuning beyond what the rebuild incidentally improves.

**Agent assignment for the build**
- Frontend (UI components, layout, CSS, motion, ink picker) → `lockin-frontend` agent.
- Backend touches (Supabase queries, RLS sanity, data-layer edge cases, any cron/email work that the rebuild surfaces) → `/codex:rescue`.

---

## 2. Decisions locked in (Wave 0.5 brainstorm + 2026-05-02 second pass)

| Decision | Pick | Why |
|---|---|---|
| Demo dashboard | **Dropped.** | Maintenance debt across `/preview/*` routes + `previewMode` prop + `lib/demoData.js` outweighs marketing payoff. LockIn signup friction is already one click. |
| Dashboard structure | Hybrid — keep TodayBar, port lockin-test sectional rhythm + live witnesses board | TodayBar is a good first impression for returning users; sectional rhythm and witnesses board are the lockin-test wins worth porting. |
| Sidebar | **Kill it.** Replace with sticky top nav (lockin-test pattern). | Sidebars read SaaS. Top nav reads confident, simplifies mobile, makes warm-paper consistent across surfaces. |
| Ink picker | Header dropdown next to avatar (always reachable) + settings page entry | Ink is identity, not preference. One-click access; the recolor cascade is the wow moment. |

---

## 3. Information architecture

### 3.1 Top nav (replaces Sidebar + MobileNav)

New `components/DashboardNav.js` + `.module.css` mounted in `app/dashboard/layout.js`. Pattern adapted from `/tmp/lockin-test/components/nav.tsx`.

**Desktop (≥768px) layout left → right:**
1. Logo (yellow rotated square + "LockIn." with yellow `.`) → links to `/dashboard`.
2. Status pill (shown ≥1024px only, hidden below): live time stamp + active-state dot — small editorial flourish. Optional polish; drop if it adds noise.
3. Section links: `Today` / `Pacts` / `Groups` / `Focus` / `Feed` / `Profile`. Active state: 2px highlighter underline beneath link, inset 12px from each side. Use the same NavMarker hover behavior as the landing nav (so users recognize the system); calm version — shorter sweep, lower amplitude.
4. Right cluster:
   - Rank chip — "Highlighter · 1280m" or equivalent, derived from XP/Level (don't rename to "Marks/Ranks/Seals" — keep the XP/Level/Streak labels per `.impeccable.md`).
   - **Lock In** button — outline-style with carbon-blue border, pulse dot. Routes to `/dashboard/focus`.
   - Ink-picker button — 28×28 with a 12×12 yellow rotated square inside. Click opens panel.
   - Avatar — links to `/dashboard/profile` or settings.

**Mobile (≤768px):**
- Logo + hamburger button on right.
- Hamburger drops a flat list of nav links + Lock In CTA + Ink picker + Sign out.
- Replace existing `components/MobileNav.js` usage in dashboard layout — delete the file once unreferenced.

**Sticky behavior:** `position: sticky; top: 0; z-index: 30;` Background `color-mix(in oklch, var(--bg-primary) 95%, transparent)` + `backdrop-filter: blur(12px)`. Bottom border `1px solid var(--border-subtle)`. Same spec as the landing navbar.

### 3.2 Dashboard page structure (`/dashboard`)

```
[ Sticky DashboardNav ]
[ TodayBar — streak monumental, pact count, focus time today, streak-risk ]
[ § 01 — Today's pacts ]              full-width grid of PactCard, 2/3-col responsive
[ § 02 — Witnesses now / § 03 — Activity ]    2-col mosaic at ≥1024px, stacked below
   ↳ § 02: live focus-session cards from friends, progress bars, names
   ↳ § 03: Ticker + recent activity feed (reactions, comments, kept/missed)
[ § 04 — Stats / § 05 — Achievements ]    2-col mosaic at ≥1024px, stacked below
   ↳ § 04: monthly heatmap + streak number (Redaction-equivalent system serif) + personal best
   ↳ § 05: rail of earned + locked seals (label stays "Achievement", not "Seal")
[ Footer breadcrumb — § Pact #N indices, JetBrains Mono ]
```

**Container:** `max-width: 1400px`, horizontal padding `40px` desktop / `20px` mobile, vertical rhythm via section spacing (≥80px between sections desktop, ≥48px mobile). No global page card container — sections own their own surfaces.

**SectionHeader** component (already built) used at every § seam: `§ 0N` JetBrains Mono numeral + Host Grotesk title + uppercase 11px tracked caption.

### 3.3 Voice on dashboard surfaces (direct-positive, NOT wry)

Per `.impeccable.md` voice scope:

- Hero/TodayBar: "Streak at 12 days · 3 pacts due today · Locked in 45m"
- Pact urgency: "CLOSES SOON" sticker (existing) — fact, not jab
- Empty states: "Add your first pact to start building a streak." / "No pacts due today. Make one."
- Witness tile: name initial, focus-session minute counter
- Activity row: "Maya kept #88" / "Theo locked in — 50m" — concrete, no editorializing

**Marketing-wry copy is banned on dashboard surfaces.** No "Stop lying to yourself" on the dashboard; that lives on landing only.

---

## 4. Data + state

### 4.1 Authenticated dashboard data flow

Existing `app/dashboard/page.js` + `DashboardClient.js` keep their Supabase data flow. The rebuild is structural (replace section markup), not a data refactor. Today's pacts, focus sessions, activity, achievements, stats — all already wired.

The new `Witnesses` component reads from existing `focus_sessions` data (active sessions for users in the current user's groups). No schema changes; new query only.

If any backend touches surface during the rebuild (a missing query, an RLS gap, a cron job that needs adjustment), delegate to `/codex:rescue`. The frontend agent should not edit Supabase queries — it should flag what it needs and the orchestrator routes to codex.

### 4.2 Ink picker state

- localStorage key: `lockin-ink` — values `highlighter | redpen | carbon | moss | indigo-legacy`.
- The ink is read by the existing `[data-ink="..."]` boot script on `<html>` (already in `app/layout.js`).
- The picker UI writes the new key on selection AND triggers a re-read so the page recolors instantly without reload.
- Migration: on first read, if `lockin-ink` is unset but `lockin-accent` is set, map old → new:
  - `indigo` (default old) → `highlighter` (new default)
  - `violet` → `indigo-legacy`
  - `rose` → `redpen`
  - `ocean` → `carbon`
  - `emerald` → `moss`
  - `sunset` → `redpen`
  - `slate` → `carbon`
- After migration, write `lockin-ink` and leave `lockin-accent` in place (don't break legacy code paths until they're confirmed unused).

---

## 5. Component changes

| Component | Action |
|---|---|
| `DashboardNav.js` + `.module.css` | NEW. Sticky top nav. Replaces Sidebar in dashboard layout. |
| `Sidebar.js`, `Sidebar.module.css` | Stop importing into dashboard layout. Keep file in repo for one wave so we can confirm nothing else references it; delete in Wave 3 final pass. |
| `MobileNav.js`, `.module.css` | Same — stop importing, delete in Wave 3 final pass. |
| `TodayBar.js` | Keep. Restyle minimally to match new tokens. Streak number uses display-editorial system serif. |
| `PactCard.js` | Already updated for editorial-stamps in the landing-redesign PR. No structural change in this spec. |
| `ActivityFeed.js` | Refactor to a simpler list using `Stamp` + `WitnessTile` rows. Reactions stay. Comments collapse to inline text + count, expandable. |
| `Witnesses.js` (NEW) | Live focus-session board. Reads from existing `focus_sessions` table data via existing Supabase client. WitnessTile + minute counter + progress bar. |
| `Heatmap`, `MonthlyCalendar` | Restyle to ink cascade (tile color uses `--stamp-yellow` at varying opacity per current ink). |
| `Achievements.js` | Restyle rail. Earned vs. locked visual distinction via opacity + cream-paper vs. glassine treatment. Keep "Achievement" label. |
| `InkPicker.js` + `.module.css` (NEW) | Panel triggered from DashboardNav. 5 ink swatches with live preview-on-hover. Selection writes localStorage + dispatches `storage` event so the boot script re-applies. |

---

## 6. Routing

| Route | Auth | Status |
|---|---|---|
| `/dashboard`, `/dashboard/*` | Yes | Existing — restructured |

No new routes in this spec.

---

## 7. Build sequence

1. **Wave 1 — Authenticated dashboard rebuild.**
   - New `components/DashboardNav.js` + `.module.css`.
   - New `components/Witnesses.js` + `.module.css` (reads existing `focus_sessions` data).
   - Update `app/dashboard/layout.js` — drop Sidebar import, mount DashboardNav.
   - Rewrite `app/dashboard/page.js` + `DashboardClient.js` to mirror the structure in §3.2 with real Supabase data.
   - Restyle `TodayBar.js`, `ActivityFeed.js`, `Heatmap.module.css`, `Achievements.module.css` to ink-cascade-aware tokens.
   - Verify all existing data flows still work (TodayBar streak, pact CRUD, witnesses, activity reactions, achievements rail, heatmap).
   - Verify at 1440 + 1024 + 390. Light + dark mode.

2. **Wave 2 — Other auth routes.**
   - Port `/dashboard/pacts` → grid of PactCards by category.
   - Port `/dashboard/focus` → timer page with witnesses-of-me view.
   - Port `/dashboard/groups` + `/dashboard/groups/[id]` → group list + Kanban with editorial chrome.
   - Port `/dashboard/stats` → expanded heatmap + streak + chart breakdowns.
   - Port `/dashboard/settings` → editorial settings sections (profile, timer, theme, **ink**, shortcuts).

3. **Wave 3 — Ink-picker UI + cleanup.**
   - New `components/InkPicker.js` + `.module.css`.
   - Mount in DashboardNav.
   - Add ink section to `/dashboard/settings`.
   - Migration logic from `lockin-accent` → `lockin-ink`.
   - Delete unreferenced `Sidebar.js` + `MobileNav.js` (after confirming no remaining imports via grep).
   - Audit `app/dashboard/*` for surviving `#6366f1` indigo-gradient leaks.

4. **Wave 4 — Audit + polish (separate session, not this spec).**
   - `/critique`, `/audit`, `/polish` over the rebuilt dashboard.
   - Address findings.
   - Open PR.

---

## 8. Constraints (re-stated for the implementing agent)

- JavaScript + CSS Modules only. No TypeScript. No Tailwind. No CSS-in-JS.
- Impeccable absolute bans: no `border-left/right ≥ 2px`, no `background-clip: text` + gradient.
- Glass on modals only (`backdrop-filter: blur()` on the sticky DashboardNav is the established sticky-bar exception, same as landing).
- Keep XP / Level / Streak / Achievement product labels.
- Keep confetti on pact completion + streak-celebration animations.
- Sweep `#6366f1` / indigo-purple-magenta gradient leaks in dashboard components — landing waves left dashboard untouched.
- Dashboard supports BOTH light and dark mode (landing is light-only). Dark mode = inverted paper.
- No new npm dependencies — use existing primitives (Framer Motion, CSS Modules, Phosphor icons).
- Confrontational-wry voice stays banned on dashboard surfaces.
- Frontend agents do not edit Supabase queries / RLS / cron jobs. Anything backend goes to `/codex:rescue`.

---

## 9. Acceptance criteria

- [ ] `/dashboard` renders with real data, all existing flows work (TodayBar streak, pact CRUD, focus timer, activity reactions, stats heatmap, achievements rail).
- [ ] DashboardNav sticky at top across all dashboard routes; identical chrome on every surface.
- [ ] Sidebar.js and MobileNav.js no longer imported anywhere under `/app/dashboard`.
- [ ] Ink-picker switches the cascade live without reload.
- [ ] Migration from `lockin-accent` → `lockin-ink` runs once on first visit; no double-write.
- [ ] No `#6366f1` or indigo→purple→magenta gradient surviving anywhere outside the explicit legacy ink + level-up easter-egg paths.
- [ ] Light + dark mode both render correctly across all dashboard surfaces (warm cream / inverted paper).
- [ ] Visual parity at 1440, 1024, 768, 390. No horizontal scroll on mobile.
- [ ] All keyboard shortcuts still work (Cmd+N, Space, Escape).
- [ ] Reduced motion: dashboard motion gated by `prefersReducedMotion()` helper.
- [ ] WCAG AA contrast holds on all ink colors against cream + dark paper.

---

## 10. Risks + open questions

- **Sidebar removal blast radius.** The current sidebar holds: nav, XP ring, level badge, accent picker, sign-out, keyboard shortcut hint. Each must land somewhere in the new top nav or settings — verify nothing is dropped. Accent picker functionality is replaced by the new InkPicker.
- **DashboardNav vs NavbarLanding.** Two separate components, intentional. Landing nav uses anchor links to landing sections; dashboard nav uses route links + active-state highlighter underline + Lock In CTA + ink picker. They share the logo + nav-link visual language but not the code.
- **Ink-cascade-aware data viz.** Heatmap currently uses fixed indigo colors. Wave 1 restyle requires the heatmap fill to follow `--stamp-yellow`. Verify this works in dark mode (cream-on-dark heatmap should still be legible).
- **Backend touchpoints during rebuild.** The Witnesses component needs a query against `focus_sessions` filtered to current user's group members. If the existing data layer doesn't expose this cleanly, surface to `/codex:rescue` rather than letting the frontend agent improvise a Supabase query.
