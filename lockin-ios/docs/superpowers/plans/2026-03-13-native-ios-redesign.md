# Native iOS Redesign Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform LockIn's view layer from custom glassmorphism to native iOS patterns (NavigationStack, List, toolbar, swipe actions, semantic fonts).

**Architecture:** Each tab owns its own NavigationStack. List with insetGrouped replaces ScrollView+LazyVStack. Brand gradient restricted to CTA buttons, timer ring, streak flame. Dark-only theme applied at app root.

**Tech Stack:** SwiftUI (iOS 17+), @Observable, @AppStorage, UIKit haptics

**Spec:** `docs/superpowers/specs/2026-03-13-native-ios-redesign-design.md`

---

## Chunk 1: Foundation

### Task 1: Theme & App Entry Point

**Files:**
- Modify: `LockIn/Utilities/Theme.swift`
- Modify: `LockIn/LockInApp.swift`

- [ ] **Step 1: Rewrite Theme.swift**

Remove `GlassCard` modifier and its extension. Keep brand colors. Keep old color constants as deprecated aliases so intermediate builds don't break — they will be unused after all views are rewritten and can be cleaned up in the final task:

```swift
import SwiftUI

enum Theme {
    // Brand gradient colors
    static let indigo = Color(hex: "5B5EF5")
    static let purple = Color(hex: "7C4DFF")
    static let magenta = Color(hex: "B44AE6")
    static let pink = Color(hex: "E040CB")

    // Gradients — restricted to: CTA buttons, timer ring, streak flame
    static let brandGradient = LinearGradient(
        colors: [indigo, purple, magenta, pink],
        startPoint: .topLeading,
        endPoint: .bottomTrailing
    )

    // Status colors
    static let success = Color(hex: "2DDF8E")
    static let danger = Color(hex: "FF6B6B")
    static let warning = Color(hex: "FFB84D")
    static let active = Color(hex: "6EA8FE")

    // MARK: - Deprecated (kept for intermediate build compatibility, remove after all views rewritten)
    static let bgPrimary = Color(hex: "08090D")
    static let bgSecondary = Color(hex: "0E1117")
    static let bgTertiary = Color(hex: "161B25")
    static let bgElevated = Color(hex: "1A1F2B")
    static let textPrimaryDark = Color(hex: "F0F0FF")
    static let textSecondaryDark = Color(hex: "A8A3C0")
    static let textMutedDark = Color(hex: "4A4568")
    static let borderSubtle = Color.white.opacity(0.06)
    static let borderDefault = Color.white.opacity(0.09)
    static let subtleGradient = LinearGradient(
        colors: [indigo.opacity(0.15), purple.opacity(0.08), magenta.opacity(0.05)],
        startPoint: .topLeading,
        endPoint: .bottomTrailing
    )
    static let successGradient = LinearGradient(
        colors: [Color(hex: "0DBF73"), Color(hex: "2DDFAC")],
        startPoint: .leading,
        endPoint: .trailing
    )
    static let bgPrimaryLight = Color(hex: "FAFAFF")
    static let bgSecondaryLight = Color(hex: "F5F4FF")
}
```

Note: The `GlassCard` modifier and `.glassCard()` extension are REMOVED. The deprecated color constants remain temporarily.

- [ ] **Step 2: Update LockInApp.swift**

Add `.preferredColorScheme(.dark)` globally:

```swift
import SwiftUI

@main
struct LockInApp: App {
    var body: some Scene {
        WindowGroup {
            ContentView()
                .preferredColorScheme(.dark)
                .tint(Theme.indigo)
                .task {
                    await NotificationService.shared.requestPermission()
                }
        }
    }
}
```

- [ ] **Step 3: Commit**

```bash
git add LockIn/Utilities/Theme.swift LockIn/LockInApp.swift
git commit -m "feat: simplify theme, remove glass cards, add global dark mode"
```

---

### Task 2: MainTabView Cleanup

**Files:**
- Modify: `LockIn/Views/MainTabView.swift`

- [ ] **Step 1: Remove .ignoresSafeArea and .preferredColorScheme from MainTabView**

Each tab will own its own NavigationStack internally, so MainTabView just wraps them in tabs:

```swift
import SwiftUI

struct MainTabView: View {
    let authViewModel: AuthViewModel

    var body: some View {
        TabView {
            PactsView(isPreview: !authViewModel.isRealAuth)
                .tabItem { Label("Pacts", systemImage: "checkmark.circle.fill") }

            FocusView()
                .tabItem { Label("Focus", systemImage: "timer") }

            GroupsView(isPreview: !authViewModel.isRealAuth)
                .tabItem { Label("Groups", systemImage: "person.3.fill") }

            StatsView(isPreview: !authViewModel.isRealAuth)
                .tabItem { Label("Stats", systemImage: "chart.bar.fill") }

            SettingsView(authViewModel: authViewModel)
                .tabItem { Label("Settings", systemImage: "gearshape.fill") }
        }
        .tint(Theme.indigo)
    }
}
```

- [ ] **Step 2: Commit**

```bash
git add LockIn/Views/MainTabView.swift
git commit -m "refactor: clean up MainTabView, remove per-tab ignoresSafeArea"
```

---

### Task 3: ViewModel Error Handling & AppStorage

**Files:**
- Modify: `LockIn/ViewModels/StatsViewModel.swift`
- Modify: `LockIn/ViewModels/FocusViewModel.swift`

- [ ] **Step 1: Add errorMessage to StatsViewModel, fix silent catch**

```swift
import Foundation

@Observable
final class StatsViewModel {
    var streak = StreakData(currentStreak: 0, longestStreak: 0, totalCompleted: 0)
    var heatmapData: [HeatmapDay] = []
    var isLoading = false
    var errorMessage: String?

    private let statsService = StatsService()
    private let authService = AuthService()

    func loadStats() async {
        guard let userId = await authService.currentUserId else { return }
        isLoading = true

        do {
            async let streakResult = statsService.calculateStreak(userId: userId)
            async let heatmapResult = statsService.getHeatmap(userId: userId)

            streak = try await streakResult
            heatmapData = try await heatmapResult
            errorMessage = nil
        } catch {
            errorMessage = error.localizedDescription
        }

        isLoading = false
    }
}
```

- [ ] **Step 2: Update FocusViewModel — add errorMessage, use @AppStorage for durations**

Note: `@Observable` and `@AppStorage` don't work together directly. Use `UserDefaults` reads in an `@Observable` class instead. Import UIKit for haptic feedback generators:

```swift
import Foundation
import UIKit

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
    var timeRemaining: Int
    var state: TimerState = .idle
    var phase: TimerPhase = .work
    var completedPomodoros: Int = 0
    var todaySessions: [FocusSession] = []
    var errorMessage: String?

    var workDuration: Int { UserDefaults.standard.object(forKey: "workDuration") as? Int ?? 25 }
    var breakDuration: Int { UserDefaults.standard.object(forKey: "breakDuration") as? Int ?? 5 }
    var longBreakDuration: Int { UserDefaults.standard.object(forKey: "longBreakDuration") as? Int ?? 15 }

    private var timer: Timer?
    private var sessionStartTime: Date?
    private let focusService = FocusService()
    private let authService = AuthService()

    init() {
        let work = UserDefaults.standard.object(forKey: "workDuration") as? Int ?? 25
        timeRemaining = work * 60
    }

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
        phase = .work
        timeRemaining = workDuration * 60
    }

    func skip() {
        timer?.invalidate()
        timer = nil
        advancePhase()
    }

    func reloadDurations() {
        if state == .idle {
            timeRemaining = workDuration * 60
        }
    }

    private var currentPhaseDuration: Int {
        switch phase {
        case .work: return workDuration * 60
        case .shortBreak: return breakDuration * 60
        case .longBreak: return longBreakDuration * 60
        }
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
                NotificationService.shared.scheduleTimerComplete()
                UINotificationFeedbackGenerator().notificationOccurred(.success)
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
            errorMessage = nil
        } catch {
            errorMessage = error.localizedDescription
        }
    }

    func loadTodaySessions() async {
        guard let userId = await authService.currentUserId else { return }
        do {
            todaySessions = try await focusService.fetchTodaySessions(userId: userId)
        } catch {
            errorMessage = error.localizedDescription
        }
    }
}
```

- [ ] **Step 3: Commit**

```bash
git add LockIn/ViewModels/StatsViewModel.swift LockIn/ViewModels/FocusViewModel.swift
git commit -m "fix: add error handling to StatsViewModel and FocusViewModel, use UserDefaults for timer durations"
```

---

## Chunk 2: Tab Rewrites — Pacts & Focus

### Task 4: Pacts Tab Rewrite

**Files:**
- Modify: `LockIn/Views/Pacts/PactsView.swift` — full rewrite
- Delete: `LockIn/Views/Pacts/PactCard.swift` — replaced by inline row
- Modify: `LockIn/Views/Pacts/CreatePactSheet.swift` — remove redundant color scheme

- [ ] **Step 1: Rewrite PactsView.swift**

```swift
import SwiftUI

struct PactsView: View {
    var isPreview: Bool = false
    @State private var viewModel = PactsViewModel()
    @State private var pactToMiss: Pact?

    private var displayPacts: [Pact] {
        if isPreview {
            switch viewModel.filter {
            case .all: return MockData.pacts
            case .active: return MockData.pacts.filter { $0.status == .active }
            case .completed: return MockData.pacts.filter { $0.status == .completed }
            case .missed: return MockData.pacts.filter { $0.status == .missed }
            }
        }
        return viewModel.filteredPacts
    }

    var body: some View {
        NavigationStack {
            List {
                if displayPacts.isEmpty {
                    ContentUnavailableView(
                        "No Pacts",
                        systemImage: "checkmark.circle",
                        description: Text("Tap + to create your first pact")
                    )
                    .listRowBackground(Color.clear)
                    .listRowSeparator(.hidden)
                } else {
                    ForEach(displayPacts) { pact in
                        pactRow(pact)
                            .swipeActions(edge: .leading, allowsFullSwipe: true) {
                                if pact.status == .active {
                                    Button {
                                        UIImpactFeedbackGenerator(style: .medium).impactOccurred()
                                        if !isPreview {
                                            Task { await viewModel.completePact(pact) }
                                        }
                                    } label: {
                                        Label("Complete", systemImage: "checkmark")
                                    }
                                    .tint(Theme.success)
                                }
                            }
                            .swipeActions(edge: .trailing, allowsFullSwipe: false) {
                                if pact.status == .active && !isPreview {
                                    Button {
                                        pactToMiss = pact
                                    } label: {
                                        Label("Miss", systemImage: "xmark")
                                    }
                                    .tint(Theme.danger)
                                }
                                if !isPreview {
                                    Button(role: .destructive) {
                                        Task { await viewModel.deletePact(pact) }
                                    } label: {
                                        Label("Delete", systemImage: "trash")
                                    }
                                }
                            }
                    }
                }
            }
            .listStyle(.insetGrouped)
            .navigationTitle("Pacts")
            .toolbar {
                ToolbarItem(placement: .primaryAction) {
                    Button {
                        viewModel.showCreateSheet = true
                    } label: {
                        Image(systemName: "plus")
                    }
                }
                ToolbarItemGroup(placement: .bottomBar) {
                    Picker("Filter", selection: $viewModel.filter) {
                        ForEach(PactFilter.allCases, id: \.self) { filter in
                            Text(filter.rawValue).tag(filter)
                        }
                    }
                    .pickerStyle(.segmented)
                }
            }
            .refreshable {
                if !isPreview { await viewModel.loadPacts() }
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
            .confirmationDialog(
                "Mark as missed?",
                isPresented: Binding(
                    get: { pactToMiss != nil },
                    set: { if !$0 { pactToMiss = nil } }
                ),
                presenting: pactToMiss
            ) { pact in
                Button("Miss Pact", role: .destructive) {
                    UIImpactFeedbackGenerator(style: .medium).impactOccurred()
                    Task { await viewModel.missPact(pact) }
                }
                Button("Cancel", role: .cancel) {}
            } message: { pact in
                Text("Are you sure you want to mark \"\(pact.title)\" as missed?")
            }
            .alert("Error", isPresented: Binding(
                get: { viewModel.errorMessage != nil },
                set: { if !$0 { viewModel.errorMessage = nil } }
            )) {
                Button("OK") { viewModel.errorMessage = nil }
            } message: {
                Text(viewModel.errorMessage ?? "")
            }
        }
        .task {
            if !isPreview { await viewModel.loadPacts() }
        }
    }

    @ViewBuilder
    private func pactRow(_ pact: Pact) -> some View {
        HStack(spacing: 12) {
            // Status icon
            statusIcon(for: pact)

            // Content
            VStack(alignment: .leading, spacing: 2) {
                Text(pact.title)
                    .font(.body)
                    .foregroundStyle(pact.status == .completed ? .secondary : .primary)
                    .strikethrough(pact.status == .completed)

                if let description = pact.description, !description.isEmpty {
                    Text(description)
                        .font(.subheadline)
                        .foregroundStyle(.secondary)
                        .lineLimit(1)
                }

                HStack(spacing: 8) {
                    if pact.isRecurring, let type = pact.recurrenceType {
                        Label(type.rawValue.capitalized, systemImage: "repeat")
                            .font(.caption)
                            .foregroundStyle(.secondary)
                    }

                    Label(deadlineText(for: pact), systemImage: "clock")
                        .font(.caption)
                        .foregroundStyle(pact.deadline < Date() && pact.status == .active ? Theme.danger : .secondary)
                }
            }

            Spacer()
        }
        .opacity(pact.status == .completed ? 0.7 : 1)
    }

    @ViewBuilder
    private func statusIcon(for pact: Pact) -> some View {
        switch pact.status {
        case .active:
            Image(systemName: "circle")
                .font(.title3)
                .foregroundStyle(pact.deadline < Date() ? Theme.danger : Theme.indigo)
        case .completed:
            Image(systemName: "checkmark.circle.fill")
                .font(.title3)
                .foregroundStyle(Theme.success)
        case .missed:
            Image(systemName: "xmark.circle.fill")
                .font(.title3)
                .foregroundStyle(Theme.danger)
        }
    }

    private func deadlineText(for pact: Pact) -> String {
        let calendar = Calendar.current
        guard pact.status == .active else {
            return pact.status == .completed ? "Completed" : "Missed"
        }
        if calendar.isDateInToday(pact.deadline) {
            let formatter = DateFormatter()
            formatter.dateFormat = "h:mm a"
            return "Due today at \(formatter.string(from: pact.deadline))"
        } else if calendar.isDateInTomorrow(pact.deadline) {
            return "Due tomorrow"
        } else if pact.deadline < Date() {
            return "Overdue"
        } else {
            let days = calendar.dateComponents([.day], from: Date(), to: pact.deadline).day ?? 0
            return "Due in \(days) days"
        }
    }
}
```

- [ ] **Step 2: Delete PactCard.swift**

```bash
rm LockIn/Views/Pacts/PactCard.swift
```

- [ ] **Step 3: Clean up CreatePactSheet.swift — remove redundant .preferredColorScheme**

In `CreatePactSheet.swift`, the only change is removing `.preferredColorScheme(.dark)` from any `.sheet` callers (already handled by app root). The file itself is already good — it uses `NavigationStack` + `Form` + `.toolbar` which is exactly the native pattern we want. No changes needed to CreatePactSheet.swift itself.

- [ ] **Step 4: Commit**

```bash
git add LockIn/Views/Pacts/PactsView.swift LockIn/Views/Pacts/CreatePactSheet.swift
git rm LockIn/Views/Pacts/PactCard.swift
git commit -m "feat: rewrite Pacts tab with native List, swipe actions, and segmented filter"
```

---

### Task 5: Focus Tab Rewrite

**Files:**
- Modify: `LockIn/Views/Focus/FocusView.swift`

- [ ] **Step 1: Rewrite FocusView.swift**

Wrap in NavigationStack with inline title. Keep custom timer ring. Add toolbar gear for settings. Add haptics. Simplify bottom stats:

```swift
import SwiftUI

struct FocusView: View {
    @State private var viewModel = FocusViewModel()
    @State private var showTimerSettings = false

    private var ringColor: Color {
        switch viewModel.phase {
        case .work: return Theme.indigo
        case .shortBreak: return Theme.success
        case .longBreak: return Theme.purple
        }
    }

    var body: some View {
        NavigationStack {
            VStack(spacing: 0) {
                Spacer()

                // Phase label
                Text(viewModel.phase.rawValue.uppercased())
                    .font(.caption.weight(.bold))
                    .tracking(2)
                    .foregroundStyle(ringColor)
                    .padding(.bottom, 16)

                // Timer ring
                ZStack {
                    Circle()
                        .fill(ringColor.opacity(viewModel.state == .running ? 0.12 : 0.06))
                        .frame(width: 260, height: 260)
                        .blur(radius: 50)

                    Circle()
                        .stroke(Color.white.opacity(0.06), lineWidth: 6)
                        .frame(width: 200, height: 200)

                    Circle()
                        .trim(from: 0, to: viewModel.progress)
                        .stroke(
                            AngularGradient(
                                colors: [Theme.indigo, Theme.purple, Theme.magenta, Theme.pink],
                                center: .center,
                                startAngle: .degrees(-90),
                                endAngle: .degrees(270)
                            ),
                            style: StrokeStyle(lineWidth: 6, lineCap: .round)
                        )
                        .frame(width: 200, height: 200)
                        .rotationEffect(.degrees(-90))
                        .animation(.linear(duration: 1), value: viewModel.progress)
                        .shadow(color: ringColor.opacity(0.4), radius: 12)

                    VStack(spacing: 6) {
                        Text(viewModel.displayTime)
                            .font(.system(size: 48, weight: .heavy, design: .monospaced))
                            .foregroundStyle(.white)
                            .contentTransition(.numericText())

                        if viewModel.completedPomodoros > 0 {
                            HStack(spacing: 4) {
                                ForEach(0..<min(viewModel.completedPomodoros, 4), id: \.self) { _ in
                                    Circle()
                                        .fill(Theme.brandGradient)
                                        .frame(width: 6, height: 6)
                                }
                            }
                        }
                    }
                }

                Spacer().frame(height: 28)

                // Controls
                HStack(spacing: 36) {
                    Button {
                        viewModel.reset()
                    } label: {
                        Image(systemName: "arrow.counterclockwise")
                            .font(.body.weight(.medium))
                            .frame(width: 48, height: 48)
                            .foregroundStyle(.secondary)
                            .background(.fill.tertiary)
                            .clipShape(Circle())
                    }

                    Button {
                        UIImpactFeedbackGenerator(style: .medium).impactOccurred()
                        if viewModel.state == .running {
                            viewModel.pause()
                        } else {
                            viewModel.start()
                        }
                    } label: {
                        Image(systemName: viewModel.state == .running ? "pause.fill" : "play.fill")
                            .font(.title2.weight(.semibold))
                            .frame(width: 64, height: 64)
                            .background(Theme.brandGradient)
                            .foregroundStyle(.white)
                            .clipShape(Circle())
                            .shadow(color: Theme.indigo.opacity(0.4), radius: 20)
                    }

                    Button {
                        viewModel.skip()
                    } label: {
                        Image(systemName: "forward.fill")
                            .font(.body.weight(.medium))
                            .frame(width: 48, height: 48)
                            .foregroundStyle(.secondary)
                            .background(.fill.tertiary)
                            .clipShape(Circle())
                    }
                }

                Spacer()

                // Today's stats — simple, no card
                HStack(spacing: 0) {
                    VStack(spacing: 4) {
                        Text("\(viewModel.completedPomodoros)")
                            .font(.title2.bold())
                        Text("Sessions")
                            .font(.caption2.weight(.medium))
                            .foregroundStyle(.secondary)
                    }
                    .frame(maxWidth: .infinity)

                    Divider().frame(height: 32)

                    VStack(spacing: 4) {
                        Text("\(viewModel.todayTotalMinutes)")
                            .font(.title2.bold())
                        Text("Minutes")
                            .font(.caption2.weight(.medium))
                            .foregroundStyle(.secondary)
                    }
                    .frame(maxWidth: .infinity)
                }
                .padding(.vertical, 16)
                .padding(.horizontal, 20)
                .padding(.bottom, 8)
            }
            .navigationTitle("Focus")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .primaryAction) {
                    Button {
                        showTimerSettings = true
                    } label: {
                        Image(systemName: "gearshape")
                    }
                }
            }
            .sheet(isPresented: $showTimerSettings) {
                TimerSettingsView()
                    .onDisappear {
                        viewModel.reloadDurations()
                    }
            }
            .alert("Error", isPresented: Binding(
                get: { viewModel.errorMessage != nil },
                set: { if !$0 { viewModel.errorMessage = nil } }
            )) {
                Button("OK") { viewModel.errorMessage = nil }
            } message: {
                Text(viewModel.errorMessage ?? "")
            }
        }
        .task {
            await viewModel.loadTodaySessions()
        }
    }
}
```

- [ ] **Step 2: Commit**

```bash
git add LockIn/Views/Focus/FocusView.swift
git commit -m "feat: rewrite Focus tab with NavigationStack, haptics, and timer settings toolbar"
```

---

## Chunk 3: Tab Rewrites — Groups & Stats

### Task 6: Groups Tab Rewrite

**Files:**
- Modify: `LockIn/Views/Groups/GroupsView.swift` — full rewrite
- Modify: `LockIn/Views/Groups/GroupDetailView.swift` — full rewrite
- Modify: `LockIn/Views/Groups/CreateGroupSheet.swift` — convert to Form
- Modify: `LockIn/Views/Groups/JoinGroupSheet.swift` — convert to Form

- [ ] **Step 1: Rewrite GroupsView.swift**

```swift
import SwiftUI

struct GroupsView: View {
    var isPreview: Bool = false
    @State private var viewModel = GroupsViewModel()
    @State private var selectedGroupId: UUID?
    @State private var showGroupDetail = false

    private var displayGroups: [GroupWithDetails] {
        isPreview ? MockData.groups : viewModel.groups
    }

    var body: some View {
        NavigationStack {
            List {
                if displayGroups.isEmpty && !viewModel.isLoading {
                    ContentUnavailableView(
                        "No Groups",
                        systemImage: "person.3",
                        description: Text("Create a group or join one with an invite code")
                    )
                    .listRowBackground(Color.clear)
                    .listRowSeparator(.hidden)
                } else {
                    ForEach(displayGroups) { item in
                        Button {
                            selectedGroupId = item.group.id
                            showGroupDetail = true
                        } label: {
                            groupRow(item)
                        }
                        .tint(.primary)
                    }
                }
            }
            .listStyle(.insetGrouped)
            .navigationTitle("Groups")
            .toolbar {
                ToolbarItem(placement: .primaryAction) {
                    Button {
                        viewModel.showCreateSheet = true
                    } label: {
                        Image(systemName: "plus")
                    }
                }
                ToolbarItem(placement: .topBarLeading) {
                    Button {
                        viewModel.showJoinSheet = true
                    } label: {
                        Image(systemName: "link.badge.plus")
                    }
                }
            }
            .refreshable {
                if !isPreview { await viewModel.loadGroups() }
            }
            .navigationDestination(isPresented: $showGroupDetail) {
                if let groupId = selectedGroupId {
                    GroupDetailView(groupId: groupId, isPreview: isPreview)
                }
            }
            .sheet(isPresented: $viewModel.showCreateSheet) {
                CreateGroupSheet { name, description in
                    await viewModel.createGroup(name: name, description: description)
                }
                .presentationDetents([.medium])
            }
            .sheet(isPresented: $viewModel.showJoinSheet) {
                JoinGroupSheet { code in
                    await viewModel.joinGroup(code: code)
                }
                .presentationDetents([.medium])
            }
            .alert("Error", isPresented: Binding(
                get: { viewModel.errorMessage != nil },
                set: { if !$0 { viewModel.errorMessage = nil } }
            )) {
                Button("OK") { viewModel.errorMessage = nil }
            } message: {
                Text(viewModel.errorMessage ?? "")
            }
        }
        .task {
            if !isPreview { await viewModel.loadGroups() }
        }
    }

    @ViewBuilder
    private func groupRow(_ item: GroupWithDetails) -> some View {
        HStack(spacing: 14) {
            ZStack {
                RoundedRectangle(cornerRadius: 10)
                    .fill(Theme.brandGradient)
                    .frame(width: 40, height: 40)
                Text(item.group.name.prefix(1).uppercased())
                    .font(.headline)
                    .foregroundStyle(.white)
            }

            VStack(alignment: .leading, spacing: 2) {
                HStack(spacing: 6) {
                    Text(item.group.name)
                        .font(.body.weight(.medium))
                        .lineLimit(1)
                    if item.role == "owner" {
                        Text("OWNER")
                            .font(.caption2.bold())
                            .padding(.horizontal, 5)
                            .padding(.vertical, 1)
                            .background(Theme.warning.opacity(0.15))
                            .foregroundStyle(Theme.warning)
                            .clipShape(Capsule())
                    }
                }

                HStack(spacing: 10) {
                    Label("\(item.memberCount)", systemImage: "person.2")
                        .font(.caption)
                        .foregroundStyle(.secondary)
                    Label("\(item.taskCount)", systemImage: "checklist")
                        .font(.caption)
                        .foregroundStyle(.secondary)
                }
            }

            Spacer()

            Image(systemName: "chevron.right")
                .font(.caption.weight(.semibold))
                .foregroundStyle(.tertiary)
        }
    }
}
```

- [ ] **Step 2: Rewrite GroupDetailView.swift**

```swift
import SwiftUI

struct GroupDetailView: View {
    let groupId: UUID
    var isPreview: Bool = false
    @State private var viewModel = GroupsViewModel()
    @State private var copiedCode = false

    private var group: ProjectGroup? {
        isPreview ? MockData.groupDetail : viewModel.selectedGroup
    }
    private var members: [MemberInfo] {
        isPreview ? MockData.memberInfos : viewModel.members
    }
    private var tasks: [GroupTask] {
        isPreview ? MockData.groupTasks : viewModel.tasks
    }
    private var todoTasks: [GroupTask] { tasks.filter { $0.status == .todo } }
    private var inProgressTasks: [GroupTask] { tasks.filter { $0.status == .inProgress } }
    private var doneTasks: [GroupTask] { tasks.filter { $0.status == .done } }

    var body: some View {
        List {
            // Group info
            if let group = group {
                Section {
                    if let desc = group.description, !desc.isEmpty {
                        Text(desc)
                            .font(.subheadline)
                            .foregroundStyle(.secondary)
                    }

                    HStack {
                        Label("\(members.count) members", systemImage: "person.2")
                            .font(.subheadline)
                        Spacer()
                        Label("\(tasks.count) tasks", systemImage: "checklist")
                            .font(.subheadline)
                    }
                    .foregroundStyle(.secondary)

                    Button {
                        UIPasteboard.general.string = group.inviteCode
                        UIImpactFeedbackGenerator(style: .light).impactOccurred()
                        copiedCode = true
                        DispatchQueue.main.asyncAfter(deadline: .now() + 2) {
                            copiedCode = false
                        }
                    } label: {
                        HStack {
                            Label("Invite Code", systemImage: "doc.on.doc")
                            Spacer()
                            Text(copiedCode ? "Copied!" : group.inviteCode)
                                .font(.body.monospaced())
                                .foregroundStyle(copiedCode ? Theme.success : Theme.indigo)
                        }
                    }
                    .tint(.primary)
                }
            }

            // Members
            Section("Members") {
                ForEach(members) { member in
                    HStack(spacing: 10) {
                        ZStack {
                            Circle()
                                .fill(Theme.brandGradient)
                                .frame(width: 32, height: 32)
                            Text(member.fullName.prefix(1).uppercased())
                                .font(.caption.bold())
                                .foregroundStyle(.white)
                        }
                        Text(member.fullName)
                            .font(.body)
                        if member.role == "owner" {
                            Spacer()
                            Text("Owner")
                                .font(.caption)
                                .foregroundStyle(Theme.warning)
                        }
                    }
                }
            }

            // Tasks by status
            taskSection("To Do", tasks: todoTasks, color: Theme.active, status: .todo)
            taskSection("In Progress", tasks: inProgressTasks, color: Theme.warning, status: .inProgress)
            taskSection("Done", tasks: doneTasks, color: Theme.success, status: .done)
        }
        .listStyle(.insetGrouped)
        .navigationTitle(group?.name ?? "Group")
        .toolbar {
            ToolbarItem(placement: .primaryAction) {
                Button {
                    viewModel.showAddTaskSheet = true
                } label: {
                    Image(systemName: "plus")
                }
            }
        }
        .sheet(isPresented: $viewModel.showAddTaskSheet) {
            AddTaskSheet { title, description, deadline in
                await viewModel.createTask(groupId: groupId, title: title, description: description, deadline: deadline)
            }
            .presentationDetents([.medium])
        }
        .alert("Error", isPresented: Binding(
            get: { viewModel.errorMessage != nil },
            set: { if !$0 { viewModel.errorMessage = nil } }
        )) {
            Button("OK") { viewModel.errorMessage = nil }
        } message: {
            Text(viewModel.errorMessage ?? "")
        }
        .task {
            if !isPreview { await viewModel.loadGroupDetail(groupId: groupId) }
        }
    }

    @ViewBuilder
    private func taskSection(_ title: String, tasks: [GroupTask], color: Color, status: TaskStatus) -> some View {
        Section {
            if tasks.isEmpty {
                Text("No tasks")
                    .font(.subheadline)
                    .foregroundStyle(.tertiary)
            } else {
                ForEach(tasks) { task in
                    taskRow(task)
                        .swipeActions(edge: .trailing, allowsFullSwipe: true) {
                            if !isPreview {
                                if task.status == .todo {
                                    Button {
                                        Task { await viewModel.updateTaskStatus(taskId: task.id, status: .inProgress, groupId: groupId) }
                                    } label: {
                                        Label("Start", systemImage: "arrow.forward.circle")
                                    }
                                    .tint(Theme.warning)
                                }
                                if task.status == .inProgress {
                                    Button {
                                        Task { await viewModel.updateTaskStatus(taskId: task.id, status: .done, groupId: groupId) }
                                    } label: {
                                        Label("Done", systemImage: "checkmark.circle")
                                    }
                                    .tint(Theme.success)
                                }
                                if task.status == .done {
                                    Button {
                                        Task { await viewModel.updateTaskStatus(taskId: task.id, status: .todo, groupId: groupId) }
                                    } label: {
                                        Label("Reopen", systemImage: "arrow.uturn.backward.circle")
                                    }
                                    .tint(Theme.active)
                                }
                            }
                        }
                }
            }
        } header: {
            HStack(spacing: 6) {
                Circle().fill(color).frame(width: 8, height: 8)
                Text(title)
                Text("(\(tasks.count))")
                    .foregroundStyle(.secondary)
            }
        }
    }

    @ViewBuilder
    private func taskRow(_ task: GroupTask) -> some View {
        VStack(alignment: .leading, spacing: 4) {
            Text(task.title)
                .font(.body)
                .foregroundStyle(task.status == .done ? .secondary : .primary)
                .strikethrough(task.status == .done)

            if let desc = task.description, !desc.isEmpty {
                Text(desc)
                    .font(.subheadline)
                    .foregroundStyle(.secondary)
                    .lineLimit(2)
            }

            if let deadline = task.deadline {
                Label(deadline.formatted(date: .abbreviated, time: .shortened), systemImage: "clock")
                    .font(.caption)
                    .foregroundStyle(.tertiary)
            }
        }
    }
}

struct AddTaskSheet: View {
    let onSave: (String, String?, Date?) async -> Void
    @Environment(\.dismiss) private var dismiss
    @State private var title = ""
    @State private var description = ""
    @State private var hasDeadline = false
    @State private var deadline = Date().addingTimeInterval(86400)
    @State private var isSubmitting = false

    var body: some View {
        NavigationStack {
            Form {
                Section("Task") {
                    TextField("Title", text: $title)
                    TextField("Description (optional)", text: $description, axis: .vertical)
                        .lineLimit(3...5)
                }

                Section {
                    Toggle("Set deadline", isOn: $hasDeadline)
                    if hasDeadline {
                        DatePicker("Deadline", selection: $deadline, in: Date()..., displayedComponents: [.date, .hourAndMinute])
                    }
                }
            }
            .navigationTitle("New Task")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") { dismiss() }
                }
                ToolbarItem(placement: .confirmationAction) {
                    Button("Add") {
                        isSubmitting = true
                        Task {
                            await onSave(title, description.isEmpty ? nil : description, hasDeadline ? deadline : nil)
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

- [ ] **Step 3: Convert CreateGroupSheet to Form**

```swift
import SwiftUI

struct CreateGroupSheet: View {
    let onSave: (String, String?) async -> Void
    @Environment(\.dismiss) private var dismiss
    @State private var name = ""
    @State private var description = ""
    @State private var isSubmitting = false

    var body: some View {
        NavigationStack {
            Form {
                Section("Group Info") {
                    TextField("Group name", text: $name)
                    TextField("Description (optional)", text: $description, axis: .vertical)
                        .lineLimit(3...5)
                }
            }
            .navigationTitle("Create Group")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") { dismiss() }
                }
                ToolbarItem(placement: .confirmationAction) {
                    Button("Create") {
                        isSubmitting = true
                        Task {
                            await onSave(name, description.isEmpty ? nil : description)
                            isSubmitting = false
                            dismiss()
                        }
                    }
                    .disabled(name.trimmingCharacters(in: .whitespaces).isEmpty || isSubmitting)
                    .bold()
                }
            }
        }
    }
}
```

- [ ] **Step 4: Convert JoinGroupSheet to Form**

```swift
import SwiftUI

struct JoinGroupSheet: View {
    let onJoin: (String) async -> Void
    @Environment(\.dismiss) private var dismiss
    @State private var inviteCode = ""
    @State private var isSubmitting = false

    var body: some View {
        NavigationStack {
            Form {
                Section {
                    TextField("ABC123", text: $inviteCode)
                        .font(.title2.bold().monospaced())
                        .multilineTextAlignment(.center)
                        .textInputAutocapitalization(.characters)
                        .onChange(of: inviteCode) { _, newValue in
                            inviteCode = String(newValue.prefix(6)).uppercased()
                        }
                } header: {
                    Text("Enter invite code")
                } footer: {
                    Text("Ask your group admin for the 6-character code")
                }
            }
            .navigationTitle("Join Group")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") { dismiss() }
                }
                ToolbarItem(placement: .confirmationAction) {
                    Button("Join") {
                        isSubmitting = true
                        Task {
                            await onJoin(inviteCode)
                            isSubmitting = false
                            dismiss()
                        }
                    }
                    .disabled(inviteCode.count != 6 || isSubmitting)
                    .bold()
                }
            }
        }
    }
}
```

- [ ] **Step 5: Commit**

```bash
git add LockIn/Views/Groups/
git commit -m "feat: rewrite Groups tab with native List, push navigation, swipe actions, Form sheets"
```

---

### Task 7: Stats Tab Rewrite

**Files:**
- Modify: `LockIn/Views/Stats/StatsView.swift` — full rewrite
- Modify: `LockIn/Views/Stats/HeatmapView.swift` — minor cleanup

- [ ] **Step 1: Rewrite StatsView.swift**

```swift
import SwiftUI

struct StatsView: View {
    var isPreview: Bool = false
    @State private var viewModel = StatsViewModel()

    private var streak: StreakData {
        isPreview ? MockData.streak : viewModel.streak
    }

    private var heatmap: [HeatmapDay] {
        isPreview ? MockData.heatmapData() : viewModel.heatmapData
    }

    private var level: Int {
        isPreview ? 9 : (streak.totalCompleted / 10 + 1)
    }

    var body: some View {
        NavigationStack {
            List {
                // Hero streak
                Section {
                    VStack(spacing: 8) {
                        Image(systemName: "flame.fill")
                            .font(.largeTitle)
                            .foregroundStyle(Theme.brandGradient)

                        Text("\(streak.currentStreak)")
                            .font(.system(size: 56, weight: .heavy, design: .rounded))

                        Text("Day Streak")
                            .font(.subheadline.weight(.medium))
                            .foregroundStyle(.secondary)
                    }
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 12)
                    .listRowBackground(Color.clear)
                }
                .listRowSeparator(.hidden)

                // Secondary stats
                Section {
                    HStack {
                        Label("Longest Streak", systemImage: "trophy.fill")
                            .foregroundStyle(.primary)
                        Spacer()
                        Text("\(streak.longestStreak) days")
                            .foregroundStyle(.secondary)
                    }

                    HStack {
                        Label("Total Completed", systemImage: "checkmark.circle.fill")
                            .foregroundStyle(.primary)
                        Spacer()
                        Text("\(streak.totalCompleted)")
                            .foregroundStyle(.secondary)
                    }

                    HStack {
                        Label("Level", systemImage: "star.fill")
                            .foregroundStyle(.primary)
                        Spacer()
                        Text("\(level)")
                            .foregroundStyle(.secondary)
                    }
                }

                // Heatmap
                Section {
                    HeatmapView(data: heatmap)
                        .padding(.vertical, 4)

                    HStack(spacing: 4) {
                        Text("Less")
                            .font(.caption2)
                            .foregroundStyle(.tertiary)
                        ForEach(0..<5, id: \.self) { level in
                            RoundedRectangle(cornerRadius: 2)
                                .fill(legendColor(level))
                                .frame(width: 12, height: 12)
                        }
                        Text("More")
                            .font(.caption2)
                            .foregroundStyle(.tertiary)
                    }
                } header: {
                    HStack {
                        Text("Activity")
                        Spacer()
                        Text("Last 90 days")
                            .font(.caption)
                            .foregroundStyle(.secondary)
                    }
                }
            }
            .listStyle(.insetGrouped)
            .navigationTitle("Stats")
            .refreshable {
                if !isPreview { await viewModel.loadStats() }
            }
            .alert("Error", isPresented: Binding(
                get: { viewModel.errorMessage != nil },
                set: { if !$0 { viewModel.errorMessage = nil } }
            )) {
                Button("OK") { viewModel.errorMessage = nil }
            } message: {
                Text(viewModel.errorMessage ?? "")
            }
        }
        .task {
            if !isPreview { await viewModel.loadStats() }
        }
    }

    private func legendColor(_ level: Int) -> Color {
        switch level {
        case 0: return Color.white.opacity(0.04)
        case 1: return Theme.indigo.opacity(0.25)
        case 2: return Theme.purple.opacity(0.4)
        case 3: return Theme.magenta.opacity(0.55)
        case 4: return Theme.pink.opacity(0.7)
        default: return Color.white.opacity(0.04)
        }
    }
}
```

- [ ] **Step 2: HeatmapView.swift — no changes needed**

The HeatmapView is already clean and standalone. It takes `[HeatmapDay]` data and renders the grid. No changes required.

- [ ] **Step 3: Commit**

```bash
git add LockIn/Views/Stats/StatsView.swift
git commit -m "feat: rewrite Stats tab with NavigationStack, hero streak, and native List sections"
```

---

## Chunk 4: Settings, Login & Cleanup

### Task 8: Settings Tab Rewrite

**Files:**
- Modify: `LockIn/Views/Settings/SettingsView.swift` — full rewrite
- Create: `LockIn/Views/Settings/EditProfileView.swift`
- Create: `LockIn/Views/Settings/NotificationSettingsView.swift`
- Create: `LockIn/Views/Settings/TimerSettingsView.swift`

- [ ] **Step 1: Rewrite SettingsView.swift**

```swift
import SwiftUI
import StoreKit

struct SettingsView: View {
    let authViewModel: AuthViewModel
    @State private var profile: Profile?
    @State private var isLoading = true
    @State private var showSignOutConfirmation = false
    @State private var showTimerSettings = false
    @Environment(\.requestReview) private var requestReview

    private var displayProfile: Profile? {
        authViewModel.isRealAuth ? profile : MockData.profile
    }

    private let supabase = SupabaseService.shared.client

    var body: some View {
        NavigationStack {
            List {
                // Profile header
                if let profile = displayProfile {
                    Section {
                        VStack(spacing: 12) {
                            ZStack {
                                Circle()
                                    .fill(Theme.brandGradient)
                                    .frame(width: 64, height: 64)

                                Text(profile.fullName?.prefix(1).uppercased() ?? "?")
                                    .font(.title.bold())
                                    .foregroundStyle(.white)
                            }

                            VStack(spacing: 4) {
                                Text(profile.fullName ?? "User")
                                    .font(.title3.bold())

                                Text("Level \(profile.level) \u{00B7} \(profile.totalXp) XP")
                                    .font(.subheadline)
                                    .foregroundStyle(.secondary)
                            }

                            // XP progress bar
                            VStack(spacing: 4) {
                                GeometryReader { geo in
                                    ZStack(alignment: .leading) {
                                        RoundedRectangle(cornerRadius: 3)
                                            .fill(.fill.tertiary)
                                            .frame(height: 6)

                                        RoundedRectangle(cornerRadius: 3)
                                            .fill(Theme.brandGradient)
                                            .frame(width: geo.size.width * Double(profile.totalXp % 100) / 100.0, height: 6)
                                    }
                                }
                                .frame(height: 6)

                                Text("\(profile.totalXp % 100)/100 XP to next level")
                                    .font(.caption)
                                    .foregroundStyle(.tertiary)
                            }
                        }
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 8)
                        .listRowBackground(Color.clear)
                    }
                    .listRowSeparator(.hidden)
                }

                // Stats
                Section {
                    HStack {
                        Label("Current Streak", systemImage: "flame.fill")
                        Spacer()
                        Text("\(displayProfile?.currentStreak ?? 0) days")
                            .foregroundStyle(.secondary)
                    }
                    HStack {
                        Label("Longest Streak", systemImage: "trophy.fill")
                        Spacer()
                        Text("\(displayProfile?.longestStreak ?? 0) days")
                            .foregroundStyle(.secondary)
                    }
                }

                // Preferences
                Section("Preferences") {
                    NavigationLink {
                        EditProfileView(profile: $profile)
                    } label: {
                        Label("Edit Profile", systemImage: "person.fill")
                    }

                    NavigationLink {
                        NotificationSettingsView()
                    } label: {
                        Label("Notifications", systemImage: "bell.fill")
                    }

                    Button {
                        showTimerSettings = true
                    } label: {
                        HStack {
                            Label("Timer Settings", systemImage: "clock.fill")
                            Spacer()
                            Image(systemName: "chevron.right")
                                .font(.caption.weight(.semibold))
                                .foregroundStyle(.tertiary)
                        }
                    }
                    .tint(.primary)
                }

                // About
                Section("About") {
                    Button {
                        // Opens feedback — placeholder
                    } label: {
                        Label("Help & Feedback", systemImage: "questionmark.circle.fill")
                    }
                    .tint(.primary)

                    Button {
                        requestReview()
                    } label: {
                        Label("Rate LockIn", systemImage: "star.fill")
                    }
                    .tint(.primary)

                    HStack {
                        Label("Version", systemImage: "info.circle.fill")
                        Spacer()
                        Text("1.0.0")
                            .foregroundStyle(.secondary)
                    }
                }

                // Sign out
                Section {
                    Button(role: .destructive) {
                        showSignOutConfirmation = true
                    } label: {
                        HStack {
                            Spacer()
                            Text("Sign Out")
                            Spacer()
                        }
                    }
                }
            }
            .listStyle(.insetGrouped)
            .navigationTitle("Settings")
            .sheet(isPresented: $showTimerSettings) {
                TimerSettingsView()
            }
            .confirmationDialog("Sign Out", isPresented: $showSignOutConfirmation) {
                Button("Sign Out", role: .destructive) {
                    Task { await authViewModel.signOut() }
                }
                Button("Cancel", role: .cancel) {}
            } message: {
                Text("Are you sure you want to sign out?")
            }
        }
        .task {
            if authViewModel.isRealAuth { await loadProfile() }
        }
    }

    private func loadProfile() async {
        guard let userId = await AuthService().currentUserId else {
            isLoading = false
            return
        }
        do {
            profile = try await supabase
                .from("profiles")
                .select()
                .eq("id", value: userId.uuidString)
                .single()
                .execute()
                .value
        } catch {
            // Profile load failure is non-fatal — settings still usable without profile data
        }
        isLoading = false
    }
}
```

- [ ] **Step 2: Create EditProfileView.swift**

```swift
import SwiftUI

struct EditProfileView: View {
    @Binding var profile: Profile?
    @State private var fullName: String = ""
    @State private var bio: String = ""
    @State private var isSaving = false
    @State private var errorMessage: String?
    @Environment(\.dismiss) private var dismiss

    private let supabase = SupabaseService.shared.client

    var body: some View {
        Form {
            Section("Name") {
                TextField("Full Name", text: $fullName)
            }

            Section("Bio") {
                TextField("Tell us about yourself", text: $bio, axis: .vertical)
                    .lineLimit(3...6)
            }
        }
        .navigationTitle("Edit Profile")
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            ToolbarItem(placement: .confirmationAction) {
                Button("Save") {
                    Task { await save() }
                }
                .disabled(fullName.trimmingCharacters(in: .whitespaces).isEmpty || isSaving)
                .bold()
            }
        }
        .alert("Error", isPresented: Binding(
            get: { errorMessage != nil },
            set: { if !$0 { errorMessage = nil } }
        )) {
            Button("OK") {}
        } message: {
            Text(errorMessage ?? "")
        }
        .onAppear {
            fullName = profile?.fullName ?? ""
            bio = profile?.bio ?? ""
        }
    }

    private func save() async {
        guard let userId = await AuthService().currentUserId else { return }
        isSaving = true
        do {
            try await supabase
                .from("profiles")
                .update([
                    "full_name": fullName.trimmingCharacters(in: .whitespaces),
                    "bio": bio.trimmingCharacters(in: .whitespaces)
                ])
                .eq("id", value: userId.uuidString)
                .execute()

            profile?.fullName = fullName.trimmingCharacters(in: .whitespaces)
            profile?.bio = bio.trimmingCharacters(in: .whitespaces)
            dismiss()
        } catch {
            errorMessage = error.localizedDescription
        }
        isSaving = false
    }
}
```

- [ ] **Step 3: Create NotificationSettingsView.swift**

```swift
import SwiftUI
import UserNotifications

struct NotificationSettingsView: View {
    @State private var notificationsEnabled = false
    @State private var authorizationStatus: UNAuthorizationStatus = .notDetermined

    var body: some View {
        Form {
            Section {
                Toggle("Enable Notifications", isOn: $notificationsEnabled)
                    .onChange(of: notificationsEnabled) { _, newValue in
                        if newValue {
                            Task { await requestPermission() }
                        }
                    }
            } footer: {
                switch authorizationStatus {
                case .denied:
                    Text("Notifications are disabled in system Settings. Tap to open Settings.")
                case .authorized:
                    Text("You'll receive reminders 1 hour before pact deadlines and when focus sessions complete.")
                default:
                    Text("Enable notifications to get pact deadline reminders.")
                }
            }

            if authorizationStatus == .denied {
                Section {
                    Button("Open Settings") {
                        if let url = URL(string: UIApplication.openSettingsURLString) {
                            UIApplication.shared.open(url)
                        }
                    }
                }
            }
        }
        .navigationTitle("Notifications")
        .navigationBarTitleDisplayMode(.inline)
        .task {
            await checkStatus()
        }
    }

    private func checkStatus() async {
        let settings = await UNUserNotificationCenter.current().notificationSettings()
        authorizationStatus = settings.authorizationStatus
        notificationsEnabled = settings.authorizationStatus == .authorized
    }

    private func requestPermission() async {
        await NotificationService.shared.requestPermission()
        await checkStatus()
    }
}
```

- [ ] **Step 4: Create TimerSettingsView.swift**

```swift
import SwiftUI

struct TimerSettingsView: View {
    @AppStorage("workDuration") private var workDuration = 25
    @AppStorage("breakDuration") private var breakDuration = 5
    @AppStorage("longBreakDuration") private var longBreakDuration = 15
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        NavigationStack {
            Form {
                Section("Focus") {
                    Stepper("\(workDuration) minutes", value: $workDuration, in: 5...120, step: 5)
                }

                Section("Short Break") {
                    Stepper("\(breakDuration) minutes", value: $breakDuration, in: 1...30, step: 1)
                }

                Section("Long Break") {
                    Stepper("\(longBreakDuration) minutes", value: $longBreakDuration, in: 5...60, step: 5)
                }

                Section {
                    Button("Reset to Defaults") {
                        workDuration = 25
                        breakDuration = 5
                        longBreakDuration = 15
                    }
                    .foregroundStyle(Theme.danger)
                }
            }
            .navigationTitle("Timer Settings")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .confirmationAction) {
                    Button("Done") { dismiss() }
                }
            }
        }
    }
}
```

- [ ] **Step 5: Commit**

```bash
git add LockIn/Views/Settings/
git commit -m "feat: rewrite Settings with native List, add EditProfile, NotificationSettings, TimerSettings views"
```

---

### Task 9: Login Screen Polish

**Files:**
- Modify: `LockIn/Views/Auth/LoginView.swift`

- [ ] **Step 1: Add entrance animation, remove redundant .preferredColorScheme**

```swift
import SwiftUI
import AuthenticationServices

struct LoginView: View {
    let authViewModel: AuthViewModel
    @State private var showContent = false

    var body: some View {
        ZStack {
            Color(.systemBackground)
                .ignoresSafeArea()

            // Gradient orbs
            Canvas { context, size in
                context.fill(
                    Path(ellipseIn: CGRect(x: -60, y: size.height * 0.15, width: 280, height: 280)),
                    with: .color(Theme.indigo.opacity(0.12))
                )
                context.fill(
                    Path(ellipseIn: CGRect(x: size.width - 100, y: size.height * 0.55, width: 220, height: 220)),
                    with: .color(Theme.magenta.opacity(0.08))
                )
                context.fill(
                    Path(ellipseIn: CGRect(x: size.width * 0.3, y: -40, width: 200, height: 200)),
                    with: .color(Theme.purple.opacity(0.06))
                )
            }
            .blur(radius: 80)
            .ignoresSafeArea()

            VStack(spacing: 0) {
                Spacer()

                // Lock icon
                Image("LockIcon")
                    .resizable()
                    .scaledToFit()
                    .frame(height: 80)
                    .padding(.bottom, 12)
                    .opacity(showContent ? 1 : 0)
                    .offset(y: showContent ? 0 : 20)

                // Text logo
                Image("LockInLogo")
                    .resizable()
                    .scaledToFit()
                    .frame(height: 36)
                    .padding(.bottom, 20)
                    .opacity(showContent ? 1 : 0)
                    .offset(y: showContent ? 0 : 20)

                Text("Stop procrastinating.\nStart delivering.")
                    .font(.body.weight(.medium))
                    .foregroundStyle(.secondary)
                    .multilineTextAlignment(.center)
                    .lineSpacing(4)
                    .opacity(showContent ? 1 : 0)

                Spacer()
                Spacer()

                // Buttons
                VStack(spacing: 14) {
                    SignInWithAppleButton(.signIn) { request in
                        let hashedNonce = authViewModel.prepareNonce()
                        request.requestedScopes = [.fullName, .email]
                        request.nonce = hashedNonce
                    } onCompletion: { result in
                        Task {
                            await authViewModel.handleAppleSignIn(result: result)
                        }
                    }
                    .signInWithAppleButtonStyle(.white)
                    .frame(height: 52)
                    .clipShape(RoundedRectangle(cornerRadius: 14))

                    Button {
                        Task {
                            await authViewModel.handleGoogleSignIn()
                        }
                    } label: {
                        HStack(spacing: 8) {
                            Image(systemName: "g.circle.fill")
                                .font(.title2)
                            Text("Sign in with Google")
                                .font(.body.weight(.semibold))
                        }
                        .frame(maxWidth: .infinity)
                        .frame(height: 52)
                        .background(.fill.tertiary)
                        .foregroundStyle(.primary)
                        .clipShape(RoundedRectangle(cornerRadius: 14))
                    }
                }
                .padding(.horizontal, 28)
                .opacity(showContent ? 1 : 0)
                .offset(y: showContent ? 0 : 30)

                if let error = authViewModel.errorMessage {
                    Text(error)
                        .font(.caption)
                        .foregroundStyle(Theme.danger)
                        .padding(.top, 12)
                        .padding(.horizontal, 28)
                }

                Button {
                    authViewModel.skipAuth()
                } label: {
                    Text("Skip for now")
                        .font(.footnote.weight(.medium))
                        .foregroundStyle(.tertiary)
                }
                .padding(.top, 16)
                .padding(.bottom, 50)
                .opacity(showContent ? 1 : 0)
            }
        }
        .onAppear {
            withAnimation(.easeOut(duration: 0.8).delay(0.2)) {
                showContent = true
            }
        }
    }
}
```

- [ ] **Step 2: Commit**

```bash
git add LockIn/Views/Auth/LoginView.swift
git commit -m "feat: add entrance animation to login, use system colors"
```

---

### Task 10: ContentView & Final Cleanup

**Files:**
- Modify: `LockIn/ContentView.swift` — remove redundant color scheme

- [ ] **Step 1: Clean up ContentView**

The only change is using system background instead of hardcoded Theme.bgPrimary (which no longer exists):

```swift
import SwiftUI

struct ContentView: View {
    @State private var authViewModel = AuthViewModel()

    var body: some View {
        Group {
            if authViewModel.isLoading {
                ZStack {
                    Color(.systemBackground).ignoresSafeArea()
                    ProgressView()
                        .tint(Theme.indigo)
                }
            } else if authViewModel.isAuthenticated {
                MainTabView(authViewModel: authViewModel)
            } else {
                LoginView(authViewModel: authViewModel)
            }
        }
        .animation(.easeInOut(duration: 0.3), value: authViewModel.isAuthenticated)
        .task {
            await authViewModel.checkSession()
        }
    }
}
```

- [ ] **Step 2: Build the project to verify compilation**

```bash
cd /Users/vayun/projects/lockin-ios && xcodebuild -scheme LockIn -destination 'platform=iOS Simulator,name=iPhone 16' build 2>&1 | tail -20
```

Fix any compilation errors that arise.

- [ ] **Step 3: Commit**

```bash
git add LockIn/ContentView.swift
git commit -m "refactor: clean up ContentView, use system background"
```

---

### Task 11: Remove Deprecated Theme Colors

**Files:**
- Modify: `LockIn/Utilities/Theme.swift`

- [ ] **Step 1: Remove the deprecated color constants**

After all views are rewritten, remove the `// MARK: - Deprecated` section from Theme.swift. Only the brand colors, gradients, and status colors should remain.

- [ ] **Step 2: Build to verify no remaining references**

```bash
cd /Users/vayun/projects/lockin-ios && xcodebuild -scheme LockIn -destination 'platform=iOS Simulator,name=iPhone 16' build 2>&1 | tail -30
```

If any views still reference the removed colors, fix them to use system colors (`.secondary`, `.tertiary`, `Color(.systemBackground)`, etc.).

- [ ] **Step 3: Commit**

```bash
git add LockIn/Utilities/Theme.swift
git commit -m "chore: remove deprecated theme color constants"
```

---

## Build Verification

After all tasks, run a full build:

```bash
cd /Users/vayun/projects/lockin-ios && xcodebuild -scheme LockIn -destination 'platform=iOS Simulator,name=iPhone 16' build 2>&1 | tail -30
```

If build succeeds, the redesign is complete. Fix any remaining compilation issues before considering the work done.

## Summary

| Task | What | Files |
|------|------|-------|
| 1 | Theme + App entry | Theme.swift, LockInApp.swift |
| 2 | MainTabView cleanup | MainTabView.swift |
| 3 | ViewModel fixes | StatsViewModel.swift, FocusViewModel.swift |
| 4 | Pacts tab rewrite | PactsView.swift, delete PactCard.swift |
| 5 | Focus tab rewrite | FocusView.swift |
| 6 | Groups tab rewrite | GroupsView.swift, GroupDetailView.swift, CreateGroupSheet.swift, JoinGroupSheet.swift |
| 7 | Stats tab rewrite | StatsView.swift |
| 8 | Settings tab rewrite | SettingsView.swift, EditProfileView.swift, NotificationSettingsView.swift, TimerSettingsView.swift |
| 9 | Login polish | LoginView.swift |
| 10 | ContentView + build | ContentView.swift |
| 11 | Remove deprecated theme colors | Theme.swift |
