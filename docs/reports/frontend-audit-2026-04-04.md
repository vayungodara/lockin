# LockIn Frontend Audit -- 2026-04-04

**Generated:** 2026-04-04 (automated)
**Pages scored:** 9
**Visual audit context:** yes (25 Notion findings from visual-audit/competitor-intel/design-trend)

## Page Scores
| Page | Layout | Typography | Color | Components | Motion | Dark Mode | Responsive | Overall |
|------|--------|------------|-------|------------|--------|-----------|------------|---------|
| Landing | 8 | 8 | 7 | 8 | 5 | 4 | 8 | 7 |
| Dashboard | 8 | 8 | 8 | 8 | 7 | 5 | 8 | 7 |
| Pacts | 7 | 7 | 8 | 7 | 7 | 5 | 7 | 7 |
| Groups | 7 | 7 | 8 | 7 | 7 | 5 | 7 | 7 |
| Group Detail | 8 | 7 | 8 | 8 | 6 | 5 | 7 | 7 |
| Focus | 8 | 8 | 9 | 8 | 7 | 8 | 7 | 8 |
| Stats | 7 | 7 | 8 | 7 | 7 | 6 | 7 | 7 |
| Settings | 7 | 7 | 8 | 7 | 7 | 4 | 8 | 7 |
| Share Streak | 6 | 7 | 6 | 6 | 7 | 3 | 7 | 6 |

**Average: 7.0/10** (up from 6.9 yesterday). Focus page best at 8/10. Share Streak worst at 6/10 (dark mode 3/10).

### Score Changes vs Yesterday
| Page | Dimension | Yesterday | Today | Reason |
|------|-----------|-----------|-------|--------|
| Groups | Dark Mode | 4 | 5 | Re-evaluated: CSS variables do adapt, only shadows/borders lack overrides |
| Group Detail | Dark Mode | 4 | 5 | Same re-evaluation |
| Pacts | Dark Mode | 5 | 5 | No change |
| Dashboard | Dark Mode | 5 | 5 | No change |
| Settings | Dark Mode | 4 | 4 | Still zero [data-theme="dark"] overrides |
| Landing | Motion | 6 | 5 | Downgrade: 87 inline animations counted (worst in project) |

## AI-Generated Tells
| File | Element | What a Human Designer Would Do Differently |
|------|---------|-------------------------------------------|
| app/dashboard/groups/GroupsPage.module.css | .groupsGrid | Uniform 2-col grid -- vary card sizes, give active groups hero treatment |
| app/dashboard/pacts/PactsPage.module.css | .pactsGrid | Uniform 2-col grid -- urgent pacts should be visually heavier |
| app/page.module.css | .steps (.step) | 3 identical step cards -- stagger sizes, add unique visual per step |
| components/CompactActivityCard.module.css | .card:hover | Same translateY(-3px) + box-shadow as every card -- use distinct hover |
| app/dashboard/Dashboard.module.css | .statsGrid | 3 identical stat cards -- make streak card span 2 cols |
| app/page.module.css | .featureGrid | Hero cards only differ by span, not visual treatment -- use bento asymmetry |
| app/dashboard/stats/StatsPage.module.css | .analyticsGrid | Calendar should span full width, smaller stat cards cluster differently |

## Hardcoded Values
| File | Line | Current | Recommended |
|------|------|---------|-------------|
| app/not-found.module.css | 19,29,34 | 16px, 32px, 12px 24px | **FIXED** -- var(--space-4), var(--space-8), var(--space-3) var(--space-6) |
| app/page.module.css | 114 | gap: 6px | --space-1 (4px) or custom calc |
| app/page.module.css | 489 | gap: 6px, 4px, 2px | Multiple arbitrary px in mock dashboard |
| components/DailySummaryCard.module.css | 45-46 | gap: 3px, padding: 2px 8px | --space-1, --space-2 |
| components/GroupDetail.module.css | 67-68 | gap: 4px, padding: 4px 10px | --space-1, --space-2/--space-3 |

## Missing Dark Mode (32 CSS module files with zero [data-theme="dark"] selectors)
Top priority files:
1. **SettingsPage.module.css** -- Where users toggle dark mode, zero overrides
2. **Dashboard.module.css** -- Main page, stat cards lack shadow/border adjustments
3. **PactsPage.module.css** -- statsBar, filterTabs, emptyState
4. **GroupsPage.module.css** -- groupCard, progressBar, emptyState
5. **ShareStreak.module.css** -- Public-facing shareable page, worst dark mode (3/10)
6. **DailySummaryCard.module.css** -- Card hover, freezeBtn, riskBanner
7. **CompactActivityCard.module.css** -- Card and tooltip surfaces
8. **MobileNav.module.css** -- Glass surface may be too transparent in dark mode

## Animation Violations (168 inline animations across 17 files)
| File | Count | Worst Offenders |
|------|-------|----------------|
| LandingPageClient.js | 87 | Hero entrance, floating cards, feature cards, CTAs |
| Sidebar.js | 21 | Same spring config `{stiffness: 400, damping: 30}` repeated 8+ times |
| ActivityItem.js | 12 | Reaction picker animations |
| NotificationBell.js | 6 | Bell icon, dropdown, badges |
| MonthlyCalendar.js | 7 | Calendar cells, detail panel |
| OnboardingChecklist.js | 6 | Checklist items |

## Quick Visual Wins (<1hr)
| File | CSS Class | Current | Recommended |
|------|-----------|---------|-------------|
| StreakHero.module.css | .hero | No dark mode | Add [data-theme="dark"] with boosted rgba opacity |
| ShareStreak.module.css | .container | var(--bg-primary) | Change to var(--bg-secondary) |
| SettingsPage.module.css | .toggleKnob | hardcoded box-shadow | Use var(--shadow-sm) |
| DailySummaryCard.module.css | .card:hover | Same as all cards | Differentiate hover effect |
| DashboardLayout.module.css | .main | No scrollbar-gutter | Add scrollbar-gutter: stable |

## Component Redesigns (1-4hr)
| Component | File | Issue | Recommended Approach |
|-----------|------|-------|---------------------|
| LandingPageClient | components/LandingPageClient.js | 87 inline animations | Extract to animation presets |
| Sidebar | components/Sidebar.js | 21 inline animations | Create sidebarSpring preset |
| Dark Mode (all pages) | 32 CSS module files | Zero overrides | Add [data-theme="dark"] blocks |
| Dashboard Stats Grid | Dashboard.module.css | 3 identical cards | Streak card spans 2 cols |
| Settings Dark Mode | SettingsPage.module.css | Zero overrides | Add toggle, kbd, slider dark styles |

## Top 5 Highest Impact Changes
1. **Add dark mode overrides to all page CSS modules** -- 32 of 38 files have zero [data-theme="dark"] selectors. Settings page (where dark mode is toggled) has none.
2. **Extract landing page inline animations** -- 87 inline objects (52% of all violations). Use fadeInUp/fadeInScale/ambientFloat presets.
3. **Extract sidebar inline animations** -- 21 inline objects, same spring config 8+ times. Visible on every dashboard page.
4. **Break visual uniformity in grids** -- Dashboard statsGrid, pactsGrid, groupsGrid, landing steps all look "AI-generated" with identical cards.
5. **Share Streak page dark mode** -- Worst score (3/10), public-facing shareable page. Container, buttons, text all need dark overrides.
