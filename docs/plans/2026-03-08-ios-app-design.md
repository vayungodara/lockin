# LockIn iOS App — Design Document

**Date:** 2026-03-08
**Status:** Approved

## Overview

Native SwiftUI iOS app for LockIn, connecting to the existing Supabase backend. MVP scope: pacts, focus timer, stats, auth, push notifications.

## MVP Scope

**Included:** Sign in with Apple + Google, personal pacts (CRUD, recurring), focus timer (pomodoro), stats (streak, heatmap), local push notifications, dark/light mode, settings/profile.

**Deferred (v2):** Groups & kanban, activity feed & reactions, gamification (XP/levels/achievements), email reminders, accountability partners.

## Tech Stack

- SwiftUI (iOS 17+, @Observable macro)
- supabase-swift SDK (auth, database, realtime)
- AuthenticationServices (Apple) + GoogleSignIn-iOS SDK
- UserNotifications framework
- Swift Package Manager

## Architecture

Pure SwiftUI + Supabase Swift SDK. Service layer talks to Supabase, @Observable ViewModels hold state, SwiftUI views react.

```
Supabase DB (existing) <-> supabase-swift SDK <-> Services <-> @Observable ViewModels <-> SwiftUI Views
```

## Navigation

TabView with 4 tabs: Pacts, Focus, Stats, Settings. NavigationStack inside each tab. Modal sheets for creation forms.

## Auth Flow

1. LoginView with Apple + Google buttons
2. Apple: ASAuthorizationController -> identity token -> supabase.auth.signInWithIdToken(.apple)
3. Google: GoogleSignIn SDK -> ID token -> supabase.auth.signInWithIdToken(.google)
4. Session persisted in Keychain by supabase-swift
5. App launch checks session, routes to LoginView or TabView

## Database

Uses existing tables (no new tables): profiles, pacts, focus_sessions, activity_log, notifications. All with existing RLS policies.

## Design Language

- Brand gradient: #6366F1 -> #8B5CF6 -> #D946EF
- SF Symbols for icons, system fonts
- iOS-native patterns and spacing
- Dark mode via @Environment(\.colorScheme) + manual toggle

## Notifications

- Local: timer completion, deadline warnings (scheduled on pact creation)
- Remote APNs deferred to v2

## App Store

- Bundle ID: com.vayungodara.LockIn
- iOS 17.0 minimum
- Requires privacy policy URL
- Sign in with Apple mandatory (since Google is offered)
