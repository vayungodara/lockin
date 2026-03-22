import SwiftUI

struct MainTabView: View {
    let authViewModel: AuthViewModel

    var body: some View {
        TabView {
            Tab("Pacts", systemImage: "checkmark.circle") {
                PactsView(isPreview: !authViewModel.isRealAuth)
            }

            Tab("Focus", systemImage: "timer") {
                FocusView()
            }

            Tab("Groups", systemImage: "person.3") {
                GroupsView(isPreview: !authViewModel.isRealAuth)
            }

            Tab("Stats", systemImage: "chart.bar") {
                StatsView(isPreview: !authViewModel.isRealAuth)
            }

            Tab("Settings", systemImage: "gearshape") {
                SettingsView(authViewModel: authViewModel)
            }
        }
        .tabBarMinimizeBehavior(.onScrollDown)
        .tint(Theme.indigo)
    }
}
