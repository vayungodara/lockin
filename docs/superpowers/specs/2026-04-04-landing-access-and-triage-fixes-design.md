# Landing Page Access + PR #50 Triage Fixes

**Date:** 2026-04-04
**Status:** Approved

## Feature 1: Landing Page Access from Dashboard

### Problem
Logged-in users can't easily get back to the landing page. The `/?preview=true` escape hatch exists but isn't discoverable.

### Solution
Add an external-link icon button to the sidebar footer action row (between theme toggle and sign-out).

### Changes
- **Sidebar.js**: Add `<Link href="/?preview=true">` with external-link SVG icon. Wrapped in `motion.div` with layout animation matching sibling buttons. Tooltip: "View Landing Page".
- **Sidebar.module.css**: Add `.landingBtn` style — `background: rgba(var(--accent-primary-rgb, 91,94,245), 0.12)`, `border: 1px solid rgba(var(--accent-primary-rgb, 91,94,245), 0.18)`. Uses existing `actionBtn` base class.
- **MobileNav.js**: No change (too tight, low-frequency action on mobile).

### Behavior
- Same-tab navigation via Next.js `<Link>`
- Collapsed sidebar: icon-only, same as other action buttons
- Expanded sidebar: icon with animated layout transition

## Feature 2: LI-145 — Dark Mode Completed Pact Contrast

### Problem
Completed pact card text is nearly invisible in dark mode on Dashboard and My Pacts page.

### Changes
- **PactCard.module.css**: Add `[data-theme="dark"]` overrides for completed state — boost title, description, and status label contrast using `--text-secondary` and `--text-muted` variables.
- **DailySummaryCard.module.css**: If Recent Pacts carousel shares the same issue, apply same fix.

## Fix 3: DailySummaryCard Error Handling

### Problem
DailySummaryCard.js:60-88 runs 4 parallel Supabase queries and ignores errors from all of them.

### Changes
- **DailySummaryCard.js**: Check `.error` from each query. On error, show a toast or fallback to zero/empty state rather than silently displaying stale data.

## Fix 4: ActivityComments Error Handling

### Problem
ActivityComments.js:22-23 ignores query errors when fetching comments.

### Changes
- **ActivityComments.js**: Check `.error` from the Supabase query. Show inline error state or fail gracefully.

## Out of Scope
- DB function `search_path` fixes (schema migration — needs separate review)
- 8 tables with excess DELETE grants (schema migration — needs separate review)
