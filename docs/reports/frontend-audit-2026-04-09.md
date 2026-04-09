# LockIn Frontend Audit — 2026-04-09

**Generated:** 2026-04-09 (automated)
**Pages scored:** 8
**Visual audit context:** yes (25 Notion findings from Apr 8-9)
**Note:** First audit after major landing page redesign (#58)

## Page Scores
| Page | Layout | Typography | Color | Components | Motion | Dark Mode | Overall |
|------|--------|------------|-------|------------|--------|-----------|---------|
| Landing | 8/10 | 8/10 | 7/10 | 8/10 | 7/10 | 7/10 | 7.5/10 |
| Dashboard | 7/10 | 7/10 | 7/10 | 7/10 | 7/10 | 6/10 | 6.8/10 |
| Pacts | 7/10 | 7/10 | 7/10 | 7/10 | 7/10 | 6/10 | 6.8/10 |
| Groups | 7/10 | 7/10 | 7/10 | 7/10 | 6/10 | 6/10 | 6.7/10 |
| Focus Timer | 7/10 | 7/10 | 7/10 | 7/10 | 7/10 | 6/10 | 6.8/10 |
| Stats | 7/10 | 7/10 | 7/10 | 7/10 | 6/10 | 6/10 | 6.7/10 |
| Settings | 7/10 | 7/10 | 7/10 | 7/10 | 6/10 | 6/10 | 6.7/10 |
| Sidebar | 7/10 | 7/10 | 7/10 | 7/10 | 7/10 | 7/10 | 7.0/10 |

**Notes:** Landing page significantly improved by redesign. Dashboard and inner pages still need dark mode coverage and animation preset adoption.

## AI-Generated Tells
| File | Element | What a human designer would do differently |
|------|---------|-------------------------------------------|
| page.module.css | Landing sections | Reduce vertical gap between features and social proof (~300px void flagged by visual audit) |
| LandingPageClient.js | Inline animations | 80+ inline Framer Motion variants instead of using @/lib/animations presets — human would centralize |
| page.module.css | Hardcoded colors | ~15 hardcoded hex values in landing CSS — human would define as --landing-* variables |
| Dashboard.module.css | Dark mode | Missing comprehensive data-theme="dark" overrides |

## Quick Visual Wins (<1hr)
| File | CSS Class | Current | Recommended | CSS Variable |
|------|-----------|---------|-------------|-------------|
| LandingPageClient.js:589 | bentoAvatar | `#3B82F6` hardcoded | ACCENT_PALETTES ocean | **FIXED** |
| LandingPageClient.js:590 | bentoAvatar | `#10B981` hardcoded | ACCENT_PALETTES emerald | **FIXED** |
| LandingPageClient.js:153 | avatar | `#5B5EF5` fallback | ACCENT_PALETTES indigo | **FIXED** |
| NavbarLanding.js:7 | — | Unused `motion` import | Remove import | **FIXED** |

## Component Redesigns (1-4hr)
| Component | File | Issue | Recommended Approach |
|-----------|------|-------|---------------------|
| LandingPageClient | components/LandingPageClient.js | 80+ inline Framer Motion animations | Extract to @/lib/animations presets (carried-over finding) |
| Dark mode coverage | Multiple .module.css files | ~30+ CSS modules missing dark overrides | Systematic dark mode pass across all module files |
| Dashboard hero | components/Dashboard.js | Static text hero vs. competitors using live product screenshots | Consider dynamic dashboard preview or populated mockup |

## Design System Recommendations
| Type | Name | Value | Reasoning |
|------|------|-------|-----------|
| CSS Variables | --landing-success, --landing-warning | #16a34a, #B45309 etc. | Centralize landing page editorial hex values |
| Dark mode | data-theme overrides | All .module.css files | ~30 files still lack dark mode overrides |
| Motion | Animation presets | @/lib/animations | Landing page should use centralized presets |

## Top 5 Highest Impact Changes
1. **Dark mode coverage** — Add data-theme="dark" overrides to remaining ~30 .module.css files (biggest visual gap)
2. **Landing page animations** — Extract 80+ inline Framer Motion variants to @/lib/animations presets (consistency + maintainability)
3. **Landing page section spacing** — Reduce excessive vertical gaps between sections (visual audit flagged ~300px void)
4. **CSS variable centralization** — Define landing page hex colors as --landing-* custom properties
5. **Dashboard visual richness** — Add populated product screenshots or dynamic previews per competitor intel
