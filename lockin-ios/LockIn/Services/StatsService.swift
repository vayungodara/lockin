import Foundation
import Supabase

struct HeatmapDay: Identifiable {
    var id: String { date }
    let date: String
    let pactCount: Int
    let focusCount: Int
    let level: Int
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
            .limit(100)
            .execute()
            .value

        guard !pacts.isEmpty else {
            return StreakData(currentStreak: 0, longestStreak: 0, totalCompleted: 0)
        }

        // Use the user's local timezone consistently for day boundary calculations
        let localTimeZone = TimeZone.current

        let formatter = DateFormatter()
        formatter.dateFormat = "yyyy-MM-dd"
        formatter.timeZone = localTimeZone

        var calendar = Calendar.current
        calendar.timeZone = localTimeZone

        let completedDates = Array(Set(
            pacts.compactMap { $0.completedAt }.map { formatter.string(from: $0) }
        )).sorted(by: >)

        guard !completedDates.isEmpty else {
            return StreakData(currentStreak: 0, longestStreak: 0, totalCompleted: pacts.count)
        }

        let today = formatter.string(from: Date())
        let yesterday = formatter.string(from: calendar.date(byAdding: .day, value: -1, to: Date())!)

        var currentStreak = 0
        if completedDates[0] == today || completedDates[0] == yesterday {
            currentStreak = 1
            for i in 1..<completedDates.count {
                guard let prev = formatter.date(from: completedDates[i - 1]),
                      let curr = formatter.date(from: completedDates[i]) else { break }
                let diff = calendar.dateComponents([.day], from: curr, to: prev).day ?? 0
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
            guard let prev = formatter.date(from: completedDates[i - 1]),
                  let curr = formatter.date(from: completedDates[i]) else { continue }
            let diff = calendar.dateComponents([.day], from: curr, to: prev).day ?? 0
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
        let localTimeZone = TimeZone.current
        var calendar = Calendar.current
        calendar.timeZone = localTimeZone

        let startDate = calendar.date(byAdding: .day, value: -days, to: Date())!
        let iso = ISO8601DateFormatter()
        let isoStart = iso.string(from: startDate)

        // Lightweight structs to decode only the date fields we need
        struct PactDate: Codable {
            let completedAt: Date?

            enum CodingKeys: String, CodingKey {
                case completedAt = "completed_at"
            }
        }

        struct SessionDate: Codable {
            let startedAt: Date

            enum CodingKeys: String, CodingKey {
                case startedAt = "started_at"
            }
        }

        // Fetch only the date columns we need
        let pactDates: [PactDate] = try await supabase
            .from("pacts")
            .select("completed_at")
            .eq("user_id", value: userId.uuidString)
            .gte("completed_at", value: isoStart)
            .execute()
            .value

        let sessionDates: [SessionDate] = try await supabase
            .from("focus_sessions")
            .select("started_at")
            .eq("user_id", value: userId.uuidString)
            .gte("started_at", value: isoStart)
            .execute()
            .value

        let formatter = DateFormatter()
        formatter.dateFormat = "yyyy-MM-dd"
        formatter.timeZone = localTimeZone

        var activityMap: [String: (pacts: Int, focus: Int)] = [:]

        for pactDate in pactDates {
            guard let completedAt = pactDate.completedAt else { continue }
            let dateStr = formatter.string(from: completedAt)
            let existing = activityMap[dateStr] ?? (0, 0)
            activityMap[dateStr] = (existing.pacts + 1, existing.focus)
        }

        for sessionDate in sessionDates {
            let dateStr = formatter.string(from: sessionDate.startedAt)
            let existing = activityMap[dateStr] ?? (0, 0)
            activityMap[dateStr] = (existing.pacts, existing.focus + 1)
        }

        var heatmap: [HeatmapDay] = []
        for i in stride(from: days - 1, through: 0, by: -1) {
            let date = calendar.date(byAdding: .day, value: -i, to: Date())!
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
