# AGENTS.md - LockIn Codebase Guide

> **IMPORTANT:** Always update this file with new checkpoints, bug fixes, or significant changes before ending a session. This ensures continuity across AI sessions.

> Student accountability app using social pressure to combat procrastination.
> Built with Next.js 16 (App Router), Supabase, Framer Motion, and CSS Modules.
>
> **Core USP:** "The app that makes sure tomorrow actually comes" — accountability through visibility and social pressure. Designed to stop students from "hiding" in group projects.
>
> **Developer:** Vayun (solo beginner). Keep code simple and explain concepts clearly.

## Quick Reference

### Commands
```bash
# Development
npm run dev          # Start dev server (http://localhost:3000)
npm run build        # Production build
npm run start        # Start production server
npm run lint         # Run ESLint

# No test framework configured yet
```

### Project Structure
```
/app              # Next.js App Router pages & layouts
/components       # Reusable React components (*.js + *.module.css)
/lib              # Utilities: Supabase clients, animations, helpers
/public           # Static assets
/supabase         # Database schema files
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

## Code Style Guidelines

### General Patterns
- **JavaScript only** - no TypeScript in this codebase
- Use `'use client';` directive at top of client components
- Path aliases: `@/` maps to project root (e.g., `@/components/`, `@/lib/`)
- Components are default exports with PascalCase names
- File naming: `ComponentName.js` + `ComponentName.module.css`

### Imports Order
```javascript
'use client';

// 1. React/Next.js
import { useState, useEffect } from 'react';
import Link from 'next/link';

// 2. External libraries
import { motion, AnimatePresence } from 'framer-motion';

// 3. Internal: lib/utilities
import { createClient } from '@/lib/supabase/client';
import { logActivity } from '@/lib/activity';
import { buttonHover, buttonTap } from '@/lib/animations';

// 4. Internal: components
import PactCard from '@/components/PactCard';

// 5. Styles (always last)
import styles from './ComponentName.module.css';
```

### Component Structure
```javascript
'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { createClient } from '@/lib/supabase/client';
import styles from './Component.module.css';

export default function ComponentName({ prop1, prop2 }) {
  const [state, setState] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    // Effect logic
  }, [dependencies]);

  const handleAction = async () => {
    setIsLoading(true);
    try {
      // Supabase operation
    } catch (err) {
      console.error('Error message:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      {/* JSX */}
    </div>
  );
}
```

### Supabase Patterns

**Client-side (browser):**
```javascript
import { createClient } from '@/lib/supabase/client';
const supabase = createClient();
```

**Server-side (RSC, Route Handlers):**
```javascript
import { createClient } from '@/lib/supabase/server';
const supabase = await createClient();
```

**Data fetching pattern:**
```javascript
const { data, error } = await supabase
  .from('table_name')
  .select('*')
  .order('created_at', { ascending: false });

if (error) throw error;
```

### Animation Patterns

Import from `@/lib/animations`:
- `fadeIn`, `fadeInUp`, `fadeInDown`, `fadeInScale`
- `staggerContainer`, `staggerItem` - for list animations
- `buttonHover`, `buttonTap` - interactive feedback
- `cardHover` - card lift effect
- `modalOverlay`, `modalContent` - modal animations

Usage:
```javascript
<motion.div
  variants={staggerContainer}
  initial="initial"
  animate="animate"
>
  {items.map(item => (
    <motion.div key={item.id} variants={staggerItem}>
      {/* content */}
    </motion.div>
  ))}
</motion.div>

<motion.button
  whileHover={buttonHover}
  whileTap={buttonTap}
>
  Click me
</motion.button>
```

### CSS Modules Conventions

**File structure:** Each component has a paired `.module.css` file.

**Naming:** Use camelCase for class names.
```css
.container { }
.headerTitle { }
.btnPrimary { }
.isActive { }
```

**Use CSS variables from globals.css:**
```css
.card {
  background: var(--surface-1);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-xl);
  padding: var(--space-6);
  box-shadow: var(--shadow-sm);
}
```

**Key CSS variable categories:**
- Colors: `--bg-*`, `--surface-*`, `--text-*`, `--accent-*`
- Status: `--success`, `--warning`, `--danger`, `--info`
- Spacing: `--space-1` through `--space-32`
- Radius: `--radius-sm` through `--radius-full`
- Shadows: `--shadow-xs` through `--shadow-2xl`
- Typography: `--text-xs` through `--text-6xl`

### Error Handling
```javascript
try {
  const { data, error } = await supabase.from('table').select('*');
  if (error) throw error;
  // Handle data
} catch (err) {
  console.error('Descriptive message:', err);
  // Set error state for UI feedback
}
```

### Naming Conventions
- **Components:** PascalCase (`CreatePactModal.js`)
- **Utilities/hooks:** camelCase (`logActivity.js`)
- **CSS classes:** camelCase in modules (`styles.headerTitle`)
- **Database tables:** snake_case (`activity_log`, `user_profiles`)
- **Variables/functions:** camelCase

## Database Schema (Supabase)

### Core Tables
- `pacts` - Personal commitments with deadlines
- `tasks` - Group project tasks (Kanban board)
- `groups` - Group projects
- `group_members` - Group membership
- `activity_log` - Activity feed entries
- `activity_reactions` - Emoji reactions (fire, clap, strong, yikes, love)
- `focus_sessions` - Pomodoro timer sessions
- `user_profiles` - View exposing auth.users metadata

### RLS Enabled
All tables use Row Level Security. Users can only access their own data or data from groups they belong to.

## Key Features & Implementation

| Feature | Files |
|---------|-------|
| Pacts | `DashboardClient.js`, `PactCard.js`, `CreatePactModal.js` |
| Groups | `GroupsPageClient.js`, `GroupDetailClient.js` |
| Focus Timer | `FocusTimer.js`, `FocusPageClient.js` |
| Activity Feed | `ActivityFeed.js`, `ActivityItem.js`, `lib/activity.js` |
| Streaks | `lib/streaks.js`, `HeatmapCalendar.js` |
| Reactions | `lib/reactions.js`, `ActivityItem.js` |
| Theming | `ThemeProvider.js`, `ThemeToggle.js` |
| Auth | `middleware.js`, `lib/supabase/*` |

## Design System

**Aesthetic:** Clean, modern, slightly playful. Inspired by Notion, Figma, Duolingo, Arc Browser.

**Primary Gradient:** `linear-gradient(135deg, #6366F1, #8B5CF6, #D946EF)` (indigo → purple → pink)

**Sidebar Dimensions:** 72px collapsed / 260px expanded (Arc-style)

**Theme:** Light-first with dark mode. Uses `data-theme` attribute on `<html>`.

## Known Bug Fixes Applied

- Layout content not adapting to sidebar → Added `onExpandChange` callback
- Theme toggle clipped by sidebar → Changed sidebar `overflow` to `visible`
- Gaps between sidebar and content → Dynamic `marginLeft` based on sidebar state
- Activity feed pagination → Fixed offset parameter in `lib/activity.js`
- Heatmap tooltip behind squares → Added `z-index` on `.day:hover`, `overflow-y: visible` on wrapper, `pointer-events: none` on tooltip
- Activity logging errors → Improved error messages in `lib/activity.js` to show `error.message`
- `activity_log_action_check` constraint too restrictive → Drop constraint in Supabase SQL Editor:
  ```sql
  ALTER TABLE activity_log DROP CONSTRAINT IF EXISTS activity_log_action_check;
  ```
- Groups page N+1 counts → Batched member/task counts in `GroupsPageClient.js`
- Streak/heatmap date drift → Use local date formatting in `lib/streaks.js`
- Activity/reaction silent failures → Added Supabase error checks in `lib/activity.js` and `lib/reactions.js`
- Sign-out error handling → Wrapped `signOut` in try/catch in dashboard layout and client
- Focus session insert errors → Validate insert in `FocusTimer.js`
- Group detail debug log removed → Cleaned `GroupDetailClient.js`
- Overdue pact updates → Use `mark_overdue_pacts()` RPC in dashboard and pacts pages
- Lint cleanup → Fixed hook dependency warnings and replaced avatar `<img>` tags with `next/image`
- Avatar images → Added `images.remotePatterns` in `next.config.mjs` for Supabase/Google URLs
- Middleware deprecation → Renamed root `middleware.js` to `proxy.js` and exported default proxy handler
- Focus session logging → Start/update focus sessions and log activity events in `FocusTimer.js`
- Group focus pressure → Added "Locked In" badge and weekly focus leaderboard in `GroupDetailClient.js`

## Database Setup Notes

### Required SQL for Checkpoint 8
Run `/supabase/checkpoint8_complete.sql` in Supabase SQL Editor. This creates:
- `activity_log` table with RLS
- `activity_reactions` table with RLS  
- `focus_sessions` table with RLS
- Adds `is_recurring`, `recurrence_type`, `completed_at` columns to `pacts`

### Required SQL for Overdue Pact Updates
Run `/supabase/mark_overdue_pacts.sql` in Supabase SQL Editor. This creates:
- `mark_overdue_pacts()` RPC used by the dashboard to mark overdue pacts with server time

### Required SQL for Focus Session Updates
Run `/supabase/focus_sessions_update_policy.sql` in Supabase SQL Editor. This allows:
- `UPDATE` on `focus_sessions` for the current user (needed for start/end logging)

### user_profiles View
Required for activity feed to show user names/avatars:
```sql
CREATE OR REPLACE VIEW public.user_profiles AS
SELECT 
  id,
  COALESCE(raw_user_meta_data->>'full_name', raw_user_meta_data->>'name', email) as full_name,
  raw_user_meta_data->>'avatar_url' as avatar_url,
  email,
  created_at
FROM auth.users;

GRANT SELECT ON public.user_profiles TO authenticated;
GRANT SELECT ON public.user_profiles TO anon;
```

## Known Issues (Fixed)

- **Name duplication on Groups page**: Members section and TaskCard owner display may show name split across lines or duplicated. Database returns correct data - likely a rendering/caching issue. Try hard refresh (Cmd+Shift+R).

## Developer Notes

**Target audience:** Beginner-friendly codebase. Keep code simple and well-commented.

**CSS preference:** Stick to vanilla CSS Modules. No Tailwind or CSS-in-JS frameworks.

**Animation guidelines:** Use Framer Motion but keep animations subtle for future mobile scaling.

**Theme system:** Light-first design. Uses `data-theme` attribute on `<html>` for dark mode. Respects system preference with localStorage override.

## Environment Variables

Required in `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

## Common Gotchas

1. **Client vs Server Supabase:** Use `client.js` for browser, `server.js` (async) for RSC
2. **Animations:** Always use `'use client'` when using Framer Motion
3. **CSS Variables:** Theme changes happen via `data-theme` attribute on `<html>`
4. **Auth flow:** Google OAuth redirects through `/auth/callback`

---

## Development Checkpoints

### Completed Checkpoints

#### Checkpoint 1 — Project Kickoff (Jan 15, 2026)
- Defined app concept and USP ("The app that makes sure tomorrow actually comes")
- Chose tech stack (Next.js 16, Supabase, CSS Modules, Framer Motion)
- Created 6-week roadmap
- Decided on app name: LockIn

#### Checkpoint 2 — Foundation & Auth (Jan 15, 2026)
- Initialized Next.js 16 project with App Router
- Created landing page with dark mode design system (purple accent)
- Set up Supabase client with `@supabase/ssr`
- Implemented Google OAuth sign-in flow and `/auth/callback` route
- Built protected dashboard with sidebar
- Added middleware for protected routes

#### Checkpoint 3 — Personal Pacts (Jan 15, 2026)
- Created `pacts` table with RLS policies
- Built `CreatePactModal` with form validation
- Created `PactCard` with status badges and actions
- Implemented mark as done/missed functionality
- Added auto-miss for overdue pacts
- Built dedicated My Pacts page with filtering
- Added success rate statistics

#### Checkpoint 4 — Groups & Task Board (Jan 16, 2026)
- Built Group Detail page with Kanban task board (To Do, In Progress, Done)
- Created `TaskCard` with status transitions
- Built `CreateTaskModal`
- Added invite code copy-to-clipboard
- Implemented members display with avatars and role badges

#### Checkpoint 5 — Focus Timer & Activity Feed (Jan 16, 2026)
- Built Pomodoro-style Focus Timer with circular progress ring
- Created focus timer page with session stats
- Added pact activity logging (created/completed/missed)
- Integrated `ActivityFeed` into dashboard
- Added Focus Timer link to sidebar

#### Checkpoint 6 — UI Redesign (Jan 16, 2026)
- Switched to light-first design
- Replaced solid purple with gradient accents (indigo → purple → pink)
- Added dark mode with system preference detection
- Added `ThemeToggle` component
- Full visual overhaul (1000+ lines in globals.css)
- Inspiration: Notion, Figma, Duolingo, Arc Browser

#### UI Change 2 — Animation Overhaul (Jan 16, 2026)
- Integrated `framer-motion` and `canvas-confetti`
- Added particle backgrounds on landing page
- Scroll-triggered animations
- Animated stat counters
- Confetti bursts on pact completion
- Pulsing glow for Focus Timer
- Interactive button/modal transitions

#### Checkpoint 7 — Arc-Style Collapsible Sidebar (Jan 17, 2026)
- Built Arc-style sidebar (72px collapsed / 260px expanded)
- Hover-to-expand behavior
- Pin/unpin functionality
- Persistent state via `localStorage`
- Shared dashboard layout system
- Fixed activity feed pagination

#### Checkpoint 8 — Streaks, Heatmap, Reactions, Recurring Pacts (Jan 17, 2026)
- **Streaks:** Daily completion tracking with fire emoji badges
- **Heatmap:** GitHub-style 365-day activity visualization
- **Reactions:** 5 emoji reactions for activity feed (fire, clap, strong, yikes, love)
- **Recurring Pacts:** Daily, Weekly, or Weekdays recurrence options
- **SQL Status:** Run `/supabase/checkpoint8_complete.sql` if features don't work

#### Checkpoint 9 — Pre-Launch Polish & Security (Jan 19, 2026)
- **ESLint Fixes:** Fixed all 8 ESLint errors
  - `ActivityItem.js`: Fixed setState in effect, moved fetchReactions to async pattern with cleanup
  - `FocusTimer.js`: Wrapped handleTimerComplete in useCallback
  - `DashboardClient.js`: Fixed AnimatedCounter setState with lazy initial state
  - `Sidebar.js`: Used lazy initializer for localStorage read
  - `ThemeProvider.js`: Used useRef for mounted flag, useSyncExternalStore for system theme
- **Security Patch Applied:** Created `/supabase/security_patch.sql`
  - Removed `email` column from `user_profiles` view
  - Revoked anonymous access to `user_profiles`
  - Restricted `activity_log` RLS to own + group activities only
  - Restricted `activity_reactions` RLS to match activity visibility
- **Theme Flash Fix:** Added blocking script in `layout.js` that sets theme before React hydrates
- **Member Name Fix:** Removed `email` query from `GroupDetailClient.js` (security patch removed column)
- **UI Polish:**
  - Added text truncation to TaskCard owner names (prevents wrapping)
  - ThemeProvider now always sets `data-theme` attribute (fixes system theme in dark mode)

#### Checkpoint 10 — Production Deployment & Bug Fixes (Jan 22, 2026)
- **Deployed to Vercel** with GitHub integration
- **SQL Security Fixes:**
  - Fixed `mark_overdue_pacts` search_path vulnerability
  - Created `profiles` table with proper RLS (replaces view)
  - Secured `activity_log` and `activity_reactions` RLS policies
  - Created `/supabase/security_fixes_final.sql` (run this for all fixes)
- **Bug Fixes:**
  - Added Toast notification system for user error feedback
  - Fixed N+1 reaction fetching with batch queries
  - Fixed setTimeout memory leak in GroupDetailClient
  - Fixed HeatmapCalendar keys issue
  - Added aria-labels for accessibility
  - Added error states with retry buttons to DashboardClient
  - Fixed empty catch block in layout.js
- **Updated checkpoint8_complete.sql** with secure RLS policies

### Security Notes (IMPORTANT)

**Run `/supabase/security_patch.sql` before launching to production!**

The security patch fixes:
1. `user_profiles` view - removes email exposure, blocks anonymous access
2. `activity_log` RLS - restricts to own activities + group activities only
3. `activity_reactions` RLS - matches activity_log visibility

### Updated user_profiles View (Post-Security Patch)
```sql
CREATE OR REPLACE VIEW public.user_profiles AS
SELECT 
  id,
  COALESCE(raw_user_meta_data->>'full_name', raw_user_meta_data->>'name', 'User') as full_name,
  raw_user_meta_data->>'avatar_url' as avatar_url,
  created_at
FROM auth.users;

REVOKE ALL ON public.user_profiles FROM anon;
GRANT SELECT ON public.user_profiles TO authenticated;
```

**Note:** Email column is intentionally removed for privacy. Do NOT re-add it.

---

### Pending / Future Work

#### Deployment Status
- [x] **DEPLOYED TO PRODUCTION** — Vercel
- [x] ESLint: 0 errors
- [x] Build: Passes
- [x] Security: All SQL patches applied
- [x] Google OAuth: Working
- [x] GitHub repo: github.com/vayungodara/lockin

#### Deployment Workflow
```bash
# To deploy changes:
git add .
git commit -m "description of changes"
git push
# Vercel auto-deploys from main branch
```

#### Supabase Warnings (Can Ignore)
- Performance suggestions (43) — These are optimization hints, not errors
- user_profiles SECURITY DEFINER — Run this SQL if warning persists:
  ```sql
  DROP VIEW IF EXISTS public.user_profiles;
  CREATE VIEW public.user_profiles WITH (security_invoker = true) AS
  SELECT id, full_name, avatar_url, created_at FROM public.profiles;
  GRANT SELECT ON public.user_profiles TO authenticated;
  ```

#### Testing & Launch
- [x] Bug fixes and edge case handling
- [x] Vercel deployment
- [ ] Soft launch with classmates for feedback
- [ ] Gather user feedback and iterate

#### Known Issues (Low Priority - Not Blocking Launch)
These were identified in final audit but are low-risk for MVP:
- **Missing auth checks in lib utilities**: `streaks.js`, `activity.js` rely on RLS only

#### Planned Features
- [ ] Email reminders for upcoming deadlines
- [ ] Mobile-responsive tuning
- [ ] Notification system for group activity

#### Long-term Goals
- [ ] iOS app after web MVP validation
- [ ] Push notifications
- [ ] Calendar integration
