import Foundation

@MainActor @Observable
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
