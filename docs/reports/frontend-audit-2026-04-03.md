# LockIn Frontend Audit — 2026-04-03

**Generated:** 2026-04-03 (automated)
**Pages scored:** 9
**Visual audit context:** yes (25 Notion findings from visual-audit/competitor-intel/design-trend)

## Page Scores
| Page | Layout | Typography | Color | Components | Motion | Dark Mode | Responsive | Overall |
|------|--------|------------|-------|------------|--------|-----------|------------|---------|
| Landing | 8 | 7 | 7 | 8 | 6 | 4 | 8 | 7 |
| Dashboard | 8 | 8 | 8 | 7 | 7 | 5 | 7 | 7 |
| Pacts | 7 | 7 | 8 | 7 | 7 | 6 | 7 | 7 |
| Groups | 7 | 7 | 8 | 7 | 6 | 4 | 7 | 7 |
| Group Detail | 7 | 7 | 7 | 7 | 6 | 4 | 7 | 6 |
| Focus | 8 | 8 | 8 | 8 | 7 | 7 | 7 | 8 |
| Stats | 7 | 7 | 7 | 7 | 7 | 4 | 7 | 7 |
| Settings | 8 | 8 | 8 | 8 | 5 | 4 | 8 | 7 |
| Share Streak | 7 | 7 | 6 | 6 | 5 | 3 | 7 | 6 |

**Average: 6.9/10** — Focus page improved to 8 (dark mode fixes). Lowest: Share Streak (6), Group Detail (6). Dark Mode remains weakest dimension (4.6 avg).

### Score Changes vs Yesterday
| Page | Dimension | Yesterday | Today | Reason |
|------|-----------|-----------|-------|--------|
| Focus | Dark Mode | 5 | 7 | Timer ring dark overrides added in 7a34a37 |
| Pacts | Dark Mode | 5 | 6 | Completed card contrast fix in 7a34a37 |
| Landing | Motion | 8 | 6 | Downgrade: 92 inline animations counted (worst in project) |
| Settings | Dark Mode | 5 | 4 | Downgrade: closer inspection reveals zero [data-theme="dark"] overrides |
| Share Streak | Dark Mode | 4 | 3 | Downgrade: container bg hardcoded, buttons have no dark overrides |

## AI-Generated Tells
| File | Element | What a Human Designer Would Do Differently |
|------|---------|-------------------------------------------|
| app/dashboard/groups/GroupsPage.module.css | .groupsGrid | Uniform 2-col grid — vary card sizes, give owned groups hero treatment |
| app/dashboard/pacts/PactsPage.module.css | .pactsGrid | Uniform 2-col grid — urgent pacts get larger card, completed de-emphasized |
| app/page.module.css | .steps (.step) | 3 identical step cards — stagger sizes, add unique illustrations per step |
| components/CompactActivityCard.module.css | .card:hover | Same box-shadow hover as every card — use border-color shift or accent glow |
| app/dashboard/Dashboard.module.css | .statsGrid | 3 identical stat cards — make primary stat (streak) larger |
| app/page.module.css | .featureGrid | 2x2 + span-2 but identical treatment — use bento-grid asymmetry |
| components/GroupStats.module.css | .statsGrid | 3 identical stat boxes — merge related stats or vary sizes |
| app/share/streak/ShareStreak.module.css | .card | Generic gradient card — add lock icon watermark or confetti pattern |

## Hardcoded Values (Fixed This Session)
| File | Line | Old Value | New Value |
|------|------|-----------|-----------|
| app/page.module.css | 5-6 | rgba(91, 94, 245, 0.08) / rgba(224, 64, 203, 0.05) | rgba(var(--accent-primary-rgb), 0.08) / rgba(var(--accent-tertiary-rgb), 0.05) |
| app/page.module.css | 722 | color: #fff | color: var(--text-inverse) |
| app/page.module.css | 799-800 | rgba(99, 102, 241) / rgba(217, 70, 239) | rgba(var(--accent-primary-rgb)) / rgba(var(--accent-tertiary-rgb)) |
| app/join/[code]/JoinPage.module.css | 61-62 | rgba(239, 68, 68, 0.1/0.2) | var(--danger-bg) / var(--danger-light) |

## Remaining Hardcoded Values
| File | Line | Current Value | Notes |
|------|------|---------------|-------|
| app/page.module.css | 412-414 | #FF5F56, #FFBD2E, #27C93F (macOS dots) | Acceptable: standard window decoration colors |
| components/TaskCard.module.css | 225 | rgba(255, 255, 255, 0.6) | Needs dark override |
| app/dashboard/settings/SettingsPage.module.css | 246 | rgba(0, 0, 0, 0.2) knob shadow | Acceptable but needs dark variant |

## Missing Dark Mode (31 CSS files — top priority)
| Priority | File | Key Selectors Missing Dark Override |
|----------|------|-------------------------------------|
| 1 | app/page.module.css | .main, .featureCard, .step, .ctaCard, .footer (entire landing page) |
| 2 | app/dashboard/settings/SettingsPage.module.css | .settingCard, .toggle, .toggleKnob, .kbd, .slider (all controls) |
| 3 | app/dashboard/groups/GroupsPage.module.css | .groupCard, .progressBar, .emptyState |
| 4 | app/dashboard/groups/[id]/GroupDetail.module.css | .kanbanColumn, .leaderboardCard, .memberCard |
| 5 | app/dashboard/stats/StatsPage.module.css | .streakCard, .analyticsCard, .sessionsCard |
| 6 | app/dashboard/Dashboard.module.css | .statCard, .statsGrid, .emptyState |
| 7 | app/dashboard/focus/FocusPage.module.css | .statsCard, .historyCard, .sessionItem |
| 8 | app/share/streak/ShareStreak.module.css | .container, .shareBtn, .backBtn |
| 9 | components/ActivityFeed.module.css | .container, .skeleton |
| 10 | components/Navbar.module.css | entire file |

## Animation Violations (190+ inline occurrences)
| File | Count | Priority |
|------|-------|----------|
| components/LandingPageClient.js | 92 | HIGH — worst violator |
| components/Sidebar.js | 26 | MEDIUM |
| components/NotificationBell.js | 7 | LOW |
| components/MonthlyCalendar.js | 7 | LOW |
| components/OnboardingChecklist.js | 6 | LOW |
| components/CreatePactModal.js | 6 | LOW |
| components/ActivityItem.js | ~10 | LOW |

## Quick Visual Wins (<1hr)
| File | CSS Class | Current | Recommended | CSS Variable |
|------|-----------|---------|-------------|-------------|
| components/TaskCard.module.css | .loadingOverlay | rgba(255,255,255,0.6) | Add dark override rgba(0,0,0,0.4) | -- |
| components/CompactActivityCard.module.css | .tooltip | No dark mode | Add dark bg/border overrides | --bg-elevated, --border-default |
| app/dashboard/stats/StatsPage.module.css | .analyticsCard | No dark mode | Add dark background override | --surface-1 |
| app/page.module.css | .step p | var(--text-secondary) | Consider --text-primary for better contrast | --text-primary |

## Component Redesigns (1-4hr)
| Component | File | Issue | Recommended Approach |
|-----------|------|-------|---------------------|
| Landing Page Animations | components/LandingPageClient.js | 92 inline Framer Motion animations | Extract to named presets in @/lib/animations |
| Settings Dark Mode | SettingsPage.module.css | Zero dark mode overrides | Add [data-theme="dark"] for all controls |
| Landing Dark Mode | app/page.module.css | No dark overrides (1064 lines) | Add comprehensive dark mode section |
| Share Streak | ShareStreak.module.css + Client.js | No dark mode, no brand personality | Add dark mode, lock icon watermark |
| Stats Dark Mode | StatsPage.module.css | No dark overrides for stat cards | Add [data-theme="dark"] section |

## Design System Recommendations
| Type | Name | Value | Reasoning |
|------|------|-------|-----------|
| Variable | --text-inverse | Already exists | Use instead of hardcoded #fff on accent backgrounds |
| Variable | --accent-primary-rgb | Already exists | Use instead of hardcoded 91,94,245 or 99,102,241 |
| Pattern | Bento grid | Asymmetric card sizes | Differentiate from uniform AI-generated grid patterns |
| Pattern | Dark glassmorphism | Trend-aligned (Notion finding) | Aligns with 2026 design trends and user's glass modal preference |

## Top 5 Highest Impact Changes
1. **ADD DARK MODE TO LANDING PAGE** (page.module.css) — First page users see, zero dark support across 1064 lines
2. **ADD DARK MODE TO SETTINGS PAGE** (SettingsPage.module.css) — Users toggle dark mode here but settings controls have no dark overrides
3. **REFACTOR LANDING ANIMATIONS** (LandingPageClient.js) — 92 inline animations, worst violator, extract to @/lib/animations presets
4. **ADD DARK MODE TO GROUPS PAGES** (GroupsPage + GroupDetail CSS) — Kanban board, member cards all lack dark overrides
5. **REPLACE REMAINING HARDCODED ACCENT COLORS** — 3 remaining rgba values in page.module.css break non-indigo palettes
