# Amp project guidance

Follow `CLAUDE.md` for project conventions, commands, and design context. Its Amp mapping explains which Claude Code plugin agents have matching Amp skills.

## Orb notes

- Setup prepares dependencies only. Run unit tests separately with `npm test`; run e2e tests with `npm run test:e2e`.
- Run `npm run dev` for the app. Register it as a service with `amp orb service start dev --command 'npm run dev' --portal`.
- Setup copies `.env.local.example` to `.env.local` only when `.env.local` is absent. Supabase keys must be supplied through project secrets.
- Keep project guidance in this repository. Setup must not write to `~/.config/amp/AGENTS.md`.
