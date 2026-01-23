# AGENTS.md - LockIn Codebase Guide

> **IMPORTANT:** Update this file with significant changes before ending a session.

> Student accountability app using social pressure to combat procrastination.
> Built with Next.js 16 (App Router), Supabase, Framer Motion, CSS Modules.
>
> **Developer:** Vayun (solo beginner). Keep code simple.

## Quick Reference

```bash
npm run dev      # Dev server (localhost:3000)
npm run build    # Production build
npm run lint     # ESLint
```

```
/app              # Next.js App Router pages & layouts
/components       # React components (*.js + *.module.css)
/lib              # Supabase clients, animations, helpers
/supabase         # SQL schema files
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router) |
| Language | JavaScript (no TypeScript) |
| Database | Supabase (PostgreSQL + RLS) |
| Auth | Google OAuth via @supabase/ssr |
| Styling | CSS Modules (vanilla CSS) |
| Animations | Framer Motion |

## Code Conventions

- **JavaScript only** — no TypeScript
- `'use client';` at top of client components
- Path alias: `@/` maps to project root
- File naming: `ComponentName.js` + `ComponentName.module.css`
- CSS class names: camelCase (`styles.headerTitle`)
- Database tables: snake_case (`activity_log`)

### Supabase

```javascript
// Client-side (browser)
import { createClient } from '@/lib/supabase/client';
const supabase = createClient();

// Server-side (RSC, Route Handlers) — note the await
import { createClient } from '@/lib/supabase/server';
const supabase = await createClient();
```

### Animations

Import from `@/lib/animations`:
- `fadeIn`, `fadeInUp`, `fadeInScale` — entrance animations
- `staggerContainer`, `staggerItem` — list animations
- `buttonHover`, `buttonTap` — button feedback
- `cardHover` — card lift effect
- `modalOverlay`, `modalContent` — modals

### CSS Variables

All in `globals.css`. Key categories:
- Colors: `--bg-*`, `--surface-*`, `--text-*`, `--accent-*`
- Status: `--success`, `--warning`, `--danger`
- Spacing: `--space-1` to `--space-32`
- Radius: `--radius-sm` to `--radius-full`

## Database Schema

| Table | Purpose |
|-------|---------|
| `pacts` | Personal commitments with deadlines |
| `tasks` | Group project tasks (Kanban) |
| `groups` | Group projects |
| `group_members` | Group membership |
| `activity_log` | Activity feed entries |
| `activity_reactions` | Emoji reactions |
| `focus_sessions` | Pomodoro timer sessions |
| `profiles` | User display names/avatars |

All tables use RLS. Users access only their own data or group data.

## Key Features & Files

| Feature | Files |
|---------|-------|
| Pacts | `DashboardClient.js`, `PactCard.js`, `CreatePactModal.js` |
| Groups | `GroupsPageClient.js`, `GroupDetailClient.js` |
| Focus Timer | `FocusTimer.js`, `FocusPageClient.js` |
| Activity Feed | `ActivityFeed.js`, `ActivityItem.js`, `lib/activity.js` |
| Streaks/Heatmap | `lib/streaks.js`, `HeatmapCalendar.js` |
| Theming | `ThemeProvider.js`, `ThemeToggle.js` |

## Design System

- **Aesthetic:** Clean, modern. Inspired by Notion, Figma, Arc Browser
- **Gradient:** `linear-gradient(135deg, #6366F1, #8B5CF6, #D946EF)`
- **Sidebar:** 72px collapsed / 260px expanded (Arc-style)
- **Theme:** Light-first, dark mode via `data-theme` attribute

## Environment Variables

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

## Common Gotchas

1. **Supabase client vs server:** `client.js` for browser, `server.js` (async) for RSC
2. **Framer Motion:** Requires `'use client'`
3. **Theme:** Uses `data-theme` attribute on `<html>`
4. **Auth:** Google OAuth redirects through `/auth/callback`

---

## Current Status

**Live on Vercel** — github.com/vayungodara/lockin

| Item | Status |
|------|--------|
| Build | Passing |
| ESLint | 0 errors |
| Security patches | Applied |
| Google OAuth | Working |

**Supabase:** 10 INFO-level warnings remaining (can ignore — minor hints, not errors)

## SQL Files to Run

Run these in Supabase SQL Editor (in order):

1. `/supabase/checkpoint8_complete.sql` — Core tables, RLS policies
2. `/supabase/security_fixes_final.sql` — Security hardening
3. `/supabase/performance_fixes.sql` — RLS optimization (46 fixes)

## Recent Changes (Checkpoint 12 — Jan 23, 2026)

**Growth & Sharing Features:**
- Added `/join/[code]` route for shareable group invite links
- Updated invite button to copy full URL instead of just code
- Added `/share/streak` page for shareable streak cards with social share support
- Added share button to HeatmapCalendar component

**PWA Support:**
- Added `manifest.json` with app shortcuts
- Added SVG icon in `/public/icons/`
- Configured metadata for Apple Web App support

**Stability:**
- Added `ErrorBoundary` component for graceful error handling
- Wrapped dashboard content with error boundary

**Previous (Checkpoint 11 — Jan 22, 2026):**

**Animation Rework:**
- Rewrote `lib/animations.js` with GPU-optimized, buttery smooth configs
- Fixed landing page double animation bug (replaced stagger with `whileInView`)
- Added `LayoutGroup` + `AnimatePresence` for smooth pact grid reordering

**Performance:**
- Created `performance_fixes.sql` for 46 Supabase linting warnings
- Replaced `auth.uid()` with `(SELECT auth.uid())` in all RLS policies
- Removed duplicate policies and indexes

**Previous (Checkpoint 10):**
- Deployed to Vercel
- Added Toast notification system
- Fixed N+1 reaction fetching
- Security hardening for RLS policies

## Pending Features

- [ ] Email reminders for deadlines
- [ ] Group activity notifications
- [ ] iOS app (post-MVP)

## Known Issues

- **Low priority:** `streaks.js`, `activity.js` rely on RLS only (no client-side auth checks)
