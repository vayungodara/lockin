import SwiftUI
import StoreKit

struct SettingsView: View {
    let authViewModel: AuthViewModel
    @State private var profile: Profile?
    @State private var isLoading = true
    @State private var showSignOutConfirmation = false
    @State private var showTimerSettings = false
    @AppStorage("appTheme") private var appTheme: String = "dark"
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
                            .accessibilityHidden(true)

                            VStack(spacing: 4) {
                                Text(profile.fullName ?? "User")
                                    .font(.title3.bold())

                                Text("Level \(profile.level ?? 1) \u{00B7} \(profile.totalXp ?? 0) XP")
                                    .font(.subheadline)
                                    .foregroundStyle(.secondary)
                            }
                            .accessibilityElement(children: .combine)

                            // XP progress bar
                            VStack(spacing: 4) {
                                GeometryReader { geo in
                                    ZStack(alignment: .leading) {
                                        RoundedRectangle(cornerRadius: 3)
                                            .fill(.fill.tertiary)
                                            .frame(height: 6)

                                        RoundedRectangle(cornerRadius: 3)
                                            .fill(Theme.brandGradient)
                                            .frame(width: geo.size.width * Double((profile.totalXp ?? 0) % 100) / 100.0, height: 6)
                                    }
                                }
                                .frame(height: 6)

                                Text("\((profile.totalXp ?? 0) % 100)/100 XP to next level")
                                    .font(.caption)
                                    .foregroundStyle(.tertiary)
                            }
                            .accessibilityElement(children: .combine)
                            .accessibilityLabel("\((profile.totalXp ?? 0) % 100) of 100 XP to next level")
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

                // Appearance
                Section("Appearance") {
                    Picker("Theme", selection: $appTheme) {
                        Text("System").tag("system")
                        Text("Dark").tag("dark")
                        Text("Light").tag("light")
                    }
                    .pickerStyle(.menu)
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
                        Label("Timer Settings", systemImage: "clock.fill")
                    }
                    .buttonStyle(.plain)
                }

                // About
                Section("About") {
                    Button {
                        // Opens feedback — placeholder
                    } label: {
                        Label("Help & Feedback", systemImage: "questionmark.circle.fill")
                    }
                    .buttonStyle(.plain)

                    Button {
                        requestReview()
                    } label: {
                        Label("Rate LockIn", systemImage: "star.fill")
                    }
                    .buttonStyle(.plain)

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
