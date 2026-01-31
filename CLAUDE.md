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
| `notifications` | In-app notifications |
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
| Stats | `app/dashboard/stats/StatsPageClient.js`, `HeatmapCalendar.js` |
| Settings | `app/dashboard/settings/SettingsPageClient.js` |
| Notifications | `NotificationBell.js`, `lib/NotificationContext.js`, `lib/notifications.js` |
| Keyboard Shortcuts | `lib/KeyboardShortcutsContext.js` |
| Theming | `ThemeProvider.js`, `ThemeToggle.js` |
| Email Reminders | `lib/email.js`, `app/api/cron/send-reminders/route.js` *(not deployed)* |

## Design System

- **Aesthetic:** Clean, modern. Inspired by Notion, Figma, Arc Browser
- **Brand Colors:** `#6366F1` (indigo) → `#8B5CF6` (purple) → `#D946EF` (magenta)
- **Gradient:** `linear-gradient(135deg, #6366F1, #8B5CF6, #D946EF)`
- **Logo:** `/public/logo.png` (full), `/public/lock-icon.png` (icon), `/public/logo-text.png` (text)
- **Sidebar:** 72px collapsed / 260px expanded (Arc-style)
- **Theme:** Light-first, dark mode via `data-theme="dark"` on `<html>`

## Sidebar Footer Layout

The sidebar footer uses a **consistent horizontal icon row** in both collapsed and expanded states:
- **Collapsed:** Avatar centered, icons (bell, theme, sign-out) in horizontal row below
- **Expanded:** Avatar + name/email left-aligned, same icon row centered below
- Only user text animates (opacity + width) — icons stay fixed to prevent jarring movement
- CSS classes: `.userSection` (centered), `.userSectionExpanded` (flex-start), `.footerActions` (always horizontal)
- Button size: 36px for all action buttons (theme, sign-out, notification bell)

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
- HeatmapCalendar has intentional horizontal scroll inside `.calendarWrapper`
- **CompactActivityCard** is the main dashboard activity display (2-week grid, no scroll)

## Common Gotchas

1. **Supabase client vs server:** `client.js` for browser, `server.js` (async) for RSC
2. **Framer Motion:** Requires `'use client'`
3. **Theme:** Uses `data-theme` attribute on `<html>`
4. **Auth:** Google OAuth redirects through `/auth/callback`
5. **Mobile overflow:** Use `overflow-x: clip` (not `hidden`) on html/body - `hidden` blocks nested scroll on iOS Safari
6. **Sidebar footer animations:** Keep icons in same horizontal row; only animate user text width/opacity

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

Run in Supabase SQL Editor (in order):

1. `/supabase/checkpoint8_complete.sql` — Core tables, RLS policies ✅
2. `/supabase/security_fixes_final.sql` — Security hardening ✅
3. `/supabase/performance_fixes.sql` — RLS optimization ✅
4. `/supabase/email_reminders.sql` — Email reminder tracking + view ✅
5. `/supabase/fix_reminders_view_security.sql` — View permissions fix ✅
6. `/supabase/notifications.sql` — In-app notifications table ⏳ (run this to enable notifications)

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

## Pending Features

- [ ] Email reminders for deadlines (code written, needs domain + deploy)
- [ ] iOS app (post-MVP)

## Completed Features

**Stats Page** `/dashboard/stats` — Full 365-day heatmap, streak summary, pact/focus analytics

**Settings Page** `/dashboard/settings` — Timer customization, sound toggle, theme switcher, shortcuts reference

**In-App Notifications** — Bell in sidebar, dropdown list, mark read, realtime via Supabase

**Keyboard Shortcuts** — `Cmd/Ctrl+N` (new pact), `Space` (pause timer), `Escape` (close modal)

**Recurring Pacts** — Auto-creates next pact on completion (daily/weekly/weekdays)

**Focus Timer** — Pomodoro timer with sidebar mini display, mobile timer bar, sound effects
