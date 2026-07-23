Three structural problems remain on branch `redesign/2026-05-02-navbar-dashboard`. Brainstorm only — no code this session.

═══════════════════════════════════════════════════════════════════
PROBLEM 1 — Tier/level visibility in dashboard nav
═══════════════════════════════════════════════════════════════════

User feedback: "still a problem I have to click profile to see level."

Current rank chip ("UNBROKEN · 1308") in DashboardNav reads as flat metadata — easy to miss at 11px tracked uppercase. User wants tier/level/streak readable AT A GLANCE.

Brainstorm directions:
- Persistent tier badge with level numeral (serif "14" + tier label)
- XP progress ring around avatar (bring back the old Sidebar pattern at nav scale)
- Inline streak chip ("12-day streak" in mono)
- Replace status pill (date+time) with tier+streak
- Hover/active drop-down "ledger snapshot" row beneath the nav
- Surface tier monumental display IN navbar so /profile becomes optional rather than required

Brainstorm Q: what lives permanently in the navbar vs. one-click on /profile? Should /profile keep all three sections (Tier / Streak / Achievements) or do some surface upward?

═══════════════════════════════════════════════════════════════════
PROBLEM 2 — Achievement icons: emoji vs. SVG vs. Phosphor
═══════════════════════════════════════════════════════════════════

`/dashboard/profile` § 03 Achievements renders the achievement's `icon` string (emoji baked into `lib/gamification.js`) inside a rotated yellow stamp glyph. Emojis fight the editorial rubber-stamp register and render inconsistently across OS.

Three options to weigh:
(a) Phosphor React icons (already used elsewhere — `Plus`, `CaretDown`) — consistent line weight, OKLCH-tintable, but has deprecation warnings in current imports
(b) Custom inline SVG glyphs — most editorial, full brand control, but requires designing 11+ glyphs
(c) Keep emoji but lock to one platform render

Brainstorm Q: which matches `.impeccable.md`'s rubber-stamp + editorial-typography commitment? Does the answer differ between the rotated corner stamp (focal point) vs. inline icons (decorative)?

═══════════════════════════════════════════════════════════════════
PROBLEM 3 — Modals still on old-LockIn format
═══════════════════════════════════════════════════════════════════

CreatePactModal got partial editorialization (header serif, pills 2px radius, motion wrapper removed). User reports: "every modal e.g. create join group still uses old lockin format."

Modal inventory needing editorial pass:
- EditPactModal — untouched
- CreateGroupModal — accent rgba swept, typography NOT editorialized
- JoinGroupModal — likely untouched
- CreateTaskModal — same as CreateGroup
- CommandPalette — partial (caret + active item)
- DatePicker / RecurrencePicker / inline confirmations
- Onboarding modal

Brainstorm directions:
- Single `<EditorialModal>` shell owning header / close / section rhythm — modals compose body inside
- Shared `modal-editorial.module.css` token module each modal imports (lighter touch, less refactor risk)
- Per-modal manual editorialization (highest velocity per change, matches current "old LockIn" complaint though)

Trade-offs to weigh:
- Shell-based = consistency guaranteed, refactor risk on form state / validation / focus trap
- Token-based = light touch, requires discipline to stay consistent
- Per-modal = current state, doesn't scale

Brainstorm Q: shell-based or token-based? Do command surfaces (CommandPalette) vs. form surfaces (CreatePactModal) deserve different chrome?

═══════════════════════════════════════════════════════════════════
ANCHOR
═══════════════════════════════════════════════════════════════════

Read `/Users/vayun/projects/lockin/.impeccable.md` IN FULL before brainstorming. Voice rules, ink cascade, glass-on-modals exception, banned courthouse vocab, no-gradient-text, no-border-left-≥-2px.

Voice on dashboard + modals = direct-positive, NOT confrontational-wry.

Brainstorm output format: 2-3 options per problem with trade-offs, your recommendation, then ask before locking in. Call out anywhere the three problems share an answer (e.g., if Phosphor wins for achievement icons, does that imply Phosphor for modal CTA icons too?).

Goal this session: agreed-upon design spec across all three problems. Implementation is a separate pass.
