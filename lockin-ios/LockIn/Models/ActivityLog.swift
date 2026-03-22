import Foundation

struct ActivityLog: Codable {
    let userId: UUID
    let action: String
    let groupId: UUID?
    let metadata: [String: String]?

    enum CodingKeys: String, CodingKey {
        case userId = "user_id"
        case action
        case groupId = "group_id"
        case metadata
    }
}
