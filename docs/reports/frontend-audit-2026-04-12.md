# LockIn Frontend Audit — 2026-04-12

**Generated:** 2026-04-12 (automated)
**Pages scored:** 7
**Visual audit context:** yes (Notion findings from visual-audit task)

## Page Scores

| Page | Layout | Typography | Color | Components | Motion | Dark Mode | Overall |
|------|--------|------------|-------|------------|--------|-----------|---------|
| Landing | 9 | 9 | 6 | 8 | 8 | 7 | 7.8 |
| Dashboard | 9 | 9 | 8 | 9 | 8 | 9 | 8.7 |
| Pacts | 8 | 9 | 9 | 9 | 8 | 8 | 8.5 |
| Groups | 8 | 9 | 8 | 8 | 7 | 9 | 8.2 |
| Focus | 9 | 8 | 8 | 9 | 9 | 9 | 8.7 |
| Stats | 8 | 8 | 8 | 8 | 7 | 8 | 7.8 |
| Settings | 8 | 8 | 9 | 9 | 6 | 9 | 8.2 |

## AI-Generated Tells

| File | Element | What a human designer would do differently |
|------|---------|---------------------------------------------|
| `components/TodayBar.module.css` | `.base` through `.legendary` tiers | All 4+ tiers use identical `background: #FFFCF5` — a human would create subtle visual differentiation between streak tiers in light mode |
| `app/page.module.css` | `.bentoCard` grid | All bento cards share identical padding, border-radius, bg — a human designer would vary card scale/emphasis |
| `app/page.module.css` | `.featureCheckItem` | Checklist items uniformly spaced with identical weight — human would add visual hierarchy |
| `components/EmptyState.module.css` | `.wrapper` | Gradient-top-bar + centered icon + text + button is prototypical "AI empty state" pattern |
| `app/dashboard/settings/SettingsPage.module.css` | `.settingCard` | All setting cards identical — no visual grouping beyond section titles |

## Hardcoded Values (should be CSS variables)

| File | Line(s) | Current Value | Recommended Variable |
|------|---------|---------------|---------------------|
| `components/TodayBar.module.css` | 8, 47, 52, 57, 62, 67, 73 | `#FFFCF5` | Define `--streak-bg-light` in globals.css |
| `app/page.module.css` | 274, 313 | `color: #16a34a` | `var(--success)` |
| `app/page.module.css` | 279, 317 | `color: #4ade80` | Dark mode `var(--success)` |
| `app/page.module.css` | 604-707 | Multiple hex for status badges | `var(--success)`, `var(--warning)` |
| `app/page.module.css` | 984-1395 | `#312E81`, `#3730A3`, `#4F46E5`, `#1E1B4B` | `var(--accent-primary)` or define `--accent-deep` |
| `app/dashboard/Dashboard.module.css` | 143, 148 | `#EA580C`, `#FB923C` | `var(--landing-tension)` or define `--streak-highlight` |
| `components/MonthlyCalendar.module.css` | 470, 475 | `#FFFFFF` | `var(--text-inverse)` |

## Missing Dark Mode Overrides

| File | CSS Class | Property | Needs Dark Override |
|------|-----------|----------|---------------------|
| `app/page.module.css` | `.featuresDark .bentoCard` | Internal colors | Uses same colors in both themes — works but slightly inconsistent |
| `components/ActivityFeed.module.css` | `.header` border | `var(--border-subtle)` | Missing explicit dark border override |
| `app/dashboard/groups/[id]/GroupDetail.module.css` | `.lockedInBadge` | border, box-shadow | May need stronger border for dark mode visibility |

## Animation Issues

| File | Component | Issue | Recommended Fix |
|------|-----------|-------|-----------------|
| `components/FocusTimer.module.css` | `.timerRing::after` breathe | No `prefers-reduced-motion` override | Add `@media (prefers-reduced-motion: reduce)` |
| `components/TodayBar.module.css` | `.iconPulse` | No `prefers-reduced-motion` override | Add reduced motion query |
| `components/XPBar.module.css` | `.shimmerGlint`, `.floatXP` | No `prefers-reduced-motion` override | Add reduced motion query |
| `components/ActivityItem.module.css` | `.newItemFlash` | No `prefers-reduced-motion` override | Add reduced motion query |
| `components/ActivityFeed.module.css` | `.shimmer` | No `prefers-reduced-motion` override | Add reduced motion query |
| `components/LandingPageClient.js` | Hero entrance animations | 15+ inline `initial`/`animate`/`transition` props | Extract to named presets in `@/lib/animations` |
| `app/dashboard/settings/SettingsPageClient.js` | Settings page | No page-level or card entrance animations | Add `fadeInUp` stagger for sections |

## Quick Visual Wins (<1hr each)

| File | CSS Class | Current | Recommended | CSS Variable |
|------|-----------|---------|-------------|--------------|
| `components/TodayBar.module.css` | `.base` through `.legendary` (light) | All identical `#FFFCF5` | Graduate warmth per tier | Define `--streak-tier-bg-{n}` |
| `app/dashboard/focus/FocusPage.module.css` | `.inlineStats` | `font-size: 14px` | `font-size: var(--text-sm)` | `--text-sm` |
| `app/dashboard/focus/FocusPage.module.css` | `.lastSession` | `font-size: 11px` | `font-size: var(--text-xs)` | `--text-xs` |
| `app/dashboard/Dashboard.module.css` | `.streakHighlight` | `color: #EA580C` | `color: var(--landing-tension)` | Already defined |
| `components/MonthlyCalendar.module.css` | L470, L475 | `#FFFFFF` | `var(--text-inverse)` | Already exists |
| `components/NotificationBell.module.css` | `.dropdown` | `z-index: 9999` | `z-index: var(--z-tooltip)` or define `--z-notification` | -- |

## Component Redesigns (1-4hr)

| Component | File | Issue | Recommended Approach |
|-----------|------|-------|---------------------|
| Landing bento cards | `app/page.module.css` L897+ | All cards identical size/padding — reads as template | Vary card sizes, add unique accent gradient per card |
| Empty states | `components/EmptyState.module.css` | Single generic empty state for all pages | Create page-specific variants |
| Settings visual grouping | `SettingsPage.module.css` | Flat list of identical cards | Group related settings with visual hierarchy |
| Landing hero cards | `app/page.module.css` L224-396 | Static positioned cards | Add mouse parallax or scroll response for depth |

## Top 5 Highest Impact Changes

1. **Extract hardcoded hex colors in landing page to CSS variables** (`app/page.module.css`): 40+ hardcoded hex values across features dark section, bento cards, and status badges. These bypass the design system.

2. **Add `prefers-reduced-motion` to 8 CSS animations missing it**: FocusTimer (breathe), TodayBar (iconPulse), XPBar (shimmerGlint, floatXP), ActivityItem (newItemFlash), ActivityFeed (shimmer), NotificationBell (dotPulse, bellWiggle). Accessibility gap.

3. **Differentiate TodayBar streak tiers in light mode**: All 6 tiers render identical `#FFFCF5` backgrounds in light mode. Dark mode correctly graduates intensity. Light mode should too.

4. **Extract landing page inline Framer Motion animations to presets**: `LandingPageClient.js` has 15+ inline animation objects. Rest of app correctly uses `@/lib/animations`.

5. **Replace `color: white` with `var(--text-inverse)` across 30+ occurrences**: Found in EmptyState, XPBar, CreatePactModal, FocusTimer, MonthlyCalendar, PactCard, NotificationBell.

## Summary

The codebase is in strong shape post-redesign. Design system tokens are comprehensive and well-used. Dark mode coverage is 85%+ with proper `[data-theme="dark"]` overrides. Main gaps: (a) landing page bypasses token system with 40+ hardcoded hex values, (b) reduced motion support is inconsistent, (c) TodayBar streak tiers are visually flat in light mode. Typography is excellent — all font-families use CSS variables, heading hierarchy consistent with `--font-display`.
