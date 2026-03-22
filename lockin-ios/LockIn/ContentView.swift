import SwiftUI

struct ContentView: View {
    @State private var authViewModel = AuthViewModel()
    @Environment(\.accessibilityReduceMotion) var reduceMotion

    var body: some View {
        Group {
            if authViewModel.isLoading {
                ZStack {
                    Color(.systemBackground).ignoresSafeArea()
                    ProgressView("Loading...")
                        .tint(Theme.indigo)
                }
            } else if authViewModel.isAuthenticated {
                MainTabView(authViewModel: authViewModel)
            } else {
                LoginView(authViewModel: authViewModel)
            }
        }
        .animation(reduceMotion ? nil : .spring(response: 0.5, dampingFraction: 0.85), value: authViewModel.isAuthenticated)
        .task {
            await authViewModel.checkSession()
        }
    }
}
