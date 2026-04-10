# LockIn Frontend Audit — 2026-04-10

**Generated:** 2026-04-10 (automated)
**Pages scored:** 7
**CSS files checked:** 39
**Hardcoded hex values:** 44 (41 in page.module.css, 2 in MonthlyCalendar.module.css, 1 in not-found.module.css)
**Inline animation violations:** 160 across 19 files (66 in LandingPageClient.js alone)
**Visual audit context:** no (Chrome extension unavailable today)

## Page Scores
| Page | Layout | Typography | Color | Components | Motion | Dark Mode | Responsive | Overall |
|------|--------|------------|-------|------------|--------|-----------|------------|---------|
| Landing | 8/10 | 7/10 | 5/10 | 8/10 | 5/10 | 6/10 | 8/10 | 6.7/10 |
| Dashboard | 9/10 | 9/10 | 9/10 | 9/10 | 7/10 | 9/10 | 8/10 | 8.6/10 |
| Pacts | 9/10 | 9/10 | 9/10 | 9/10 | 7/10 | 8/10 | 8/10 | 8.4/10 |
| Groups | 9/10 | 9/10 | 9/10 | 9/10 | 7/10 | 9/10 | 8/10 | 8.6/10 |
| Focus | 8/10 | 9/10 | 9/10 | 8/10 | 7/10 | 8/10 | 8/10 | 8.1/10 |
| Stats | 8/10 | 9/10 | 9/10 | 9/10 | 7/10 | 9/10 | 8/10 | 8.4/10 |
| Settings | 8/10 | 9/10 | 9/10 | 9/10 | 8/10 | 9/10 | 8/10 | 8.6/10 |

**Score changes vs yesterday:** Dashboard 8.3→8.6, Groups 8.1→8.6, Settings 8.0→8.6 (thorough dark mode recognized). Landing unchanged at 6.7.

## AI-Generated Tells
| File | Element | What a Human Designer Would Do Differently |
|------|---------|-------------------------------------------|
| page.module.css | `.featuresDark .bentoCard` | All 4 bento cards identical padding/radius/border — vary card sizes, add micro-illustrations or data-viz |
| Dashboard.module.css | `.statsGrid` | 3 stat cards in rigid grid, same left-border + icon pattern — differentiate hero stat with larger number or sparkline |
| page.module.css | `.ctaFooter` | Generic gradient CTA with centered text — add asymmetry, use user's streak data as dynamic motivator |
| page.module.css | `.browserFrame .mockDashboard` | Static mock dashboard with hardcoded values — make it interactive (click checkboxes, see streak update) |
| EmptyState.module.css | `.wrapper` | Every empty state identical layout — first pact could be guided walkthrough, groups could show invite link prominent |
| NavbarLanding.module.css | `.navInner` | Hardcoded rgba instead of --landing-bg token — use color-mix() or define --landing-surface-glass |

## Quick Visual Wins (<1hr)
| File | CSS Class | Current | Recommended | CSS Variable |
|------|-----------|---------|-------------|-------------|
| page.module.css:274 | `.cardXp` | `color: #16a34a` | `color: var(--success)` | `--success` |
| page.module.css:652-653 | `.borderGreen`, `.borderAmber` | `#0DBF73`, `#F5A623` | `var(--success)`, `var(--warning)` | `--success`, `--warning` |
| page.module.css:687,692 | `.mockPactComplete`, `.mockPactText` | `#0a8a54`, `#92630b` | `var(--success)`, `var(--warning)` | `--success`, `--warning` |
| page.module.css:829-830 | `.featuresDark` | `#09090B`, `#F4F2EB` | `var(--landing-ink)`, `var(--landing-bg)` | `--landing-ink`, `--landing-bg` |
| page.module.css:861 | `.featuresHeading` | `color: #FFFFFF` | `color: var(--text-inverse)` | `--text-inverse` |
| page.module.css:951 | `.bentoRewardStatus` | `color: #0DBF73` | `color: var(--success)` | `--success` |
| page.module.css:1430 | `.ctaHeadline` | `color: #FFFFFF` | `color: var(--text-inverse)` | `--text-inverse` |
| MonthlyCalendar.module.css:470,475 | `.level3/.level4` dark text | `#FFFFFF` | `var(--text-primary)` | **FIXED in this triage** |
| NavbarLanding.module.css:25 | `.navInner` | `rgba(244, 242, 235, 0.85)` | Define `--landing-nav-glass` token | New token needed |
| MobileNav.js:101,119 | whileTap on buttons | inline `{{ scale: 0.95 }}` | `buttonTap` preset | `buttonTap` |
| CreatePactModal.js:241 | whileTap on close | inline `{{ scale: 0.9 }}` | `buttonTap` preset | `buttonTap` |
| CreateGroupModal.js:148 | whileTap on close | inline `{{ scale: 0.9 }}` | `buttonTap` preset | `buttonTap` |
| CreateTaskModal.js:137 | whileTap on close | inline `{{ scale: 0.9 }}` | `buttonTap` preset | `buttonTap` |

## Component Redesigns (1-4hr)
| Component | File | Issue | Recommended Approach |
|-----------|------|-------|---------------------|
| Landing Features Dark Section | page.module.css:828-1037 | 30+ hardcoded hex, parallel color system | Replace with --landing-ink, --landing-bg, --landing-surface tokens. Define 2-3 new tokens for bento card backgrounds. |
| Landing CTA Footer | page.module.css:1385-1514 | Hardcodes indigo — breaks accent switching | Use var(--accent-primary) with color-mix() |
| LandingPageClient Animations | LandingPageClient.js | 66 inline Framer Motion literals | Extract landingReveal preset, batch-convert whileInView |
| JoinPage Dark Mode | JoinPage.module.css | 0 dark mode overrides | Add 8-10 overrides matching GroupsPage pattern |
| NavbarLanding Glass | NavbarLanding.module.css | Hardcoded rgba, 1 dark override | Define --landing-nav-glass, add 4-5 dark overrides |
| Sidebar Dark Mode | Sidebar.module.css | 1 dark override, 15+ elements need coverage | Add overrides for footer, action buttons, tooltip, mini timer |

## Hardcoded Hex Count Per File
| File | Count | Notes |
|------|-------|-------|
| app/page.module.css | 41 | Editorial landing palette — biggest violation |
| components/MonthlyCalendar.module.css | 2 | **FIXED in this triage** |
| app/not-found.module.css | 1 | Fallback syntax, acceptable |
| All other 36 CSS files | 0 | Clean |

## Animation Violations Per File
| File | Count | Notes |
|------|-------|-------|
| LandingPageClient.js | 66 | Critical — 41% of all violations |
| DashboardClient.js | 14 | |
| CreatePactModal.js | 10 | |
| Sidebar.js | 9 | Many are legitimate layout animations |
| MonthlyCalendar.js | 8 | |
| OnboardingChecklist.js | 7 | |
| ActivityItem.js | 6 | |
| PactsPageClient.js | 5 | |
| CreateGroupModal.js | 5 | |
| JoinGroupModal.js | 5 | |
| CreateTaskModal.js | 5 | |
| Toast.js | 4 | |
| ActivityComments.js | 4 | |
| MobileNav.js | 3 | |
| DailySummaryCard.js | 3 | |
| XPBar.js | 3 | |
| CompactActivityCard.js | 1 | |
| FocusTimer.js | 1 | |
| NotificationBell.js | 1 | |

## Dark Mode Coverage Gaps
| File | Overrides | Risk | Notes |
|------|-----------|------|-------|
| JoinPage.module.css | 0 | Medium-High | User-facing invite page |
| Sidebar.module.css | 1 | High | Visible on every dashboard page |
| NavbarLanding.module.css | 1 | Medium | Hardcoded glass background |
| loading.module.css | 0 | Low | CSS variables auto-resolve |
| not-found.module.css | 0 | Low | Error page |
| DashboardLayout.module.css | 0 | Low | Container only, variables auto-resolve |

## Design System Recommendations
| Type | Gap | Recommendation | Reasoning |
|------|-----|----------------|-----------|
| Token | Landing dark section uses 30+ raw hex | Define `--landing-card-dark`, `--landing-card-dark-hover` | Enable design system consistency |
| Token | NavbarLanding hardcodes glass bg | Define `--landing-nav-glass` in globals.css | Enable theme adaptation |
| Pattern | CTA footer hardcodes indigo | Use accent-aware variables | Breaks for non-indigo accent users |
| Pattern | 160 inline Framer Motion animations | Systematic extraction to presets | Improves reduced-motion support |

## Top 5 Highest Impact Changes
1. **Replace 30+ hardcoded hex in .featuresDark with --landing-* tokens (page.module.css:828-1037)** — Biggest design system violation. Dark features section maintains parallel color system.
2. **Extract 66 inline Framer Motion animations from LandingPageClient.js** — 41% of all violations. Most are fadeInUp/revealUp patterns that already exist as presets.
3. **Add dark mode overrides to JoinPage.module.css and Sidebar.module.css** — User-facing components with zero/near-zero dark coverage. JoinPage is first impression for invited users.
4. **Make CTA footer accent-color-aware (page.module.css:1385-1514)** — Hardcoded indigo breaks for all other accent themes.
5. **Replace NavbarLanding glass background with CSS variable** — Hardcoded rgba will break if landing bg tokens change.
