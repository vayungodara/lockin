import Foundation
import Supabase

final class PactService {
    private let supabase = SupabaseService.shared.client

    func fetchPacts(userId: UUID) async throws -> [Pact] {
        try await supabase
            .from("pacts")
            .select()
            .eq("user_id", value: userId.uuidString)
            .order("deadline", ascending: true)
            .execute()
            .value
    }

    func createPact(userId: UUID, title: String, description: String?, deadline: Date, isRecurring: Bool, recurrenceType: Pact.RecurrenceType?) async throws -> Pact {
        let iso = ISO8601DateFormatter()

        struct NewPact: Encodable {
            let user_id: String
            let title: String
            let description: String?
            let deadline: String
            let status: String
            let is_recurring: Bool
            let recurrence_type: String?
        }

        let newPact = NewPact(
            user_id: userId.uuidString,
            title: title,
            description: description,
            deadline: iso.string(from: deadline),
            status: "active",
            is_recurring: isRecurring,
            recurrence_type: recurrenceType?.rawValue
        )

        return try await supabase
            .from("pacts")
            .insert(newPact)
            .select()
            .single()
            .execute()
            .value
    }

    func completePact(pactId: UUID) async throws {
        struct Update: Encodable {
            let status: String
            let completed_at: String
        }

        try await supabase
            .from("pacts")
            .update(Update(
                status: "completed",
                completed_at: ISO8601DateFormatter().string(from: Date())
            ))
            .eq("id", value: pactId.uuidString)
            .execute()
    }

    func missPact(pactId: UUID) async throws {
        struct Update: Encodable {
            let status: String
        }

        try await supabase
            .from("pacts")
            .update(Update(status: "missed"))
            .eq("id", value: pactId.uuidString)
            .execute()
    }

    func deletePact(pactId: UUID) async throws {
        try await supabase
            .from("pacts")
            .delete()
            .eq("id", value: pactId.uuidString)
            .execute()
    }

    func logActivity(userId: UUID, action: String, metadata: [String: String]? = nil) async throws {
        let entry = ActivityLog(userId: userId, action: action, groupId: nil, metadata: metadata)
        try await supabase
            .from("activity_log")
            .insert(entry)
            .execute()
    }
}
