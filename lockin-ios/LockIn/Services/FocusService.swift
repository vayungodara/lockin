import Foundation
import Supabase

final class FocusService {
    private let supabase = SupabaseService.shared.client

    func logSession(userId: UUID, durationMinutes: Int, startedAt: Date, endedAt: Date) async throws {
        struct NewSession: Encodable {
            let user_id: String
            let duration_minutes: Int
            let started_at: String
            let ended_at: String
        }

        let iso = ISO8601DateFormatter()
        let session = NewSession(
            user_id: userId.uuidString,
            duration_minutes: durationMinutes,
            started_at: iso.string(from: startedAt),
            ended_at: iso.string(from: endedAt)
        )

        try await supabase
            .from("focus_sessions")
            .insert(session)
            .execute()
    }

    func fetchTodaySessions(userId: UUID) async throws -> [FocusSession] {
        let startOfDay = Calendar.current.startOfDay(for: Date())
        let iso = ISO8601DateFormatter()

        return try await supabase
            .from("focus_sessions")
            .select()
            .eq("user_id", value: userId.uuidString)
            .gte("started_at", value: iso.string(from: startOfDay))
            .order("started_at", ascending: false)
            .execute()
            .value
    }
}
