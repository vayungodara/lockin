import Foundation
import Supabase

final class ProfileService {
    private let supabase = SupabaseService.shared.client

    func fetchProfile(userId: UUID) async throws -> Profile {
        let profile: Profile = try await supabase
            .from("profiles")
            .select()
            .eq("id", value: userId.uuidString)
            .single()
            .execute()
            .value
        return profile
    }

    func updateProfile(userId: UUID, fullName: String) async throws {
        try await supabase
            .from("profiles")
            .update(["full_name": fullName])
            .eq("id", value: userId.uuidString)
            .execute()
    }
}
