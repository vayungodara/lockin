# Dashboard Polish Follow-up

> Items deferred from `dashboard-redesign` branch (27 commits). These are secondary UI components that weren't reworked in the main redesign pass. Each can be a separate PR.

**Branch:** Create `dashboard-polish` off main (after `dashboard-redesign` merges)

---

## Modals — Glass + Warm Tokens + Phosphor Icons

### CreatePactModal
- [ ] Replace template category emojis (📚, 💪, 💻, 🚀, ⛺) with Phosphor icons
- [ ] Replace template card emojis (📖, 📝, etc.) with Phosphor icons
- [ ] Apply warm surface tokens to modal card
- [ ] Verify glass backdrop blur is sufficient (currently 12px overlay + 20px card)
- [ ] Apply Instrument Sans to modal heading

### CreateGroupModal
- [ ] Replace any emojis with Phosphor icons
- [ ] Warm surface tokens
- [ ] Instrument Sans heading

### JoinGroupModal
- [ ] Same treatment as CreateGroupModal

## Command Palette
- [ ] Replace emojis in command list with Phosphor icons
- [ ] Warm surface tokens
- [ ] Verify glass blur backdrop

## Notification Panel
- [ ] Review notification item styling — warm tokens
- [ ] Replace any inline SVGs with Phosphor
- [ ] Verify dark mode

## OnboardingChecklist
- [ ] Review styling for warm token consistency
- [ ] Replace any emojis/inline SVGs with Phosphor

## EmptyState — Per-Page Variants
The spec called for different empty state layouts per page (not uniform centered). Currently all pages use the same `EmptyState` component.
- [ ] Dashboard empty: asymmetric layout, prominent CTA
- [ ] Pacts empty: different illustration/copy than groups empty
- [ ] Groups empty: different layout
- [ ] Focus empty: minimal, timer-focused prompt
- [ ] Stats empty: calendar-focused prompt

## Activity Feed Enhancements
- [ ] Friends/Global toggle (needs backend query filtering)
- [ ] Inline emoji reaction counts (🔥3, 👏1) — data exists in `activity_reactions` table, just needs rendering
- [ ] Compact activity card variant for dashboard right column
- [ ] "View Older Activity" link destination (dedicated activity page or expand in-place?)

## Pact Card Enhancements
- [ ] Category tags on cards (needs `category` field on pacts table, or infer from template)
- [ ] Overdue card "Resolve" action button styling
- [ ] Due-today card accent color on title hover

## Focus Timer — Mode Pills
The Short Break / Long Break pills on the focus page are currently inert (visual only). They need to be wired to FocusContext's mode-change logic.
- [ ] Wire Short Break pill to switch timer to short break duration
- [ ] Wire Long Break pill to switch timer to long break duration
- [ ] Ensure active pill state updates when mode changes automatically (after work session completes)
- [ ] This is a behavioral change, not just visual — needs FocusContext integration

## Animation Review
- [ ] Verify all card hover effects are varied (not uniform translateY(-2px))
- [ ] TodayBar count-change animations on pact completion
- [ ] Card-specific entrance animations (stagger reveals on pact list)
- [ ] Ensure no blanket route transitions remain
- [ ] Confetti still fires on achievements/milestones

## Phosphor Icon Sweep
Files that may still have inline SVGs or emojis:
- [ ] `components/EmptyState.js` — custom SVG illustrations (keep these, they're decorative)
- [ ] `components/PactCard.js` — check for remaining inline SVGs
- [ ] `components/ActivityItem.js` — reaction/action icons
- [ ] `components/GroupCard.js` — if it exists
- [ ] `components/NotificationItem.js` — if it exists

## Accessibility
- [ ] Verify all Phosphor icons have appropriate `aria-label` or `aria-hidden`
- [ ] Check color contrast on warm backgrounds (WCAG AA)
- [ ] Keyboard navigation through new TodayBar zones
- [ ] Screen reader testing on TodayBar state announcements

## Cross-Check
- [ ] Auth pages (sign-in card) — verify warm tokens didn't break styling
- [ ] Landing page on main — verify no regression from globals.css changes
- [ ] Mobile (375px, 414px) — full pass on all pages
- [ ] iPad (768px) — verify layouts
- [ ] Laptop (1024px) — verify activity column collapse
