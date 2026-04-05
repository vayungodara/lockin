# LockIn Frontend Audit -- 2026-04-05

**Generated:** 2026-04-05 (automated)
**Pages scored:** 9
**Visual audit context:** yes (10 Notion findings from visual-audit/competitor-intel/design-trend, Apr 4-5)

## Page Scores
| Page | Layout | Typography | Color | Components | Motion | Dark Mode | Responsive | Overall |
|------|--------|------------|-------|------------|--------|-----------|------------|---------|
| Landing | 8 | 8 | 7 | 8 | 4 | 4 | 8 | 7 |
| Dashboard | 8 | 8 | 8 | 8 | 7 | 4 | 8 | 7 |
| Pacts | 7 | 7 | 8 | 7 | 7 | 4 | 7 | 7 |
| Groups | 7 | 7 | 8 | 7 | 7 | 3 | 7 | 7 |
| Group Detail | 8 | 7 | 8 | 8 | 6 | 3 | 7 | 7 |
| Focus | 8 | 8 | 9 | 8 | 7 | 8 | 7 | 8 |
| Stats | 7 | 7 | 8 | 7 | 7 | 3 | 7 | 7 |
| Settings | 7 | 7 | 8 | 7 | 7 | 3 | 8 | 7 |
| Share Streak | 6 | 7 | 6 | 6 | 7 | 3 | 7 | 6 |

**Average: 7.0/10** (stable from yesterday). Focus page best at 8/10. Share Streak worst at 6/10.

### Score Changes vs Yesterday
| Page | Dimension | Yesterday | Today | Reason |
|------|-----------|-----------|-------|--------|
| Landing | Motion | 5 | 4 | Downgrade: 20+ inline animation violations counted (worst file in project) |
| Dashboard | Dark Mode | 5 | 4 | Dashboard.module.css has 0 dark mode selectors; DailySummaryCard/StreakHero/CompactActivityCard also 0 |
| Pacts | Dark Mode | 5 | 4 | PactsPage.module.css has 0 dark overrides; only PactCard.module.css has them |
| Groups | Dark Mode | 5 | 3 | GroupsPage.module.css confirmed 0 dark mode selectors |
| Group Detail | Dark Mode | 5 | 3 | GroupDetail.module.css confirmed 0 dark mode selectors |
| Stats | Dark Mode | 6 | 3 | StatsPage.module.css confirmed 0 dark mode selectors |
| Settings | Dark Mode | 4 | 3 | SettingsPage.module.css confirmed 0 dark mode selectors (where users toggle dark mode) |

**Note:** Yesterday's dark mode scores were over-reported. globals.css variable overrides handle text/bg/border swaps automatically, but component-level refinements (shadows, glass surfaces, contrast on colored backgrounds) are absent in 30 of 37 CSS module files. Focus page remains best because FocusTimer.module.css has 6 explicit dark mode overrides.

## AI-Generated Tells
| File | Element | What a Human Designer Would Do Differently |
|------|---------|-------------------------------------------|
| app/page.module.css | .screenshotPlaceholder (line 145) | Empty gray box "Your dashboard, visualized" — most visible AI tell. Interactive mock below is good; placeholder above should show actual screenshot |
| app/dashboard/groups/GroupsPage.module.css | .groupsGrid | Uniform 2-col grid — vary card sizes, give active groups hero treatment |
| app/dashboard/pacts/PactsPage.module.css | .pactsGrid | Uniform 2-col grid — urgent pacts should be visually heavier |
| app/page.module.css | .steps (.step) | 3 identical step cards — stagger sizes, add unique visual per step |
| components/CompactActivityCard.module.css | .card:hover | Same translateY(-3px) + box-shadow as every card — use distinct hover |
| app/dashboard/Dashboard.module.css | .statsGrid | 3 identical stat cards — make streak card span 2 cols |
| app/dashboard/stats/StatsPage.module.css | .analyticsGrid | Calendar should span full width, smaller stat cards cluster differently |

## Hardcoded Values
| File | Line | Current | Recommended |
|------|------|---------|-------------|
| app/page.module.css | 114 | gap: 6px | --space-1 (4px) or --space-2 (8px) |
| app/page.module.css | 489 | gap: 6px, 4px, 2px | Multiple arbitrary px in mock dashboard |
| components/DailySummaryCard.module.css | 45-46 | gap: 3px, padding: 2px 8px | --space-1, --space-2 |
| components/GroupDetail.module.css | 67-68 | gap: 4px, padding: 4px 10px | --space-1, --space-2/--space-3 |
| components/FocusTimer.js | 71-73 | #6366F1, #8B5CF6, #D946EF | CSS vars (SVG compatibility concern) |
| components/LandingPageClient.js | 388 | Hardcoded hex array for avatars | @/lib/accentColors palette |

## Missing Dark Mode (30 of 37 CSS module files with zero [data-theme="dark"] selectors)
Top priority files:
1. **SettingsPage.module.css** -- Where users toggle dark mode, zero overrides
2. **Dashboard.module.css** -- Main page, stat cards lack shadow/border adjustments
3. **PactsPage.module.css** -- statsBar, filterTabs, emptyState
4. **GroupsPage.module.css** -- groupCard, progressBar, emptyState
5. **StatsPage.module.css** -- analyticsGrid, calendar container
6. **GroupDetail.module.css** -- kanban columns, task cards
7. **ShareStreak.module.css** -- Public-facing shareable page, worst dark mode (3/10)
8. **DailySummaryCard.module.css** -- Card hover, freezeBtn, riskBanner
9. **CompactActivityCard.module.css** -- Card and tooltip surfaces
10. **MobileNav.module.css** -- Glass surface may be too transparent

Files WITH dark mode overrides (7): PactCard, FocusTimer, MonthlyCalendar, Sidebar, LandingPage (page.module.css), NotificationBell, Navbar

## Animation Violations (20+ inline animations in 1 file dominates)
| File | Count | Worst Offenders |
|------|-------|----------------|
| LandingPageClient.js | 20+ | Hero entrance, floating cards, feature cards, CTAs — imports only buttonHover/buttonTap/iconHover but hand-codes fadeInUp/fadeIn/fadeInScale/ambientFloat equivalents inline |
| Sidebar.js | ~15 | Same spring config repeated multiple times |
| ActivityItem.js | ~10 | Reaction picker animations |
| NotificationBell.js | ~6 | Bell icon, dropdown, badges |
| MonthlyCalendar.js | ~5 | Calendar cells, detail panel |

## Quick Visual Wins (<1hr)
| File | CSS Class | Current | Recommended |
|------|-----------|---------|-------------|
| StreakHero.module.css | .hero | No dark mode | Add [data-theme="dark"] with boosted rgba opacity |
| ShareStreak.module.css | .container | var(--bg-primary) | Change to var(--bg-secondary) for card consistency |
| SettingsPage.module.css | .toggleKnob | hardcoded box-shadow | Use var(--shadow-sm) |
| DailySummaryCard.module.css | .card:hover | Same as all cards | Differentiate hover effect |
| DashboardLayout.module.css | .main | No scrollbar-gutter | Add scrollbar-gutter: stable |

## Component Redesigns (1-4hr)
| Component | File | Issue | Recommended Approach |
|-----------|------|-------|---------------------|
| LandingPageClient | components/LandingPageClient.js | 20+ inline animations | Extract to animation presets from @/lib/animations |
| Sidebar | components/Sidebar.js | ~15 inline animations | Create sidebarSpring preset |
| Dark Mode (all pages) | 30 CSS module files | Zero overrides | Add [data-theme="dark"] blocks for shadows, glass, contrast |
| Dashboard Stats Grid | Dashboard.module.css | 3 identical cards | Streak card spans 2 cols, add visual variety |
| Empty State Components | 4 pages | Near-identical CSS patterns (~150 lines duplicated) | Extract shared EmptyState component |

## Design System Recommendations
| Type | Name | Value | Reasoning |
|------|------|-------|-----------|
| Token | --shadow-card-dark | 0 2px 8px rgba(0,0,0,0.3) | Dark mode needs heavier shadows for depth perception |
| Token | --surface-glass-dark | rgba(20,20,23,0.75) | Current 0.65 may be too transparent on dark |
| Component | EmptyState | shared component | 4 pages duplicate the same empty state pattern |
| Pattern | Screenshot placeholder | actual product screenshot | Remove "Your dashboard, visualized" gray box |

## Top 5 Highest Impact Changes
1. **Dark mode pass (30 files)** -- Only 7 of 37 CSS module files have [data-theme="dark"] selectors. Globals handles basics but shadows, glass, and contrast on colored backgrounds need explicit tuning. Settings page (where dark mode is toggled) has zero overrides.
2. **Landing page inline animations (20+ violations)** -- LandingPageClient.js imports only 3 presets but hand-codes 20+ equivalent animations inline. Refactoring to use @/lib/animations presets would eliminate half the project's animation violations.
3. **Product showcase placeholder** -- .screenshotPlaceholder renders empty gray box. Most visible "AI-generated" tell. Interactive mock below is excellent; placeholder above should be replaced with actual screenshot or removed.
4. **Calendar heatmap text contrast** -- level3/level4 cells use dark text (#161529) on semi-transparent indigo backgrounds. Adequate for default indigo palette but may degrade with accent color switching (sunset, emerald). Consider adding white text for level3+ in light mode too.
5. **Empty state pattern consolidation** -- 4 pages (Dashboard, Pacts, Groups, Stats) duplicate identical empty state CSS (~150 lines). Extract shared EmptyState component for consistent dark mode, hover states, and maintenance.
