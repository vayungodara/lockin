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
