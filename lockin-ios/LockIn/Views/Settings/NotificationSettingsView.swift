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
