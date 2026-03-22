import Foundation

struct ProjectGroup: Codable, Identifiable {
    let id: UUID
    let name: String
    let description: String?
    let inviteCode: String
    let createdBy: UUID
    let createdAt: Date

    enum CodingKeys: String, CodingKey {
        case id, name, description
        case inviteCode = "invite_code"
        case createdBy = "created_by"
        case createdAt = "created_at"
    }
}

struct GroupMember: Codable, Identifiable {
    let id: UUID
    let groupId: UUID
    let userId: UUID
    let role: String
    let joinedAt: Date

    enum CodingKeys: String, CodingKey {
        case id
        case groupId = "group_id"
        case userId = "user_id"
        case role
        case joinedAt = "joined_at"
    }
}

struct GroupTask: Codable, Identifiable {
    let id: UUID
    let groupId: UUID
    let title: String
    let description: String?
    let ownerId: UUID?
    let createdBy: UUID
    var status: TaskStatus
    let deadline: Date?
    let completedAt: Date?
    let createdAt: Date

    enum CodingKeys: String, CodingKey {
        case id
        case groupId = "group_id"
        case title, description
        case ownerId = "owner_id"
        case createdBy = "created_by"
        case status, deadline
        case completedAt = "completed_at"
        case createdAt = "created_at"
    }
}

enum TaskStatus: String, Codable, CaseIterable {
    case todo
    case inProgress = "in_progress"
    case done
    case unknown

    static var allCases: [TaskStatus] { [.todo, .inProgress, .done] }

    init(from decoder: Decoder) throws {
        let value = try decoder.singleValueContainer().decode(String.self)
        self = TaskStatus(rawValue: value) ?? .unknown
    }
}

struct GroupWithDetails: Identifiable {
    let group: ProjectGroup
    let memberCount: Int
    let taskCount: Int
    let role: String
    var id: UUID { group.id }
}
