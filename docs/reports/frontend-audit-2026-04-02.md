# LockIn Frontend Audit — 2026-04-02

**Generated:** 2026-04-02 (automated)
**Pages scored:** 9
**Visual audit context:** yes (22 Notion findings from visual-audit/competitor-intel/design-trend)

## Page Scores
| Page | Layout | Typography | Color | Components | Motion | Dark Mode | Responsive | Overall |
|------|--------|------------|-------|------------|--------|-----------|------------|---------|
| Landing | 8 | 7 | 7 | 8 | 8 | 5 | 8 | 7 |
| Dashboard | 8 | 8 | 8 | 7 | 7 | 6 | 7 | 7 |
| Pacts | 7 | 7 | 8 | 7 | 7 | 5 | 7 | 7 |
| Groups | 7 | 7 | 8 | 7 | 6 | 5 | 7 | 7 |
| Group Detail | 7 | 7 | 6 | 7 | 6 | 4 | 7 | 6 |
| Focus | 8 | 8 | 7 | 8 | 7 | 5 | 7 | 7 |
| Stats | 7 | 7 | 7 | 7 | 7 | 5 | 7 | 7 |
| Settings | 8 | 8 | 8 | 8 | 5 | 5 | 8 | 7 |
| Share Streak | 7 | 7 | 7 | 6 | 5 | 4 | 7 | 6 |

**Average: 6.8/10** — Lowest scores in Dark Mode (4.9 avg) and Group Detail/Share Streak pages.

## AI-Generated Tells
| File | Element | What a Human Designer Would Do Differently |
|------|---------|-------------------------------------------|
| page.module.css | .screenshotPlaceholder | 400px gray box "Your dashboard, visualized" — replace with actual screenshot or remove |
| Dashboard.module.css | .statsGrid | Uniform 3-col stat cards — vary card prominence, make streak larger |
| PactsPage.module.css | .pactsGrid | Cookie-cutter 2-col cards — add featured/pinned treatment for today's pacts |
| GroupsPage.module.css | .groupsGrid | All same size — active groups should feel "alive" with bigger cards |
| LandingPageClient.js:399 | avatarStack | Hardcoded hex colors for fake avatars — use real avatars or gradient placeholders |
| page.module.css | .step::after | Connecting lines between steps — very common AI pattern |
| SettingsPage.module.css | .settingCard | Uniform rows with toggles — group with section cards, add icons |
| StatsPage.module.css | .streakCard | Symmetric streak display — make primary number dramatically larger |

## Hardcoded Values (21 instances)
| File | Line | Current Value | Recommended CSS Variable |
|------|------|---------------|--------------------------|
| FocusTimer.module.css | 100 | rgba(16, 185, 129, 0.4) | Use --success-glow equivalent |
| FocusTimer.module.css | 155 | rgba(245, 158, 11, 0.3) | Use --warning-glow equivalent |
| PactCard.module.css | 155 | rgba(16, 185, 129, 0.3) | Use --success-glow |
| Sidebar.module.css | 216 | rgba(99, 102, 241, 0.3) | rgba(var(--accent-primary-rgb), 0.3) |
| NotificationBell.module.css | 91, 151 | rgba(99, 102, 241, 0.1/0.05) | rgba(var(--accent-primary-rgb), ...) |
| Toast.module.css | 55-96 | 8 hardcoded rgba() for status colors | Use --success/danger/warning/info-glow/bg vars |
| NudgeButton.module.css | 20 | rgba(245, 158, 11, 0.2) | var(--warning-glow) |
| CreateTaskModal.module.css | 175 | rgba(59, 130, 246, 0.15) | rgba(var(--accent-primary-rgb), 0.15) |
| StatsPage.module.css | 246 | rgba(139, 92, 246, 0.15) | rgba(var(--accent-primary-rgb), 0.15) |
| GroupDetail.module.css | 76, 91-93 | rgba(139, 92, 246, ...) | rgba(var(--accent-primary-rgb), ...) |
| page.module.css | 631-633 | rgba(99, 102, 241, ...) | rgba(var(--accent-primary-rgb), ...) |

## Missing Dark Mode Overrides (20 files)
Most impactful files needing [data-theme="dark"] overrides:
1. FocusTimer.module.css — timer ring glow barely visible in dark mode (confirmed by Notion visual audit)
2. PactCard.module.css — completed card text low contrast in dark (confirmed by Notion visual audit)
3. GroupDetail.module.css — hardcoded violet doesn't adapt to accent palette
4. Toast.module.css — all 4 status variants need dark adjustments
5. CompactActivityCard.module.css — heatmap cells, tooltip, hover shadows
6. DailySummaryCard.module.css — freeze badge, milestone/risk banners
7. ActivityFeed.module.css, ActivityItem.module.css, ActivityComments.module.css
8. NotificationBell.module.css, XPBar.module.css, CommandPalette.module.css
9. OnboardingChecklist.module.css, StreakHero.module.css, NudgeButton.module.css
10. page.module.css, ShareStreak.module.css, StatsPage.module.css, GroupStats.module.css

Note: Many components rely on globals.css variable swaps which handles most dark mode. Issues above are specific hardcoded rgba values or custom glows that don't adapt.

## Animation Violations (6 components)
| File | Issue | Correct Preset |
|------|-------|---------------|
| MobileNav.js:101 | Inline whileTap={{ scale: 0.95 }} | buttonTap |
| MobileNav.js:128 | Inline spring transition | shared spring config |
| Toast.js:51 | Inline initial/animate/transition | fadeInUp |
| NotificationBell.js:114-172 | Multiple inline animations | scaleIn, fadeInUp, buttonTap |
| Navbar.js:35-87 | Inline entrance animations | fadeInDown or pageTransition |
| CompactActivityCard.js:139-144 | Inline variants object | cardHover |

## Quick Visual Wins (<1hr each)
| File | CSS Class | Current | Recommended |
|------|-----------|---------|-------------|
| Sidebar.module.css:216 | .miniTimer | hardcoded rgba(99,102,241) | rgba(var(--accent-primary-rgb), 0.3) |
| NotificationBell.module.css:91,151 | .markAllBtn:hover | hardcoded indigo | rgba(var(--accent-primary-rgb), ...) |
| GroupDetail.module.css:76,91 | .lockedInBadge | hardcoded violet | rgba(var(--accent-primary-rgb), ...) |
| page.module.css:631 | .mockLevel1-3 | hardcoded indigo | rgba(var(--accent-primary-rgb), ...) |
| page.module.css | .heroTitle, .statNumber | hardcoded font-weight | var(--font-extrabold), var(--font-bold) |

## Component Redesigns (1-4hr each)
| Component | File | Issue | Recommended Approach |
|-----------|------|-------|---------------------|
| Toast | Toast.module.css + Toast.js | All hardcoded status rgba, no dark mode, no animation presets | Replace with CSS vars, add dark overrides, use fadeInUp preset |
| NotificationBell | NotificationBell.module.css + .js | Hardcoded accent (breaks non-indigo palettes), inline animations | Use --accent-primary-rgb, import presets |
| CompactActivityCard | CompactActivityCard.module.css + .js | Hardcoded font-sizes, gaps, inline variants, no dark mode | Convert to tokens, import cardHover, add dark mode |
| ActivityComments | ActivityComments.module.css | Hardcoded font sizes (9-13px), no dark mode | Normalize to --text-xs/--text-sm, add dark overrides |
| Landing Placeholder | page.module.css .screenshotPlaceholder | Gray box placeholder — weakest visual element | Replace with actual screenshot or remove entirely |

## Design System Recommendations
| Type | Name | Value | Reasoning |
|------|------|-------|-----------|
| Token | --accent-primary-rgb | R, G, B values of accent | Needed for rgba() with opacity — currently most components hardcode indigo RGB |
| Token | --success-rgb | 16, 185, 129 | Needed for FocusTimer, PactCard success glows with custom opacity |
| Token | --font-extrabold | 800 | Used on landing hero but hardcoded |
| Token | --font-bold | 700 | Used on stat numbers but hardcoded |

## Top 5 Highest Impact Changes
1. **Add --accent-primary-rgb token + replace hardcoded accent rgba() (~2hr)** — 6+ files locked to indigo/violet that break on other accent palettes
2. **Toast component CSS variable migration (~1hr)** — 8 hardcoded rgba() values, high-visibility component seen constantly
3. **Remove prefers-color-scheme media queries (~15min)** — DONE in this triage (CreatePactModal, Sidebar)
4. **Import animation presets in 6 components (~2hr)** — MobileNav, Toast, NotificationBell, Navbar, CompactActivityCard most impactful
5. **Hardcoded font-sizes to typography tokens (~2hr)** — 31 instances across 12 files, DailySummaryCard and ActivityComments most impactful
