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
| `reminder_logs` | Tracks sent email reminders |
| `pacts_needing_reminders` | View for cron job (service_role only) |

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
| Email Reminders | `lib/email.js`, `app/api/cron/send-reminders/route.js` *(not deployed)* |

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
| Supabase | ACTIVE_HEALTHY |
| Email Reminders | ⏳ Code written, not deployed (waiting on domain) |

## SQL Files

Run in Supabase SQL Editor (in order). All have been run ✅:

1. `/supabase/checkpoint8_complete.sql` — Core tables, RLS policies
2. `/supabase/security_fixes_final.sql` — Security hardening
3. `/supabase/performance_fixes.sql` — RLS optimization
4. `/supabase/email_reminders.sql` — Email reminder tracking + view
5. `/supabase/fix_reminders_view_security.sql` — View permissions fix

## Recent Changes (Checkpoint 18 — Jan 31, 2026)

**Bug Check Results:**
- Build: Passing
- ESLint: 0 errors
- Supabase: All 9 tables present, RLS enabled, no data integrity issues
- `pacts_needing_reminders` view: Exists, permissions correctly restricted to service_role only

**Email Reminders Feature (Code Written - NOT DEPLOYED):**

Code is ready but waiting on custom domain before deployment:

1. **24-Hour Reminders** — Sends branded email 24 hours before pact deadline
   - Gradient header matching app design
   - Pact card with title and deadline
   - "View in LockIn" CTA button
   - Mobile responsive HTML template

2. **Duplicate Prevention** — `reminder_logs` table tracks sent reminders
   - Unique constraint on (pact_id, reminder_type)
   - Won't send same reminder twice

3. **Hourly Cron Job** — Vercel cron runs `/api/cron/send-reminders` every hour
   - Protected by `CRON_SECRET` header
   - Uses service role to bypass RLS

**New Files (uncommitted):**
- `app/api/cron/send-reminders/route.js` — Cron endpoint
- `lib/email.js` — Resend client + email template
- `vercel.json` — Cron schedule config
- `supabase/email_reminders.sql` — Database schema + view
- `supabase/fix_reminders_view_security.sql` — Security fix for view

---

## To Deploy Email Reminders (When Ready)

**Prerequisites:**
1. Get a custom domain (e.g., `lockin.app`)
2. Verify domain in Resend for sending emails
3. Update `lib/email.js` line 134: change `reminders@lockin.app` to your verified domain

**Deployment Steps:**

1. **Run SQL in Supabase** (already done ✅):
   ```
   supabase/email_reminders.sql
   ```

2. **Add Vercel Environment Variables:**
   | Variable | Value |
   |----------|-------|
   | `RESEND_API_KEY` | From https://resend.com/api-keys |
   | `CRON_SECRET` | Run: `openssl rand -hex 32` |
   | `SUPABASE_SERVICE_ROLE_KEY` | Supabase Dashboard → Settings → API |
   | `NEXT_PUBLIC_APP_URL` | Your production URL |

3. **Commit and Push:**
   ```bash
   git add app/api/ lib/email.js vercel.json
   git commit -m "feat: email reminders for pact deadlines"
   git push
   ```

4. **Verify:** After deploy, test endpoint returns 401 (unauthorized):
   ```bash
   curl https://your-app.vercel.app/api/cron/send-reminders
   # Should return: {"error":"Unauthorized"}
   ```

---

## Previous Changes (Checkpoint 17 — Jan 30, 2026)

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

- [ ] Email reminders for deadlines (code written, needs domain + deploy)
- [ ] iOS app (post-MVP)

## Recently Completed Features (Checkpoint 19 — Jan 31, 2026)

**Stats Page** `/dashboard/stats`
- Full 365-day activity heatmap
- Streak summary (current, best, total completed)
- Pact analytics (completion rate, weekly/monthly counts, status breakdown)
- Focus analytics (total time, sessions, average duration)
- Recent focus sessions history grouped by day

**Settings Page** `/dashboard/settings`
- Timer duration customization (work: 15-60 min, break: 1-15 min)
- Sound effects toggle for timer completion
- Theme switcher (light/dark/system)
- Account info display
- Keyboard shortcuts reference

**In-App Notifications**
- Notification bell in sidebar with unread badge
- Dropdown with notification list
- Mark as read / mark all read functionality
- Realtime updates via Supabase subscription
- Database: `supabase/notifications.sql` (needs to be run)

**Keyboard Shortcuts**
- `Cmd/Ctrl + N` — Open new pact modal (dashboard)
- `Space` — Pause/resume timer (focus page)
- `Escape` — Close any open modal

**Sound Effects**
- Timer completion chime using Web Audio API
- Toggle in Settings page
- Respects user preference stored in localStorage

**New Files:**
- `app/dashboard/stats/` — Stats page
- `app/dashboard/settings/` — Settings page
- `components/NotificationBell.js` — Notification dropdown
- `lib/NotificationContext.js` — Notification state management
- `lib/notifications.js` — Notification helper functions
- `lib/KeyboardShortcutsContext.js` — Keyboard shortcut handling
- `supabase/notifications.sql` — Notifications table schema
