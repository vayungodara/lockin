# LockIn Frontend Audit — 2026-04-14

**Generated:** 2026-04-14 (automated)
**Pages scored:** 7
**Visual audit context:** yes (25 Notion findings, Chrome skipped Apr 10-11)
**Note:** No app code changes since Apr 9 audit — score changes reflect calibration corrections

## Page Scores
| Page | Layout | Typography | Color | Components | Motion | Dark Mode | Responsive | Overall |
|------|--------|------------|-------|------------|--------|-----------|------------|---------|
| Landing | 8/10 | 7/10 | 6/10 | 8/10 | 7/10 | 7/10 | 8/10 | 7.3/10 |
| Dashboard | 8/10 | 8/10 | 8/10 | 8/10 | 8/10 | 8/10 | 8/10 | 8.0/10 |
| Pacts | 8/10 | 8/10 | 8/10 | 9/10 | 7/10 | 8/10 | 8/10 | 8.0/10 |
| Groups | 8/10 | 8/10 | 8/10 | 8/10 | 7/10 | 9/10 | 8/10 | 8.0/10 |
| Focus | 9/10 | 8/10 | 8/10 | 8/10 | 8/10 | 8/10 | 8/10 | 8.1/10 |
| Stats | 7/10 | 7/10 | 7/10 | 6/10 | 4/10 | 7/10 | 7/10 | 6.4/10 |
| Settings | 8/10 | 8/10 | 8/10 | 8/10 | 6/10 | 9/10 | 8/10 | 7.9/10 |

**Score changes vs Apr 9:**
| Page | Apr 9 | Apr 14 | Delta | Notes |
|------|-------|--------|-------|-------|
| Landing | 6.7 | 7.3 | +0.6 | --font-display fix landed |
| Dashboard | 8.3 | 8.0 | -0.3 | Pact card contrast concern (now fixed) |
| Pacts | 8.4 | 8.0 | -0.4 | Stricter scoring |
| Stats | 8.3 | 6.4 | -1.9 | Calibration correction — zero animations |

## Previous Finding Verification
1. **CRITICAL: --font-display undefined** — RESOLVED. Defined at globals.css:103.
2. **45+ hardcoded hex in page.module.css** — STILL OPEN. 37+ remain (editorial dark section + CTA footer).
3. **24 inline Framer Motion in LandingPageClient.js** — STILL OPEN. 25+ inline instances.
4. **Toast/MobileNav/ActivityComments inline animations** — STILL OPEN.
5. **Missing dark mode overrides in landing** — PARTIALLY RESOLVED. Landing tokens defined, but .ctaFooter/.ctaButtonLarge/.bentoCard still hardcoded.

## Notion Finding Investigation
1. **"Pact card text nearly invisible"** — CONFIRMED + FIXED. Light mode completed cards had opacity 0.7 + text-tertiary (~3:1 contrast). Fixed to opacity 0.8 + text-secondary. Dark mode was already mitigated at 0.9 opacity.
2. **"Dark mode well-implemented except pact cards"** — MITIGATED. Dark override at PactCard.module.css:378 boosts to 0.9 opacity + text-primary.
3. **"Stats page 6.5/10 — zero animations"** — CONFIRMED. StatsPageClient.js imports zero Framer Motion. Entirely static page.
4. **"Landing hero 3+ seconds to appear"** — PARTIALLY CONFIRMED. Animation delays max out at 0.8s. The 3+ second delay is TTFB from force-dynamic + getUser(), not animation.
5. **"Stats page only activity calendar"** — NOT CONFIRMED. Analytics grid exists in code (StatsPageClient.js:250-278) with pact analytics and focus stats. May be a data/visual issue.

## AI-Generated Tells
| File | Element | What a human designer would do differently |
|------|---------|-------------------------------------------|
| StatsPageClient.js | Analytics cards | Plain bordered cards with dot+label+value rows. A human would add entrance stagger, hover micro-interactions, visual weight to primary metric |
| StatsPageClient.js | Streak summary | Single-line text with no visual hierarchy or celebration. Compare to TodayBar which treats streak as hero |
| page.module.css | `.bentoCard` grid | All four bento cards identical padding/radius/hover — vary visual weight for wide card |
| FocusTimer.module.css | Timer controls | Sizes are good but spacing/layout purely functional with no visual personality |

## Hardcoded Values
| File | Line(s) | Current Value | Recommended CSS Variable |
|------|---------|---------------|--------------------------|
| TodayBar.module.css | 8, 47-73 | `#FFFCF5` (7x) | Create `--streak-warm-bg` token |
| page.module.css | 274, 313 | `#16a34a` | `var(--success)` |
| page.module.css | 604 | `#B45309` | `var(--urgency-amber)` |
| page.module.css | 829 | `#09090B` | `var(--landing-ink)` (same value) |
| page.module.css | 898 | `#27272A` | Create `--landing-surface-dark` |
| page.module.css | 1303-1304, 1386, 1395 | `#312E81`, `#1E1B4B` | Create `--landing-accent-deep` |
| Dashboard.module.css | 143 | `#EA580C` | `var(--landing-tension)` |

## Missing Dark Mode Overrides
| File | Selector | Issue |
|------|----------|-------|
| page.module.css | `.bentoCard` | Hardcoded #27272A, no token adaptation |
| page.module.css | `.ctaButtonLarge` | White bg + #1e1b4b text, no dark override |
| page.module.css | `.bentoAvatar`, `.bentoAvatarMore` | Border hardcoded #27272A |
| page.module.css | `.bentoReward` | background: #09090B, no dark adjustment |

## Animation Violations
| File | Line(s) | Issue | Correct Preset |
|------|---------|-------|----------------|
| LandingPageClient.js | 85-145 | 5 inline initial/animate on hero elements | Use fadeInUp from @/lib/animations |
| LandingPageClient.js | 170-176 | Inline floating card animation | Custom OK but could use preset |
| Toast.js | 65-68 | Inline spring animation | Create toastEnter/toastExit presets |
| MobileNav.js | 68, 94 | Inline whileTap={{ scale: 0.95 }} | Use buttonTap |
| ActivityComments.js | 86-87 | Inline expand/collapse | Create expandCollapse preset |
| ActivityItem.js | 269-270 | Inline initial={{ opacity: 0, scale: 0 }} | Use scaleIn or fadeInScale |

## Quick Visual Wins (<1hr)
| File | CSS Class | Current | Recommended |
|------|-----------|---------|-------------|
| TodayBar.module.css | `.bar` / streak tiers | 7x `#FFFCF5` | Define `--streak-warm-bg` in globals.css |
| StatsPage.module.css | `.analyticsCard` | No hover state | Add hover transition + box-shadow |
| StatsPageClient.js | Entire file | Zero motion imports | Add staggerContainer/staggerItem for analytics cards |
| MobileNav.js | Lines 68, 94 | Inline whileTap | Replace with imported buttonTap |
| Dashboard.module.css | `.streakHighlight` | Hardcoded #EA580C | Use var(--landing-tension) |

## Component Redesigns (1-4hr)
| Component | File | Issue | Recommended Approach |
|-----------|------|-------|---------------------|
| Landing Dark Section | page.module.css:828-1038 | 30+ hardcoded hex bypass design system | Define landing-specific dark tokens |
| Landing Animations | LandingPageClient.js | 25+ inline Framer Motion | Extract to heroEntrance, sectionReveal presets |
| CTA Footer | page.module.css:1381-1515 | Hardcoded indigo breaks accent switching | Replace with accent-aware variables |
| Stats Page | StatsPageClient.js | Zero animations, lowest scoring page | Add stagger, hover, entrance animations |

## Top 5 Highest Impact Changes
1. **Stats page animation overhaul** — Lowest page at 6.4/10, zero Framer Motion. Adding stagger/fadeIn for analytics cards would lift to ~7.5+ and address Notion findings.
2. **Extract landing inline animations into presets** — 25+ inline definitions in LandingPageClient.js. Extract to named presets in @/lib/animations.js.
3. **Consolidate TodayBar hardcoded colors** — 7 instances of #FFFCF5 should become --streak-warm-bg token.
4. **Landing page token consolidation** — Create 4-5 landing-specific tokens to replace 37+ hardcoded hex values.
5. **Toast animation preset** — Extract inline spring animation to toastSpring preset for global tuning.
