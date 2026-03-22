# LockIn iOS App Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a native SwiftUI iOS app for LockIn that connects to the existing Supabase backend, with pacts, focus timer, stats, and auth.

**Architecture:** Pure SwiftUI with `@Observable` ViewModels, a service layer wrapping `supabase-swift` SDK, and native iOS auth (Sign in with Apple + Google). All data reads/writes go to the same Supabase PostgreSQL database the web app uses.

**Tech Stack:** SwiftUI (iOS 17+), supabase-swift, AuthenticationServices, GoogleSignIn-iOS, UserNotifications, Swift Package Manager.

---

## Task 1: Create Xcode Project & Add Dependencies

**Files:**
- Create: `/Users/vayun/projects/lockin-ios/LockIn.xcodeproj`
- Create: `/Users/vayun/projects/lockin-ios/LockIn/LockInApp.swift`
- Create: `/Users/vayun/projects/lockin-ios/LockIn/Config.swift`

**Step 1: Create the Xcode project via command line**

```bash
mkdir -p /Users/vayun/projects/lockin-ios
cd /Users/vayun/projects/lockin-ios
# We'll use xcodegen or manual project creation
```

Since `xcodebuild` can't create projects from CLI, create the project in Xcode:
1. Open Xcode → File → New → Project → iOS → App
2. Product Name: `LockIn`
3. Team: Vayun's Apple Developer account
4. Organization Identifier: `com.vayungodara`
5. Interface: SwiftUI
6. Language: Swift
7. Save to `/Users/vayun/projects/lockin-ios/`

**Alternatively, use the Swift Package approach — create a Package.swift-based project that Xcode opens natively.**

**Step 2: Add Swift Package dependencies**

In Xcode: File → Add Package Dependencies, add:
- `https://github.com/supabase/supabase-swift` (latest version)
- `https://github.com/google/GoogleSignIn-iOS` (latest version)

Or add to `Package.swift` / project's package dependencies.

**Step 3: Create Config.swift**

```swift
// LockIn/Config.swift
import Foundation

enum Config {
    static let supabaseURL = "YOUR_SUPABASE_URL"
    static let supabaseAnonKey = "YOUR_SUPABASE_ANON_KEY"
}
```

**Step 4: Create the app entry point**

```swift
// LockIn/LockInApp.swift
import SwiftUI

@main
struct LockInApp: App {
    var body: some Scene {
        WindowGroup {
            ContentView()
        }
    }
}
```

```swift
// LockIn/ContentView.swift
import SwiftUI

struct ContentView: View {
    var body: some View {
        Text("LockIn")
    }
}
```

**Step 5: Build and run to verify project compiles**

Run: Cmd+B in Xcode or `xcodebuild -scheme LockIn -destination 'platform=iOS Simulator,name=iPhone 16' build`
Expected: BUILD SUCCEEDED

**Step 6: Initialize git repo**

```bash
cd /Users/vayun/projects/lockin-ios
git init
echo ".DS_Store\n*.xcuserstate\nxcuserdata/\nDerivedData/\n.build/" > .gitignore
git add .
git commit -m "feat: initial Xcode project with Supabase and GoogleSignIn dependencies"
```

---

## Task 2: Supabase Client & Models

**Files:**
- Create: `LockIn/Services/SupabaseService.swift`
- Create: `LockIn/Models/Pact.swift`
- Create: `LockIn/Models/FocusSession.swift`
- Create: `LockIn/Models/Profile.swift`
- Create: `LockIn/Models/ActivityLog.swift`

**Step 1: Create SupabaseService singleton**

```swift
// LockIn/Services/SupabaseService.swift
import Foundation
import Supabase

final class SupabaseService {
    static let shared = SupabaseService()

    let client: SupabaseClient

    private init() {
        client = SupabaseClient(
            supabaseURL: URL(string: Config.supabaseURL)!,
            supabaseKey: Config.supabaseAnonKey
        )
    }
}
```

**Step 2: Create Pact model**

```swift
// LockIn/Models/Pact.swift
import Foundation

struct Pact: Codable, Identifiable {
    let id: UUID
    let userId: UUID
    var title: String
    var description: String?
    var deadline: Date
    var completedAt: Date?
    var status: PactStatus
    var isRecurring: Bool
    var recurrenceType: RecurrenceType?
    let createdAt: Date
    var updatedAt: Date

    enum PactStatus: String, Codable {
        case active
        case completed
        case missed
    }

    enum RecurrenceType: String, Codable {
        case daily
        case weekly
        case weekdays
    }

    enum CodingKeys: String, CodingKey {
        case id
        case userId = "user_id"
        case title
        case description
        case deadline
        case completedAt = "completed_at"
        case status
        case isRecurring = "is_recurring"
        case recurrenceType = "recurrence_type"
        case createdAt = "created_at"
        case updatedAt = "updated_at"
    }
}
```

**Step 3: Create FocusSession model**

```swift
// LockIn/Models/FocusSession.swift
import Foundation

struct FocusSession: Codable, Identifiable {
    let id: UUID
    let userId: UUID
    let durationMinutes: Int
    let startedAt: Date
    var endedAt: Date?
    let createdAt: Date

    enum CodingKeys: String, CodingKey {
        case id
        case userId = "user_id"
        case durationMinutes = "duration_minutes"
        case startedAt = "started_at"
        case endedAt = "ended_at"
        case createdAt = "created_at"
    }
}
```

**Step 4: Create Profile model**

```swift
// LockIn/Models/Profile.swift
import Foundation

struct Profile: Codable, Identifiable {
    let id: UUID
    var fullName: String?
    var avatarUrl: String?
    var bio: String?
    var theme: String?
    var accentColor: String?
    var currentStreak: Int
    var longestStreak: Int
    var lastActivityDate: String?
    var totalXp: Int
    var level: Int
    let createdAt: Date
    var updatedAt: Date

    enum CodingKeys: String, CodingKey {
        case id
        case fullName = "full_name"
        case avatarUrl = "avatar_url"
        case bio
        case theme
        case accentColor = "accent_color"
        case currentStreak = "current_streak"
        case longestStreak = "longest_streak"
        case lastActivityDate = "last_activity_date"
        case totalXp = "total_xp"
        case level
        case createdAt = "created_at"
        case updatedAt = "updated_at"
    }
}
```

**Step 5: Create ActivityLog model**

```swift
// LockIn/Models/ActivityLog.swift
import Foundation

struct ActivityLog: Codable {
    let userId: UUID
    let action: String
    let groupId: UUID?
    let metadata: [String: String]?

    enum CodingKeys: String, CodingKey {
        case userId = "user_id"
        case action
        case groupId = "group_id"
        case metadata
    }
}
```

**Step 6: Build to verify models compile**

Run: Cmd+B
Expected: BUILD SUCCEEDED

**Step 7: Commit**

```bash
git add .
git commit -m "feat: add Supabase client service and data models"
```

---

## Task 3: Authentication — Sign in with Apple

**Files:**
- Create: `LockIn/Services/AuthService.swift`
- Create: `LockIn/ViewModels/AuthViewModel.swift`
- Create: `LockIn/Views/Auth/LoginView.swift`
- Modify: `LockIn/LockInApp.swift`
- Modify: `LockIn/ContentView.swift`

**Step 1: Add Sign in with Apple capability**

In Xcode: Select target → Signing & Capabilities → + Capability → Sign in with Apple

**Step 2: Create AuthService**

```swift
// LockIn/Services/AuthService.swift
import Foundation
import AuthenticationServices
import Supabase

final class AuthService {
    private let supabase = SupabaseService.shared.client

    func signInWithApple(idToken: String, nonce: String) async throws {
        try await supabase.auth.signInWithIdToken(
            credentials: .init(
                provider: .apple,
                idToken: idToken,
                nonce: nonce
            )
        )
    }

    func signOut() async throws {
        try await supabase.auth.signOut()
    }

    var currentSession: Session? {
        get async {
            try? await supabase.auth.session
        }
    }

    var currentUserId: UUID? {
        get async {
            let session = await currentSession
            return session?.user.id
        }
    }
}
```

**Step 3: Create AuthViewModel**

```swift
// LockIn/ViewModels/AuthViewModel.swift
import Foundation
import AuthenticationServices
import CryptoKit

@Observable
final class AuthViewModel {
    var isAuthenticated = false
    var isLoading = true
    var errorMessage: String?

    private let authService = AuthService()
    private var currentNonce: String?

    func checkSession() async {
        isLoading = true
        let session = await authService.currentSession
        isAuthenticated = session != nil
        isLoading = false
    }

    func handleAppleSignIn(result: Result<ASAuthorization, Error>) async {
        switch result {
        case .success(let authorization):
            guard let appleCredential = authorization.credential as? ASAuthorizationAppleIDCredential,
                  let identityTokenData = appleCredential.identityToken,
                  let idToken = String(data: identityTokenData, encoding: .utf8),
                  let nonce = currentNonce else {
                errorMessage = "Failed to get Apple credentials"
                return
            }

            do {
                try await authService.signInWithApple(idToken: idToken, nonce: nonce)
                isAuthenticated = true
                errorMessage = nil
            } catch {
                errorMessage = error.localizedDescription
            }

        case .failure(let error):
            errorMessage = error.localizedDescription
        }
    }

    func prepareNonce() -> String {
        let nonce = randomNonceString()
        currentNonce = nonce
        return sha256(nonce)
    }

    func signOut() async {
        do {
            try await authService.signOut()
            isAuthenticated = false
        } catch {
            errorMessage = error.localizedDescription
        }
    }

    // MARK: - Nonce helpers

    private func randomNonceString(length: Int = 32) -> String {
        precondition(length > 0)
        var randomBytes = [UInt8](repeating: 0, count: length)
        let errorCode = SecRandomCopyBytes(kSecRandomDefault, randomBytes.count, &randomBytes)
        precondition(errorCode == errSecSuccess)
        let charset: [Character] = Array("0123456789ABCDEFGHIJKLMNOPQRSTUVXYZabcdefghijklmnopqrstuvwxyz-._")
        return String(randomBytes.map { charset[Int($0) % charset.count] })
    }

    private func sha256(_ input: String) -> String {
        let data = Data(input.utf8)
        let hash = SHA256.hash(data: data)
        return hash.compactMap { String(format: "%02x", $0) }.joined()
    }
}
```

**Step 4: Create LoginView**

```swift
// LockIn/Views/Auth/LoginView.swift
import SwiftUI
import AuthenticationServices

struct LoginView: View {
    let authViewModel: AuthViewModel

    var body: some View {
        VStack(spacing: 32) {
            Spacer()

            // Logo & branding
            VStack(spacing: 12) {
                Image(systemName: "lock.circle.fill")
                    .font(.system(size: 80))
                    .foregroundStyle(
                        LinearGradient(
                            colors: [
                                Color(hex: "6366F1"),
                                Color(hex: "8B5CF6"),
                                Color(hex: "D946EF")
                            ],
                            startPoint: .topLeading,
                            endPoint: .bottomTrailing
                        )
                    )

                Text("LockIn")
                    .font(.largeTitle.bold())

                Text("The app that makes sure\ntomorrow actually comes.")
                    .font(.subheadline)
                    .foregroundStyle(.secondary)
                    .multilineTextAlignment(.center)
            }

            Spacer()

            // Sign in buttons
            VStack(spacing: 16) {
                SignInWithAppleButton(.signIn) { request in
                    let hashedNonce = authViewModel.prepareNonce()
                    request.requestedScopes = [.fullName, .email]
                    request.nonce = hashedNonce
                } onCompletion: { result in
                    Task {
                        await authViewModel.handleAppleSignIn(result: result)
                    }
                }
                .signInWithAppleButtonStyle(.whiteOutline)
                .frame(height: 50)

                // Google sign in button placeholder — Task 4
            }
            .padding(.horizontal, 32)

            if let error = authViewModel.errorMessage {
                Text(error)
                    .font(.caption)
                    .foregroundStyle(.red)
                    .padding(.horizontal)
            }

            Spacer()
                .frame(height: 40)
        }
    }
}
```

**Step 5: Create Color hex extension**

```swift
// LockIn/Utilities/Extensions.swift
import SwiftUI

extension Color {
    init(hex: String) {
        let hex = hex.trimmingCharacters(in: CharacterSet.alphanumerics.inverted)
        var int: UInt64 = 0
        Scanner(string: hex).scanHexInt64(&int)
        let a, r, g, b: UInt64
        switch hex.count {
        case 6:
            (a, r, g, b) = (255, int >> 16, int >> 8 & 0xFF, int & 0xFF)
        case 8:
            (a, r, g, b) = (int >> 24, int >> 16 & 0xFF, int >> 8 & 0xFF, int & 0xFF)
        default:
            (a, r, g, b) = (255, 0, 0, 0)
        }
        self.init(
            .sRGB,
            red: Double(r) / 255,
            green: Double(g) / 255,
            blue: Double(b) / 255,
            opacity: Double(a) / 255
        )
    }
}
```

**Step 6: Create Theme constants**

```swift
// LockIn/Utilities/Theme.swift
import SwiftUI

enum Theme {
    static let indigo = Color(hex: "6366F1")
    static let purple = Color(hex: "8B5CF6")
    static let magenta = Color(hex: "D946EF")

    static let brandGradient = LinearGradient(
        colors: [indigo, purple, magenta],
        startPoint: .topLeading,
        endPoint: .bottomTrailing
    )

    static let success = Color.green
    static let danger = Color.red
    static let warning = Color.orange
    static let active = Color.blue
}
```

**Step 7: Update ContentView to route based on auth state**

```swift
// LockIn/ContentView.swift
import SwiftUI

struct ContentView: View {
    @State private var authViewModel = AuthViewModel()

    var body: some View {
        Group {
            if authViewModel.isLoading {
                ProgressView()
            } else if authViewModel.isAuthenticated {
                MainTabView(authViewModel: authViewModel)
            } else {
                LoginView(authViewModel: authViewModel)
            }
        }
        .task {
            await authViewModel.checkSession()
        }
    }
}
```

**Step 8: Create placeholder MainTabView**

```swift
// LockIn/Views/MainTabView.swift
import SwiftUI

struct MainTabView: View {
    let authViewModel: AuthViewModel

    var body: some View {
        TabView {
            Tab("Pacts", systemImage: "checkmark.circle") {
                Text("Pacts")
            }
            Tab("Focus", systemImage: "timer") {
                Text("Focus")
            }
            Tab("Stats", systemImage: "chart.bar") {
                Text("Stats")
            }
            Tab("Settings", systemImage: "gear") {
                Text("Settings")
            }
        }
        .tint(Theme.indigo)
    }
}
```

**Step 9: Build and run**

Run: Cmd+R on iPhone Simulator
Expected: App shows loading spinner, then LoginView with Sign in with Apple button

**Step 10: Commit**

```bash
git add .
git commit -m "feat: add Sign in with Apple authentication flow"
```

---

## Task 4: Authentication — Google Sign-In

**Files:**
- Modify: `LockIn/Services/AuthService.swift`
- Modify: `LockIn/ViewModels/AuthViewModel.swift`
- Modify: `LockIn/Views/Auth/LoginView.swift`
- Modify: `Info.plist` (add Google URL scheme)

**Step 1: Configure Google Sign-In**

1. Go to Google Cloud Console → Credentials → Create OAuth 2.0 Client ID (iOS)
2. Add bundle ID: `com.vayungodara.LockIn`
3. Download `GoogleService-Info.plist` and add to Xcode project
4. Add URL scheme to Info.plist: reversed client ID from the plist

**Step 2: Add Google sign-in to AuthService**

```swift
// Add to AuthService.swift
import GoogleSignIn

// Add this method:
func signInWithGoogle(presenting: UIWindow) async throws {
    let result = try await GIDSignIn.sharedInstance.signIn(
        withPresenting: presenting.rootViewController!
    )

    guard let idToken = result.user.idToken?.tokenString else {
        throw AuthError.missingToken
    }

    try await supabase.auth.signInWithIdToken(
        credentials: .init(
            provider: .google,
            idToken: idToken
        )
    )
}

enum AuthError: LocalizedError {
    case missingToken

    var errorDescription: String? {
        switch self {
        case .missingToken: return "Failed to get authentication token"
        }
    }
}
```

**Step 3: Add Google sign-in to AuthViewModel**

```swift
// Add to AuthViewModel.swift
func handleGoogleSignIn() async {
    guard let window = UIApplication.shared.connectedScenes
        .compactMap({ $0 as? UIWindowScene })
        .flatMap({ $0.windows })
        .first(where: { $0.isKeyWindow }) else {
        errorMessage = "Cannot find window"
        return
    }

    do {
        try await authService.signInWithGoogle(presenting: window)
        isAuthenticated = true
        errorMessage = nil
    } catch {
        errorMessage = error.localizedDescription
    }
}
```

**Step 4: Add Google button to LoginView**

```swift
// Add below the Sign in with Apple button in LoginView.swift
Button {
    Task {
        await authViewModel.handleGoogleSignIn()
    }
} label: {
    HStack {
        Image(systemName: "g.circle.fill")
            .font(.title2)
        Text("Sign in with Google")
            .font(.body.weight(.medium))
    }
    .frame(maxWidth: .infinity)
    .frame(height: 50)
    .background(.background)
    .foregroundStyle(.primary)
    .clipShape(RoundedRectangle(cornerRadius: 8))
    .overlay(
        RoundedRectangle(cornerRadius: 8)
            .stroke(.secondary.opacity(0.3), lineWidth: 1)
    )
}
```

**Step 5: Build and run**

Run: Cmd+R
Expected: LoginView shows both Apple and Google sign-in buttons

**Step 6: Commit**

```bash
git add .
git commit -m "feat: add Google Sign-In authentication"
```

---

## Task 5: Pacts — Service & ViewModel

**Files:**
- Create: `LockIn/Services/PactService.swift`
- Create: `LockIn/ViewModels/PactsViewModel.swift`

**Step 1: Create PactService**

```swift
// LockIn/Services/PactService.swift
import Foundation
import Supabase

final class PactService {
    private let supabase = SupabaseService.shared.client

    func fetchPacts(userId: UUID) async throws -> [Pact] {
        try await supabase
            .from("pacts")
            .select()
            .eq("user_id", value: userId.uuidString)
            .order("deadline", ascending: true)
            .execute()
            .value
    }

    func createPact(userId: UUID, title: String, description: String?, deadline: Date, isRecurring: Bool, recurrenceType: Pact.RecurrenceType?) async throws -> Pact {
        let newPact: [String: AnyJSON] = [
            "user_id": .string(userId.uuidString),
            "title": .string(title),
            "description": description.map { .string($0) } ?? .null,
            "deadline": .string(ISO8601DateFormatter().string(from: deadline)),
            "status": .string("active"),
            "is_recurring": .bool(isRecurring),
            "recurrence_type": recurrenceType.map { .string($0.rawValue) } ?? .null
        ]

        return try await supabase
            .from("pacts")
            .insert(newPact)
            .select()
            .single()
            .execute()
            .value
    }

    func completePact(pactId: UUID) async throws {
        try await supabase
            .from("pacts")
            .update([
                "status": "completed",
                "completed_at": ISO8601DateFormatter().string(from: Date())
            ])
            .eq("id", value: pactId.uuidString)
            .execute()
    }

    func missPact(pactId: UUID) async throws {
        try await supabase
            .from("pacts")
            .update(["status": "missed"])
            .eq("id", value: pactId.uuidString)
            .execute()
    }

    func deletePact(pactId: UUID) async throws {
        try await supabase
            .from("pacts")
            .delete()
            .eq("id", value: pactId.uuidString)
            .execute()
    }

    func logActivity(userId: UUID, action: String, metadata: [String: String]? = nil) async throws {
        let entry = ActivityLog(userId: userId, action: action, groupId: nil, metadata: metadata)
        try await supabase
            .from("activity_log")
            .insert(entry)
            .execute()
    }
}
```

**Step 2: Create PactsViewModel**

```swift
// LockIn/ViewModels/PactsViewModel.swift
import Foundation

enum PactFilter: String, CaseIterable {
    case all = "All"
    case active = "Active"
    case completed = "Completed"
    case missed = "Missed"
}

@Observable
final class PactsViewModel {
    var pacts: [Pact] = []
    var filter: PactFilter = .all
    var isLoading = false
    var errorMessage: String?
    var showCreateSheet = false

    private let pactService = PactService()
    private let authService = AuthService()

    var filteredPacts: [Pact] {
        switch filter {
        case .all: return pacts
        case .active: return pacts.filter { $0.status == .active }
        case .completed: return pacts.filter { $0.status == .completed }
        case .missed: return pacts.filter { $0.status == .missed }
        }
    }

    func loadPacts() async {
        guard let userId = await authService.currentUserId else { return }
        isLoading = true
        do {
            pacts = try await pactService.fetchPacts(userId: userId)
            errorMessage = nil
        } catch {
            errorMessage = error.localizedDescription
        }
        isLoading = false
    }

    func createPact(title: String, description: String?, deadline: Date, isRecurring: Bool, recurrenceType: Pact.RecurrenceType?) async {
        guard let userId = await authService.currentUserId else { return }
        do {
            let pact = try await pactService.createPact(
                userId: userId, title: title, description: description,
                deadline: deadline, isRecurring: isRecurring, recurrenceType: recurrenceType
            )
            pacts.insert(pact, at: 0)
            try await pactService.logActivity(userId: userId, action: "pact_created", metadata: ["pact_description": title])
            errorMessage = nil
        } catch {
            errorMessage = error.localizedDescription
        }
    }

    func completePact(_ pact: Pact) async {
        guard let userId = await authService.currentUserId else { return }
        do {
            try await pactService.completePact(pactId: pact.id)
            if let index = pacts.firstIndex(where: { $0.id == pact.id }) {
                pacts[index].status = .completed
                pacts[index].completedAt = Date()
            }
            try await pactService.logActivity(userId: userId, action: "pact_completed", metadata: ["pact_description": pact.title])
        } catch {
            errorMessage = error.localizedDescription
        }
    }

    func missPact(_ pact: Pact) async {
        guard let userId = await authService.currentUserId else { return }
        do {
            try await pactService.missPact(pactId: pact.id)
            if let index = pacts.firstIndex(where: { $0.id == pact.id }) {
                pacts[index].status = .missed
            }
            try await pactService.logActivity(userId: userId, action: "pact_missed", metadata: ["pact_description": pact.title])
        } catch {
            errorMessage = error.localizedDescription
        }
    }

    func deletePact(_ pact: Pact) async {
        do {
            try await pactService.deletePact(pactId: pact.id)
            pacts.removeAll { $0.id == pact.id }
        } catch {
            errorMessage = error.localizedDescription
        }
    }
}
```

**Step 3: Build to verify**

Run: Cmd+B
Expected: BUILD SUCCEEDED

**Step 4: Commit**

```bash
git add .
git commit -m "feat: add PactService and PactsViewModel with CRUD operations"
```

---

## Task 6: Pacts — Views (List, Card, Create Sheet)

**Files:**
- Create: `LockIn/Views/Pacts/PactsView.swift`
- Create: `LockIn/Views/Pacts/PactCard.swift`
- Create: `LockIn/Views/Pacts/CreatePactSheet.swift`
- Modify: `LockIn/Views/MainTabView.swift`

**Step 1: Create PactCard**

```swift
// LockIn/Views/Pacts/PactCard.swift
import SwiftUI

struct PactCard: View {
    let pact: Pact
    let onComplete: () -> Void
    let onMiss: () -> Void

    private var statusColor: Color {
        switch pact.status {
        case .active:
            return pact.deadline < Date() ? Theme.danger : Theme.active
        case .completed:
            return Theme.success
        case .missed:
            return Theme.danger
        }
    }

    private var statusText: String {
        switch pact.status {
        case .active:
            return pact.deadline < Date() ? "Overdue" : "Active"
        case .completed:
            return "Done"
        case .missed:
            return "Missed"
        }
    }

    private var deadlineText: String {
        let calendar = Calendar.current
        if pact.status != .active { return "" }

        if calendar.isDateInToday(pact.deadline) {
            return "Due today"
        } else if calendar.isDateInTomorrow(pact.deadline) {
            return "Due tomorrow"
        } else if pact.deadline < Date() {
            return "Overdue"
        } else {
            let days = calendar.dateComponents([.day], from: Date(), to: pact.deadline).day ?? 0
            return "Due in \(days) days"
        }
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                Text(pact.title)
                    .font(.headline)
                    .lineLimit(2)

                Spacer()

                Text(statusText)
                    .font(.caption.weight(.semibold))
                    .padding(.horizontal, 8)
                    .padding(.vertical, 4)
                    .background(statusColor.opacity(0.15))
                    .foregroundStyle(statusColor)
                    .clipShape(Capsule())
            }

            if let description = pact.description, !description.isEmpty {
                Text(description)
                    .font(.subheadline)
                    .foregroundStyle(.secondary)
                    .lineLimit(2)
            }

            HStack {
                if pact.isRecurring, let type = pact.recurrenceType {
                    Label(type.rawValue.capitalized, systemImage: "arrow.trianglehead.2.counterclockwise")
                        .font(.caption)
                        .foregroundStyle(.secondary)
                }

                if !deadlineText.isEmpty {
                    Label(deadlineText, systemImage: "clock")
                        .font(.caption)
                        .foregroundStyle(pact.deadline < Date() && pact.status == .active ? Theme.danger : .secondary)
                }

                Spacer()

                if pact.status == .active {
                    Button { onComplete() } label: {
                        Image(systemName: "checkmark.circle.fill")
                            .font(.title2)
                            .foregroundStyle(Theme.success)
                    }

                    Button { onMiss() } label: {
                        Image(systemName: "xmark.circle.fill")
                            .font(.title2)
                            .foregroundStyle(Theme.danger)
                    }
                }
            }
        }
        .padding()
        .background(.regularMaterial)
        .clipShape(RoundedRectangle(cornerRadius: 12))
    }
}
```

**Step 2: Create CreatePactSheet**

```swift
// LockIn/Views/Pacts/CreatePactSheet.swift
import SwiftUI

struct CreatePactSheet: View {
    @Environment(\.dismiss) private var dismiss
    let onCreate: (String, String?, Date, Bool, Pact.RecurrenceType?) async -> Void

    @State private var title = ""
    @State private var description = ""
    @State private var deadline = Date().addingTimeInterval(86400) // tomorrow
    @State private var isRecurring = false
    @State private var recurrenceType: Pact.RecurrenceType = .daily
    @State private var isSubmitting = false

    var body: some View {
        NavigationStack {
            Form {
                Section("What's the pact?") {
                    TextField("Title", text: $title)
                    TextField("Description (optional)", text: $description, axis: .vertical)
                        .lineLimit(3...6)
                }

                Section("Deadline") {
                    DatePicker("Due", selection: $deadline, in: Date()..., displayedComponents: [.date, .hourAndMinute])
                }

                Section("Recurring") {
                    Toggle("Repeat this pact", isOn: $isRecurring)

                    if isRecurring {
                        Picker("Frequency", selection: $recurrenceType) {
                            Text("Daily").tag(Pact.RecurrenceType.daily)
                            Text("Weekly").tag(Pact.RecurrenceType.weekly)
                            Text("Weekdays").tag(Pact.RecurrenceType.weekdays)
                        }
                    }
                }
            }
            .navigationTitle("New Pact")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") { dismiss() }
                }
                ToolbarItem(placement: .confirmationAction) {
                    Button("Lock It In") {
                        isSubmitting = true
                        Task {
                            await onCreate(
                                title,
                                description.isEmpty ? nil : description,
                                deadline,
                                isRecurring,
                                isRecurring ? recurrenceType : nil
                            )
                            isSubmitting = false
                            dismiss()
                        }
                    }
                    .disabled(title.trimmingCharacters(in: .whitespaces).isEmpty || isSubmitting)
                    .bold()
                }
            }
        }
    }
}
```

**Step 3: Create PactsView**

```swift
// LockIn/Views/Pacts/PactsView.swift
import SwiftUI

struct PactsView: View {
    @State private var viewModel = PactsViewModel()

    var body: some View {
        NavigationStack {
            VStack(spacing: 0) {
                // Filter tabs
                ScrollView(.horizontal, showsIndicators: false) {
                    HStack(spacing: 8) {
                        ForEach(PactFilter.allCases, id: \.self) { filter in
                            Button {
                                viewModel.filter = filter
                            } label: {
                                Text(filter.rawValue)
                                    .font(.subheadline.weight(.medium))
                                    .padding(.horizontal, 16)
                                    .padding(.vertical, 8)
                                    .background(viewModel.filter == filter ? Theme.indigo : Color.clear)
                                    .foregroundStyle(viewModel.filter == filter ? .white : .secondary)
                                    .clipShape(Capsule())
                            }
                        }
                    }
                    .padding(.horizontal)
                    .padding(.vertical, 8)
                }

                // Pact list
                if viewModel.isLoading {
                    Spacer()
                    ProgressView()
                    Spacer()
                } else if viewModel.filteredPacts.isEmpty {
                    Spacer()
                    ContentUnavailableView(
                        "No pacts yet",
                        systemImage: "checkmark.circle.badge.questionmark",
                        description: Text("Tap + to create your first pact")
                    )
                    Spacer()
                } else {
                    ScrollView {
                        LazyVStack(spacing: 12) {
                            ForEach(viewModel.filteredPacts) { pact in
                                PactCard(
                                    pact: pact,
                                    onComplete: {
                                        Task { await viewModel.completePact(pact) }
                                    },
                                    onMiss: {
                                        Task { await viewModel.missPact(pact) }
                                    }
                                )
                            }
                        }
                        .padding()
                    }
                }
            }
            .navigationTitle("Pacts")
            .toolbar {
                ToolbarItem(placement: .primaryAction) {
                    Button {
                        viewModel.showCreateSheet = true
                    } label: {
                        Image(systemName: "plus")
                    }
                }
            }
            .sheet(isPresented: $viewModel.showCreateSheet) {
                CreatePactSheet { title, description, deadline, isRecurring, recurrenceType in
                    await viewModel.createPact(
                        title: title, description: description,
                        deadline: deadline, isRecurring: isRecurring,
                        recurrenceType: recurrenceType
                    )
                }
            }
            .refreshable {
                await viewModel.loadPacts()
            }
            .task {
                await viewModel.loadPacts()
            }
        }
    }
}
```

**Step 4: Update MainTabView to use PactsView**

Replace the Pacts tab placeholder:

```swift
Tab("Pacts", systemImage: "checkmark.circle") {
    PactsView()
}
```

**Step 5: Build and run**

Run: Cmd+R
Expected: App shows Pacts tab with filter pills, empty state, + button opens create sheet

**Step 6: Commit**

```bash
git add .
git commit -m "feat: add Pacts views — list, card, create sheet"
```

---

## Task 7: Focus Timer

**Files:**
- Create: `LockIn/Services/FocusService.swift`
- Create: `LockIn/ViewModels/FocusViewModel.swift`
- Create: `LockIn/Views/Focus/FocusView.swift`
- Modify: `LockIn/Views/MainTabView.swift`

**Step 1: Create FocusService**

```swift
// LockIn/Services/FocusService.swift
import Foundation
import Supabase

final class FocusService {
    private let supabase = SupabaseService.shared.client

    func logSession(userId: UUID, durationMinutes: Int, startedAt: Date, endedAt: Date) async throws {
        let session: [String: AnyJSON] = [
            "user_id": .string(userId.uuidString),
            "duration_minutes": .integer(durationMinutes),
            "started_at": .string(ISO8601DateFormatter().string(from: startedAt)),
            "ended_at": .string(ISO8601DateFormatter().string(from: endedAt))
        ]

        try await supabase
            .from("focus_sessions")
            .insert(session)
            .execute()
    }

    func fetchTodaySessions(userId: UUID) async throws -> [FocusSession] {
        let startOfDay = Calendar.current.startOfDay(for: Date())

        return try await supabase
            .from("focus_sessions")
            .select()
            .eq("user_id", value: userId.uuidString)
            .gte("started_at", value: ISO8601DateFormatter().string(from: startOfDay))
            .order("started_at", ascending: false)
            .execute()
            .value
    }
}
```

**Step 2: Create FocusViewModel**

```swift
// LockIn/ViewModels/FocusViewModel.swift
import Foundation
import Combine

enum TimerState {
    case idle, running, paused
}

enum TimerPhase: String {
    case work = "Focus"
    case shortBreak = "Short Break"
    case longBreak = "Long Break"
}

@Observable
final class FocusViewModel {
    var timeRemaining: Int = 25 * 60
    var state: TimerState = .idle
    var phase: TimerPhase = .work
    var completedPomodoros: Int = 0
    var todaySessions: [FocusSession] = []

    var workDuration: Int = 25  // minutes
    var breakDuration: Int = 5
    var longBreakDuration: Int = 15

    private var timer: Timer?
    private var sessionStartTime: Date?
    private let focusService = FocusService()
    private let authService = AuthService()

    var displayTime: String {
        let minutes = timeRemaining / 60
        let seconds = timeRemaining % 60
        return String(format: "%02d:%02d", minutes, seconds)
    }

    var progress: Double {
        let total: Int
        switch phase {
        case .work: total = workDuration * 60
        case .shortBreak: total = breakDuration * 60
        case .longBreak: total = longBreakDuration * 60
        }
        guard total > 0 else { return 0 }
        return Double(total - timeRemaining) / Double(total)
    }

    var todayTotalMinutes: Int {
        todaySessions.reduce(0) { $0 + $1.durationMinutes }
    }

    func start() {
        state = .running
        if sessionStartTime == nil {
            sessionStartTime = Date()
        }
        timer = Timer.scheduledTimer(withTimeInterval: 1, repeats: true) { [weak self] _ in
            self?.tick()
        }
    }

    func pause() {
        state = .paused
        timer?.invalidate()
        timer = nil
    }

    func reset() {
        timer?.invalidate()
        timer = nil
        state = .idle
        sessionStartTime = nil
        timeRemaining = workDuration * 60
        phase = .work
    }

    func skip() {
        timer?.invalidate()
        timer = nil
        advancePhase()
    }

    private func tick() {
        if timeRemaining > 0 {
            timeRemaining -= 1
        } else {
            timer?.invalidate()
            timer = nil

            if phase == .work {
                Task { await saveSession() }
                completedPomodoros += 1
            }

            advancePhase()
        }
    }

    private func advancePhase() {
        state = .idle
        sessionStartTime = nil

        switch phase {
        case .work:
            if completedPomodoros % 4 == 0 && completedPomodoros > 0 {
                phase = .longBreak
                timeRemaining = longBreakDuration * 60
            } else {
                phase = .shortBreak
                timeRemaining = breakDuration * 60
            }
        case .shortBreak, .longBreak:
            phase = .work
            timeRemaining = workDuration * 60
        }
    }

    private func saveSession() async {
        guard let userId = await authService.currentUserId,
              let startTime = sessionStartTime else { return }

        do {
            try await focusService.logSession(
                userId: userId,
                durationMinutes: workDuration,
                startedAt: startTime,
                endedAt: Date()
            )
            todaySessions = try await focusService.fetchTodaySessions(userId: userId)
        } catch {
            // Silently fail — don't interrupt timer UX
        }
    }

    func loadTodaySessions() async {
        guard let userId = await authService.currentUserId else { return }
        todaySessions = (try? await focusService.fetchTodaySessions(userId: userId)) ?? []
    }
}
```

**Step 3: Create FocusView**

```swift
// LockIn/Views/Focus/FocusView.swift
import SwiftUI

struct FocusView: View {
    @State private var viewModel = FocusViewModel()

    var body: some View {
        NavigationStack {
            VStack(spacing: 32) {
                Spacer()

                // Phase label
                Text(viewModel.phase.rawValue)
                    .font(.title3.weight(.medium))
                    .foregroundStyle(.secondary)

                // Timer circle
                ZStack {
                    Circle()
                        .stroke(.quaternary, lineWidth: 8)
                        .frame(width: 250, height: 250)

                    Circle()
                        .trim(from: 0, to: viewModel.progress)
                        .stroke(
                            Theme.brandGradient,
                            style: StrokeStyle(lineWidth: 8, lineCap: .round)
                        )
                        .frame(width: 250, height: 250)
                        .rotationEffect(.degrees(-90))
                        .animation(.linear(duration: 1), value: viewModel.progress)

                    Text(viewModel.displayTime)
                        .font(.system(size: 56, weight: .light, design: .monospaced))
                }

                // Controls
                HStack(spacing: 32) {
                    Button { viewModel.reset() } label: {
                        Image(systemName: "arrow.counterclockwise")
                            .font(.title2)
                            .frame(width: 56, height: 56)
                            .background(.regularMaterial)
                            .clipShape(Circle())
                    }

                    Button {
                        if viewModel.state == .running {
                            viewModel.pause()
                        } else {
                            viewModel.start()
                        }
                    } label: {
                        Image(systemName: viewModel.state == .running ? "pause.fill" : "play.fill")
                            .font(.title)
                            .frame(width: 72, height: 72)
                            .background(Theme.brandGradient)
                            .foregroundStyle(.white)
                            .clipShape(Circle())
                    }

                    Button { viewModel.skip() } label: {
                        Image(systemName: "forward.fill")
                            .font(.title2)
                            .frame(width: 56, height: 56)
                            .background(.regularMaterial)
                            .clipShape(Circle())
                    }
                }

                Spacer()

                // Today's stats
                HStack(spacing: 32) {
                    VStack {
                        Text("\(viewModel.completedPomodoros)")
                            .font(.title2.bold())
                        Text("Sessions")
                            .font(.caption)
                            .foregroundStyle(.secondary)
                    }

                    VStack {
                        Text("\(viewModel.todayTotalMinutes)")
                            .font(.title2.bold())
                        Text("Minutes today")
                            .font(.caption)
                            .foregroundStyle(.secondary)
                    }
                }
                .padding(.bottom, 32)
            }
            .navigationTitle("Focus")
            .task {
                await viewModel.loadTodaySessions()
            }
        }
    }
}
```

**Step 4: Update MainTabView**

Replace the Focus tab placeholder:

```swift
Tab("Focus", systemImage: "timer") {
    FocusView()
}
```

**Step 5: Build and run**

Run: Cmd+R
Expected: Focus tab shows circular timer with play/pause/reset/skip controls

**Step 6: Commit**

```bash
git add .
git commit -m "feat: add Focus timer with pomodoro logic and session logging"
```

---

## Task 8: Stats — Streak & Heatmap

**Files:**
- Create: `LockIn/Services/StatsService.swift`
- Create: `LockIn/ViewModels/StatsViewModel.swift`
- Create: `LockIn/Views/Stats/StatsView.swift`
- Create: `LockIn/Views/Stats/HeatmapView.swift`
- Modify: `LockIn/Views/MainTabView.swift`

**Step 1: Create StatsService**

```swift
// LockIn/Services/StatsService.swift
import Foundation
import Supabase

struct HeatmapDay: Identifiable {
    let id = UUID()
    let date: String
    let pactCount: Int
    let focusCount: Int
    let level: Int  // 0-4
}

struct StreakData {
    let currentStreak: Int
    let longestStreak: Int
    let totalCompleted: Int
}

final class StatsService {
    private let supabase = SupabaseService.shared.client

    func calculateStreak(userId: UUID) async throws -> StreakData {
        let pacts: [Pact] = try await supabase
            .from("pacts")
            .select()
            .eq("user_id", value: userId.uuidString)
            .eq("status", value: "completed")
            .not("completed_at", operator: .is, value: "null")
            .order("completed_at", ascending: false)
            .execute()
            .value

        guard !pacts.isEmpty else {
            return StreakData(currentStreak: 0, longestStreak: 0, totalCompleted: 0)
        }

        let formatter = DateFormatter()
        formatter.dateFormat = "yyyy-MM-dd"
        formatter.timeZone = TimeZone(identifier: "UTC")

        let completedDates = Array(Set(
            pacts.compactMap { $0.completedAt }.map { formatter.string(from: $0) }
        )).sorted(by: >)

        let today = formatter.string(from: Date())
        let yesterday = formatter.string(from: Calendar.current.date(byAdding: .day, value: -1, to: Date())!)

        var currentStreak = 0
        if completedDates.first == today || completedDates.first == yesterday {
            currentStreak = 1
            for i in 1..<completedDates.count {
                let prev = formatter.date(from: completedDates[i - 1])!
                let curr = formatter.date(from: completedDates[i])!
                let diff = Calendar.current.dateComponents([.day], from: curr, to: prev).day ?? 0
                if diff == 1 {
                    currentStreak += 1
                } else {
                    break
                }
            }
        }

        var longestStreak = 0
        var tempStreak = 1
        for i in 1..<completedDates.count {
            let prev = formatter.date(from: completedDates[i - 1])!
            let curr = formatter.date(from: completedDates[i])!
            let diff = Calendar.current.dateComponents([.day], from: curr, to: prev).day ?? 0
            if diff == 1 {
                tempStreak += 1
            } else {
                longestStreak = max(longestStreak, tempStreak)
                tempStreak = 1
            }
        }
        longestStreak = max(longestStreak, tempStreak, currentStreak)

        return StreakData(currentStreak: currentStreak, longestStreak: longestStreak, totalCompleted: pacts.count)
    }

    func getHeatmap(userId: UUID, days: Int = 90) async throws -> [HeatmapDay] {
        let startDate = Calendar.current.date(byAdding: .day, value: -days, to: Date())!
        let isoStart = ISO8601DateFormatter().string(from: startDate)

        let pacts: [Pact] = try await supabase
            .from("pacts")
            .select()
            .eq("user_id", value: userId.uuidString)
            .gte("completed_at", value: isoStart)
            .execute()
            .value

        let sessions: [FocusSession] = try await supabase
            .from("focus_sessions")
            .select()
            .eq("user_id", value: userId.uuidString)
            .gte("started_at", value: isoStart)
            .execute()
            .value

        let formatter = DateFormatter()
        formatter.dateFormat = "yyyy-MM-dd"

        var activityMap: [String: (pacts: Int, focus: Int)] = [:]

        for pact in pacts where pact.completedAt != nil {
            let dateStr = formatter.string(from: pact.completedAt!)
            let existing = activityMap[dateStr] ?? (0, 0)
            activityMap[dateStr] = (existing.pacts + 1, existing.focus)
        }

        for session in sessions {
            let dateStr = formatter.string(from: session.startedAt)
            let existing = activityMap[dateStr] ?? (0, 0)
            activityMap[dateStr] = (existing.pacts, existing.focus + 1)
        }

        var heatmap: [HeatmapDay] = []
        for i in stride(from: days - 1, through: 0, by: -1) {
            let date = Calendar.current.date(byAdding: .day, value: -i, to: Date())!
            let dateStr = formatter.string(from: date)
            let activity = activityMap[dateStr] ?? (0, 0)
            let weighted = activity.pacts * 2 + activity.focus

            let level: Int
            switch weighted {
            case 0: level = 0
            case 1: level = 1
            case 2...3: level = 2
            case 4...5: level = 3
            default: level = 4
            }

            heatmap.append(HeatmapDay(date: dateStr, pactCount: activity.pacts, focusCount: activity.focus, level: level))
        }

        return heatmap
    }
}
```

**Step 2: Create StatsViewModel**

```swift
// LockIn/ViewModels/StatsViewModel.swift
import Foundation

@Observable
final class StatsViewModel {
    var streak: StreakData = StreakData(currentStreak: 0, longestStreak: 0, totalCompleted: 0)
    var heatmapData: [HeatmapDay] = []
    var isLoading = false

    private let statsService = StatsService()
    private let authService = AuthService()

    func loadStats() async {
        guard let userId = await authService.currentUserId else { return }
        isLoading = true

        async let streakResult = statsService.calculateStreak(userId: userId)
        async let heatmapResult = statsService.getHeatmap(userId: userId)

        do {
            streak = try await streakResult
            heatmapData = try await heatmapResult
        } catch {
            // Silently handle
        }

        isLoading = false
    }
}
```

**Step 3: Create HeatmapView**

```swift
// LockIn/Views/Stats/HeatmapView.swift
import SwiftUI

struct HeatmapView: View {
    let data: [HeatmapDay]

    private let columns = Array(repeating: GridItem(.fixed(14), spacing: 3), count: 7)

    private func colorForLevel(_ level: Int) -> Color {
        switch level {
        case 0: return Color(.systemGray5)
        case 1: return Theme.indigo.opacity(0.3)
        case 2: return Theme.indigo.opacity(0.5)
        case 3: return Theme.purple.opacity(0.7)
        case 4: return Theme.magenta
        default: return Color(.systemGray5)
        }
    }

    var body: some View {
        LazyVGrid(columns: columns, spacing: 3) {
            ForEach(data) { day in
                RoundedRectangle(cornerRadius: 2)
                    .fill(colorForLevel(day.level))
                    .frame(width: 14, height: 14)
            }
        }
    }
}
```

**Step 4: Create StatsView**

```swift
// LockIn/Views/Stats/StatsView.swift
import SwiftUI

struct StatsView: View {
    @State private var viewModel = StatsViewModel()

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: 24) {
                    // Streak cards
                    HStack(spacing: 16) {
                        StatCard(
                            title: "Current Streak",
                            value: "\(viewModel.streak.currentStreak)",
                            unit: "days",
                            icon: "flame.fill",
                            color: Theme.magenta
                        )
                        StatCard(
                            title: "Longest Streak",
                            value: "\(viewModel.streak.longestStreak)",
                            unit: "days",
                            icon: "trophy.fill",
                            color: Theme.indigo
                        )
                    }

                    StatCard(
                        title: "Total Completed",
                        value: "\(viewModel.streak.totalCompleted)",
                        unit: "pacts",
                        icon: "checkmark.circle.fill",
                        color: Theme.success
                    )

                    // Heatmap
                    VStack(alignment: .leading, spacing: 12) {
                        Text("Activity")
                            .font(.headline)

                        HeatmapView(data: viewModel.heatmapData)

                        // Legend
                        HStack(spacing: 4) {
                            Text("Less")
                                .font(.caption2)
                                .foregroundStyle(.secondary)
                            ForEach(0..<5) { level in
                                RoundedRectangle(cornerRadius: 2)
                                    .fill(legendColor(level))
                                    .frame(width: 12, height: 12)
                            }
                            Text("More")
                                .font(.caption2)
                                .foregroundStyle(.secondary)
                        }
                    }
                    .padding()
                    .background(.regularMaterial)
                    .clipShape(RoundedRectangle(cornerRadius: 12))
                }
                .padding()
            }
            .navigationTitle("Stats")
            .refreshable {
                await viewModel.loadStats()
            }
            .task {
                await viewModel.loadStats()
            }
        }
    }

    private func legendColor(_ level: Int) -> Color {
        switch level {
        case 0: return Color(.systemGray5)
        case 1: return Theme.indigo.opacity(0.3)
        case 2: return Theme.indigo.opacity(0.5)
        case 3: return Theme.purple.opacity(0.7)
        case 4: return Theme.magenta
        default: return Color(.systemGray5)
        }
    }
}

struct StatCard: View {
    let title: String
    let value: String
    let unit: String
    let icon: String
    let color: Color

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            Image(systemName: icon)
                .font(.title2)
                .foregroundStyle(color)

            Text(value)
                .font(.title.bold())

            Text(title)
                .font(.caption)
                .foregroundStyle(.secondary)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding()
        .background(.regularMaterial)
        .clipShape(RoundedRectangle(cornerRadius: 12))
    }
}
```

**Step 5: Update MainTabView**

Replace the Stats tab placeholder:

```swift
Tab("Stats", systemImage: "chart.bar") {
    StatsView()
}
```

**Step 6: Build and run**

Run: Cmd+R
Expected: Stats tab shows streak cards and activity heatmap grid

**Step 7: Commit**

```bash
git add .
git commit -m "feat: add Stats view with streak calculation and activity heatmap"
```

---

## Task 9: Settings & Profile

**Files:**
- Create: `LockIn/Views/Settings/SettingsView.swift`
- Modify: `LockIn/Views/MainTabView.swift`

**Step 1: Create SettingsView**

```swift
// LockIn/Views/Settings/SettingsView.swift
import SwiftUI

struct SettingsView: View {
    let authViewModel: AuthViewModel

    @AppStorage("lockin-theme") private var isDarkMode = false
    @State private var profile: Profile?
    @State private var isLoading = true

    private let supabase = SupabaseService.shared.client

    var body: some View {
        NavigationStack {
            List {
                // Profile section
                if let profile {
                    Section {
                        HStack(spacing: 12) {
                            Circle()
                                .fill(Theme.brandGradient)
                                .frame(width: 50, height: 50)
                                .overlay {
                                    Text(profile.fullName?.prefix(1).uppercased() ?? "?")
                                        .font(.title2.bold())
                                        .foregroundStyle(.white)
                                }

                            VStack(alignment: .leading) {
                                Text(profile.fullName ?? "User")
                                    .font(.headline)
                                Text("Level \(profile.level) · \(profile.totalXp) XP")
                                    .font(.caption)
                                    .foregroundStyle(.secondary)
                            }
                        }
                        .padding(.vertical, 4)
                    }
                }

                // Appearance
                Section("Appearance") {
                    Toggle("Dark Mode", isOn: $isDarkMode)
                }

                // App info
                Section("About") {
                    HStack {
                        Text("Version")
                        Spacer()
                        Text("1.0.0")
                            .foregroundStyle(.secondary)
                    }
                }

                // Sign out
                Section {
                    Button(role: .destructive) {
                        Task { await authViewModel.signOut() }
                    } label: {
                        HStack {
                            Spacer()
                            Text("Sign Out")
                            Spacer()
                        }
                    }
                }
            }
            .navigationTitle("Settings")
            .preferredColorScheme(isDarkMode ? .dark : nil)
            .task {
                await loadProfile()
            }
        }
    }

    private func loadProfile() async {
        guard let userId = await AuthService().currentUserId else { return }
        do {
            profile = try await supabase
                .from("profiles")
                .select()
                .eq("id", value: userId.uuidString)
                .single()
                .execute()
                .value
        } catch {
            // Profile may not exist yet
        }
        isLoading = false
    }
}
```

**Step 2: Update MainTabView to pass authViewModel**

```swift
// LockIn/Views/MainTabView.swift
import SwiftUI

struct MainTabView: View {
    let authViewModel: AuthViewModel

    var body: some View {
        TabView {
            Tab("Pacts", systemImage: "checkmark.circle") {
                PactsView()
            }
            Tab("Focus", systemImage: "timer") {
                FocusView()
            }
            Tab("Stats", systemImage: "chart.bar") {
                StatsView()
            }
            Tab("Settings", systemImage: "gear") {
                SettingsView(authViewModel: authViewModel)
            }
        }
        .tint(Theme.indigo)
    }
}
```

**Step 3: Apply dark mode preference at app level**

Add to `LockInApp.swift`:

```swift
@main
struct LockInApp: App {
    @AppStorage("lockin-theme") private var isDarkMode = false

    var body: some Scene {
        WindowGroup {
            ContentView()
                .preferredColorScheme(isDarkMode ? .dark : nil)
        }
    }
}
```

**Step 4: Build and run**

Run: Cmd+R
Expected: Settings tab shows profile, dark mode toggle, sign out button

**Step 5: Commit**

```bash
git add .
git commit -m "feat: add Settings view with profile, dark mode toggle, sign out"
```

---

## Task 10: Local Notifications

**Files:**
- Create: `LockIn/Services/NotificationService.swift`
- Modify: `LockIn/ViewModels/PactsViewModel.swift` (schedule on create)
- Modify: `LockIn/ViewModels/FocusViewModel.swift` (notify on timer complete)

**Step 1: Create NotificationService**

```swift
// LockIn/Services/NotificationService.swift
import Foundation
import UserNotifications

final class NotificationService {
    static let shared = NotificationService()

    func requestPermission() async -> Bool {
        do {
            return try await UNUserNotificationCenter.current()
                .requestAuthorization(options: [.alert, .sound, .badge])
        } catch {
            return false
        }
    }

    func schedulePactReminder(pactId: UUID, title: String, deadline: Date) {
        // Remind 1 hour before deadline
        let reminderDate = deadline.addingTimeInterval(-3600)
        guard reminderDate > Date() else { return }

        let content = UNMutableNotificationContent()
        content.title = "Pact Deadline Approaching"
        content.body = "\"\(title)\" is due in 1 hour"
        content.sound = .default

        let components = Calendar.current.dateComponents(
            [.year, .month, .day, .hour, .minute],
            from: reminderDate
        )
        let trigger = UNCalendarNotificationTrigger(dateMatching: components, repeats: false)

        let request = UNNotificationRequest(
            identifier: "pact-\(pactId.uuidString)",
            content: content,
            trigger: trigger
        )

        UNUserNotificationCenter.current().add(request)
    }

    func cancelPactReminder(pactId: UUID) {
        UNUserNotificationCenter.current()
            .removePendingNotificationRequests(withIdentifiers: ["pact-\(pactId.uuidString)"])
    }

    func scheduleTimerComplete() {
        let content = UNMutableNotificationContent()
        content.title = "Focus Session Complete"
        content.body = "Great work! Time for a break."
        content.sound = .default

        let trigger = UNTimeIntervalNotificationTrigger(timeInterval: 1, repeats: false)
        let request = UNNotificationRequest(identifier: "timer-complete", content: content, trigger: trigger)

        UNUserNotificationCenter.current().add(request)
    }
}
```

**Step 2: Request notification permission on first launch**

Add to `LockInApp.swift` in the `body`:

```swift
.task {
    await NotificationService.shared.requestPermission()
}
```

**Step 3: Schedule reminder when pact is created**

Add to `PactsViewModel.createPact()` after successful creation:

```swift
NotificationService.shared.schedulePactReminder(pactId: pact.id, title: title, deadline: deadline)
```

**Step 4: Cancel reminder when pact is completed/missed**

Add to `PactsViewModel.completePact()` and `missPact()`:

```swift
NotificationService.shared.cancelPactReminder(pactId: pact.id)
```

**Step 5: Notify on timer completion**

Add to `FocusViewModel.tick()` when `timeRemaining` hits 0 and `phase == .work`:

```swift
NotificationService.shared.scheduleTimerComplete()
```

**Step 6: Build and run**

Run: Cmd+R
Expected: App requests notification permission on first launch

**Step 7: Commit**

```bash
git add .
git commit -m "feat: add local notifications for pact deadlines and timer completion"
```

---

## Task 11: App Icon & Final Polish

**Files:**
- Modify: `LockIn/Assets.xcassets/AppIcon.appiconset/`
- Modify: `Info.plist` — display name

**Step 1: Set display name**

In Xcode: Target → General → Display Name: `LockIn`

**Step 2: Create app icon**

Design a 1024x1024 icon with the brand gradient (#6366F1 → #8B5CF6 → #D946EF) background and a white lock icon. Add it to the AppIcon asset catalog in Xcode.

**Step 3: Set accent color**

In Assets.xcassets → AccentColor, set to #6366F1 (indigo).

**Step 4: Full build & test on simulator**

Run: Cmd+R on multiple simulator sizes (iPhone 16, iPhone SE)
Test: Auth flow, create pact, complete pact, run timer, view stats, toggle dark mode, sign out

**Step 5: Commit**

```bash
git add .
git commit -m "feat: add app icon, display name, and final polish"
```

---

## Task 12: Archive & Upload to App Store Connect

**Step 1: Set version and build number**

In Xcode: Target → General → Version: `1.0.0`, Build: `1`

**Step 2: Set signing team**

Target → Signing & Capabilities → Team: Your Apple Developer account

**Step 3: Archive**

1. Select "Any iOS Device (arm64)" as destination
2. Product → Archive
3. Wait for archive to complete

**Step 4: Upload**

1. In Organizer window, select the archive
2. Click "Distribute App"
3. Choose "App Store Connect"
4. Follow prompts to upload

**Step 5: Complete App Store Connect listing**

1. Go to appstoreconnect.apple.com
2. Add screenshots, description, keywords
3. Fill privacy nutrition labels
4. Add privacy policy URL
5. Submit for review

---

Plan complete and saved to `docs/plans/2026-03-08-ios-app-plan.md`. Two execution options:

**1. Subagent-Driven (this session)** — I dispatch a fresh subagent per task, review between tasks, fast iteration

**2. Parallel Session (separate)** — Open a new session in the project directory with the executing-plans skill, batch execution with checkpoints

Which approach?