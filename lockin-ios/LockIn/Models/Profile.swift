import Foundation

struct Profile: Codable, Identifiable {
    let id: UUID
    var fullName: String?
    var avatarUrl: String?
    var currentStreak: Int?
    var longestStreak: Int?
    var lastActivityDate: String?
    var totalXp: Int?
    var level: Int?
    let createdAt: Date?
    var updatedAt: Date?

    enum CodingKeys: String, CodingKey {
        case id
        case fullName = "full_name"
        case avatarUrl = "avatar_url"
        case currentStreak = "current_streak"
        case longestStreak = "longest_streak"
        case lastActivityDate = "last_activity_date"
        case totalXp = "total_xp"
        case level
        case createdAt = "created_at"
        case updatedAt = "updated_at"
    }
}
