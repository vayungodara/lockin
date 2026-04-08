# LockIn Frontend Audit -- 2026-04-08

**Generated:** 2026-04-08 (automated)
**Pages scored:** 7
**Visual audit context:** yes (Notion findings from Apr 6-8)

## Page Scores
| Page | Layout | Typography | Color | Components | Motion | Dark Mode | Responsive | Overall |
|------|--------|------------|-------|------------|--------|-----------|------------|---------|
| Landing | 8 | 8 | 7 | 7 | 6 | 6 | 8 | 7 |
| Dashboard | 8 | 8 | 9 | 8 | 8 | 8 | 8 | 8 |
| Pacts | 8 | 8 | 9 | 8 | 7 | 7 | 8 | 8 |
| Groups | 8 | 8 | 8 | 8 | 7 | 7 | 8 | 8 |
| Focus | 8 | 8 | 8 | 8 | 7 | 8 | 8 | 8 |
| Stats | 7 | 8 | 8 | 7 | 7 | 8 | 8 | 8 |
| Settings | 8 | 8 | 9 | 8 | 7 | 7 | 7 | 8 |

**Score notes:**
- Landing Motion 6/10: 86 inline animation props, only ~10 use @/lib/animations presets
- Landing Dark Mode 6/10: page.module.css is 700+ lines with only 4 dark mode selectors
- Stats Layout/Components 7/10: Cards blend into background in light mode (--surface-1 on --bg-secondary with near-invisible --border-subtle)

## AI-Generated Tells
| File | Element | What a human designer would do differently |
|------|---------|-------------------------------------------|
| page.module.css:213-217 | .featureGrid -- uniform 2-col grid | Use asymmetric layout with 1 dominant card and smaller supporting cards |
| page.module.css:231-241 | .featureCard::before -- identical gradient bar on all | Reserve gradient for 1-2 hero features, differentiate others via icon tint |
| StatsPage.module.css:42-64 | .streakCard -- blends into background | Add box-shadow: var(--shadow-sm) for visible card lift |
| LandingPageClient.js:152-218 | Floating cards -- 3 identical structure | Give each card distinct visual style (avatar stack, badge, toast) |
| page.module.css:645-694 | .step -- 3 equal columns | Progressive visual weight (step 1 lighter, step 3 bolder) |

## Quick Visual Wins (<1hr)
| File | CSS Class | Current | Recommended | CSS Variable |
|------|-----------|---------|-------------|-------------|
| MonthlyCalendar.module.css | .level3/.level4 dark dayNumber | #FFFFFF | var(--text-inverse) | FIXED in this triage |
| StatsPage.module.css | .streakCard | No shadow | Add box-shadow: var(--shadow-sm) | var(--shadow-sm) |
| JoinPage.module.css | entire file | Zero dark mode overrides | Add [data-theme="dark"] overrides for card, buttons | --surface-2, --border-default |
| not-found.module.css | .link | No dark adjustment | Add dark mode override for gradient button contrast | --accent-primary |

## Component Redesigns (1-4hr)
| Component | File | Issue | Recommended Approach |
|-----------|------|-------|---------------------|
| LandingPageClient | components/LandingPageClient.js | 86 inline animation props | Extract to @/lib/animations presets; use staggerContainer/staggerItem for lists |
| Landing page dark mode | app/page.module.css | Only 4 dark rules in 700+ line file | Add dark overrides for browserFrame, mockDashboard, steps, ctaCard, footer |
| Stats cards | app/dashboard/stats/StatsPage.module.css | Cards blend into bg in light mode | Add shadow-sm, or switch to --bg-elevated background |

## Dark Mode Coverage
| Status | Count | Files |
|--------|-------|-------|
| Has dark overrides | 35 | Most CSS modules |
| Missing dark overrides | 4 | not-found.module.css, JoinPage.module.css, loading.module.css, page.module.css (partial) |

**Progress:** Down from 31 missing (Apr 4) to 5 (Apr 5 after 6314b06 pass) to 4 today.

## Design System Recommendations
| Type | Name | Value | Reasoning |
|------|------|-------|-----------|
| Shadow | Default card shadow | var(--shadow-sm) on all cards | Prevents cards from blending into background in light mode |
| Background | Card surface | Consider --bg-elevated | Creates more visible separation than --surface-1 on --bg-secondary |
| Animation | Landing page | Use presets from @/lib/animations | 86 inline props vs 80+ available presets creates maintainability debt |

## Top 5 Highest Impact Changes
1. **Landing page dark mode overrides** -- page.module.css needs comprehensive dark theme (affects first impression for all dark-mode visitors)
2. **Stats card visibility** -- Add shadow-sm to streakCard and stat cards (addresses visual-audit finding about invisible borders)
3. **LandingPageClient animation refactor** -- Extract 86 inline animation props to presets (maintainability + accessibility via prefersReducedMotion)
4. **JoinPage dark mode** -- Add dark overrides to join page (user-facing invite flow, zero dark support currently)
5. **Landing feature card differentiation** -- Break the "AI-generated" uniform grid pattern with varied card styles
