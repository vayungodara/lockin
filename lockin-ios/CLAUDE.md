# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Agent Policy

**Always use specialized agents** — never general-purpose when a domain agent exists:
- **iOS development:** `multi-platform-apps:ios-developer`
- **UI/design:** `ui-design:ui-designer` or `ui-design:design-system-architect`
- **Accessibility:** `ui-design:accessibility-expert` or `accessibility-compliance:*`
- **Code review:** `comprehensive-review:code-reviewer` or `comprehensive-review:architect-review`
- **Security:** `comprehensive-review:security-auditor`
- **Debugging:** `unit-testing:debugger`
- **Architecture:** `feature-dev:code-architect`
- **Data/backend:** `multi-platform-apps:backend-architect`

Use parallel agent dispatch when tasks are independent. Use skills proactively.

## Commands

```bash
# Generate Xcode project from project.yml (after adding files/targets)
xcodegen generate

# Build (CLI)
xcodebuild -project LockIn.xcodeproj -scheme LockIn \
  -destination 'platform=iOS Simulator,name=iPhone 17 Pro' build

# Open in Xcode
open LockIn.xcodeproj
```

No test target exists yet. Build system is XcodeGen (`project.yml`) — regenerate after adding new targets or changing build settings.

## Architecture

MVVM with a service layer connecting to the shared Supabase backend (same database as the Next.js web app).

```
Supabase DB ←→ supabase-swift SDK ←→ Services ←→ @Observable ViewModels ←→ SwiftUI Views
```

**Data flow:** `SupabaseService.shared.client` (singleton) → domain Services (PactService, FocusService, etc.) → `@MainActor @Observable` ViewModels → SwiftUI Views via `@State`.

**Navigation:** `TabView` with 5 tabs (Pacts, Focus, Groups, Stats, Settings). `NavigationStack` inside each tab. Modal sheets for creation forms.

**Auth:** Sign in with Apple (nonce-based) + Google OAuth redirect → `supabase.auth.signInWithIdToken` / `signInWithOAuth`. Session managed by supabase-swift Keychain storage. `#if DEBUG` skip-auth bypass exists for previews.

## Key Patterns

### ViewModels
All ViewModels use `@MainActor @Observable` (not legacy `@ObservableObject`/`@Published`). Views own them with `@State private var viewModel = ...`.

### Services
All service methods are `async throws`. Services are stateless `final class` instances (not actors). `AuthService` provides `currentUserId` — pass it to other services as a parameter.

### Supabase Clients
```swift
// Always go through the service layer, never raw Supabase in Views
let pactService = PactService()
let pacts = try await pactService.fetchPacts(userId: userId)
```
Exception: `ProfileService` was recently created — some views may still have raw Supabase calls that should be migrated.

### Theme & Design System (`Utilities/Theme.swift`)
- **Colors:** `Theme.indigo`, `.purple`, `.magenta`, `.pink`, `.success`, `.danger`, `.warning`, `.active`
- **Gradient:** `Theme.brandGradient` — restricted to CTA buttons, timer ring, streak flame
- **Typography:** `Theme.heroNumber`, `.timerDisplay`, `.rowTitle`, `.rowSubtitle`, `.rowMeta`, `.sectionLabel`
- **Spacing:** `Theme.space4` through `.space40` (8pt grid)
- **Radius:** `Theme.radiusSm` (8) through `.radiusFull` (9999)
- **Animation:** `Theme.springDefault`, `.springSnappy`, `.springBouncy`

### Reusable Components (`Views/Components/`)
- `BounceButtonStyle` — scale-on-press button style
- `ShimmerModifier` — `.shimmering()` for skeleton loading
- `ErrorAlertModifier` — `.errorAlert($viewModel.errorMessage)`

### Haptics
Use SwiftUI-native `.sensoryFeedback(.impact(weight:), trigger:)` — not UIKit `UIImpactFeedbackGenerator`.

### Accessibility
Views use `.accessibilityLabel`, `.accessibilityElement(children: .combine)`, `.accessibilityHidden(true)` on decorative elements, and `@Environment(\.accessibilityReduceMotion)` for conditional animation.

### Appearance
User-controlled via `@AppStorage("appTheme")` — values: `"dark"` (default), `"light"`, `"system"`. Applied in `LockInApp.swift` via `.preferredColorScheme()`.

### Enum Safety
All Codable enums (`PactStatus`, `RecurrenceType`, `TaskStatus`) have an `.unknown` fallback case with custom `init(from:)` so new server-side values don't crash decoding.

## Gotchas

1. **Timer RunLoop mode:** `FocusViewModel` uses `RunLoop.main.add(timer, forMode: .common)` — not `Timer.scheduledTimer` — so the timer doesn't freeze during scroll.
2. **Timer cleanup:** `FocusViewModel` has `nonisolated(unsafe) private var timer` for `deinit` access from a `@MainActor` class.
3. **Focus session recovery:** If `saveSession()` fails, the session is persisted to UserDefaults and retried on next app launch via `retryPendingSession()`.
4. **Preview/mock mode:** Views accept `isPreview: Bool` to branch between mock data and real Supabase calls. `AuthViewModel.isRealAuth` gates this.
5. **No local persistence layer:** All data is fetched from Supabase per-view-appearance — no Core Data/SwiftData/offline cache. This blocks widgets, background refresh, and offline support.
6. **XcodeGen:** Run `xcodegen generate` after modifying `project.yml`. The `sources: [LockIn]` directive auto-discovers all Swift files.
7. **Groups already implemented:** Despite the design doc deferring groups to v2, GroupService/GroupsViewModel/GroupsView are fully built.

## Database

Uses the same Supabase tables as the web app (no iOS-specific tables): `profiles`, `pacts`, `focus_sessions`, `groups`, `group_members`, `tasks`, `activity_log`, `notifications`. All with RLS policies — the iOS client sends the auth JWT automatically via supabase-swift.
