# AGENTS.md

Agent routing policy for Droid. For the full project guide (stack, schema, conventions, gotchas), see [`CLAUDE.md`](./CLAUDE.md) — that file is the human-facing reference. This file is the machine-readable routing layer Droid reads on session start.

## Agent Policy

**Always use specialized/plugin agents and project-local custom droids** — never general-purpose when a domain agent exists.

| Task | Agent | When |
|------|-------|------|
| Frontend / UI / components / design / a11y | `lockin-frontend` (project custom droid) | Building React components, redesigns, tokens, animations, a11y. Reads `.impeccable.md`. Skip for typos and one-line fixes. |
| Pure JS logic & utilities (non-React) | `javascript-typescript:javascript-pro` | Helpers, `lib/`, API routes, cron handlers |
| New UI visual components (clean-slate design) | `frontend-design:frontend-design` (skill) | When creating new visual layouts from scratch |
| Design system / theming / a11y audit | `ui-design:design-system-architect` or `ui-design:accessibility-expert` | Token redesign, WCAG audits, keyboard-nav reviews |
| Deep code review | `security-engineer:reviewer` (Droid-native, preferred) | Thorough — security + correctness + performance |
| Quick PR review | `comprehensive-review:code-reviewer` | Faster gate — Opus, framework-agnostic |
| Architecture review | `comprehensive-review:architect-review` | System design, scalability, large refactors |
| Security audit | `security-engineer:auditor` (Droid-native) | OWASP, DevSecOps, threat modeling |
| Debugging / test failures | `unit-testing:debugger` | Vitest failures, unexpected behavior, root-cause |
| iOS / Swift development | `multi-platform-apps:ios-developer` | SwiftUI work in `/lockin-ios/` (iOS 17+, MVVM) |
| Performance / Core Web Vitals | `vercel:performance-optimizer` | Vercel deploys, Edge, ISR, image opt |
| Supabase database / RLS / migrations | `developer-essentials:sql-pro` or `supabase` plugin tools | SQL optimization, RLS policies, migrations |
| Cross-model second-pass review | `validator` (user-level custom droid) | After non-trivial changes, before high-stakes commits, when a fix is suspect — GPT-5.5 xhigh, read-only. Replaces Claude-Code's `codex:codex-rescue`. |
| Generic delegation | `worker` (user-level) | Multi-step research or analysis that benefits from parallel execution |

### Routing notes

- **Custom droid first.** `lockin-frontend` always wins over `frontend-mobile-development:frontend-developer` for LockIn UI work — the generic agent pushes TypeScript / Tailwind / Storybook / Zustand / Jest / NextAuth / Lucide / Prisma, all of which contradict LockIn conventions.
- **Parallel dispatch.** Issue multiple `Task` tool calls in the same assistant turn when the work is independent (e.g., review + security audit + a11y check).
- **Skills proactively.** `agent-browser` for live UI testing, `simplify` for review-and-fix, `review` for structured PR review, `security-review` for STRIDE / OWASP audits, `wiki` for codebase documentation.

### Hard constraints (project-wide — every agent must respect these)

These come from `CLAUDE.md` and `.impeccable.md`. Generic plugin agents bias against them; the `lockin-frontend` droid bakes them in. If invoking a generic agent for LockIn frontend work, paste these as a system reminder:

- JavaScript only (no TypeScript)
- CSS Modules only (no Tailwind, no CSS-in-JS)
- React Context for state (no Zustand / Redux / Jotai)
- `@supabase/ssr` for auth (no NextAuth / Clerk / Auth0)
- `@phosphor-icons/react` for UI chrome (no Lucide / Heroicons)
- Vitest + Playwright (no Jest / Cypress)
- No Storybook
- Framer Motion via `@/lib/animations` presets (no ad-hoc `initial`/`animate`/`transition`)
- Brand: highlighter yellow flat (no indigo→purple→magenta gradient on new surfaces)
- Fonts: Besley + Host Grotesk + JetBrains Mono (Inter and Instrument Sans retired)
- Glass: modals only — never cards / sidebar / chrome / inputs
