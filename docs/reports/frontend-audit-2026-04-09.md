# LockIn Frontend Audit — 2026-04-09

**Generated:** 2026-04-09 (automated)
**Pages scored:** 7
**CSS files checked:** 40
**Hardcoded hex values:** 48
**Visual audit context:** yes (25 Notion findings from Apr 8-9)
**Note:** First audit after major landing page redesign (#58)

## Page Scores
| Page | Layout | Typography | Color | Components | Motion | Dark Mode | Responsive | Overall |
|------|--------|------------|-------|------------|--------|-----------|------------|---------|
| Landing | 7/10 | 5/10 | 5/10 | 8/10 | 7/10 | 7/10 | 8/10 | 6.7/10 |
| Dashboard | 8/10 | 9/10 | 9/10 | 8/10 | 7/10 | 9/10 | 8/10 | 8.3/10 |
| Pacts | 8/10 | 9/10 | 9/10 | 9/10 | 8/10 | 8/10 | 8/10 | 8.4/10 |
| Groups | 8/10 | 9/10 | 9/10 | 8/10 | 7/10 | 8/10 | 8/10 | 8.1/10 |
| Focus | 8/10 | 8/10 | 9/10 | 9/10 | 8/10 | 7/10 | 7/10 | 8.0/10 |
| Stats | 8/10 | 9/10 | 9/10 | 8/10 | 7/10 | 9/10 | 8/10 | 8.3/10 |
| Settings | 8/10 | 9/10 | 9/10 | 8/10 | 6/10 | 8/10 | 8/10 | 8.0/10 |

**Notes:** Dashboard and inner pages score well (8.0-8.4). Landing page drags down due to undefined `--font-display` variable (typography 5/10) and 45+ hardcoded hex values (color 5/10). Landing redesign improved layout and responsiveness but introduced design system debt.

## CRITICAL: --font-display Undefined

**Every headline on the landing page falls back to browser default serif** because `--font-display` is referenced 12 times in page.module.css but never defined in globals.css. Affected selectors: `.heroTitle`, `.sectionHeader h2`, `.featuresHeading`, `.stepsHeading`, `.ctaHeadline`, `.bentoTimerDisplay`, `.stepNumber`, `.stepTitle`, `.footerBrand`.

**Fix:** Either define `--font-display` in globals.css (pointing to DM Sans or Inter) or replace all 12 references with `var(--font-body)`.

## AI-Generated Tells
| File | Element | What a human designer would do differently |
|------|---------|-------------------------------------------|
| page.module.css | `.featuresDark` bento grid | All four bento cards identical padding/radius/hover — vary visual weight, make wide card truly distinct |
| page.module.css | `.bentoAvatar` | Perfect circle avatars in a row with uniform sizing — use actual photos, vary sizes slightly |
| LandingPageClient.js:168-220 | Hero floating cards | Two cards with nearly identical structure just mirrored — differentiate (notification toast vs. full card) |
| page.module.css | `.ctaFooter` | Standard "big headline + description + button" centered layout — add asymmetry, offset elements |
| page.module.css | `.marquee` | Generic scrolling marquee with repeated uppercase text — show real user completions or rotating pact names |

## Quick Visual Wins (<1hr)
| File | CSS Class | Current | Recommended | CSS Variable |
|------|-----------|---------|-------------|-------------|
| page.module.css:92 | `.heroTitle` + 11 others | `var(--font-display)` (undefined → serif) | `var(--font-body)` or define `--font-display` | `--font-body` |
| page.module.css:40 | `.heroGrid` | `gap: 48px` hardcoded | `gap: var(--space-12)` | `--space-12` |
| page.module.css:119 | `.heroCtas` | `gap: 16px` hardcoded | `gap: var(--space-4)` | `--space-4` |
| page.module.css:126 | `.ctaPrimary` | `padding: 16px 32px; border-radius: 12px` | `padding: var(--space-4) var(--space-8); border-radius: var(--radius-lg)` | `--space-4`, `--space-8`, `--radius-lg` |
| page.module.css:274 | `.cardBadge[data-status="done"]` | `color: #16a34a` | `color: var(--success)` | `--success` |
| page.module.css:829 | `.featuresDark` | `background: #09090B` | `background: var(--landing-ink)` (already defined) | `--landing-ink` |
| page.module.css:1226 | `.stepsInner` | `gap: 80px` | `gap: var(--space-20)` | `--space-20` |
| page.module.css:1388 | `.ctaFooter` | `padding: 128px 24px 48px` | `padding: var(--space-32) var(--space-6) var(--space-12)` | `--space-32`, `--space-6`, `--space-12` |
| MonthlyCalendar.module.css:470 | streak tooltip | `color: #FFFFFF` | `color: var(--text-inverse)` | `--text-inverse` |
| LandingPageClient.js:589-590 | bentoAvatar | Hardcoded hex | ACCENT_PALETTES lookup | **FIXED** |
| NavbarLanding.js:7 | — | Unused `motion` import | Removed | **FIXED** |

## Missing Dark Mode Overrides (Landing Page)
| File | Selector | Issue |
|------|----------|-------|
| page.module.css:898 | `.bentoCard` | `background: #27272A` hardcoded, doesn't adapt between themes |
| page.module.css:1442 | `.ctaButtonLarge` | `background: white; color: #1e1b4b` — no dark override |
| page.module.css:970,982 | `.bentoAvatar`, `.bentoAvatarMore` | Border/background hardcoded, no dark override |
| NavbarLanding.module.css:25 | `.navInner` | Light mode `rgba(244, 242, 235, 0.85)` should reference `var(--landing-bg)` with alpha |

## Animation Violations (8 files)
| File | Line | Issue | Correct Preset |
|------|------|-------|---------------|
| Toast.js | 51-52 | Inline `initial/animate` | `fadeInScale` or `fadeInUp` |
| MobileNav.js | 101, 119 | Inline `whileTap` | `buttonTap` |
| ActivityComments.js | 87-88 | Inline `initial/animate` | `fadeIn` |
| LandingPageClient.js | 24 occurrences | Inline `whileInView` fade-ins | Extract to `landingFadeInView` config |
| LandingPageClient.js | 727 | Inline `whileHover={{ scale: 1.05 }}` | `buttonHover` (already imported) |
| LandingPageClient.js | 85-89 | Inline heroTag animation | `fadeInUp` or `fadeIn` |

## Component Redesigns (1-4hr)
| Component | File | Issue | Recommended Approach |
|-----------|------|-------|---------------------|
| Landing Dark Section | page.module.css:828-1038 | 30+ hardcoded hex values bypass design system | Define `--landing-card-bg`, `--landing-card-hover`, `--landing-muted-text` with `[data-theme="dark"]` overrides |
| Landing Animations | LandingPageClient.js | 24 inline Framer Motion definitions | Create `landingFadeInView`, `landingStaggerSection` configs — reduces 24 to ~5 |
| CTA Footer | page.module.css:1381-1515 | Hardcoded indigo `#312E81`, `#1E1B4B`, `#4F46E5` breaks accent switching | Replace with accent-aware variables |
| Toast Component | Toast.js | Inline animations + no dark mode overrides | Import presets from `@/lib/animations`, add dark overrides to Toast.module.css |

## Design System Recommendations
| Type | Gap | Recommendation | Reasoning |
|------|-----|----------------|-----------|
| Variable | `--font-display` undefined, referenced 12x | Define in globals.css → DM Sans/Inter | Headlines falling back to serif |
| Variable | Landing dark section uses 30+ raw hex | Create `--landing-card-bg`, `--landing-card-hover`, `--landing-muted-text` | Enable dark mode adaptation |
| Pattern | 15+ raw px values with exact --space-* equivalents | Replace with spacing tokens | Design system consistency |
| Pattern | CTA footer hardcodes indigo | Use accent-aware variables | Breaks for non-indigo accent users |

## Top 5 Highest Impact Changes
1. **CRITICAL: Define `--font-display` or replace 12 references in page.module.css** — Every landing page headline falls back to browser serif. This is the single biggest visual bug on the site.
2. **Replace 45+ hardcoded hex values in page.module.css with CSS variables** — Landing page has 45 of 48 total hardcoded colors in the codebase. Dashboard pages are clean. Worst offenders: `.featuresDark` (lines 828-1038) and `.ctaFooter` (lines 1381-1515).
3. **Consolidate 24 inline Framer Motion animations in LandingPageClient.js** — More inline definitions than all other components combined. Extract repeated `whileInView` fade-in pattern into reusable config.
4. **Fix features-to-social-proof spacing gap** — Visual audit flagged ~300px void. Tighten padding or add transitional content between `.featuresDark` and `.howItWorks`.
5. **Add animation presets to 5 components** — Toast.js, MobileNav.js, ActivityComments.js use inline Framer Motion instead of `@/lib/animations` presets.
