# LockIn Frontend Audit -- 2026-04-06

**Generated:** 2026-04-06 (automated)
**Pages scored:** 9
**Visual audit context:** yes (12 Notion findings from visual-audit/competitor-intel/design-trend, Apr 5-6)

## Page Scores
| Page | Layout | Typography | Color | Components | Motion | Dark Mode | Responsive | Overall |
|------|--------|------------|-------|------------|--------|-----------|------------|---------|
| Landing | 8 | 8 | 7 | 7 | 5 | 5 | 8 | 6.9 |
| Dashboard | 8 | 8 | 8 | 7 | 7 | 4 | 8 | 7.1 |
| Pacts | 7 | 8 | 8 | 8 | 7 | 5 | 7 | 7.1 |
| Groups | 7 | 8 | 8 | 7 | 6 | 3 | 7 | 6.6 |
| Group Detail | 7 | 7 | 8 | 7 | 6 | 3 | 7 | 6.4 |
| Focus | 8 | 8 | 9 | 8 | 7 | 8 | 7 | 7.9 |
| Stats | 7 | 8 | 8 | 7 | 6 | 4 | 7 | 6.7 |
| Settings | 7 | 8 | 8 | 7 | 6 | 3 | 8 | 6.7 |
| Share Streak | 6 | 7 | 7 | 6 | 6 | 3 | 7 | 6.0 |

**Average: 6.8/10** (down from 7.0 yesterday due to stricter animation/dark mode scoring)

### Score Changes vs Yesterday
| Page | Dimension | Yesterday | Today | Reason |
|------|-----------|-----------|-------|--------|
| Landing | Motion | 4 | 5 | Rescored: 76 inline animation props confirmed, but landing page motion is visually effective |
| Landing | Dark Mode | 4 | 5 | 4 dark mode selectors confirmed in page.module.css (lines 86-94, 838-847) |
| Focus | Dark Mode | 8 | 8 | Stable: FocusTimer.module.css has 6 well-targeted dark overrides |
| Pacts | Dark Mode | 4 | 5 | PactCard.module.css has 5 dark mode overrides for completed state contrast |
| Stats | Dark Mode | 3 | 4 | MonthlyCalendar.module.css has 2 dark overrides for level3/level4 day numbers |

## AI-Generated Tells
| File | Element | What a Human Designer Would Do Differently |
|------|---------|-------------------------------------------|
| app/page.module.css:145 | .screenshotPlaceholder | 400px empty gray box "Your dashboard, visualized." Interactive mock exists below -- remove placeholder or embed actual screenshot |
| app/dashboard/groups/GroupsPage.module.css:83 | .groupsGrid | Uniform 2-col grid; human designer would feature primary group with full-width hero card |
| app/dashboard/stats/StatsPage.module.css:89 | .analyticsGrid | Uniform 2-col; calendar/heatmap should have more prominence |
| components/LandingPageClient.js:388 | .socialProof avatars | Inline hardcoded hex backgroundColor; use CSS variables or real user photos |
| app/dashboard/Dashboard.module.css:292 | .statsGrid | 3 identical stat cards; streak card could span 2 cols for visual hierarchy |

## Hardcoded Values
| File | Line | Current | Recommended |
|------|------|---------|-------------|
| components/LandingPageClient.js | 388 | #5B5EF5, #7C4DFF, #E040CB, #00C9A7, #FF6B6B inline | var(--accent-primary) etc. or import from accentColors |
| components/FocusTimer.js | 71-73 | #6366F1, #8B5CF6, #D946EF in SVG stops | var(--accent-primary), var(--accent-secondary), var(--accent-tertiary) |
| app/page.module.css | 422-424 | #FF5F56, #FFBD2E, #27C93F | Acceptable: macOS window dot colors (conventionally hardcoded) |
| components/DailySummaryCard.module.css | 45-46 | gap: 3px, padding: 2px 8px | var(--space-1), var(--space-1) var(--space-2) |
| components/GroupDetail.module.css | 67-68 | gap: 4px, padding: 4px 10px | var(--space-1), var(--space-1) var(--space-3) |

## Missing Dark Mode (31 of 38 CSS module files with zero [data-theme="dark"] selectors)
Top 10 priority files:
1. **SettingsPage.module.css** -- CRITICAL: where users toggle dark mode, zero overrides
2. **Dashboard.module.css** -- HIGH: main dashboard, stat cards lack shadow/border adjustments
3. **StatsPage.module.css** -- HIGH: streakCard, analyticsCard, statBox, sessionsCard surfaces
4. **GroupsPage.module.css** -- HIGH: groupCard, progressBar, emptyState
5. **GroupDetail.module.css** -- HIGH: kanban columns, leaderboard, member cards
6. **StreakHero.module.css** -- MEDIUM: tier glow effects invisible in dark mode
7. **DailySummaryCard.module.css** -- MEDIUM: card hover, freezeBtn, riskBanner
8. **ShareStreak.module.css** -- MEDIUM: public-facing page, worst dark mode (3/10)
9. **FocusPage.module.css** -- MEDIUM: statsCard, historyCard, statBox, sessionItem
10. **CompactActivityCard.module.css** -- LOW: card hover uses accent-rgb which adapts

Files WITH dark mode overrides (7): PactCard, FocusTimer, MonthlyCalendar, Sidebar, page.module.css, NotificationBell, Navbar

## Animation Violations
| File | Count | Worst Offenders |
|------|-------|----------------|
| LandingPageClient.js | ~76 | Local easeOutQuint (line 18), inline fadeInUp/fadeInScale/ambientFloat equivalents, feature card stagger, hero entrance |
| Sidebar.js | ~13 | Width animation, nav pill transitions (some are legitimate layout animations) |
| ActivityItem.js | ~12 | Reaction buttons, expansion animations |
| NotificationBell.js | ~6 | Bell icon, dropdown, badges |
| MonthlyCalendar.js | ~5 | Calendar cells, detail panel |

**Accessibility gap:** Only 1 component (OnboardingChecklist.js) checks prefersReducedMotion(). All animated pages should check this.

## Quick Visual Wins (<1hr)
| File | CSS Class | Current | Recommended |
|------|-----------|---------|-------------|
| SettingsPage.module.css | .toggleKnob | hardcoded box-shadow | Add [data-theme="dark"] override with var(--shadow-sm) |
| DailySummaryCard.module.css | .freezeBadge | padding: 2px 8px | var(--space-1) var(--space-2) |
| GroupDetail.module.css | .lockedInBadge | margin-left: 8px, padding: 4px 10px | var(--space-2), var(--space-1) var(--space-3) |
| ShareStreak.module.css | .container | background: var(--bg-primary) | Change to inherit or var(--bg-secondary) per gotcha #6 |
| FocusPage.module.css | .sessionInfo | gap: 2px | var(--space-1) |

## Component Redesigns (1-4hr)
| Component | File | Issue | Recommended Approach |
|-----------|------|-------|---------------------|
| LandingPageClient | components/LandingPageClient.js | 76 inline animation props, only 3 presets imported | Extract to fadeInUp, fadeInScale, staggerContainer, staggerItem, ambientFloat presets; add prefersReducedMotion |
| Settings dark mode | app/dashboard/settings/SettingsPage.module.css | Zero dark overrides on the dark mode settings page | Add [data-theme="dark"] for toggle, slider, kbd, themeBtn, settingCard |
| Dashboard dark mode | app/dashboard/Dashboard.module.css | Zero dark overrides, stat icon backgrounds | Add dark overrides for statCard, statIcon, emptyState |
| GroupDetail kanban | app/dashboard/groups/[id]/GroupDetail.module.css | Zero dark overrides, glass surfaces | Add dark overrides for kanbanColumn, leaderboard, memberCard |

## Design System Recommendations
| Type | Name | Value | Reasoning |
|------|------|-------|-----------|
| Enforcement | prefersReducedMotion | N/A | Only 1 of ~10 animated components checks this; accessibility requirement |
| Pattern | Dark mode baseline | N/A | 31/38 CSS module files have zero overrides; consider lint rule or checklist |
| Convention | Animation imports | N/A | LandingPageClient shows the risk: imports 3 presets, hand-codes 76 props |
| Token gap | None | N/A | globals.css token system is comprehensive; issue is adoption not gaps |

## Top 5 Highest Impact Changes
1. **Add dark mode overrides to SettingsPage.module.css** -- The page where users toggle dark mode has zero dark mode styles. Toggle, slider, kbd, and card elements need overrides. (~30 min)
2. **Refactor LandingPageClient.js to use animation presets** -- 76 inline animation props when the library covers every pattern used. First page visitors see. (~2 hrs)
3. **Add dark mode to Dashboard, Stats, Groups CSS** -- Three high-traffic pages with zero dark mode selectors. Stat cards with -light backgrounds need component-level surface refinements. (~1.5 hrs)
4. **Remove or replace .screenshotPlaceholder** -- 400px empty gray box on landing page. Interactive mock already exists below it. Most visible AI-generated tell. (~15 min)
5. **Add prefersReducedMotion() to all animated pages** -- Only OnboardingChecklist checks this. Accessibility requirement for entrance animations. (~1 hr)
