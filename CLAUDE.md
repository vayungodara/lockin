# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

> **IMPORTANT:** Update this file with significant changes before ending a session.

> **Slogan:** "The app that makes sure tomorrow actually comes."
> Student accountability app using social pressure to combat procrastination.
> Built with Next.js 16 (App Router), Supabase, Framer Motion, CSS Modules.
>
> **Developer:** Vayun (solo beginner). Keep code simple.

## Commands

```bash
npm run dev      # Dev server (localhost:3000)
npm run build    # Production build
npm run lint     # ESLint
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

## Project Structure

```
/app              # Next.js App Router pages & layouts
/components       # React components (*.js + *.module.css)
/lib              # Supabase clients, animations, helpers
/supabase         # SQL schema files
/public           # Static assets (logo.png, icons/, manifest.json)
```

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
| Focus Timer | `FocusTimer.js`, `FocusPageClient.js`, `lib/FocusContext.js` |
| Activity Feed | `ActivityFeed.js`, `ActivityItem.js`, `lib/activity.js` |
| Streaks/Heatmap | `lib/streaks.js`, `CompactActivityCard.js`, `HeatmapCalendar.js` |
| Theming | `ThemeProvider.js`, `ThemeToggle.js` |

## Design System

- **Aesthetic:** Clean, modern. Inspired by Notion, Figma, Arc Browser
- **Brand Colors:** `#6366F1` (indigo) → `#8B5CF6` (purple) → `#D946EF` (magenta)
- **Gradient:** `linear-gradient(135deg, #6366F1, #8B5CF6, #D946EF)`
- **Logo:** `/public/logo.png` (full), `/public/lock-icon.png` (icon), `/public/logo-text.png` (text)
- **Sidebar:** 72px collapsed / 260px expanded (Arc-style)
- **Theme:** Light-first, dark mode via `data-theme="dark"` on `<html>`

## Mobile Support

**Status:** Complete ✅

- Responsive breakpoints at 768px and 480px
- Mobile bottom navigation (`MobileNav.js`) replaces sidebar on mobile
- Safe area insets for notched devices
- Touch-friendly 44px minimum tap targets
- **Global overflow protection** in `globals.css`:
  ```css
  html, body {
    overflow-x: clip;  /* NOT hidden - allows nested scroll on iOS */
    width: 100%;
  }
  body { max-width: 100vw; }
  ```
- HeatmapCalendar has intentional horizontal scroll inside `.calendarWrapper` (not used on dashboard, kept for future stats page)
- **CompactActivityCard** is the main dashboard activity display (2-week grid, no scroll)

## Common Gotchas

1. **Supabase client vs server:** `client.js` for browser, `server.js` (async) for RSC
2. **Framer Motion:** Requires `'use client'`
3. **Theme:** Uses `data-theme` attribute on `<html>`
4. **Auth:** Google OAuth redirects through `/auth/callback`
5. **Mobile overflow:** Use `overflow-x: clip` (not `hidden`) on html/body - `hidden` blocks nested scroll on iOS Safari
6. **Nested scroll on iOS:** If a component needs horizontal scroll, parent must NOT have `overflow-x: hidden`

---

## Current Status

**Live on Vercel** — github.com/vayungodara/lockin

| Item | Status |
|------|--------|
| Build | Passing |
| ESLint | 0 errors |
| Mobile Support | Complete |
| Google OAuth | Working |

## SQL Files to Run

Run in Supabase SQL Editor (in order):

1. `/supabase/checkpoint8_complete.sql` — Core tables, RLS policies
2. `/supabase/security_fixes_final.sql` — Security hardening
3. `/supabase/performance_fixes.sql` — RLS optimization

## Recent Changes (Checkpoint 17 — Jan 30, 2026)

**Bug Fixes & Features:**

1. **Recurring Pacts Now Work** — When completing a recurring pact, the next pact is automatically created
   - Daily: +1 day
   - Weekly: +7 days
   - Weekdays: skips to next Mon-Fri
   - Shows toast notification when next pact is created

2. **Sidebar Mini Timer Controls** — Focus timer in sidebar now has pause button
   - Smooth spring animations on expand/collapse
   - Shows time + "Focusing/Break" label when expanded
   - Compact view when sidebar collapsed

3. **Mobile Timer Bar** — Focus timer indicator on mobile bottom nav
   - Floating gradient bar above nav when timer running
   - Pause button for quick control

4. **Minor Fixes:**
   - Activity feed empty state text now says "your activity" (not "team") for personal feed
   - FocusTimer uses `WORK_DURATION` constant instead of hardcoded 25
   - `useMemo` for Supabase clients in PactCard and CreatePactModal

**Files Modified:**
- `components/PactCard.js` — Recurring pact logic, next deadline calculation
- `components/Sidebar.js` — Mini timer with controls and animations
- `components/Sidebar.module.css` — Timer expanded/collapsed styles
- `components/MobileNav.js` — Mobile timer bar
- `components/MobileNav.module.css` — Mobile timer styles
- `components/ActivityFeed.js` — Fixed empty state text
- `components/FocusTimer.js` — Use constant for duration calc
- `components/CreatePactModal.js` — useMemo fix
- `app/dashboard/DashboardClient.js` — Handle new recurring pact callback
- `app/dashboard/pacts/PactsPageClient.js` — Handle new recurring pact callback

---

## Previous Changes (Checkpoint 16 — Jan 27, 2026)

**Activity Overview Redesign:**
- Replaced 365-day `HeatmapCalendar` with new `CompactActivityCard` on dashboard
- Shows 2-week (14 days) mini heatmap instead of full year
- Prominent streak display: 🔥 current streak + 🏆 best streak
- Hover/tap tooltip shows activity count and date
- Empty state for new users: "✨ Start your streak today!"
- No horizontal scrolling needed
- `HeatmapCalendar.js` kept for potential future stats page

---

## Previous Changes (Checkpoint 15 — Jan 25, 2026)

**iOS Safari Scroll Fix:**
- Changed `overflow-x: hidden` to `overflow-x: clip` on html/body
- `hidden` was blocking nested horizontal scroll containers on iOS Safari (WebKit bug)
- `clip` clips content without creating scroll container interference
- HeatmapCalendar activity calendar now scrolls properly on mobile

**Previous checkpoint (14):**
- Fixed horizontal scrolling on mobile by adding overflow-x to html/body
- Added `width: 100%` and `max-width: 100vw` to prevent viewport overflow

## Pending Features

- [ ] Email reminders for deadlines
- [ ] Push notifications (browser)
- [ ] Group activity notifications
- [ ] Stats page with full 365-day heatmap
- [ ] Settings page (timer duration, preferences)
- [ ] iOS app (post-MVP)
