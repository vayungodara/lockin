import Foundation

struct Pact: Codable, Identifiable {
    let id: UUID
    let userId: UUID
    var title: String
    var description: String?
    var deadline: Date
    var completedAt: Date?
    var status: PactStatus
    var isRecurring: Bool?
    var recurrenceType: RecurrenceType?
    let createdAt: Date?

    enum PactStatus: String, Codable, CaseIterable {
        case active
        case completed
        case missed
        case unknown

        static var allCases: [PactStatus] { [.active, .completed, .missed] }

        init(from decoder: Decoder) throws {
            let value = try decoder.singleValueContainer().decode(String.self)
            self = PactStatus(rawValue: value) ?? .unknown
        }
    }

    enum RecurrenceType: String, Codable, CaseIterable {
        case daily
        case weekly
        case weekdays
        case monthly
        case unknown

        static var allCases: [RecurrenceType] { [.daily, .weekly, .weekdays, .monthly] }

        init(from decoder: Decoder) throws {
            let value = try decoder.singleValueContainer().decode(String.self)
            self = RecurrenceType(rawValue: value) ?? .unknown
        }
    }

    enum CodingKeys: String, CodingKey {
        case id
        case userId = "user_id"
        case title
        case description
        case deadline
        case completedAt = "completed_at"
        case status
        case isRecurring = "is_recurring"
        case recurrenceType = "recurrence_type"
        case createdAt = "created_at"
    }
}
