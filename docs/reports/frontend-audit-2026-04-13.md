# LockIn Frontend Audit — 2026-04-13

**Generated:** 2026-04-13 (automated)
**Pages scored:** 7 + 8 shared components
**Visual audit context:** yes (Notion findings, no live browsing — Chrome extension unavailable)

## Page Scores
| Page | Layout | Typography | Color | Components | Motion | Dark Mode | Overall |
|------|--------|------------|-------|------------|--------|-----------|---------|
| Landing | 8 | 9 | 7 | 8 | 7 | 8 | **7.8** |
| Dashboard | 9 | 8 | 8 | 9 | 8 | 7 | **8.2** |
| Pacts | 8 | 8 | 9 | 7 | 7 | 7 | **7.5** |
| Groups | 8 | 8 | 8 | 8 | 6 | 9 | **7.8** |
| Focus | 9 | 8 | 8 | 9 | 9 | 8 | **8.5** |
| Stats | 7 | 8 | 8 | 6 | 4 | 6 | **6.5** |
| Settings | 8 | 8 | 8 | 8 | 7 | 9 | **8.0** |

**Shared Component Scores:**
| Component | Score | Notes |
|-----------|-------|-------|
| Sidebar | 8.5 | Arc-style, XP ring, gradient logo. Only 1 dark override. |
| MobileNav | 8 | Glass background, safe-area, active glow. 4 dark overrides. |
| TodayBar | 8 | Impressive tier system. 26 dark overrides. 6x hardcoded `#FFFCF5`. |
| PactCard | 8.5 | Urgency hierarchy excellent. Shimmer on completion. |
| ActivityFeed | 7 | Clean but minimal. Only 2 dark overrides. |
| XPBar | 8.5 | Most "Duolingo" component. Level badge, gradient fill, shimmer. |
| EmptyState | 7 | Gradient border nice but static/generic. |
| globals.css | 8.8 | Excellent design system foundation. Comprehensive token coverage. |

## AI-Generated Tells
| File | Element | What a human designer would do differently |
|------|---------|-------------------------------------------|
| LandingPageClient.js | Bento grid cards | Vary card proportions — all identical padding/radius feels templated |
| LandingPageClient.js | Social proof copy | Use specific numbers ("Join 500+ students") not generic phrasing |
| Multiple pages | Section spacing | All use identical `gap: var(--space-6)` — vary rhythm per content |
| Stats page | Analytics cards | Plain rectangles with no visual interest — add icons, gradients, hover states |
| EmptyState component | All empty states | Text-only with gradient bar — should have unique illustrations per page |
| Loading states | Skeleton screens | Generic pulsing blocks — should match page structure |

## Hardcoded Hex Values (should use CSS variables)
| File | CSS Class | Current | Recommended | CSS Variable |
|------|-----------|---------|-------------|-------------|
| TodayBar.module.css | multiple (6x) | `#FFFCF5` | Extract to token | `--todaybar-bg` |
| Dashboard.module.css | .streakHighlight | `#EA580C` / `#FB923C` | Use streak token | `--streak-color` |
| page.module.css (landing) | featuresDark (~25 values) | `#09090B`, `#27272A`, etc. | Extract to landing tokens | `--landing-dark-*` |
| MonthlyCalendar.module.css | 2 instances | `#FFFFFF` | Use existing token | `--text-inverse` |

## Missing Dark Mode Overrides
| File | Selectors Missing | Impact |
|------|-------------------|--------|
| ActivityFeed.module.css | header border, empty state, skeleton gradient | Medium — feed looks flat in dark |
| Sidebar.module.css | nav item hover, footer border, collapse button | Medium — interactions invisible in dark |
| PactsPage.module.css | filter tab hover | Low — `rgba(255,255,255,0.04)` barely visible |
| loading.module.css | skeleton pulse | Low — works via token inheritance but no explicit treatment |

## Animation Violations
| File | Count | Issue | Recommendation |
|------|-------|-------|----------------|
| LandingPageClient.js | 60+ inline configs | Repetitive `initial/animate/transition` | Extract to `landingFadeInUp` preset in animations.js |
| DashboardClient.js | 4 inline configs | Should use existing presets | Replace with `fadeInUp` / `scaleIn` from lib |
| TodayBar.js | 2 inline configs | Height: 'auto' animation | Acceptable — height animations need custom configs |

## Quick Visual Wins (<1hr)
| File | CSS Class | Current | Recommended | Effort |
|------|-----------|---------|-------------|--------|
| TodayBar.module.css | 6 selectors | `#FFFCF5` hardcoded | Extract `--todaybar-bg` token | 5 min |
| ActivityFeed.module.css | dark overrides | 2 overrides only | Add border, empty state, skeleton dark styles | 10 min |
| GroupsPage.module.css | group cards | No hover elevation | Add `transform: translateY(-2px)` on hover | 15 min |
| StatsPage.module.css | analytics cards | No hover state | Add hover elevation + border highlight | 15 min |
| Sidebar.module.css | dark mode | 1 override only | Add nav hover, footer border, collapse btn dark styles | 10 min |

## Component Redesigns (1-4hr)
| Component | File | Issue | Recommended Approach |
|-----------|------|-------|---------------------|
| Stats page | StatsPage.module.css | Most underdeveloped page — zero animations, plain cards, no visual reward | Add completion rings, streak milestones, animated counters, focus timeline |
| Empty states | EmptyState.module.css | Generic text-only states across all pages | Contextual XP-earning CTAs with per-page illustrations |
| Loading states | loading.module.css | Generic pulsing blocks | Page-structure-matching skeleton screens |

## Design System Recommendations
| Type | Name | Value | Reasoning |
|------|------|-------|-----------|
| Token | `--todaybar-bg` | `#FFFCF5` light / `var(--surface-1)` dark | Eliminate 6 hardcoded hex values |
| Token | `--streak-color` | `#EA580C` | Used in Dashboard streak highlight |
| Token set | `--landing-dark-*` | 8-10 tokens for featuresDark section | 25+ hardcoded hex values bypass design system |
| Preset | `landingFadeInUp` | `{ initial: { opacity: 0, y: 24 }, whileInView: { opacity: 1, y: 0 }, ... }` | Clean up 60+ inline motion configs |

## Top 5 Highest Impact Changes
1. **Dark mode card separation** (Dashboard + Stats + Pacts) — Cards blend with background in dark mode. Fix with `box-shadow` + `border-color` in dark overrides. Matches known Notion finding. **Effort: 2hr. Impact: High.**
2. **Stats page visual upgrade** — Zero animations, plain cards. Needs completion rings, streak milestones, animated counters. **Effort: 4-6hr. Impact: High (user engagement).**
3. **Landing page hex extraction** — 25+ hardcoded values bypass design system. Extract to `--landing-dark-*` tokens. **Effort: 1-2hr. Impact: Medium (maintainability).**
4. **Entry animations on card lists** (Pacts, Groups, Dashboard) — Cards pop in with no transition. Add staggered `fadeInUp` from `@/lib/animations`. **Effort: 1-2hr. Impact: Medium (polish).**
5. **Empty state gamification** — Replace generic text with XP-earning CTAs and contextual illustrations. **Effort: 2-3hr. Impact: Medium (onboarding).**
