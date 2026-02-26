# UI Ascend — Complete Visual Redesign

**Date:** 2026-02-26
**Approach:** Token Evolution (Approach A) — redesign the design token layer and cascade through every component CSS module. No JS logic changes.
**Branch:** `ui-ascend` (git worktree)

## Design Principles

- **Delightfully alive** — every interaction has feedback, earned moments get celebrations, idle states feel calm
- **Not a copy** — inspired by Duolingo (juiciness, gamification feel) and Brilliant (crafted, intelligent), but distinctly LockIn
- **Both modes first-class** — adaptive to system preference, dark and light get equal treatment
- **Mixed shape language** — rounded interactive elements (buttons, badges, toggles), sharp typographic hierarchy
- **Zero feature sacrifice** — pure visual/animation transformation, all logic untouched

## 1. Color Evolution

### Light Mode — "Luminous"
- Backgrounds shift from pure white to warm off-whites with violet undertone (`#FAFAFF`, `#F6F5FF`)
- Cards get frosted-glass effect: `backdrop-filter: blur(12px)` + semi-transparent backgrounds
- Accent gradient stays indigo→purple→magenta but richer, more saturated stops
- New celebration accent: warm gold (`#F5A623`) for achievements/streak milestones
- Active elements get soft ambient glow behind them

### Dark Mode — "Deep Space"
- Deeper backgrounds with blue undertone (`#08090D`, `#0E1117`, `#161B25`) — Linear/Raycast depth
- Cards get subtle gradient borders (1px gradient, not solid color), floating-in-space feel
- Accent glows amplified — elements feel like they emit light
- Status colors slightly brighter for readability

### Shared
- Status colors get personality: success = celebratory emerald with glow, danger = urgent with subtle pulse
- New token: `--accent-celebration` — warm gold for achievements, distinct from primary gradient

## 2. Typography & Shape

### Typography
- Keep Inter for body, add Inter Display (or Inter weight 800) for headlines/large numbers
- Headlines (`text-2xl`+): `letter-spacing: -0.03em` — tight, confident, designed
- Stats/streaks/timers: `font-variant-numeric: tabular-nums` + weight 700-800
- Labels/captions: `letter-spacing: 0.06em` + `text-transform: uppercase` + lighter weight
- Clear hierarchy: "what you read" (tight, heavy) vs "what categorizes" (spaced, light)

### Shape Language
- Interactive elements (buttons, toggles, badges): `radius-full` or `radius-2xl` — bubbly, inviting
- Content containers (cards, modals): `radius-xl` to `radius-2xl` — structured but soft
- Key cards get gradient borders via `background-clip` trick
- Cards get layered shadows: tight structural shadow + diffused accent-tinted atmosphere shadow

## 3. Animation System — Three Tiers

### Tier 1 — Ambient (always running, barely noticed)
- Sidebar active nav item: gradient shimmer shifts hue over ~8s
- XP bar: slow shine/glint sweeps across fill every ~5s
- Focus timer ring: soft breathing glow when active (~4s cycle)

### Tier 2 — Responsive (reacts to interaction)
- Button press: `scale: 0.97` + brief color flash (~100ms)
- Card hover: lift + accent-tinted shadow intensification
- Checkbox/pact completion: snap overshoot (1.0→1.2→1.0) + color burst
- Sidebar nav: background pill slides between items via `layoutId`

### Tier 3 — Celebration (earned moments)
- **Pact completion:** Confetti burst (~20 particles, accent colors, 1.5s). Card flashes success gradient.
- **Streak milestone (7/30/etc.):** Bounce-scale on counter, golden glow radiates, particle shower.
- **XP level-up:** Bar fills to 100%, flashes gold, resets with whoosh. Toast with new level.
- **Focus session complete:** Timer ring completion spin → radial glow burst.

### Technical
- Confetti/particles: custom Framer Motion `motion.div` (~30 lines), no external library
- All celebrations are 1-2s, non-blocking
- `prefers-reduced-motion`: Tier 1 + 3 disable, Tier 2 simplifies to opacity-only
- Page transitions: shared `layoutId` on page header for morphing title between routes

## 4. Component Treatments

### Sidebar
- Subtle gradient background in dark mode
- Active nav pill animates between items (`layoutId`)
- Collapsed: tooltip previews with spring animation
- Nav icons: gray → accent color shift on hover

### Cards (PactCard, TaskCard, DailySummaryCard)
- Frosted glass surface (light mode), gradient borders (dark mode)
- Left stripe becomes glowing stripe (radiates, not just colored)
- Hover: higher lift + accent-tinted shadow
- Completed cards: shimmer sweep on checkmark
- TaskCard gets left-stripe parity with PactCard

### Focus Timer
- Ring: gradient stroke (indigo→purple→magenta following progress)
- Active: breathing glow around ring, background subtly darkens ("focus mode")
- Time display: heavier typography
- Complete: radial burst celebration

### XP Bar
- Slightly thicker, rounded ends
- Shine/glint sweep every ~5s
- XP gain: elastic stretch overshoot then settle
- Level indicator: celebration gold accent

### Monthly Calendar
- Activity cells: hue shift within accent palette (level 1: light indigo → level 4: deep magenta)
- Today's cell: pulsing ring
- Hover: mini tooltip with activity count
- Stays CSS-only for performance

### Modals
- Overlay: stronger blur (`backdrop-filter: blur(16px)`)
- Modal: spring scale entrance (slight overshoot)
- Input focus: accent glow border (box-shadow, not just color)
- Submit button: hover glow, press squish, loading gradient shimmer

### Activity Feed
- Migrate from custom CSS keyframes to Framer Motion stagger (consistency)
- Timeline connector: gradient line (accent at top → transparent at bottom)
- Reaction picker: spring pop-in
- New items: highlighted flash that fades after 2s

### Notification Bell
- Unread badge: subtle pulse (scale 1.0→1.1→1.0, every 3s)
- New notification: bell wiggle (rotate -5°→5°→0°, spring)
- Dropdown: spring entrance, staggered items

### Toast
- Accent-colored left border with glow matching toast type
- More spring energy on entrance
- Progress bar along bottom showing auto-dismiss countdown

### Landing Page
- Hero: large confident typography with gradient text headline
- Floating UI mockup/device frame
- Scroll-triggered reveals for feature sections
- CTA button: gradient + shimmer + hover glow + satisfying press
- Background: subtle blurred gradient orbs that slowly drift

### Mobile Nav
- Active tab: filled icon + dot indicator below with spring between tabs
- Press: scale-down tap animation

## 5. Technical Guardrails

### Performance
- No new npm dependencies
- `backdrop-filter` only on visible elements, `content-visibility: auto` where appropriate
- `will-change` sparingly — only sidebar, timer ring, XP bar
- MonthlyCalendar stays CSS-only

### Accessibility
- `prefers-reduced-motion`: Tier 1+3 fully disable, Tier 2 simplifies to opacity
- All text/bg combos meet WCAG AA (4.5:1 body, 3:1 large text)
- Focus indicators: glow-based, visible, keyboard navigation preserved

### Scope — What Does NOT Change
- Zero JS logic (no Supabase, auth, routing changes)
- No component prop changes
- No new npm packages
- No file renames or moves
- Mobile responsiveness preserved

## Files to Modify

| File | Type |
|------|------|
| `app/globals.css` | Design tokens (complete overhaul) |
| `lib/animations.js` | Animation system (expand with 3 tiers) |
| `lib/confetti.js` | **New** — celebration particle utility |
| `components/Sidebar.module.css` | Gradient bg, animated nav pill |
| `components/PactCard.module.css` | Frosted glass, glowing stripe |
| `components/TaskCard.module.css` | Match PactCard treatment |
| `components/DailySummaryCard.module.css` | Card refresh |
| `components/FocusTimer.module.css` | Gradient ring, breathing glow |
| `components/XPBar.module.css` | Thicker bar, shine animation |
| `components/MonthlyCalendar.module.css` | Hue-shifted levels, today pulse |
| `components/CreatePactModal.module.css` | Blur overlay, glow inputs |
| `components/CreateGroupModal.module.css` | Same modal treatment |
| `components/CreateTaskModal.module.css` | Same modal treatment |
| `components/OnboardingModal.module.css` | Same modal treatment |
| `components/ActivityItem.module.css` | Migrate to Framer stagger |
| `components/ActivityFeed.module.css` | Gradient timeline |
| `components/ActivityComments.module.css` | Refresh |
| `components/CompactActivityCard.module.css` | Card refresh |
| `components/NotificationBell.module.css` | Pulse badge, wiggle |
| `components/NudgeButton.module.css` | Interactive refresh |
| `components/Toast.module.css` | Glow border, progress bar |
| `components/ThemeToggle.module.css` | Refresh |
| `components/GroupStats.module.css` | Refresh |
| `components/MobileNav.module.css` | Dot indicator, filled icons |
| `components/Navbar.module.css` | Refresh |
| `app/dashboard/Dashboard.module.css` | Layout refresh |
| `app/dashboard/DashboardLayout.module.css` | Layout refresh |
| `app/page.js` + CSS | Landing page showpiece |
| All dashboard page CSS | Per-page refresh |
| Select component JS files | Animation variant updates only |
