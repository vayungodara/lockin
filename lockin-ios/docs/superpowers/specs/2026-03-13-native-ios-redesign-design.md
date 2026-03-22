# Native iOS Redesign — Design Spec

**Date:** 2026-03-13
**Status:** Approved
**Scope:** View-layer rework of all screens to native iOS patterns. Models receive minor conformance additions (Hashable). ViewModels receive minor error-handling fixes (adding `errorMessage` where missing, replacing empty `catch {}` blocks). Services remain unchanged.

## Goal

Transform LockIn from a web-app-feeling dark UI into a native iOS experience using Apple's standard navigation, list, and interaction patterns — while keeping the dark theme and brand gradient as focused accents.

## Approach

**Option B: Native iOS Redesign** — Replace custom card system with native iOS patterns (`NavigationStack`, `List`, `.toolbar`, swipe actions, semantic fonts, system colors). Keep the brand gradient restricted to 3 uses: primary CTA buttons, focus timer ring, streak flame. The Focus timer screen retains custom visual treatment.

---

## Section 1: Theme & Design System

### Changes
- **Remove `glassCard()` modifier entirely.** Replace with native `List` row backgrounds and grouped section styling.
- **Restrict brand gradient** to 3 uses only: primary CTA buttons, focus timer ring, streak flame icon. Everything else uses solid `Theme.indigo` as tint/accent.
- **Replace all hardcoded `.font(.system(size: N))`** with semantic type styles (`.title`, `.headline`, `.subheadline`, `.body`, `.caption`, `.footnote`). This enables Dynamic Type support.
- **Background:** Use `Color(.systemGroupedBackground)` with `.preferredColorScheme(.dark)` instead of hardcoded `Color(hex: "08090D")`.
- **Card surfaces:** Use `Color(.secondarySystemGroupedBackground)` instead of `Color.white.opacity(0.06)`.
- **Move `.preferredColorScheme(.dark)`** to app entry point (`LockInApp.swift`) so it applies globally.

### Files Modified
- `Utilities/Theme.swift` — simplify, remove glass card modifier, keep brand colors
- `LockInApp.swift` — add global `.preferredColorScheme(.dark)`
- All views — update font and color references

---

## Section 2: Navigation Architecture

### Changes
- **Each tab view owns its own `NavigationStack`** (not wrapped externally in MainTabView). This is the standard iOS pattern — each tab maintains independent navigation state.
- **Replace all custom headers** (GeometryReader + manual safe area + bold text) with `.navigationTitle()` and `.toolbar` for action buttons.
- **Use `.navigationBarTitleDisplayMode(.large)`** — titles start large and collapse to inline on scroll (except Focus which uses `.inline`).
- **Remove all `.ignoresSafeArea(edges: .top)`** — let NavigationStack handle safe areas.
- **Group detail:** Push navigation via `.navigationDestination(isPresented:)` with a selected group ID binding (avoids Hashable requirement on complex types). GroupDetailView loads its own data via `loadGroupDetail(groupId:)`.
- **Settings rows:** Actual `NavigationLink` destinations.

### Files Modified
- `Views/MainTabView.swift` — remove `.ignoresSafeArea` per tab, remove `.preferredColorScheme(.dark)` (moved to app root)
- All tab views — add internal `NavigationStack`, replace custom headers with navigation title + toolbar

---

## Section 3: Tab Bar

### Changes
- Keep 5 tabs with same icons (well chosen).
- Move `.preferredColorScheme(.dark)` to app entry point.
- Keep `.tint(Theme.indigo)` on TabView.

### Files Modified
- `Views/MainTabView.swift` — remove per-tab `.ignoresSafeArea`, remove `.preferredColorScheme(.dark)` (moved to app root)

---

## Section 4: Pacts Tab

### Changes
- **Replace `ScrollView` + `LazyVStack` with native `List`** using `.listStyle(.insetGrouped)`.
- **Filter:** Replace custom pill buttons with `Picker` using `.segmented` style in toolbar or pinned section header.
- **Pact rows:** Simplified native rows:
  - Leading: tappable circle checkbox (empty = active, checkmark = completed, x = missed)
  - Standard title + subtitle layout
  - Trailing: deadline text in `.caption` with color coding
  - Small colored status dot replaces loud capsule pill
- **Swipe actions:** Right swipe = complete (green). Left swipe = miss (red) or delete (trash).
- **Empty state:** Use `ContentUnavailableView` (iOS 17+).
- **Create button:** `.toolbar(placement: .primaryAction)` plus button.

### Files Modified
- `Views/Pacts/PactsView.swift` — full rewrite
- `Views/Pacts/PactCard.swift` — replace with `PactRow.swift` (simpler list row)
- `Views/Pacts/CreatePactSheet.swift` — minor: ensure dark scheme inherited from app root

---

## Section 5: Focus Tab

### Changes
- **Keep mostly custom** — timers benefit from bespoke layout.
- Wrap in `NavigationStack` with `.navigationBarTitleDisplayMode(.inline)` to maximize timer space.
- **Keep circular progress ring and gradient.**
- **Haptic feedback:** `.medium` impact on play/pause, `.success` notification on session complete.
- **Bottom stats:** Simple `HStack` with divider, no card background.
- **Toolbar item:** Gear icon for timer settings sheet (configures work/break durations).

### Files Modified
- `Views/Focus/FocusView.swift` — wrap in NavigationStack, add haptics, add toolbar settings, simplify bottom stats

---

## Section 6: Groups Tab

### Changes
- **Replace `ScrollView` + `LazyVStack` with `List`** + `.insetGrouped`.
- **Group rows:** Standard list row with leading icon, title/subtitle, disclosure via `NavigationLink`.
- **Group detail:** Push navigation via `.navigationDestination(isPresented:)` with a `@State` selected group ID binding. This avoids needing `Hashable` on `GroupWithDetails`. GroupDetailView continues to load its own data independently via `loadGroupDetail(groupId:)`.
- **Group Detail view rework:**
  - Receives `groupId: UUID` parameter (same as current)
  - Uses `.navigationTitle(group.name)` (set after data loads)
  - Info section (description, member count, invite code) as `List` `Section`
  - Members as `List` `Section` with avatar rows
  - Tasks as `List` `Section`s grouped by status (To Do / In Progress / Done) with section headers
  - Swipe actions on tasks to change status
  - Invite code: tap to copy with `"Copied!"` confirmation + haptic
  - `AddTaskSheet` (currently defined inline in GroupDetailView.swift) converted to Form-based pattern matching CreatePactSheet
- **Create/Join:** Keep as sheets (correct for modal creation).
- **Header buttons:** Move to `.toolbar`.

### Files Modified
- `Views/Groups/GroupsView.swift` — full rewrite with List + NavigationLink
- `Views/Groups/GroupDetailView.swift` — full rewrite with List sections + push nav (includes AddTaskSheet conversion)
- `Views/Groups/CreateGroupSheet.swift` — minor cleanup
- `Views/Groups/JoinGroupSheet.swift` — minor cleanup

---

## Section 7: Stats Tab

### Changes
- Wrap in `NavigationStack` with large title.
- **Hero stat:** Current streak with flame icon, large prominent number at top.
- **Secondary stats row:** Longest streak, Total completed, Level as compact `HStack`.
- **Heatmap:** Keep contribution grid, wrap in proper section with header.
- Remove glass card wrapping — use standard section styling.

### Files Modified
- `Views/Stats/StatsView.swift` — full rewrite with NavigationStack + sections
- `Views/Stats/HeatmapView.swift` — keep, minor cleanup

---

## Section 8: Settings Tab

### Changes
- **Replace entirely with native `List`** using `.insetGrouped`.
- **Section 1 — Profile:** Avatar + name + level + XP bar as custom header.
- **Section 2 — Stats:** Streak and longest streak as simple list rows.
- **Section 3 — Preferences:** Working NavigationLinks:
  - "Edit Profile" → profile editing form (new view). Receives `Profile?` binding from SettingsView. Uses simple Form with text fields for name/bio. Saves via direct Supabase `update` call (no new service method needed — use `SupabaseService.shared.client.from("profiles").update()`).
  - "Notifications" → notification settings (new view). Reads current `UNNotificationSettings` authorization status. Shows a toggle that opens system Settings if denied, or enables/disables local scheduling. Minimal — wraps existing `NotificationService` methods.
  - "Timer Settings" → duration pickers (new view). Uses `@AppStorage` keys for `workDuration`, `breakDuration`, `longBreakDuration` (defaults: 25, 5, 15). FocusViewModel reads from `@AppStorage` instead of hardcoded values. This is a minor ViewModel change — replace the three `var` declarations with `@AppStorage`-backed properties.
- **Section 4 — About:**
  - "Help & Feedback" → link/sheet
  - "Rate LockIn" → `SKStoreReviewController`
  - Version row
- **Section 5 — Sign Out:** Red destructive button with `.confirmationDialog`.

### Files Modified
- `Views/Settings/SettingsView.swift` — full rewrite
- New: `Views/Settings/EditProfileView.swift`
- New: `Views/Settings/NotificationSettingsView.swift`
- New: `Views/Settings/TimerSettingsView.swift`

---

## Section 9: Interactions & Error Handling

### Changes
- **Haptic feedback** (use imperative `UIImpactFeedbackGenerator` / `UINotificationFeedbackGenerator` calls inside action closures, not `.sensoryFeedback` modifier, since most haptics are triggered by async actions not state changes):
  - `UIImpactFeedbackGenerator(style: .medium).impactOccurred()` on pact complete/miss
  - `UINotificationFeedbackGenerator().notificationOccurred(.success)` on focus session complete
  - Picker changes get haptics automatically from the native `Picker` control
- **Confirmation dialogs:**
  - `.confirmationDialog` before signing out
  - `.confirmationDialog` before marking a pact as missed
- **Error alerts:** `.alert` bindings on each view bound to `viewModel.errorMessage`. Note: `StatsViewModel` currently has no `errorMessage` property — add one (same pattern as PactsViewModel/GroupsViewModel).
- **Replace empty `catch {}` blocks** with proper error propagation to ViewModels (FocusViewModel.saveSession, StatsViewModel.loadStats)
- **Loading:** Use `.redacted(reason: .placeholder)` or `ProgressView` in list rows

### Files Modified
- All views — add `.alert` bindings, haptic feedback calls, `.confirmationDialog`
- `ViewModels/FocusViewModel.swift` — fix silent error handling, add `errorMessage` property, read timer durations from `@AppStorage`
- `ViewModels/StatsViewModel.swift` — fix silent error handling, add `errorMessage` property

---

## Section 10: Login Screen

### Changes
- **Keep current design** — branded, distinct, works well.
- Remove per-view `.preferredColorScheme(.dark)` (inherited from app root).
- Add subtle entrance animation (staggered fade-in for logo + buttons).

### Files Modified
- `Views/Auth/LoginView.swift` — minor: remove redundant color scheme, add entrance animation

---

## isPreview / Mock Data Pattern

All views that currently accept `isPreview: Bool` (PactsView, GroupsView, StatsView, SettingsView) must preserve this pattern in the rewrite. The `isPreview` flag switches between real ViewModel data and `MockData` for SwiftUI previews and skip-auth mode. When rewriting views with `List`, the `isPreview` branching in computed properties (e.g. `displayPacts`, `displayGroups`) stays the same.

## Files NOT Modified
- `Services/` — all services stay as-is
- `Config.swift` — unchanged
- `Utilities/Extensions.swift` — unchanged (Color hex init still needed for Theme brand colors)
- `Utilities/MockData.swift` — may need minor updates if view signatures change

## Minor Model/ViewModel Changes
- `ViewModels/StatsViewModel.swift` — add `errorMessage: String?` property
- `ViewModels/FocusViewModel.swift` — add `errorMessage: String?` property, replace hardcoded durations with `@AppStorage`

## New Files
- `Views/Settings/EditProfileView.swift`
- `Views/Settings/NotificationSettingsView.swift`
- `Views/Settings/TimerSettingsView.swift`

## Deleted Files
- `Views/Pacts/PactCard.swift` (replaced by inline `PactRow`)

## Summary of Changes by Priority
1. NavigationStack on all tabs + `.navigationTitle` + `.toolbar`
2. `List` with `.insetGrouped` on Pacts, Groups, Settings
3. Swipe actions on pacts and group tasks
4. Semantic fonts replacing hardcoded sizes
5. System colors replacing hardcoded hex backgrounds
6. Working Settings navigation destinations
7. Error alerts and confirmation dialogs
8. Haptic feedback on key interactions
9. Login entrance animation
