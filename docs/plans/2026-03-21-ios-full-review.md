# LockIn iOS — Full Review Report

**Date:** 2026-03-21
**Reviewers:** 10 specialized agents (HIG, architecture, features, accessibility, visual design, interactions, security, performance, data layer, platform integration)
**Codebase:** 38 Swift files, ~11K lines

---

## P0 — App Store Blockers (fix before submission)

| # | Issue | Agent | File | Fix |
|---|-------|-------|------|-----|
| 1 | **Auth bypass ships in production** — `skipAuth()` + "Skip for now" button lets anyone in | Security | `AuthViewModel.swift:68-72`, `LoginView.swift:107-115` | Gate behind `#if DEBUG` or remove entirely |
| 2 | **Missing PrivacyInfo.xcprivacy** — Apple rejects without it (UserDefaults + Date APIs) | Security, Platform | Project root | Create privacy manifest file |
| 3 | **Missing app icon** — asset catalog slot exists but no image assigned | Platform | `AppIcon.appiconset` | Add 1024x1024 icon |
| 4 | **Hardcoded credentials in source** — Supabase URL, anon key, Google Client ID in `Config.swift` | Security | `Config.swift:4-6` | Move to `.xcconfig` excluded from git |

---

## P1 — Crash / Data Loss Bugs (fix immediately)

| # | Issue | Agent | File | Fix |
|---|-------|-------|------|-----|
| 5 | **Missing `@MainActor` on ALL ViewModels** — `@Observable` properties mutated from arbitrary threads. Runtime crashes, purple warnings, data races | Architecture, Performance, Data | All 5 ViewModels | Add `@MainActor` to all ViewModel classes |
| 6 | **Missing `monthly` recurrence crashes pacts screen** — web supports `monthly`, iOS enum doesn't. Codable throws on unknown value, entire pact list fails | Data Layer | `Pact.swift:22-25` | Add `monthly` case + unknown fallback |
| 7 | **No unknown-value handling on ANY enum** — if web adds new status/type, iOS decoder crashes | Data Layer | `Pact.swift:15-25`, `Group.swift:59-63` | Custom `init(from:)` with `.unknown` fallback |
| 8 | **Focus session data lost on network failure** — session saves to Supabase; if it fails, data gone forever | Data Layer | `FocusViewModel.swift:140-155` | Queue failed saves locally, retry later |
| 9 | **Timer freezes during scroll** — `Timer.scheduledTimer` wrong RunLoop mode | Performance | `FocusViewModel.swift:63` | Use `RunLoop.main.add(timer, forMode: .common)` |
| 10 | **Timer leaks if ViewModel deallocated** — no `deinit` to invalidate timer | Architecture | `FocusViewModel.swift` | Add `deinit { timer?.invalidate() }` |

---

## P2 — Architecture / Code Quality (fix for stability)

| # | Issue | Agent | Files |
|---|-------|-------|-------|
| 11 | **N+1 queries in GroupService** — 16 HTTP calls for 5 groups, 10 calls for 10 members | Architecture, Performance, Data | `GroupService.swift:16-47, 66-79` |
| 12 | **No ProfileService** — Settings/EditProfile bypass service layer, make raw Supabase calls from Views | Architecture | `SettingsView.swift:166-183`, `EditProfileView.swift:42-58` |
| 13 | **Duplicate GroupsViewModel** — GroupDetailView creates its own, disconnected from GroupsView | Architecture, Performance | `GroupDetailView.swift:6` |
| 14 | **No dependency injection** — all services hard-instantiated, no test seams | Architecture | All ViewModels |
| 15 | **AuthService created fresh per call in GroupService** (4 times) | Architecture, Data | `GroupService.swift:7,94,139,185` |
| 16 | **Non-atomic group creation** — insert group + insert member in 2 separate calls | Data Layer | `GroupService.swift:93-136` |
| 17 | **Mixed UTC/local timezone in streak calculation** | Data Layer | `StatsService.swift:36-49` |
| 18 | **All queries use SELECT * instead of needed columns** | Data Layer | All Services |
| 19 | **Zero pagination** — unbounded fetches everywhere | Data Layer | All Services |
| 20 | **No retry logic on any network call** | Data Layer | All Services |
| 21 | **Auth expiry silently produces blank screens** — no session refresh handling | Security, Data | `AuthViewModel.swift:16-21` |
| 22 | **No URL validation on deep link handler** | Security | `LockInApp.swift:13-16` |
| 23 | **Weak invite codes** — 36^6 = 2.18B combinations, brute-forceable | Security | `GroupService.swift:225-228` |

---

## P3 — Design & UX Problems

### Visual Design (5.5/10 "Functional but not premium")

| # | Issue | Agent | Impact |
|---|-------|-------|--------|
| 24 | **Forced dark mode** — `.preferredColorScheme(.dark)` with no light mode support, hardcoded white colors throughout | HIG, Visual, A11y | All users who prefer light mode locked out |
| 25 | **Theme.swift is 22 lines** — no typography tokens, no spacing scale, no radius tokens, no animation presets | Visual | Inconsistent design across all views |
| 26 | **Hardcoded hex colors** instead of semantic system colors — won't adapt to Increased Contrast | HIG | Accessibility violation |
| 27 | **No loading states** — `isLoading` exists in VMs but never shown in views. Blank screens during fetch | Visual, HIG | Users see empty screens |
| 28 | **No celebration effects** — pact completion is a haptic buzz, nothing visual. Web has confetti | Visual, Interaction | Core dopamine loop is silent |
| 29 | **Gradient overuse** — brand gradient on every avatar (groups, members, profile). Loses impact | Visual | Everything looks the same |
| 30 | **Generic empty states** — stock `ContentUnavailableView` with no personality or encouragement | Visual | First impression is sterile |
| 31 | **No material/glass effects** — zero `.ultraThinMaterial` usage anywhere | Visual | Missing signature iOS visual language |

### Interactions ("Apple juice factor is near zero")

| # | Issue | Agent | Impact |
|---|-------|-------|--------|
| 32 | **Zero spring animations** — every animation is `.easeInOut` or `.easeOut` (robotic) | Interaction | App feels mechanical, not alive |
| 33 | **No button press feedback** — no scale-on-tap, no BounceButtonStyle | Interaction | Controls feel flat |
| 34 | **5 haptics using deprecated UIKit API** — should use `.sensoryFeedback` (iOS 17+) | Interaction, HIG | Missing haptics on 10+ actions |
| 35 | **No skeleton/shimmer loading** — no `.redacted(reason: .placeholder)` | Interaction | Perceived performance is poor |
| 36 | **No context menus** — no long-press on pacts or tasks | Interaction | Power user discovery blocked |
| 37 | **Timer has no pulsing glow** when running, no play/pause `.symbolEffect` | Interaction | Hero screen lacks life |
| 38 | **Inconsistent tab bar icons** — 4 tabs use `.fill`, Focus uses outline `timer` | HIG | Visual inconsistency |
| 39 | **Inconsistent nav bar title mode** — Focus uses `.inline`, others use large title | HIG | Breaks platform convention |

### Accessibility (zero modifiers in entire codebase)

| # | Issue | Agent | Impact |
|---|-------|-------|--------|
| 40 | **Zero `.accessibilityLabel` in the entire app** | A11y | VoiceOver reads raw SF Symbol names |
| 41 | **Timer controls unlabeled** — VoiceOver reads "arrow counterclockwise, button" | A11y | Timer unusable for blind users |
| 42 | **Heatmap: 90 unlabeled rectangles** — VoiceOver user must swipe through 90 blank items | A11y | Stats screen is inaccessible |
| 43 | **Pact rows not grouped** — VoiceOver reads each sub-element separately (3-5 swipes per pact) | A11y | Pacts list is tedious |
| 44 | **No Dynamic Type support** — fixed font sizes on timer (48pt) and streak (56pt) | A11y, HIG | Text doesn't scale |
| 45 | **No reduce motion respect** — no `@Environment(\.accessibilityReduceMotion)` checks | A11y | Motion-sensitive users affected |
| 46 | **"Skip for now" touch target ~17pt** — well below 44pt minimum | A11y, HIG | Hard to tap |

---

## P4 — Missing Features (priority ranked)

### High Priority (ship first)

| # | Feature | Gap | Effort |
|---|---------|-----|--------|
| 47 | **Pact Templates** | Web has 20 templates, iOS is manual entry only | Low |
| 48 | **XP Awards on Actions** | iOS reads XP but never writes — iOS-only users stuck at 0 | Low |
| 49 | **Light/Dark Mode Toggle** | Remove forced dark, add Settings toggle | Medium |
| 50 | **Confetti/Celebration** | Core dopamine loop is silent on iOS | Medium |
| 51 | **Live Activity for Focus Timer** | Perfect Dynamic Island use case — timer on Lock Screen | Medium |
| 52 | **WidgetKit: Streak + Pacts** | Home screen visibility without opening app | Medium |
| 53 | **Monthly Recurrence** | One-line enum fix, web already supports it | Trivial |

### Medium Priority (next iteration)

| # | Feature | Effort |
|---|---------|--------|
| 54 | Streak Freeze System | Low (backend exists) |
| 55 | Streak Risk Warning | Low |
| 56 | Achievement System (10 achievements) | Medium |
| 57 | Accent Color Themes (7 palettes) | Medium |
| 58 | Home Screen Quick Actions | Easy (<1hr) |
| 59 | ShareLink for streak cards + invite codes | Easy (<1hr) |
| 60 | App Intents / Siri Shortcuts | Medium |
| 61 | Sound Effects | Low |
| 62 | Onboarding Flow | Medium |

### Low Priority (v2)

| # | Feature | Effort |
|---|---------|--------|
| 63 | Activity Feed + Reactions + Comments | High |
| 64 | Nudges + Accountability Partnerships | High |
| 65 | Apple Watch Companion | Hard |
| 66 | Remote Push Notifications (APNs) | Medium |
| 67 | Universal Links (must-have for link sharing) | Easy-Medium |
| 68 | Background App Refresh | Easy |
| 69 | Spotlight Search | Easy |
| 70 | SharePlay Group Focus | Hard |

---

## Architecture Note

The single biggest blocker for widgets, background refresh, and offline support is: **no local data persistence layer**. Every piece of data is fetched from Supabase on each view appearance and held only in ViewModel memory. Before implementing widgets or offline mode, a shared data container is needed (App Group + UserDefaults(suiteName:) or SwiftData).

---

## Quick Win Summary (transform quality in <2 hours)

1. Add `@MainActor` to all 5 ViewModels (~5 min)
2. Add `monthly` + unknown fallback to enums (~15 min)
3. Gate `skipAuth()` behind `#if DEBUG` (~5 min)
4. Create `BounceButtonStyle` + apply globally (~15 min)
5. Replace all `.easeInOut` with `.spring()` (~20 min)
6. Add `.sensoryFeedback` to 10+ missing haptic points (~20 min)
7. Add `ProgressView` loading states to all views (~20 min)
8. Add timer pulsing glow + `.symbolEffect` on play/pause (~20 min)

---

## Score Summary

| Dimension | Score | Key Gap |
|-----------|-------|---------|
| HIG Compliance | 6/10 | Forced dark mode, hardcoded colors, icon inconsistency |
| Architecture | 5/10 | No DI, N+1 queries, missing @MainActor, no ProfileService |
| Visual Design | 5.5/10 | No loading states, no celebrations, minimal Theme.swift |
| Interactions | 3/10 | Zero spring animations, zero celebrations, near-zero haptics |
| Accessibility | 1/10 | Zero modifiers anywhere |
| Security | 4/10 | Auth bypass, hardcoded creds, no privacy manifest |
| Performance | 5/10 | N+1 queries, timer RunLoop, no pagination |
| Data Layer | 4/10 | Crash-causing enum gaps, no offline, timezone bugs |
| Platform Integration | 2/10 | No widgets, no Live Activities, no Shortcuts, no Universal Links |
| Feature Completeness | 5/10 | 25+ web features missing, no iOS-native features |
