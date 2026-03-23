# Frontend Design Audit — 2026-03-23

**Overall Score:** 7.2 / 10
**Source:** Automated weekly analysis (vgodara@britams.nl)
**Verdict:** Solid engineering foundation but visually reads as "polished template" rather than "handcrafted product." The design system is comprehensive but applied too uniformly, creating a flat, AI-generated feel.

---

## Page-by-Page Scores

| Page | Layout | Typography | Color | Components | Motion | Responsive | Dark Mode | Notes |
|------|--------|-----------|-------|------------|--------|-----------|-----------|-------|
| Landing (`/`) | 8 | 7 | 7.5 | 6.5 | 8.5 | 6.5 | 8 | Too many gradients stacked in hero; feature sections equally weighted |
| Dashboard (`/dashboard`) | 7.5 | 8 | 7.5 | 8 | 6.5 | 8 | 8.5 | Daily summary + activity feed have identical visual weight; greeting lacks personality |
| Pacts (`/dashboard/pacts`) | 7.5 | 7 | 6.5 | 7.5 | 6 | 7.5 | 8 | Every PactCard looks identical; no status differentiation |
| Focus Timer (`/dashboard/focus`) | 8 | 9 | 8 | 8 | 8.5 | 8 | 9 | Best page — large tabular-nums timer, confetti, ring progress |
| Stats (`/dashboard/stats`) | 8 | 8 | 8.5 | 8 | 6.5 | 8 | 8.5 | Heatmap colors excellent; could use animated number counters |
| Groups Kanban (`/dashboard/groups/[id]`) | 6.5 | 6.5 | 6 | 7 | 5.5 | 5.5 | 7.5 | Weakest page — no column separation, no drag feedback, broken mobile |
| Settings (`/dashboard/settings`) | 6.5 | 7.5 | 6.5 | 7.5 | 4.5 | 8 | 8 | Zero personality; needs visual theme previews and interactive accent picker |

---

## AI-Generated Design Tells

These patterns make LockIn look AI-generated rather than human-designed.

### 1. The 135deg Gradient Monoculture
- **Where:** `globals.css` L33-39
- **Problem:** Every gradient uses `linear-gradient(135deg, ...)`. This is THE classic AI tell — LLMs default to 135deg because it's the most common training example.
- **Fix:** Hero: 160deg. Cards: 180deg (top-to-bottom). CTAs: 90deg (left-to-right for momentum). Celebration: `radial-gradient`. Surface glows: `radial-gradient` with offset center.

### 2. Symmetrical Spacing Grid
- **Where:** All `.module.css` files
- **Problem:** Components use uniform spacing (`gap: var(--space-3)`, `padding: var(--space-4)`) everywhere without optical adjustment.
- **Fix:** Cards: 16px horizontal, 14px top, 18px bottom. Sidebar items: 8px vertical, 12px horizontal. Dense lists: 6px gap. Headers: 24px bottom margin, 16px top.

### 3. Uniform Border Radius
- **Where:** `globals.css` L141-147
- **Problem:** Nearly every component uses `--radius-lg` (14px). Buttons, cards, inputs, modals — all 14px.
- **Fix:** Badges/tags: 6px. Buttons: 8-10px. Inputs: 8px. Cards: 12px. Modals: 16px. Pills: 9999px only for status badges.

### 4. Shadow Escalation Pattern
- **Where:** `globals.css` L78-86 / all hover states
- **Problem:** Every hover follows shadow-sm -> shadow-md + translateY(-2px). Mechanical, uniform.
- **Fix:** Sidebar items: background-color change only. List items: border-color shift. Cards: shadow-md + translateY(-1px). CTAs: box-shadow glow + brightness(1.05). Remove translateY from dense UI.

### 5. Missing Visual Hierarchy Breaks
- **Where:** `DashboardLayout.module.css`
- **Problem:** Every section has the same visual weight — headers, content, sidebars all use surface-1 + border-subtle.
- **Fix:** Use bg-secondary for page backgrounds, surface-1 for primary cards, bg-elevated for featured/active cards. 48px vertical spacing between major sections. Stronger dividers between content groups.

### 6. No Personality in Empty States
- **Where:** `PactsPageClient.js`, `GroupsPageClient.js`, `DashboardClient.js`
- **Problem:** Empty states show generic "No items yet" with a plus button. These are the first thing new users see.
- **Fix:** Branded illustrations or SVG animations. Motivational copy ("Your first pact is waiting. What will you commit to today?"). Suggested actions or template quick-starts.

### 7. Color Palette Too Saturated for Productivity
- **Where:** `globals.css` L42-49
- **Problem:** Primary accent #5B5EF5 at full intensity creates visual fatigue in daily-use dashboards. Background radial gradients add unnecessary noise.
- **Fix:** Desaturate to #6366F1. Reduce body::before gradient opacity from 0.10 to 0.04 in light mode. Use accent only for interactive elements and progress indicators.

### 8. Noise Texture Overlay
- **Where:** `globals.css` L307-317
- **Problem:** SVG fractalNoise overlay at opacity 0.03 on `body::after` is a known AI-design-tutorial pattern. z-index: 9999 can interfere with tooltips.
- **Fix:** Remove entirely. If texture is desired, apply only to landing hero at 0.015 opacity in a scoped container.

---

## Quick Visual Wins (< 1 hour each)

| # | File | What to Change | Time |
|---|------|---------------|------|
| 1 | `globals.css` L307-317 | Delete entire `body::after` noise overlay block | <5 min |
| 2 | `globals.css` L288-295 | Light: accent-primary 0.10->0.04, accent-tertiary 0.07->0.03, accent-celebration 0.04->0.02. Dark (L298-302): accent-primary 0.18->0.08 | <10 min |
| 3 | `globals.css` L33-39 | gradient-primary: 150deg, gradient-success: 90deg, gradient-celebration: radial-gradient(circle at 30% 50%, ...), gradient-subtle: 180deg | <15 min |
| 4 | `globals.css` L141-147 | --radius-sm: 6px, --radius-md: 8px, --radius-lg: 12px, --radius-xl: 16px | <15 min |
| 5 | `Sidebar.module.css` | Nav hover: `background: var(--bg-hover); border-radius: 6px;` only. Active: 3px left accent border, no full bg | <15 min |
| 6 | Dashboard/Pacts/all page header CSS | `letter-spacing: -0.04em` on h1/h2 titles | <10 min |
| 7 | `globals.css` L219 | Dark `--border-subtle`: rgba(255,255,255,0.06) -> 0.04 | <5 min |
| 8 | `globals.css` L454-460 | `.btn-primary` shadow: 20px->12px, 0.2->0.12. Hover: 35px->20px, 0.35->0.2 | <5 min |

---

## Design Token Changes

| Token | Current | Proposed | Rationale |
|-------|---------|----------|-----------|
| `--radius-sm` | 8px (0.5rem) | 6px (0.375rem) | Tighter radii feel more professional |
| `--radius-md` | 10px (0.625rem) | 8px (0.5rem) | " |
| `--radius-lg` | 14px (0.875rem) | 12px (0.75rem) | " |
| `--radius-xl` | 18px (1.125rem) | 16px (1rem) | " |
| `--bg-primary` (light) | #FAFAFF | #FAFAFA | Remove violet tint for calmer canvas |
| `--bg-secondary` (light) | #F5F4FF | #F5F5F5 | " |
| `--accent-primary` | #5B5EF5 | #6366F1 | Desaturate to reduce visual fatigue |
| `--border-subtle` (dark) | rgba(255,255,255,0.06) | rgba(255,255,255,0.04) | Less "grid of boxes" in dark mode |
| body noise opacity | 0.03 | 0 (remove) | AI-design tell |
| bg gradient opacity | 0.10 / 0.18 | 0.04 / 0.08 | Calmer canvas like Linear/Sunsama |

New typography additions suggested:

```css
--text-display: 3.5rem;       /* 56px - hero headlines */
--tracking-display: -0.045em; /* tighter for display text */
--font-display: 850;          /* extra heavy for hero */
--leading-display: 1.1;       /* tight line height for heroes */
```

---

## Component Redesigns (1-4 hours each)

### PactCard — Status-First Visual Hierarchy
**Files:** `components/PactCard.js` + `PactCard.module.css`
**Reference:** Beeminder, Habitica
**Time:** ~2 hours

**Problem:** Every pact card looks identical regardless of status.

**Redesign:**
- 3px left border colored by status: `var(--success)` active, `var(--warning)` at-risk (due <24h), `var(--danger)` overdue, `var(--text-muted)` completed
- Overdue cards: subtle `background: var(--danger-bg)` tint
- At-risk cards: pulsing border animation (2s ease-in-out between normal and warning)
- Completed cards: opacity 0.7, strikethrough title, move to bottom
- Progress indicator: thin bar at bottom showing % time elapsed toward deadline
- Recurrence badge: icon only (rotate symbol) instead of text label

### Sidebar — Arc Browser-Style Polish
**Files:** `components/Sidebar.js` + `Sidebar.module.css`
**Reference:** Arc Browser, Linear
**Time:** ~3 hours

**Problem:** Standard template sidebar — nav items identical, no visual grouping, collapsed state wastes space.

**Redesign:**
- Section dividers with tiny uppercase labels ("PERSONAL", "SOCIAL", "SYSTEM") at 10px, letter-spacing 0.08em, color: var(--text-muted)
- Active item: 3px left accent line + text color change to --accent-primary, no background
- Keyboard shortcut hints right-aligned per nav item (Cmd+1, Cmd+2) in --text-muted at 11px
- Collapsed state: centered icons with tooltip on hover
- Mini timer: minimal text-only display with accent color, no gradient background
- Bottom user section: proper dropdown trigger with subtle hover state

### CreatePactModal — Guided Creation Flow
**Files:** `components/CreatePactModal.js` + `CreatePactModal.module.css`
**Reference:** Notion, Linear
**Time:** ~3 hours

**Problem:** Standard stacked form with no progressive disclosure or preview.

**Redesign:**
- Live preview card on right (or top on mobile) showing how pact will appear
- Templates as visual cards with icons and descriptions, not a dropdown
- Progressive disclosure: start with name + category, reveal deadline/recurrence after
- Emoji picker for pact icon (Notion page icons style)
- Tighter input padding: var(--space-3) -> 10px vertical, 14px horizontal
- Dynamic submit text: "Create Daily Exercise Pact" instead of "Create Pact"

### ActivityItem — Richer Activity Feed
**Files:** `components/ActivityItem.js` + `ActivityItem.module.css`
**Reference:** GitHub, Vercel
**Time:** ~2 hours

**Problem:** Text-heavy, identical formatting regardless of activity type.

**Redesign:**
- Activity type icons with colored circular backgrounds (GitHub-style)
- Streak milestones: golden bg tint + fire emoji animation
- Pact completions: success green tint + checkmark animation
- Group activities: group color accent
- Time: right-aligned, relative format ("2h ago")
- Inline reaction bar on hover (currently requires click)
- Mobile compact mode: single-line summary with expandable detail

---

## Page Redesigns (4-8 hours each)

### Landing Page — Hero Overhaul
**Files:** `components/LandingPageClient.js` + `/app/page.module.css`
**Reference:** Vercel, Cal.com, Dub.co
**Time:** ~6 hours

**Current issues:** Too many stacked effects (ParticleBackground + gradient text + gradient buttons + radial glows). Feature sections equally weighted. No social proof or interactive preview.

**Plan:**
- **Hero:** Remove ParticleBackground. Single large radial gradient glow (top-center, 60% width, 0.08 opacity). White headline with ONE gradient-text keyword. Single CTA with subtle glow.
- **Product Preview:** Browser-frame mockup of dashboard with subtle shadow. Interactive demo or screenshot carousel.
- **Features:** Bento grid layout (Apple-style). 2 large + 4 small cards. Each with unique illustration. Varied card heights.
- **Social Proof:** "Students already locked in" counter + university logos row.
- **CTA Section:** Single bold statement + button. Accent color text on neutral bg. No gradient background.
- **Footer:** Minimal — links, socials, legal. No decorative gradients.

### Groups Kanban — Linear-Style Board
**Files:** `app/dashboard/groups/[id]/GroupDetailClient.js` + `GroupDetail.module.css`
**Reference:** Linear, Notion
**Time:** ~6 hours

**Current issues:** No visual column separation. No drag feedback. Mobile = horizontal scroll only. No task counts or color coding.

**Plan:**
- **Column Headers:** Colored status dots (gray=todo, blue=in-progress, green=done) + task count badge
- **Column Backgrounds:** Subtle tints — todo: neutral, in-progress: rgba(var(--info-bg), 0.3), done: rgba(var(--success-bg), 0.3)
- **Task Cards:** Assignee avatar (24px), priority dot, due date warning
- **Drag States:** Card lifts with shadow-xl + 3deg rotation. Drop target = dashed border
- **Mobile:** Switch to list view (stacked columns) below 640px with expand/collapse per status
- **Empty Columns:** Dashed border card with "Drop tasks here" hint

---

## Brand & Personality

### 1. Motivational Micro-Copy (~30 min)
Replace generic UI copy with personality:
- "No pacts yet" -> "Your first commitment starts here."
- "Create Group" -> "Rally your crew."
- "Session complete" -> "That's what locking in looks like."

### 2. Celebration Moments (~2 hours)
Extend the confetti pattern:
- Streak milestones: fire (7-day), trophy (30-day), diamond (100-day) with unique animations
- Subtle "ding" sound on pact completion (with user toggle)
- Last pact of day: "Everything's done. You've earned your rest."

### 3. Time-Aware Greetings (~1 hour)
Dashboard greeting upgrades:
- Monday morning: "New week, fresh start."
- Friday: "Almost there. Finish strong."
- After streak break: "Welcome back. Let's rebuild."
- Late night: "Burning the midnight oil? Don't forget to rest."

### 4. Visual Identity Beyond Color (~2 hours)
- Animated lock icon in sidebar that "locks" when focus session starts
- Lock-themed loading spinner (lock rotating)
- Subtle lock watermark on shareable streak card
- Custom illustration style for empty states (geometric, minimal, brand gradient)

### 5. Sound Design (~2 hours)
- Subtle UI sounds: soft click on nav, satisfying "complete" on pact check-off
- Ambient focus sounds during timer (optional)
- Global toggle in settings
- Reference: Notion added sounds and it significantly improved perceived quality

---

## 2026 Trend Analysis

### ADOPT
| Trend | Why |
|-------|-----|
| Warm desaturated palettes | Linear, Sunsama, Amie all shifted to warmer grays in 2025-2026. LockIn's violet tint feels dated. |
| Bento grid layouts | Apple, Samsung, Microsoft all use them. Landing page + dashboard would benefit from asymmetric grids. |
| Emotional design / delight moments | Products with emotional engagement see 30%+ lower churn. Confetti is a start — extend everywhere. |
| Interactive product previews on landing | Cal.com, Dub.co, Vercel show product in motion. LockIn has no screenshots or demos — huge missed opportunity. |

### PARTIAL
| Trend | Why |
|-------|-----|
| Liquid glass / evolved glassmorphism | LockIn already uses surface-glass. Motion-reactive transparency is interesting but heavy on performance. Adopt subtly for modals/overlays only. |
| AI-driven personalization | Surface relevant pacts/groups at top, suggest focus times from patterns. Don't add AI labels — invisible infrastructure. |

### SKIP
| Trend | Why |
|-------|-----|
| 3D elements / Spline scenes | Adds bundle size, rarely improves task-focused apps. Forest App's simple 2D tree outperforms 3D. |
| Full-page noise/grain textures | Peaked in 2024 Dribbble, now a dead giveaway for AI-generated designs. Remove, don't iterate. |

---

## Top 5 Highest-Impact Changes (Ranked)

| Rank | Change | Time | Why |
|------|--------|------|-----|
| 1 | Remove noise texture + desaturate bg gradients | 15 min | Eliminates two biggest AI tells instantly |
| 2 | PactCard status differentiation (colored borders + tints) | 2 hours | Transforms pacts from "list of identical cards" to "actionable dashboard" |
| 3 | Landing page product preview + hero simplification | 4 hours | #1 conversion driver for SaaS landing pages in 2026 |
| 4 | Design token refinement (radius + backgrounds + accent) | 30 min | Cascades through every component automatically |
| 5 | Motivational micro-copy + empty states | 2 hours | Free in design resources, outsized impact on retention |

---

*Source: LockIn Frontend Design Audit email — March 23, 2026*
