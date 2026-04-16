# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

> **Slogan:** "The app that makes sure tomorrow actually comes."
> Student accountability app using social pressure to combat procrastination.
> Built with Next.js 16 (App Router), Supabase, Framer Motion, CSS Modules.
>
> **Developer:** Vayun (solo beginner). Keep code simple.

## Agent Policy

**Always use specialized/plugin agents** — never general-purpose when a domain agent exists:
- **Bugs & implementation:** `frontend-mobile-development:frontend-developer` or `javascript-typescript:javascript-pro`
- **Security:** `comprehensive-review:security-auditor`
- **Code review:** `feature-dev:code-reviewer` or `comprehensive-review:code-reviewer`
- **Debugging:** `unit-testing:debugger` or `agent-teams:team-debugger`
- **Visual/design:** `ui-design:ui-designer`
- **iOS:** `multi-platform-apps:ios-developer`
- **Performance:** `vercel:performance-optimizer`
- **Architecture:** `feature-dev:code-architect`

If none of these fit the task, use whichever specialized agent you think is best. Use parallel agent dispatch when tasks are independent. Use skills proactively.

## Commands

```bash
npm run dev          # Dev server (localhost:3000)
npm run build        # Production build
npm run lint         # ESLint
npx vitest run       # Unit tests (Vitest)
npm run test:e2e     # Playwright e2e tests (auto-starts dev server)
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16.1.2 (App Router) |
| Language | JavaScript (no TypeScript) |
| UI Library | React 19.2.3 |
| Database | Supabase (PostgreSQL + RLS) |
| Auth | Google OAuth via @supabase/ssr |
| Styling | CSS Modules (vanilla CSS) |
| Animations | Framer Motion 12.x |
| Email | Resend |
| Celebrations | canvas-confetti |
| Monitoring | Vercel Analytics + Speed Insights |
| Unit Testing | Vitest |
| E2E Testing | Playwright |
| iOS App | SwiftUI (iOS 17+) + supabase-swift |

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

Import from `@/lib/animations` (80+ presets):
- **Ambient:** `ambientFloat`, `ambientBreathing`, `ambientGlow`, `ambientGradientShift`
- **Entrance:** `fadeIn`, `fadeInUp`, `fadeInScale`, `fadeInDown`, `slideInLeft`, `slideInRight`, `scaleIn`
- **Lists:** `staggerContainer`, `staggerItem`, `listItem`, `listItemPop`
- **Buttons:** `buttonHover`, `buttonTap`
- **Cards:** `cardHover`
- **Modals:** `modalOverlay`, `modalContent`, `modalSlideUp`
- **Celebration:** `celebrationBounce`, `celebrationGlow`, `streakCelebration`, `xpFillFlash`
- **Page:** `pageTransition`

Includes `prefersReducedMotion()` for accessibility.

### CSS Variables

All in `globals.css`. Key categories:
- Colors: `--bg-*`, `--surface-*`, `--text-*`, `--accent-*`
- Status: `--success`, `--warning`, `--danger`, `--info`
- Spacing: `--space-1` (4px) to `--space-32` (128px)
- Radius: `--radius-sm` (8px) to `--radius-full` (9999px)
- Typography: `--text-xs` to `--text-6xl`, weights 400-800
- Shadows: `--shadow-xs` to `--shadow-2xl` + glow variants
- Z-index: `--z-base` (0) to `--z-tooltip` (500)
- Easing: `--ease-out-quint`, `--ease-out-expo`, `--ease-out-back`

### Context Providers

- `FocusContext` — Pomodoro timer state management
- `NotificationContext` — Toast notifications
- `KeyboardShortcutsContext` — Global keyboard event handling
- `ThemeProvider` — Theme (light/dark) and accent color switching

## Environment Variables

Copy `.env.local.example` to `.env.local`. Required vars:

| Variable | Purpose |
|----------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase admin key (server-only) |
| `RESEND_API_KEY` | Email sending via Resend |
| `CRON_SECRET` | Secures all `/api/cron/*` endpoints |
| `NEXT_PUBLIC_APP_URL` | App URL for email links |

## Project Structure

```
/app                  # Next.js App Router pages & layouts
  /api/cron/          # 4 Vercel Cron jobs
  /auth/callback/     # Google OAuth handler
  /dashboard/         # Protected dashboard routes
  /join/[code]/       # Group invite links
  /share/streak/      # Shareable streak cards
/components           # 49 React components (*.js + *.module.css)
/lib                  # Supabase clients, contexts, animations, helpers
  /supabase/          # client.js, server.js, middleware.js
/supabase             # SQL schema & migration files
/tests                # Playwright e2e + Vitest unit tests
  /unit/lib/          # Unit tests (gamification, streaks, pactTemplates, etc.)
/public               # Static assets
  /icons/             # PWA icons (192, 512, SVG)
  /logos/             # 7 accent-colored logo variants (lock + text)
/docs/plans/          # Design documents (iOS app, UI Ascend)
/.github/workflows/   # Claude Code GitHub Actions (review + general)
/lockin-ios/          # Native iOS SwiftUI app (see iOS section below)
```

## Key Routes

| Route | Purpose |
|-------|---------|
| `/` | Landing page |
| `/dashboard` | Main dashboard (activity feed + daily summary) |
| `/dashboard/pacts` | Personal commitments |
| `/dashboard/groups` | Group projects |
| `/dashboard/groups/[id]` | Single group (Kanban board) |
| `/dashboard/focus` | Pomodoro timer |
| `/dashboard/stats` | Activity calendar, streaks & analytics |
| `/dashboard/settings` | Profile, timer, theme, accent colors |
| `/join/[code]` | Group invite link |
| `/share/streak` | Shareable streak card |
| `/auth/callback` | Google OAuth callback (route handler) |
| `/api/cron/send-reminders` | Email reminders 24h before deadline |
| `/api/cron/check-streak-breaks` | Detect broken streaks |
| `/api/cron/check-streak-risk` | Warn at-risk streaks |
| `/api/cron/cleanup` | Clean old data (daily, Vercel Hobby limit) |

All cron routes require `Authorization: Bearer {CRON_SECRET}`.

## Database Schema

| Table | Purpose |
|-------|---------|
| `profiles` | User display names, avatars, XP, level |
| `pacts` | Personal commitments with deadlines & recurrence |
| `tasks` | Group project tasks (Kanban) |
| `groups` | Group projects |
| `group_members` | Group membership + roles |
| `activity_log` | Activity feed entries |
| `activity_reactions` | Emoji reactions (fire, clap, strong, yikes, love) |
| `focus_sessions` | Pomodoro timer sessions |
| `notifications` | In-app notifications |
| `reminder_logs` | Tracking sent email reminders |
| `xp_events` | XP gain history |
| `user_achievements` | Unlocked achievements per user |
| `user_onboarding` | Onboarding completion tracking |
| `accountability_partnerships` | Partner matching |
| `nudges` | Encouragement messages between users |
| `activity_comments` | Comments on activity feed items |
| `group_challenges` | Group challenge definitions |
| `pacts_needing_reminders` | View for cron job |

All tables use RLS. Users access only their own data or group data.

## Design System

- **Aesthetic:** Clean, modern. Inspired by Notion, Figma, Arc Browser
- **Brand Colors:** `#5B5EF5` (indigo) > `#7C4DFF` (purple) > `#E040CB` (magenta)
- **Gradient:** `linear-gradient(135deg, #5B5EF5, #7C4DFF, #B44AE6, #E040CB)`
- **Accent Palettes:** 7 themes — ocean, emerald, sunset, rose, violet, slate, indigo (default)
- **Logo:** `/public/logo.png` (full), `/public/lock-icon.png` (icon), `/public/logo-text.png` (text)
- **Dynamic Logos:** `/public/logos/` has accent-colored variants (e.g. `ocean-lock.png`, `emerald-text.png`)
- **Sidebar:** 72px collapsed / 260px expanded (Arc-style)
- **Theme:** Light-first, dark mode via `data-theme="dark"` on `<html>`
- **Font:** Inter (system fonts fallback)

## Lib Utilities

| File | Purpose |
|------|---------|
| `animations.js` | 80+ Framer Motion animation presets |
| `FocusContext.js` | Pomodoro timer state (React Context) |
| `NotificationContext.js` | Toast notification system |
| `KeyboardShortcutsContext.js` | Global keyboard event handling |
| `useKeyboardShortcuts.js` | Keyboard shortcuts hook |
| `gamification.js` | XP rewards, levels, achievements system |
| `streaks.js` | Streak calculation logic |
| `streaks-advanced.js` | Advanced streak features |
| `activity.js` | Activity feed helpers |
| `comments.js` | Activity comments system |
| `reactions.js` | Emoji reaction helpers |
| `nudges.js` | Encouragement/nudge system |
| `partnerships.js` | Accountability partnerships |
| `notifications.js` | Notification helpers |
| `email.js` | Email template helpers (Resend) |
| `confetti.js` | Celebration confetti effects |
| `accentColors.js` | Accent color palette definitions |
| `pactTemplates.js` | Pact template presets (20 templates, 5 categories) |
| `useModalScrollLock.js` | Shared modal scroll lock hook (used by all 5 modals) |

## Common Gotchas

1. **Supabase client vs server:** `client.js` for browser, `server.js` (async) for RSC
2. **Framer Motion:** Requires `'use client'`
3. **Theme:** Uses `data-theme` attribute on `<html>`, not `prefers-color-scheme`
4. **Auth:** Google OAuth redirects through `/auth/callback`
5. **Mobile overflow:** Use `overflow-x: clip` (not `hidden`) on html/body
6. **Page container backgrounds:** Don't set `background: var(--bg-primary)` on page containers — let them inherit `--bg-secondary` from dashboard layout for consistent card appearance
7. **Cron auth:** All cron routes need `Authorization: Bearer {CRON_SECRET}` header
8. **Security headers:** Configured in `next.config.mjs` (X-Frame-Options, HSTS, CSP, etc.)
9. **Image remotes:** `next.config.mjs` allows images from `*.supabase.co` and `*.googleusercontent.com`
10. **createPortal SSR:** Guard `createPortal(...)` with `typeof document !== 'undefined'` when the portal renders outside an `isOpen` conditional
11. **Function naming:** Don't prefix non-hook functions with `use` — ESLint's `react-hooks/rules-of-hooks` will flag calls inside event handlers

## iOS App (`/lockin-ios/`)

Native SwiftUI app connecting to the same Supabase backend.

| Layer | Technology |
|-------|-----------|
| UI | SwiftUI (iOS 17+, @Observable macro) |
| Backend | supabase-swift 2.0.0 |
| Auth | Sign in with Apple + GoogleSignIn-iOS 8.0.0 |
| Notifications | UserNotifications (local push) |
| Build | Xcode + XcodeGen (`project.yml`) |
| Bundle ID | `com.vayungodara.LockIn` |

**Architecture:** MVVM — Services > @Observable ViewModels > SwiftUI Views

```
/lockin-ios/LockIn/
  Models/         # Pact, FocusSession, Profile, Group, ActivityLog
  Services/       # AuthService, PactService, FocusService, GroupService, StatsService, NotificationService, SupabaseService
  ViewModels/     # AuthViewModel, PactsViewModel, FocusViewModel, GroupsViewModel, StatsViewModel
  Views/          # Auth/, Pacts/, Focus/, Groups/, Stats/, Settings/, Components/, MainTabView
  Utilities/      # Theme, Extensions, MockData
  Config.swift    # Supabase URL + anon key
```

**MVP scope:** Pacts (CRUD + recurring), focus timer, stats/streaks, auth, local push, dark/light mode.
**Deferred to v2:** Groups, activity feed, gamification, email reminders, partnerships.

Design doc: `/docs/plans/2026-03-08-ios-app-design.md`

## Features

- **Pacts** — Personal commitments with deadlines, recurring support (daily/weekly/weekdays/monthly), template picker (20 presets)
- **Groups** — Collaborative projects with Kanban task boards
- **Focus Timer** — Pomodoro timer with configurable durations, sound effects, confetti celebration
- **Stats** — Monthly activity heatmap, streak tracking, analytics
- **Gamification** — XP system, levels, achievements (First Steps, Week Warrior, Monthly Master, etc.)
- **Activity Feed** — Real-time activity with emoji reactions and comments
- **Nudges** — Encouragement system between users
- **Partnerships** — Accountability partner matching
- **Notifications** — In-app bell, realtime via Supabase subscriptions
- **Email Reminders** — 24h before deadline via Resend + Vercel Cron
- **Settings** — Timer customization, theme switcher, accent colors (7 palettes), shortcuts
- **Dark Mode** — Full theme support with `data-theme` attribute
- **Keyboard Shortcuts** — `Cmd/Ctrl+N` (new pact), `Space` (pause timer), `Escape` (close modal)
- **Share** — Shareable streak cards at `/share/streak`
- **PWA** — Installable as app on mobile/desktop via `manifest.json`

## CI/CD & Monitoring

- **Hosting:** Vercel (auto-deploys on push to `main`)
- **Analytics:** Vercel Analytics + Speed Insights
- **GitHub Actions:** Claude Code review (`claude-code-review.yml`) + general Claude action (`claude.yml`)
- **License:** AGPL-3.0

## Design Context

Full design brief lives in [`.impeccable.md`](./.impeccable.md) — users, brand personality, aesthetic direction, references/anti-references, 5 design principles, component vocabulary, and intentional deviations from impeccable defaults (fonts, glassmorphism, brand gradient).

For design work use impeccable skills (`/critique`, `/polish`, `/arrange`, `/animate`, `/audit`, etc.) — they read `.impeccable.md` automatically. Update via `/impeccable teach` when brand direction shifts.

## Current Status

**Live on Vercel** — github.com/vayungodara/lockin

| Item | Status |
|------|--------|
| Web App Build | Passing |
| Mobile Support | Complete (responsive + PWA) |
| Google OAuth | Working |
| Supabase | Active |
| iOS App | In development (MVP) |
| Vercel Cron Jobs | Active (4 daily jobs) |
| GitHub Actions | Active (Claude Code integration) |
