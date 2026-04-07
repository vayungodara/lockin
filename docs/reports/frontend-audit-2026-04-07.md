# LockIn Frontend Audit -- 2026-04-07

**Generated:** 2026-04-07 (automated)
**Pages scored:** 9
**Visual audit context:** yes (25 Notion findings from competitor-intel/design-trend, Apr 6-7)

## Page Scores
| Page | Layout | Typography | Color | Components | Motion | Dark Mode | Responsive | Overall |
|------|--------|------------|-------|------------|--------|-----------|------------|---------|
| Landing | 8 | 8 | 7 | 7 | 5 | 6 | 8 | 7.0 |
| Dashboard | 8 | 8 | 8 | 7 | 7 | 7 | 8 | 7.6 |
| Pacts | 7 | 8 | 8 | 8 | 7 | 7 | 7 | 7.4 |
| Groups | 7 | 8 | 8 | 7 | 6 | 7 | 7 | 7.1 |
| Group Detail | 7 | 7 | 8 | 7 | 6 | 7 | 7 | 7.0 |
| Focus | 8 | 8 | 9 | 8 | 7 | 8 | 7 | 7.9 |
| Stats | 7 | 8 | 8 | 7 | 6 | 7 | 7 | 7.1 |
| Settings | 7 | 8 | 8 | 8 | 6 | 8 | 8 | 7.6 |
| Share Streak | 6 | 7 | 7 | 6 | 6 | 7 | 7 | 6.6 |

**Average: 7.3/10** (up from 6.8 yesterday -- dark mode commit 6314b06 raised scores across 8 pages)

### Score Changes vs Yesterday
| Page | Yesterday | Today | Delta | Reason |
|------|-----------|-------|-------|--------|
| Landing | 6.9 | 7.0 | +0.1 | Dark mode 5->6 (CTA button dark overrides added) |
| Dashboard | 7.1 | 7.6 | +0.5 | Dark mode 4->7 (36 lines of dark overrides for stat cards, icons, borders) |
| Pacts | 7.1 | 7.4 | +0.3 | Dark mode 5->7 (statsBar, filterTabs, backBtn dark overrides) |
| Groups | 6.6 | 7.1 | +0.5 | Dark mode 3->7 (14+ dark rules for cards, progress bars, avatars, badges) |
| Group Detail | 6.4 | 7.0 | +0.6 | Dark mode 3->7 (17+ dark rules for kanban, leaderboard, member cards) |
| Focus | 7.9 | 7.9 | 0.0 | Already strong, stable |
| Stats | 6.7 | 7.1 | +0.4 | Dark mode 4->7 (StatsPage + 56 lines MonthlyCalendar + 24 lines StreakHero) |
| Settings | 6.7 | 7.6 | +0.9 | Dark mode 3->8 (18 dark rules for toggle, slider, theme buttons, kbd, swatches). Largest improvement. |
| Share Streak | 6.0 | 6.6 | +0.6 | Dark mode 3->7 (card glow, streak text shadow, share button glow) |

## AI-Generated Tells
| File | Element | What a Human Designer Would Do Differently |
|------|---------|-------------------------------------------|
| Dashboard.module.css | .statsGrid | Uniform 3-col stat cards. Human: hero "Completed Today" card spanning full width, secondary compact items. |
| page.module.css | .featureGrid | Symmetric 2x2 grid, no rhythm. Human: vary sizes, alternate accent colors, different density. |
| StatsPage.module.css | .analyticsGrid | Mirror-image 50/50 cards. Human: primary metric larger, embed sparkline, asymmetric layout. |
| PactCard.module.css | .card::before | Every state uses same left-border+glow. Human: differentiate -- checkmark watermark for completed, desaturated for missed. |
| page.module.css | .steps | Three identical step cards. Human: numbered timeline, staggered sizes, progressive intensity. |
| EmptyState.module.css | .wrapper | Generic centered empty state. Human: unique illustrations per context, horizontal variant. |

## Hardcoded Values
| File | Line | Current | Recommended |
|------|------|---------|-------------|
| page.module.css | 363-365 | #FF5F56, #FFBD2E, #27C93F | Acceptable -- macOS window dots |
| MonthlyCalendar.module.css | 470, 475 | #FFFFFF | **FIXED** to var(--text-inverse) in this triage |
| not-found.module.css | 52 | #fff in var() fallback | Acceptable -- CSS fallback value |

## Missing Dark Mode (5 files remaining after 6314b06)
| Priority | File | What Needs Dark Overrides |
|----------|------|--------------------------|
| HIGH | app/join/[code]/JoinPage.module.css | .card border/shadow, .cancelBtn, .container -- user-facing invite page |
| HIGH | components/TaskCard.module.css | .card border/shadow, .actions popup, .claimBtn, deadline badges (only .loadingOverlay has dark) |
| MEDIUM | app/dashboard/loading.module.css | .block skeleton pulse opacity too faint on dark bg |
| LOW | app/dashboard/DashboardLayout.module.css | Layout shell border/transition (relies on globals, mostly works) |
| LOW | app/not-found.module.css | Box-shadow and outline need dark adjustments |

## Animation Violations (15 files, ~42 inline transitions)
| File | Count | Worst Offenders |
|------|-------|----------------|
| LandingPageClient.js | ~42 | Hero section, feature cards, steps, CTA, footer -- all have inline timing |
| OnboardingChecklist.js | ~6 | Inline exit/transition objects |
| Toast.js | 1 | Inline spring transition |
| MonthlyCalendar.js | ~5 | Month change transitions, day cell stagger |
| XPBar.js | 1 | Inline fill transition |
| Navbar.js | 2 | Inline transitions |
| ActivityItem.js | 1 | Inline spring for reactions |
| MobileNav.js | 1 | Inline spring for nav pill |
| CompactActivityCard.js | 1 | Inline transition duration |
| ActivityComments.js | 1 | Inline transition duration |
| Sidebar.js | 2 | Inline transition durations |

## Missing prefers-reduced-motion Guards (CSS @keyframes)
| File | Animation | Fix |
|------|-----------|-----|
| StreakHero.module.css | iconPulse | Add @media (prefers-reduced-motion: reduce) { animation: none } |
| GroupDetail.module.css | pulse-glow, blink | Same |
| NotificationBell.module.css | dotPulse | Same |
| FocusTimer.module.css | breathe | Same |
| page.module.css | heroTagDot pulse | Same |

## Quick Visual Wins (<1hr)
| File | CSS Class | Current | Recommended |
|------|-----------|---------|-------------|
| MonthlyCalendar.module.css | dark .level3/.level4 | #FFFFFF | **FIXED** to var(--text-inverse) |
| JoinPage.module.css | (entire file) | No dark mode | Add [data-theme="dark"] for .card, .cancelBtn |
| TaskCard.module.css | .card, .actions | Only loadingOverlay dark | Add dark overrides for card border/shadow, actions popup |
| loading.module.css | .block | No dark override | Add dark background: rgba(255,255,255,0.04) |
| 5 CSS files | @keyframes | No reduced-motion guards | Add @media (prefers-reduced-motion: reduce) blocks |

## Component Redesigns (1-4hr)
| Component | File | Issue | Recommended Approach |
|-----------|------|-------|---------------------|
| LandingPageClient | components/LandingPageClient.js | 42+ inline animation transitions | Replace with heroText, revealUp, staggerContainer/staggerItem presets |
| TaskCard dark mode | components/TaskCard.module.css | Only 1 dark mode rule | Comprehensive dark mode block for all states |
| JoinPage dark mode | app/join/[code]/JoinPage.module.css | Zero dark mode overrides | Full dark treatment for user-facing invite page |
| NotificationBell dropdown | components/NotificationBell.module.css | Hardcoded left: 80px, text clipping | Dynamic positioning, overflow handling |
| Share Streak Card | app/share/streak/ShareStreak.module.css | Lacks hover/focus states, raw font sizes | Polish for shareable page quality |

## Design System Recommendations
| Type | Name | Value | Reasoning |
|------|------|-------|-----------|
| Enforcement | prefersReducedMotion | N/A | 5+ CSS files with @keyframes lack reduce-motion guards |
| Pattern | Dark mode baseline | N/A | 5/38 CSS files still have zero overrides (down from 31 yesterday) |
| Convention | Animation imports | N/A | LandingPageClient: 42+ inline transitions vs 80+ available presets |
| Token gap | None | N/A | globals.css token system comprehensive; issue is adoption |

## Top 5 Highest Impact Changes
1. **Refactor LandingPageClient.js inline animations** -- 42+ inline transitions on the most user-visible page. Use heroText, revealUp, staggerContainer/staggerItem presets. (~2 hrs)
2. **Add dark mode to TaskCard + JoinPage CSS** -- TaskCard appears on every group detail page, JoinPage is the first thing invited users see. Both will look broken in dark mode. (~1 hr)
3. **Add prefers-reduced-motion guards to 5 CSS files** -- StreakHero, GroupDetail, NotificationBell, FocusTimer, landing page all have CSS @keyframes without reduce-motion guards. Accessibility requirement. (~30 min)
4. **Fix NotificationBell dropdown positioning** -- Hardcoded left: 80px only works with collapsed sidebar. Header text clipping reported in visual audit. (~1 hr)
5. **Add dark mode to loading skeleton + DashboardLayout** -- Skeleton pulse too faint on dark backgrounds, layout shell missing border adjustments. (~30 min)
