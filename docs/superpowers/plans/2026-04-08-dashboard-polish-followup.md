# Dashboard Polish Follow-up

> Items deferred from `dashboard-redesign` branch (33 commits). Secondary UI components and enhancements that weren't in the main redesign scope. Organized by priority — do high-impact items first.

**Branch:** `dashboard-polish` off main (after `dashboard-redesign` merges)
**Design context:** See CLAUDE.md "Design Context" section and `.aidesigner/dashboard-mockup-v2.html`
**Phosphor Icons:** Already installed (`@phosphor-icons/react`). Use for UI chrome only — keep emojis for content (templates, categories, reactions).
**Continuation prompt:**
```
Continue LockIn dashboard polish. Read docs/superpowers/plans/2026-04-08-dashboard-polish-followup.md
for the full checklist. Branch: dashboard-polish off main. Phosphor Icons already installed.
Design context in CLAUDE.md. Mockup at .aidesigner/dashboard-mockup-v2.html.
```

---

## Priority 0: Critical Bugs (from /critique)

### Missing Urgency Tokens ✅ FIXED
The `--urgency-amber`, `--urgency-amber-rgb`, `--urgency-amber-bg`, `--urgency-red`, `--urgency-red-rgb`, `--urgency-red-light` tokens were referenced 23+ times across PactCard, TodayBar, TaskCard, and DailySummaryCard but never defined in globals.css. **Fixed:** Tokens added to both `:root` and `[data-theme="dark"]` in globals.css.

### Duplicate CreatePactModal ✅ FIXED
`DashboardLayout.js` and `PactsPageClient.js` both mounted separate `CreatePactModal` instances. On /dashboard/pacts, two modals existed in the DOM. **Fixed:** Removed modal from PactsPageClient, now uses `open-create-pact` CustomEvent.

### Focus Timer Mode Pills Non-Functional ✅ FIXED
Focus/Short Break/Long Break pills had no onClick handler. **Fixed:** Added `switchMode` to FocusContext, wired pills in FocusPageClient. Also added long break support (15min, auto-triggers every 4th session).

---

## Critique Findings (Unresolved)

- [ ] **No greeting/personalization** — `firstName` computed in DashboardClient.js:157 but never displayed. Header just says "Dashboard".
- [ ] **"View Older Activity" routes to /dashboard/stats** — users expect more activity, not analytics.
- [ ] **Glassmorphism performance audit** — 14 files use `backdrop-filter: blur()` (~26 instances). Consider removing blur from PactCard (inside scrollable list).
- [ ] **Streak calculation inconsistency** — DashboardClient uses `calculateStreak()` with timezone; TodayBar reads `profile.current_streak` from DB. Three-way priority chain can show stale numbers.
- [x] **Sidebar .logoText gradient** — dead gradient-clip CSS (PNG images used instead). ✅ FIXED
- [x] **XP float + shimmer infinite animations** — both were `infinite` instead of one-shot. ✅ FIXED
- [x] **Dead CSS** — 85 lines of unused sidebar styles in Dashboard.module.css. ✅ FIXED
- [ ] **Bounce easing overshoot** — `--transition-bounce: cubic-bezier(0.34, 1.56, 0.64, 1)` overshoots. Used in 4 modal animations.
- [ ] **TodayBar confetti dots always-on** — `.confettiDotBlue`/`.confettiDotGreen` appear at all streak levels, should be earned (7+ days).
- [ ] **Social proof absent from main dashboard** — Activity feed shows only user's own actions. Principle 2 scored 2/5. Design brief below.
- [ ] **GroupsPage side-tab + width transition** — `border-left: 3px solid var(--accent-primary)` (line 93) is an AI slop tell. `transition: width` (line 228) causes layout thrash. Replace border with bg tint, switch to transform.
- [ ] **TodayBar hardcoded colors** — 7 instances of `#FFFCF5` and 11 instances of `rgba(255, 184, 0, ...)` instead of CSS variables. Extract to `--today-bar-bg` and use `var(--streak-color-rgb)` consistently.

### Social Proof Surface — Design Brief (from /shape)

**Component:** `SocialPulse` — compact social indicator at top of Activity Feed column.
**Data:** Query `activity_log` joined with `group_members` for today's distinct active users (excluding self).
**Layout:** Single row — avatar stack (up to 3, overlap -8px) + text. ~48px height. Subtle tint bg `rgba(var(--accent-primary-rgb), 0.04)`, no card/border.
**Copy:** 3+ active: "{Name1}, {Name2} +{N} locked in today" · 1-2: "{Name1} locked in today" · 0: "Your groups are quiet today — be the first" · No groups: don't render.
**States:** Active (avatar stack + count), empty (muted challenge text), no groups (hidden), loading (skeleton pulse), error (silent fail).
**Interaction:** Passive only — no clicks, no hover. Count animates on change (AnimatePresence popLayout, same as streak count).
**Deferred to v2:** Milestone celebrations in social feed, link to /dashboard/friends, Supabase realtime subscriptions.

---

## Priority 1: Functional Fixes

### Focus Timer — Wire Mode Pills ✅ FIXED (Priority 0)
Moved to Priority 0 and fixed: added `switchMode` to FocusContext, wired pills, added long break support (15min, auto-triggers every 4th session).

### Activity Feed — Inline Reaction Counts
Data exists in `activity_reactions` table but isn't rendered inline on dashboard activity items.
- [ ] Read `components/ActivityItem.js` — check if reactions are fetched
- [ ] Render compact reaction pills inline: `🔥 3  👏 1` (like the mockup)
- [ ] Only show reactions that have counts > 0
- [ ] Keep the "add reaction" button on hover

---

## Priority 2: Modal Polish (Glass + Warm Tokens)

All modals should match the design language: glass backdrop blur, warm surface tokens, Instrument Sans headings. **Keep emojis** in template/category pickers — they're content, not UI chrome.

### OnboardingChecklist (Redesign — needs brainstorming)
The onboarding is the **first thing new users see** after signing in. It deserves more than token warmup — it needs design thought.
- [ ] **Brainstorm first** — use `superpowers:brainstorming` to decide:
  - Should the checklist use the same warm card styling as TodayBar?
  - Does it need a progress indicator (like a mini XP bar showing setup completion)?
  - Should steps use Instrument Sans headings with varied visual weight?
  - How should it dismiss/collapse after completion? (fade, slide, confetti?)
  - Does it conflict visually with TodayBar + XP bar stacked above it?
  - Should there be a "skip for now" option that's more prominent?
- [ ] Apply Instrument Sans to heading ("Get Started" or whatever the title is)
- [ ] Warm surface tokens on the checklist card
- [ ] Replace inline SVG icons with Phosphor (checkmarks, arrows, etc.)
- [ ] Add completion celebration (confetti? XP reward? level-up moment?)
- [ ] Verify it looks right between XP bar and TodayBar in the dashboard layout
- [ ] Test with 0 steps complete, partial, and all complete states
- [ ] Dark mode
- [ ] Mobile responsive

### CreatePactModal
- [ ] Apply Instrument Sans (`var(--font-display)`) to "New Pact" heading
- [ ] Verify glass backdrop blur (currently 12px overlay + 20px card — this is fine)
- [ ] Warm up any hardcoded card backgrounds to `var(--surface-1)` / `var(--surface-glass)`
- [ ] Keep template emojis (📚, 💪, 📖, 🚀) — they're content identifiers, not UI icons
- [ ] Replace any inline SVG UI icons (close button, plus icon) with Phosphor
- [ ] Verify dark mode

### CreateGroupModal
- [ ] Instrument Sans heading
- [ ] Warm surface tokens
- [ ] Replace inline SVG UI icons with Phosphor
- [ ] Verify dark mode

### JoinGroupModal
- [ ] Same treatment as CreateGroupModal

### Command Palette
- [ ] Warm surface tokens + glass blur
- [ ] Replace inline SVG UI icons (search, arrow) with Phosphor
- [ ] Keep emojis in command descriptions — they add personality
- [ ] Verify dark mode

---

## Priority 3: Component Polish

### Notification Panel
- [ ] Warm surface tokens on notification items
- [ ] Replace inline SVG icons with Phosphor
- [ ] Verify dark mode contrast on unread indicators

### OnboardingChecklist
- [ ] Warm token consistency
- [ ] Replace inline SVG icons with Phosphor
- [ ] Verify it doesn't clash with the new TodayBar layout

### Phosphor Icon Sweep
Files that may still have inline SVGs for UI elements:
- [ ] `components/ActivityItem.js` — action icons (reaction, comment, share)
- [ ] `components/NotificationItem.js` — notification type icons
- [ ] `components/PactCard.js` — check for remaining inline SVG UI icons
- [ ] `components/EmptyState.js` — keep custom SVG illustrations (decorative, not icons)

---

## Priority 4: Layout & Visual Enhancements

### EmptyState — Per-Page Variants
The spec called for different empty state layouts per page. Currently all pages use the same centered `EmptyState` component.
- [ ] Dashboard empty: asymmetric layout with prominent "Create Your First Pact" CTA
- [ ] Pacts empty: different illustration/copy than groups empty
- [ ] Groups empty: social-focused copy ("Create a group to hold each other accountable")
- [ ] Focus empty: minimal, timer-focused ("Start your first focus session")
- [ ] Stats empty: calendar-focused ("Complete pacts to see your activity here")
- [ ] This needs design brainstorming — use `superpowers:brainstorming` skill first

### Pact Card Enhancements
- [ ] Category tags (needs `category` field on pacts table, or infer from template used)
- [ ] Due-today card: accent color on title hover
- [ ] Consider: overdue card "Resolve" action — but only if the feature exists in the app

### Activity Feed Enhancements
- [ ] "View Older Activity" link destination — decide: dedicated activity page or expand in-place?
- [ ] Friends/Global toggle (needs backend: filter activity by followed users vs all)
- [ ] Compact card variant optimized for the dashboard right column (smaller avatars, tighter spacing)

---

## Priority 5: Animation & Motion

### Animation Review
- [ ] Verify all card hover effects are varied (overdue=red glow, today=amber, completed=none, default=subtle lift)
- [ ] TodayBar: animate count changes on pact completion (number transition)
- [ ] Pact list: stagger reveal on initial load
- [ ] Verify blanket route transition is still removed (DashboardLayout.js)
- [ ] Confetti still fires on achievements/milestones (test with streak = 7, 14, 30)
- [ ] XP bar: "+N XP" floating indicator animation on XP gain

---

## Priority 6: Quality & Accessibility

### Accessibility
- [ ] All Phosphor icons: `aria-hidden="true"` on decorative, `aria-label` on interactive
- [ ] Color contrast on warm backgrounds — verify WCAG AA (4.5:1 body, 3:1 large)
- [ ] Keyboard navigation through TodayBar zones (tab order, focus visible)
- [ ] Screen reader: TodayBar announces "2 day streak, all done for today, 0 minutes focused"
- [ ] Focus timer: mode pills keyboard accessible (arrow keys to switch)

### Cross-Page Regression Check
- [ ] Auth pages (sign-in card) — verify warm tokens look correct
- [ ] Landing page on main — verify no regression from globals.css token changes
- [ ] Mobile (375px iPhone SE, 414px iPhone Pro) — all 6 dashboard pages
- [ ] iPad (768px) — verify TodayBar stacks, pacts single column
- [ ] Laptop (1024px) — verify activity column collapses below pacts
- [ ] Desktop (1440px) — verify 1200px max-width centering

---

## Decision Log

| Decision | Rationale |
|---|---|
| Keep emojis in templates/categories | Content identifiers, not UI chrome. Adds Duolingo personality. |
| Keep emojis in command palette | Same reason — command descriptions benefit from playful emojis |
| Phosphor for UI icons only | Sidebar, nav, buttons, action icons — clean and consistent |
| EmptyState needs brainstorming | Per-page variants are a design decision, not just CSS |
| Friends/Global toggle deferred | Needs backend query filtering — not just frontend |
| Category tags deferred | Needs DB schema change or template inference logic |
| Urgency tokens fixed | Fixed missing --urgency-amber/red definitions in globals.css |
| Duplicate modal removed | PactsPageClient now uses layout-level modal via CustomEvent |
| Timer pills wired | Added switchMode to FocusContext, long break support added |
| Social proof deferred | Needs /shape design session before implementation |
