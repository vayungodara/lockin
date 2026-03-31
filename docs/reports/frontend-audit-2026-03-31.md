# LockIn Frontend Audit — 2026-03-31

**Generated:** 2026-03-31 (automated)
**Pages scored:** 9
**Cowork visual context:** yes (25 findings from Notion, 2026-03-29 to 2026-03-31)

---

## Page Scores

| Page | Layout | Typography | Color | Components | Motion | Dark Mode | Responsive | Overall |
|------|--------|------------|-------|------------|--------|-----------|------------|---------|
| Landing | 8/10 | 8/10 | 7/10 | 7/10 | 7/10 | 4/10 | 8/10 | 7/10 |
| Dashboard | 7/10 | 8/10 | 7/10 | 7/10 | 7/10 | 3/10 | 7/10 | 7/10 |
| Pacts | 7/10 | 7/10 | 7/10 | 7/10 | 6/10 | 3/10 | 7/10 | 6/10 |
| Groups | 7/10 | 7/10 | 7/10 | 7/10 | 6/10 | 3/10 | 7/10 | 6/10 |
| Group Detail | 7/10 | 7/10 | 6/10 | 7/10 | 6/10 | 3/10 | 7/10 | 6/10 |
| Focus | 8/10 | 8/10 | 6/10 | 8/10 | 7/10 | 3/10 | 7/10 | 7/10 |
| Stats | 7/10 | 7/10 | 6/10 | 6/10 | 6/10 | 3/10 | 7/10 | 6/10 |
| Settings | 7/10 | 7/10 | 7/10 | 7/10 | 5/10 | 3/10 | 8/10 | 6/10 |
| Sidebar | 8/10 | 7/10 | 7/10 | 8/10 | 8/10 | 5/10 | 8/10 | 7/10 |

**Key insight:** Dark mode scores 3-5/10 across the board. Only 4 of 37 CSS module files have `[data-theme="dark"]` selectors. This is the #1 systemic issue.

---

## AI-Generated Tells

| File | Element | What a Human Designer Would Do Differently |
|------|---------|-------------------------------------------|
| Dashboard.module.css | `.statsGrid` (3 identical stat cards) | Give "Completed" stat a featured treatment, or collapse all three into inline text. Linear/Notion use inline text, not boxed cards |
| page.module.css | `.featureGrid` (2x2 identical cards) | Vary card sizes — make 1-2 hero features large, rest compact. Use asymmetric bento grid with mixed aspect ratios |
| page.module.css | `.screenshotPlaceholder` | Literal placeholder text. Replace with actual screenshot or the interactive mockup that exists lower on the page |
| CompactActivityCard.module.css | `.level1-.level4` heatmap | Hardcoded indigo rgba — every accent color produces the same indigo heatmap. Should use `var(--accent-primary-rgb)` |
| MonthlyCalendar.module.css | `.level1-.level4` | Same issue: hardcoded brand colors that don't change with accent selection |
| StatsPage.module.css | `.streakCard` | Duplicate streak display (also in StreakHero on Dashboard + MonthlyCalendar badges). Single source of truth per page |
| page.module.css | `.heroStats` | "100% Free", "2min", "0 Excuses" — generic marketing copy. Use real user data or specific claims |
| Dashboard.module.css | `.statCard:hover` | Every card has identical hover effect. Different cards should have different hover behaviors |

---

## Quick Visual Wins (<1hr each)

| File | CSS Class | Current | Recommended | CSS Variable |
|------|-----------|---------|-------------|-------------|
| CompactActivityCard.module.css | `.level1-.level3` | `rgba(99, 102, 241, 0.25/0.5/0.75)` | `rgba(var(--accent-primary-rgb), 0.25/0.5/0.75)` | `--accent-primary-rgb` |
| MonthlyCalendar.module.css | `.level1-.level4` | Hardcoded brand color rgba (lines 264-292) | `rgba(var(--accent-primary-rgb), 0.15/0.3/0.45/0.6)` | `--accent-primary-rgb` |
| page.module.css:722 | `.stepNumber` | `color: #fff` | `color: var(--text-inverse)` | `--text-inverse` |
| FocusTimer.module.css | `.workProgress`, `.playBtn:hover` | `rgba(99,102,241,0.4)` | `rgba(var(--accent-primary-rgb), 0.4)` | `--accent-primary-rgb` |
| MobileNav.js | `navItems` array | Missing Settings item | Add Settings `{href: '/dashboard/settings'}` | N/A |
| Navbar.module.css | `.ctaBtn:hover` | `box-shadow: 0 0 20px rgba(99, 102, 241, 0.4)` | `box-shadow: var(--shadow-glow)` | `--shadow-glow` |
| GroupDetail.module.css | `.lockedInBadge` keyframe | `rgba(139, 92, 246, 0.5)` | `rgba(var(--accent-primary-rgb), 0.5)` | `--accent-primary-rgb` |
| Toast.module.css | `.success/.error/.warning/.info` | Hardcoded rgba for shadows | Use `var(--success-glow)`, `var(--danger-glow)` etc. | Status glow variables |
| Dashboard.module.css | `.statCard` (dark mode) | No dark override — cards blend into background | Add `[data-theme="dark"] .statCard { border-color: var(--border-default); }` | `--border-default` |
| page.module.css | `.main` background | `rgba(91, 94, 245, 0.08)` hardcoded | `rgba(var(--accent-primary-rgb), 0.08)` | `--accent-primary-rgb` |

---

## Hardcoded Values Found

| File | Line | Current Value | Correct Variable |
|------|------|---------------|-----------------|
| page.module.css | 412-414 | `#FF5F56`, `#FFBD2E`, `#27C93F` | Acceptable (macOS window dots) |
| page.module.css | 722 | `color: #fff` | `var(--text-inverse)` |
| CompactActivityCard.module.css | 108-110 | `rgba(99, 102, 241, ...)` | `rgba(var(--accent-primary-rgb), ...)` |
| MonthlyCalendar.module.css | 264-292 | 4 hardcoded brand color rgba values | `rgba(var(--accent-primary-rgb), ...)` |
| FocusTimer.module.css | 95, 145 | `rgba(99, 102, 241, 0.4)` | `rgba(var(--accent-primary-rgb), 0.4)` |
| Navbar.module.css | 109 | `rgba(99, 102, 241, 0.4)` | `rgba(var(--accent-primary-rgb), 0.4)` |
| GroupDetail.module.css | 76-93 | `rgba(139, 92, 246, ...)` | `rgba(var(--accent-primary-rgb), ...)` |
| Toast.module.css | 55-96 | Multiple hardcoded rgba for status glows | Status glow CSS variables |

---

## Missing Dark Mode Overrides

**33 of 37 CSS module files lack `[data-theme="dark"]` selectors.** Only these 4 have dark overrides:
- Sidebar.module.css
- CreatePactModal.module.css
- TaskCard.module.css (partial — `.loadingOverlay` only)
- CreateGroupModal.module.css (partial)

Most impactful missing dark mode overrides:
1. **Dashboard.module.css** — `.statCard` blends into background
2. **MonthlyCalendar.module.css** — `.dayNumber` invisible on dark `.level1-.level2` cells
3. **DailySummaryCard.module.css** — `.statLabel` uses `--text-tertiary` at 11px (4.1:1 contrast, below AA)
4. **StatsPage.module.css** — `.analyticsCard`, `.sessionsCard` surfaces blend
5. **PactsPage.module.css** — `.statsBar` background indistinguishable
6. **FocusTimer.module.css** — No dark overrides at all
7. **GroupsPage.module.css** — `.groupCard` lacks differentiation
8. **PactCard.module.css** — Glass card too transparent in dark
9. **StreakHero.module.css** — rgba backgrounds insufficient contrast
10. **OnboardingChecklist.module.css** — No dark overrides

---

## Animation Violations (Inline instead of Presets)

55+ instances of inline `animate={{ ... }}` instead of using presets from `lib/animations.js`. Top offenders:

| File | Count | Examples |
|------|-------|---------|
| LandingPageClient.js | 15+ | Local `easeOutQuint`, inline float/breathe/fade animations |
| DashboardClient.js | 5+ | Inline header fade, float animation, spring config |
| Sidebar.js | 2 | `miniTimerPulse` inline instead of `ambientBreathing` |
| ActivityItem.js | 4+ | Inline reactions scale/fade |
| Toast.js | 1 | Inline entrance instead of `fadeInScale` |
| NotificationBell.js | 3+ | Inline bell and dropdown animations |
| MonthlyCalendar.js | 1 | Inline day cell animation |
| XPBar.js | 1 | Inline width animation (preset imported but not used) |

`prefersReducedMotion()` is only called in 2 components despite being available in 80+ presets.

---

## Component Redesigns (1-4hr)

| Component | File | Issue | Recommended Approach |
|-----------|------|-------|---------------------|
| Dark mode surface layering | All 37 .module.css files | `--surface-1` dark value nearly identical to `--bg-secondary` — cards invisible | Raise `--surface-1` dark to `rgba(30,30,34,0.95)`, add border overrides per component |
| MonthlyCalendar dark mode | MonthlyCalendar.module.css | Hardcoded level colors invisible in dark mode | Use `rgba(var(--accent-primary-rgb), ...)`, increase opacity in dark mode |
| Landing page feature grid | page.module.css, LandingPageClient.js | Uniform template grid + empty placeholder | Bento layout, remove screenshotPlaceholder, replace avatar circles |
| Sidebar semi-collapsed state | Sidebar.js, Sidebar.module.css | Text clips mid-word during expand animation | Use opacity-only transition for labels (no x translation) |
| Stats page duplicate streak | StatsPage.module.css, StatsPageClient.js | Streak shown in 3 places | Remove `.streakCard`, keep MonthlyCalendar badges only |

---

## Design System Recommendations

| Type | Name | Value | Reasoning |
|------|------|-------|-----------|
| Variable adjustment | `--surface-1` (dark) | `rgba(30, 30, 34, 0.95)` | Current `rgba(24,24,27,0.9)` too close to `--bg-secondary` (#111113) — only 7 lightness points difference |
| Variable adjustment | `--border-default` (dark) | `rgba(255, 255, 255, 0.12)` | Current `0.09` nearly invisible — slight increase improves card boundaries |
| Variable adjustment | `--surface-glass` (dark) | `rgba(22, 22, 25, 0.65)` | Current `0.35` too transparent for glass cards |
| New pattern | Dark mode card selector | Standard `[data-theme="dark"]` block per module | Every card component needs minimum `border-color: var(--border-default)` in dark mode |

---

## Top 5 Highest Impact Changes

1. **Add dark mode overrides to all CSS module files.** Only 4/37 files have `[data-theme="dark"]` selectors. Root cause of Cowork issues #6, #7, #8, #9. Start with Dashboard.module.css, MonthlyCalendar.module.css, StatsPage.module.css, PactCard.module.css.

2. **Replace hardcoded color values with CSS variables in heatmaps/calendars.** MonthlyCalendar.module.css and CompactActivityCard.module.css use hardcoded indigo rgba — heatmap always looks indigo regardless of accent theme selection.

3. **Add Settings to mobile navigation.** MobileNav.js has 5 items but omits Settings entirely, making it inaccessible on mobile. Every mobile user affected.

4. **Refactor inline Framer Motion animations to use presets.** 55+ inline `animate={{ ... }}` bypass `prefersReducedMotion()` checks in the animation presets. Accessibility users get no motion reduction.

5. **Fix surface layering by adjusting `--surface-1` in dark mode.** Change from `rgba(24,24,27,0.9)` to `rgba(30,30,34,0.95)` in globals.css. Single-line fix that improves card visibility across all pages.

---

## Cowork Cross-Reference

| Cowork Finding | File Path | Fix Needed |
|---------------|-----------|------------|
| /pacts returns 404 | next.config.mjs | Add redirect from `/pacts` to `/dashboard/pacts` |
| Desktop challenge card empty | components/OnboardingChecklist.js | Needs runtime investigation |
| Settings inaccessible on mobile | components/MobileNav.js | Add 6th navItem for `/dashboard/settings` |
| Focus Timer "0h" vs Stats "6h 23m" | FocusPageClient.js, StatsPageClient.js | Data fetching discrepancy — backend investigation needed |
| Landing page auto-redirects | app/page.js:12-17 | Remove unconditional redirect or add bypass param |
| Dark mode cards blend into background | app/globals.css:187 | Increase `--surface-1` dark value |
| "Today" labels very faint | DailySummaryCard.module.css:150 | `.statLabel` uses `--text-tertiary` at 11px — increase font size or lighten color |
| Calendar dates invisible in dark | MonthlyCalendar.module.css:264-298 | Use `rgba(var(--accent-primary-rgb), ...)` with higher opacity in dark mode |
| Light mode contrast failures | DailySummaryCard.module.css, StatsPage.module.css | Replace `--text-muted` with `--text-tertiary` for meaningful text |
| Sidebar truncated text | Sidebar.js:256-267, Sidebar.module.css:200 | Use opacity-only transition, add `white-space: nowrap` |
| Duplicate streak info on Stats | StatsPage.module.css:42-86 | Remove `.streakCard` section |
| Inconsistent icons on Stats | StatsPageClient.js | Replace emoji with consistent SVG icons |
| Focus Analytics empty space | StatsPage.module.css:185-205 | Reduce empty state padding, add link to Focus Timer |
| Sidebar feels loose | Sidebar.module.css:89,98,32 | Reduce gap to 2px, padding to 8px 12px, header to 56px |

---

*Generated by Frontend Audit automated task.*
