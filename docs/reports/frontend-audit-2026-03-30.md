# LockIn Frontend Audit — 2026-03-30

**Generated:** 2026-03-30 (automated)
**Pages scored:** 8
**Cowork visual context:** yes (9 new findings from Mar 30, 6 carried from Mar 29)

---

## Page Scores

| Page | Layout | Typography | Color | Components | Motion | Dark Mode | Overall |
|------|--------|------------|-------|------------|--------|-----------|---------|
| Landing | 8/10 | 7/10 | 7/10 | 7/10 | 7/10 | 7/10 | 7.2/10 |
| Dashboard | 7/10 | 7/10 | 7/10 | 7/10 | 8/10 | 5/10 | 6.8/10 |
| Pacts | 7/10 | 7/10 | 7/10 | 7/10 | 7/10 | 6/10 | 6.8/10 |
| Groups | 7/10 | 7/10 | 7/10 | 7/10 | 7/10 | 6/10 | 6.8/10 |
| Focus Timer | 7/10 | 7/10 | 6/10 | 6/10 | 7/10 | 6/10 | 6.5/10 |
| Stats | 7/10 | 7/10 | 7/10 | 7/10 | 7/10 | 5/10 | 6.7/10 |
| Settings | 7/10 | 7/10 | 7/10 | 7/10 | 6/10 | 6/10 | 6.7/10 |
| Sidebar + MobileNav | 7/10 | 6/10 | 7/10 | 7/10 | 7/10 | 6/10 | 6.7/10 |

**Average:** 6.8/10 — main drag is dark mode support (5-6/10 across most pages)

---

## AI-Generated Tells

| File | Element | What a human designer would do differently |
|------|---------|-------------------------------------------|
| components/CompactActivityCard.js | L138-144 | Inline animation variants `{initial:{opacity:0,y:20}}` — a designer would use the project's animation system, not one-off values |
| components/LandingPageClient.js | L399 | Hardcoded hex array for social proof avatars — a designer would use the palette system |
| components/FocusTimer.js | L71-73 | SVG gradient with hardcoded indigo hex colors — a designer would tie to the accent color system |
| app/dashboard/Dashboard.module.css | `.statCard` | No dark mode overrides — cards blend into background. A designer would ensure visual separation |
| components/MobileNav.js | nav items | Only 5 items, missing Settings — a designer would include all core navigation |

---

## Quick Visual Wins (<1hr)

| File | CSS Class | Current | Recommended | CSS Variable |
|------|-----------|---------|-------------|-------------|
| app/globals.css L29 | `:root --text-muted` | `#A9A5BC` (2.7:1 contrast) | `#706C8A` (4.5:1 contrast) | `--text-muted` |
| app/dashboard/Dashboard.module.css L300 | `.statCard` (dark mode) | No border, blends into bg | Add `border: 1px solid var(--border-primary)` | `--border-primary` |
| app/dashboard/Dashboard.module.css L378 | `.statLabel` | `var(--text-tertiary)` | Use `var(--text-secondary)` in dark mode | `--text-secondary` |
| components/CompactActivityCard.js L138-144 | inline variants | `{opacity:0,y:20}` | Use `fadeInUp` from `@/lib/animations` | N/A (JS import) |
| components/FocusTimer.js L71-73 | SVG `stopColor` | `#6366F1`, `#8B5CF6`, `#D946EF` | Use `var(--accent-primary)`, `var(--accent-secondary)` | accent vars |

---

## Component Redesigns (1-4hr)

| Component | File | Issue | Recommended Approach |
|-----------|------|-------|---------------------|
| MobileNav | components/MobileNav.js | Missing Settings nav item (5/6 items) | Add Settings icon as 6th item or implement overflow "More" menu |
| MonthlyCalendar | components/MonthlyCalendar.module.css | Date numbers invisible in dark mode (hardcoded rgba) | Add `[data-theme="dark"]` overrides for `.level0` through `.level4` with boosted opacity |
| Sidebar | components/Sidebar.js | Truncated text labels during collapse animation | Faster opacity fade or instant text hide at collapse threshold |
| FocusTimer | components/FocusTimer.js | Plain circular ring — no ambient/immersive feel | Add optional background themes (gradient, ambient patterns) |
| OnboardingChecklist | components/OnboardingChecklist.js | Desktop challenge card renders empty | Debug Framer Motion opacity animation timing for desktop viewport |

---

## Dark Mode Issues (cross-cutting)

| File | Issue | Fix |
|------|-------|-----|
| app/dashboard/Dashboard.module.css | Card boundaries blend into page background (LI-21) | Add dark mode border or shadow |
| app/dashboard/Dashboard.module.css | 'Today' stat labels too faint (LI-23) | Use `--text-secondary` instead of `--text-tertiary` |
| components/MonthlyCalendar.module.css L259-301 | Heatmap date numbers invisible (LI-5) | Add `[data-theme="dark"]` overrides with boosted opacity |
| app/globals.css | `--text-muted` and `--text-tertiary` contrast issues in both modes | Review all secondary text colors for WCAG AA compliance |
| No `[data-theme="dark"]` in Dashboard.module.css | Zero dark mode overrides in dashboard CSS | Add dark mode section for cards, stats, labels |

---

## Design System Recommendations

| Type | Name | Value | Reasoning |
|------|------|-------|-----------|
| Color | `--text-muted` (light) | `#706C8A` (from `#A9A5BC`) | WCAG AA compliance — current value fails at 2.7:1 |
| Border | Dark mode card borders | `1px solid var(--border-primary)` | Visual hierarchy in dark mode — cards currently blend |
| Animation | Standardize all motion | Use `@/lib/animations` presets only | 2 components use inline variants, breaking consistency |
| Navigation | Mobile nav completeness | Add Settings to MobileNav | Users can't access settings on mobile |

---

## Top 5 Highest Impact Changes

1. **Dark mode card boundaries** (Dashboard.module.css) — Cards blend into background, making the entire dashboard feel flat. Fix: add dark mode borders/shadows. Affects every dashboard visitor in dark mode.
2. **Light mode contrast** (globals.css `--text-muted`) — ~2.7:1 ratio fails WCAG AA. Affects all secondary text across every page in light mode.
3. **Focus Timer "All Time" bug** (FocusPageClient.js L43) — Shows 0h when user has 6h+ total. Misleading data. Code fix needed (`.limit(10)` removal).
4. **Settings missing from mobile nav** (MobileNav.js) — Mobile users can't access settings at all. Navigation gap.
5. **Calendar dark mode visibility** (MonthlyCalendar.module.css) — Date numbers invisible in dark mode. Stats page broken for dark mode users.
