import SwiftUI

@main
struct LockInApp: App {
    @AppStorage("appTheme") private var appTheme: String = "dark"

    var body: some Scene {
        WindowGroup {
            ContentView()
                .preferredColorScheme(
                    appTheme == "dark" ? .dark : appTheme == "light" ? .light : nil
                )
                .tint(Theme.indigo)
                .task {
                    await NotificationService.shared.requestPermission()
                }
                .onOpenURL { url in
                    // Only handle auth callback URLs
                    guard url.scheme == "com.vayungodara.LockIn" ||
                          url.host == "lockin.vercel.app" else { return }
                    Task {
                        try? await SupabaseService.shared.client.auth.session(from: url)
                    }
                }
        }
    }
}
