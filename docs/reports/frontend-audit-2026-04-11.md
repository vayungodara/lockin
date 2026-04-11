# LockIn Frontend Audit — 2026-04-11

**Generated:** 2026-04-11 (automated)
**Pages scored:** 8
**Visual audit context:** no (Chrome extension unavailable)

## Page Scores
| Page | Layout | Typography | Color | Components | Motion | Dark Mode | Overall |
|------|--------|------------|-------|------------|--------|-----------|---------|
| Landing | 8/10 | 7/10 | 6/10 | 8/10 | 8/10 | 7/10 | 7.4/10 |
| Dashboard | 8/10 | 8/10 | 9/10 | 8/10 | 9/10 | 9/10 | 8.4/10 |
| Pacts | 8/10 | 8/10 | 9/10 | 8/10 | 8/10 | 8/10 | 8.1/10 |
| Groups | 8/10 | 8/10 | 9/10 | 8/10 | 7/10 | 9/10 | 8.1/10 |
| Focus | 8/10 | 8/10 | 9/10 | 9/10 | 8/10 | 8/10 | 8.1/10 |
| Stats | 8/10 | 8/10 | 9/10 | 8/10 | 7/10 | 8/10 | 8.0/10 |
| Settings | 8/10 | 8/10 | 9/10 | 9/10 | 7/10 | 9/10 | 8.3/10 |
| Sidebar | 9/10 | 8/10 | 9/10 | 9/10 | 9/10 | 8/10 | 8.6/10 |

## AI-Generated Tells
| File | Element | What a human designer would do differently |
|------|---------|-------------------------------------------|
| Dashboard.module.css | .statsGrid (3 uniform stat cards) | Vary visual weight — make primary stat larger, remove colored left border from one card |
| StatsPage.module.css | .analyticsCard (symmetric pair) | Make one card span full width or use different surface treatment |
| page.module.css | .bentoCard (identical padding/radius/bg) | Vary card sizes, use different surface treatments (glass/solid/gradient) |
| GroupStats.module.css | .statsGrid (3 identical KPI boxes) | Show hero number outside grid, use inline layout for secondary stats |

## Quick Visual Wins (<1hr)
| File | CSS Class | Current | Recommended | CSS Variable |
|------|-----------|---------|-------------|-------------|
| CompactActivityCard.module.css | .dayLabel | font-size: 10px | font-size: var(--text-xs) | --text-xs |
| Sidebar.module.css | .logoTextWrapper | margin-top: 4px | margin-top: var(--space-1) | --space-1 |
| Dashboard.module.css | .statValue | font-weight: 700 | font-weight: var(--font-bold) | --font-bold |
| MonthlyCalendar.module.css | dark .level3/.level4 | color: #FFFFFF | color: var(--text-inverse) | --text-inverse (FIXED) |
| FocusTimer.module.css | .time | font-weight: 800 | font-weight: var(--font-extrabold) | --font-extrabold |
| page.module.css | .heroCtas | gap: 16px | gap: var(--space-4) | --space-4 |
| page.module.css | .ctaPrimary | padding: 16px 32px | padding: var(--space-4) var(--space-8) | --space-4, --space-8 |

## Component Redesigns (1-4hr)
| Component | File | Issue | Recommended Approach |
|-----------|------|-------|---------------------|
| CreatePactModal | CreatePactModal.module.css | ZERO dark mode overrides — biggest gap | Add :global([data-theme="dark"]) blocks matching CreateGroupModal patterns |
| TaskCard | TaskCard.module.css | Broken dark mode selector + missing overrides | Fix :global() wrapper, add card/hover/button dark overrides |
| Landing Page | page.module.css | 40+ hardcoded hex values | Extract into landing-specific CSS custom properties |
| PactCard | PactCard.module.css | Only .completed has dark overrides | Add base card, hover, action button dark overrides |

## Dark Mode Coverage
| File | Missing Overrides | Specific Properties |
|------|-------------------|---------------------|
| CreatePactModal.module.css | .overlay, .modal, .input, .textarea, .cancelBtn:hover | All modal chrome — no dark overrides at all |
| TaskCard.module.css | .card, .card:hover, .actions, .actionBtn:hover | Bare [data-theme="dark"] won't work in CSS Modules |
| PactCard.module.css | .card base, .card:hover, .completeBtn, .missBtn, .badge | Only .completed states have dark overrides |

## Design System Violations (top 20)
| File | Line | Violation | Correct Token |
|------|------|-----------|---------------|
| Sidebar.module.css | 67 | font-weight: 800 | var(--font-extrabold) |
| Sidebar.module.css | 209 | font-weight: 600 | var(--font-semibold) |
| FocusTimer.module.css | 113 | font-weight: 800 | var(--font-extrabold) |
| FocusTimer.module.css | 208 | font-weight: 800 | var(--font-extrabold) |
| GroupStats.module.css | 24 | font-weight: 600 | var(--font-semibold) |
| GroupStats.module.css | 74 | font-weight: 800 | var(--font-extrabold) |
| EmptyState.module.css | 79 | font-weight: 600 | var(--font-semibold) |
| MobileNav.module.css | 124 | font-weight: 700 | var(--font-bold) |
| StreakHero.module.css | 118 | font-weight: 800 | var(--font-extrabold) |
| Dashboard.module.css | 47 | font-weight: 700 | var(--font-bold) |
| Dashboard.module.css | 156 | font-weight: 700 | var(--font-bold) |
| Dashboard.module.css | 387 | font-weight: 700 | var(--font-bold) |
| page.module.css | 119 | gap: 16px | gap: var(--space-4) |
| page.module.css | 126-127 | padding: 16px 32px; border-radius: 12px | var(--space-4) var(--space-8); var(--radius-lg) |
| page.module.css | 274 | color: #16a34a | color: var(--success) |
| page.module.css | 604 | color: #B45309 | color: var(--warning) |
| page.module.css | 687 | color: #0a8a54 | color: var(--success) |
| page.module.css | 829 | background: #09090B | var(--landing-bg) |
| page.module.css | 898 | background: #27272A | var(--bg-tertiary) |
| CompactActivityCard.module.css | 30 | font-size: 24px | var(--text-2xl) |

## Top 5 Highest Impact Changes
1. **Add dark mode overrides to CreatePactModal** — most-used modal, ZERO dark mode, every other modal has coverage. ~30min.
2. **Fix TaskCard dark mode selector syntax** — bare `[data-theme="dark"]` broken in CSS Modules + missing overrides. ~30min.
3. **Consolidate landing page hardcoded hex** — 40+ values, several repeated 3-5 times. Extract into CSS custom properties. ~1-2hr.
4. **Add dark mode to PactCard base states** — only .completed states covered, base card visible on every page. ~30min.
5. **Replace raw font-weight values with tokens** — ~40 instances across 12 files. Batch find-replace. ~30min.
