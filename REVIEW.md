# Code Review Guidelines

## Always check

### Supabase
- Client vs server: `client.js` (sync, browser) vs `server.js` (async, RSC/Route Handlers — must `await createClient()`)
- Cron routes use `SUPABASE_SERVICE_ROLE_KEY` which bypasses RLS — any new cron route MUST call `verifyCronSecret(request)`
- `award_xp` RPC is `SECURITY DEFINER` and accepts negative values — validate that XP clawback can't be exploited
- Queries relying on RLS for scoping (like `getAllActivity`) must not accidentally remove the user filter
- No secrets or API keys in client-side code (anything without `NEXT_PUBLIC_` prefix)

### React patterns
- `'use client'` directive on any component using hooks, Framer Motion, or browser APIs
- `createPortal()` calls must be guarded with `typeof document !== 'undefined'`
- `useModalScrollLock(isOpen)` must be used in all modal components
- Don't prefix non-hook functions with `use` — ESLint `react-hooks/rules-of-hooks` will flag it
- `isCompletingRef` guard in PactCard prevents double-click XP exploit — don't remove or weaken it
- Side effects in PactCard use `Promise.race` with 10s timeout — keep this pattern, don't let UI hang on failed side effects
- FocusContext timer completion must be in `useEffect`, NOT in a state updater (Strict Mode double-fire bug)

### Gamification exploits
- XP awards: verify no path allows duplicate XP (complete → undo → repeat was a past exploit)
- Reaction/comment XP has no rate limit — flag any change that increases these rewards
- Streak freeze milestones fire only on exact match (streak === 7, not >=7) — don't change this logic without considering edge cases
- Onboarding XP bonuses are 2-5x normal — verify they can only be earned once

### CSS & Frontend
- Use CSS variables from `globals.css`, never hardcoded hex colors (breaks dark mode — past bug pattern)
- Dark mode uses `[data-theme="dark"]` selector, NOT `prefers-color-scheme`
- Z-index must use tokens (`--z-base` through `--z-tooltip`), not raw numbers (NotificationBell's `z-index: 9999` is a known violation)
- `overflow-x: clip` (not `hidden`) on html/body to avoid mobile scroll issues
- Don't set `background: var(--bg-primary)` on page containers — inherit `--bg-secondary` from layout
- Animations must come from `@/lib/animations` presets, not inline Framer Motion configs
- Use `transform` for layout animations (not `margin-left` — causes layout recalculation jank, past bug)
- Responsive: breakpoints are 480/640/768/1024px. Sidebar uses 767px — maintain this to avoid 1px gap with DashboardLayout's 768px
- Modal blur (`filter: blur(12px)` on `#dashboard-layout`) breaks `position: fixed` children — don't add fixed elements inside dashboard while modals can be open

### Cross-component events
- `window.dispatchEvent(new CustomEvent(...))` is used for: `xp-updated`, `pact-created`, `open-create-pact`, `focus-session-completed`
- Changes to these event names or payloads break listeners in Sidebar, MobileNav, DashboardClient, DashboardLayout
- `useSyncExternalStore` + `StorageEvent` is used for theme/sidebar state — don't replace with React state

## Style
- JavaScript only, no TypeScript
- CSS Modules with camelCase class names (`styles.headerTitle`)
- Database columns: snake_case. JS variables: camelCase
- Import animations from `@/lib/animations`, not inline Framer Motion configs
- Prefer existing CSS variables (`--space-*`, `--radius-*`, `--text-*`) over raw values
- `@phosphor-icons/react` for UI icons, emojis for content (templates, categories)

## Skip
- Formatting-only changes (Prettier handles this)
- `node_modules/`, `.next/`, lock file changes
- Files under `/docs/` and `/lockin-ios/` unless explicitly part of the PR
- Generated files and build artifacts
