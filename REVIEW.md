# Code Review Guidelines

## Always check
- Supabase client vs server usage: `client.js` for browser components, `server.js` (async) for RSC/Route Handlers
- `'use client'` directive present on any component using Framer Motion, hooks, or browser APIs
- RLS implications: ensure queries don't bypass row-level security
- No secrets or API keys in client-side code (anything without `NEXT_PUBLIC_` prefix)
- Route handlers under `/api/cron/*` check `Authorization: Bearer {CRON_SECRET}`
- CSS variables from `globals.css` used instead of hardcoded colors/spacing
- `overflow-x: clip` (not `hidden`) on containers to avoid mobile scroll issues
- No `background: var(--bg-primary)` on page containers (inherit `--bg-secondary` from layout)

## Style
- JavaScript only, no TypeScript
- CSS Modules with camelCase class names
- Import animations from `@/lib/animations`, not inline Framer Motion configs
- Prefer existing CSS variables (`--space-*`, `--radius-*`, `--text-*`) over raw values
- Database columns use snake_case, JS variables use camelCase

## Skip
- Formatting-only changes (Prettier handles this)
- `node_modules/`, `.next/`, lock file changes
- Files under `/docs/` and `/lockin-ios/` unless explicitly part of the PR
- Generated files and build artifacts
