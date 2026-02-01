# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

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

All tables use RLS. Users access only their own data or group data.

## Design System

- **Aesthetic:** Clean, modern. Inspired by Notion, Figma, Arc Browser
- **Brand Colors:** `#6366F1` (indigo) → `#8B5CF6` (purple) → `#D946EF` (magenta)
- **Gradient:** `linear-gradient(135deg, #6366F1, #8B5CF6, #D946EF)`
- **Logo:** `/public/logo.png` (full), `/public/lock-icon.png` (icon), `/public/logo-text.png` (text)
- **Sidebar:** 72px collapsed / 260px expanded (Arc-style)
- **Theme:** Light-first, dark mode via `data-theme="dark"` on `<html>`

## Common Gotchas

1. **Supabase client vs server:** `client.js` for browser, `server.js` (async) for RSC
2. **Framer Motion:** Requires `'use client'`
3. **Theme:** Uses `data-theme` attribute on `<html>`
4. **Auth:** Google OAuth redirects through `/auth/callback`
5. **Mobile overflow:** Use `overflow-x: clip` (not `hidden`) on html/body
6. **Page container backgrounds:** Don't set `background: var(--bg-primary)` on page containers — let them inherit `--bg-secondary` from dashboard layout for consistent card appearance

## Current Status

**Live on Vercel** — github.com/vayungodara/lockin

| Item | Status |
|------|--------|
| Build | Passing |
| Mobile Support | Complete |
| Google OAuth | Working |
| Supabase | Active |

## Features

- **Pacts** — Personal commitments with deadlines, recurring support
- **Groups** — Collaborative projects with Kanban tasks
- **Focus Timer** — Pomodoro timer with sound effects
- **Stats** — 365-day heatmap, streak tracking, analytics
- **Settings** — Timer customization, theme switcher, shortcuts
- **Notifications** — In-app bell, realtime via Supabase
- **Keyboard Shortcuts** — `Cmd/Ctrl+N` (new pact), `Space` (pause timer), `Escape` (close modal)
