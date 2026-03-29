# LockIn Frontend Audit — 2026-03-29

**Generated:** 2026-03-29 (automated)
**Pages scored:** 8
**Cowork visual context:** yes (15 findings from Notion)

---

## Page Scores

| Page | Layout | Typography | Color | Components | Motion | Dark Mode | Responsive | Overall |
|------|--------|------------|-------|------------|--------|-----------|------------|---------|
| Landing | 8/10 | 8/10 | 7/10 | 8/10 | 7/10 | 4/10 | 8/10 | 7/10 |
| Dashboard | 8/10 | 7/10 | 7/10 | 8/10 | 8/10 | 5/10 | 7/10 | 7/10 |
| Pacts | 7/10 | 7/10 | 7/10 | 7/10 | 6/10 | 4/10 | 7/10 | 6/10 |
| Groups | 7/10 | 7/10 | 7/10 | 7/10 | 5/10 | 4/10 | 7/10 | 6/10 |
| Group Detail | 6/10 | 7/10 | 5/10 | 6/10 | 4/10 | 3/10 | 6/10 | 5/10 |
| Focus | 7/10 | 7/10 | 6/10 | 7/10 | 7/10 | 4/10 | 7/10 | 6/10 |
| Stats | 7/10 | 7/10 | 6/10 | 6/10 | 6/10 | 3/10 | 7/10 | 6/10 |
| Settings | 7/10 | 7/10 | 7/10 | 7/10 | 4/10 | 4/10 | 7/10 | 6/10 |

**Average: 6.1/10** — Weakest dimension: Dark Mode (3.9 avg). Strongest: Layout (7.1 avg).

---

## AI-Generated Tells

| File | Element | What a Human Designer Would Do Differently |
|------|---------|-------------------------------------------|
| Dashboard.module.css L292-297 | 3 identical stat cards | Make one stat the "hero" (ring chart/larger). Vary card sizes. |
| StatsPage.module.css L42-86 | 3 identical streak items | Current streak as dominant visual, secondary stats smaller |
| page.module.css L262-322 | 6 uniform feature cards | Vary sizes (1 large, 2 medium, 3 small), different content types |
| StatsPage.module.css L88-148 | 2 identical analytics cards | Different visualizations per data type (chart vs stat boxes) |
| MobileNav.module.css L1-16 | 5 identical nav items | Differentiate primary action (raised center button) |
| GroupsPage.module.css L83-101 | Uniform group cards | Sort by activity, add "hot" indicator, vary treatment |
| page.module.css L86-143 | Browser mockup placeholder | Remove "Your dashboard, visualized" placeholder or use real screenshot |
| FocusTimer.module.css L189-225 | 2 symmetric stat items | Add sparkline or progress ring, break text-only monotony |

---

## Hardcoded Values (18 occurrences across CSS)

| File | Line | Current | Recommended |
|------|------|---------|-------------|
| MonthlyCalendar.module.css | 264 | `rgba(91, 94, 245, 0.15)` | `rgba(var(--accent-primary-rgb), 0.15)` |
| MonthlyCalendar.module.css | 272 | `rgba(124, 77, 255, 0.3)` | `rgba(var(--accent-primary-rgb), 0.3)` |
| MonthlyCalendar.module.css | 280 | `rgba(180, 74, 230, 0.45)` | `rgba(var(--accent-tertiary-rgb), 0.45)` |
| MonthlyCalendar.module.css | 292 | `rgba(224, 64, 203, 0.6)` | `rgba(var(--accent-tertiary-rgb), 0.6)` |
| CompactActivityCard.module.css | 108-110 | `rgba(99, 102, 241, ...)` | `rgba(var(--accent-primary-rgb), ...)` |
| FocusTimer.module.css | 95 | `rgba(99, 102, 241, 0.4)` | `rgba(var(--accent-primary-rgb), 0.4)` |
| FocusTimer.module.css | 145 | `rgba(99, 102, 241, 0.4)` | `rgba(var(--accent-primary-rgb), 0.4)` |
| Sidebar.module.css | 216 | `rgba(99, 102, 241, 0.3)` | `rgba(var(--accent-primary-rgb), 0.3)` |
| GroupDetail.module.css | 76, 91-93 | `rgba(139, 92, 246, ...)` | `rgba(var(--accent-primary-rgb), ...)` |
| Navbar.module.css | 109 | `rgba(99, 102, 241, 0.4)` | `rgba(var(--accent-primary-rgb), 0.4)` |
| StatsPage.module.css | 246 | `rgba(139, 92, 246, 0.15)` | `rgba(var(--accent-primary-rgb), 0.15)` |
| page.module.css | 631-633 | `rgba(99, 102, 241, ...)` | `rgba(var(--accent-primary-rgb), ...)` |
| page.module.css | 722 | `color: #fff` | `color: var(--text-inverse)` |

Note: macOS window dots (#FF5F56, #FFBD2E, #27C93F) are conventional — keep as-is.

---

## Missing Dark Mode Overrides

34 of 37 .module.css files have zero `[data-theme="dark"]` selectors. Only 3 files have any dark mode overrides: CreatePactModal (2), TaskCard (1), Sidebar (1).

Most impactful files needing dark mode work:
1. MonthlyCalendar.module.css — calendar level colors near-invisible
2. FocusTimer.module.css — glow/shadow effects unadjusted
3. GroupDetail.module.css — lockedInBadge invisible in dark mode
4. CompactActivityCard.module.css — activity heatmap levels
5. Toast.module.css — toast variants use hardcoded rgba

---

## Quick Visual Wins (<1hr each)

| File | Change | Impact |
|------|--------|--------|
| MobileNav.js | Add Settings to navItems array | Critical — Settings inaccessible on mobile |
| globals.css L29 | Darken `--text-muted` to ~#706C8A | Site-wide light mode contrast fix |
| MonthlyCalendar.module.css L264-292 | Replace hardcoded rgba with `var(--accent-primary-rgb)` | Accent palette compatibility |
| CompactActivityCard.module.css L108 | Replace hardcoded rgba with `var(--accent-primary-rgb)` | Accent palette compatibility |
| FocusTimer.module.css L95 | Replace hardcoded rgba with `var(--accent-primary-rgb)` | Accent palette compatibility |
| Sidebar.module.css L216 | Replace hardcoded rgba with `var(--accent-primary-rgb)` | Accent palette compatibility |
| page.module.css L722 | `color: #fff` → `color: var(--text-inverse)` | Token consistency |

---

## Component Redesigns (1-4hr)

| Component | File | Issue | Approach | Est. |
|-----------|------|-------|----------|------|
| Calendar dark mode | MonthlyCalendar.module.css | Level colors invisible in dark mode | Add `[data-theme="dark"]` overrides boosting opacity 1.5x | 2h |
| Focus Analytics | StatsPageClient.js L298-321 | Empty card, no visualization | Add 7-day mini bar chart (CSS bars, no library) | 3h |
| Dark mode pass | All .module.css | 34 files have 0 dark overrides | Add dark blocks to 10 most impactful files | 4h |
| FocusTimer accent | FocusTimer.js L71-73, .module.css | Hardcoded indigo SVG gradient | Convert to CSS variable stop-colors | 2h |
| Landing placeholder | LandingPageClient.js L338-352 | "Your dashboard, visualized" placeholder | Replace with real dashboard screenshot | 1h |

---

## Design System Recommendations

| Type | Name | Value | Reasoning |
|------|------|-------|-----------|
| Token | `--text-inverse` | `#ffffff` (light), `#111113` (dark) | Needed for inverted-context text |
| Token | `--accent-primary-rgb` | Already exists in globals.css | Use consistently instead of hardcoded rgba |
| Convention | Dark mode minimum | Every .module.css with rgba colors | Add `[data-theme="dark"]` section |

---

## Top 5 Highest Impact Changes

1. **Fix light-mode text contrast** — Darken `--text-muted` from #A9A5BC to ~#706C8A in globals.css L29. Single token change fixes WCAG AA failures across every page.

2. **Add Settings to MobileNav** — Settings completely inaccessible on mobile (primary student device). 15-minute fix in MobileNav.js.

3. **Convert hardcoded accent rgba to --accent-primary-rgb** — 18 occurrences across 8 files hardcode indigo rgb values, breaking all non-indigo accent palettes.

4. **Add dark mode overrides to calendar/heatmap** — Core engagement features (streak visualization) are near-invisible in dark mode due to hardcoded level colors.

5. **Remove duplicate streak display** — Stats page shows streak data twice (StatsPageClient + MonthlyCalendar), each querying the database independently.
