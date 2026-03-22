import Foundation

final class GroupService {
    private let supabase = SupabaseService.shared.client
    private let authService = AuthService()

    func fetchUserGroups() async throws -> [GroupWithDetails] {
        guard let userId = await authService.currentUserId else { return [] }

        // 1. Get all memberships for this user (1 query)
        let memberships: [GroupMember] = try await supabase
            .from("group_members")
            .select()
            .eq("user_id", value: userId.uuidString)
            .execute()
            .value

        guard !memberships.isEmpty else { return [] }

        let groupIds = memberships.map { $0.groupId }
        let groupIdStrings = groupIds.map { $0.uuidString }

        // 2. Fetch all groups in ONE query
        let groups: [ProjectGroup] = try await supabase
            .from("groups")
            .select()
            .in("id", values: groupIdStrings)
            .execute()
            .value

        // 3. Fetch all members across all groups in ONE query
        let allMembers: [GroupMember] = try await supabase
            .from("group_members")
            .select()
            .in("group_id", values: groupIdStrings)
            .execute()
            .value

        // 4. Fetch all tasks across all groups in ONE query
        let allTasks: [GroupTask] = try await supabase
            .from("tasks")
            .select()
            .in("group_id", values: groupIdStrings)
            .execute()
            .value

        // 5. Index results for fast lookup
        let groupsById = Dictionary(uniqueKeysWithValues: groups.map { ($0.id, $0) })
        let memberCountByGroup = Dictionary(grouping: allMembers, by: { $0.groupId })
        let taskCountByGroup = Dictionary(grouping: allTasks, by: { $0.groupId })
        let roleByGroup = Dictionary(uniqueKeysWithValues: memberships.map { ($0.groupId, $0.role) })

        // 6. Join client-side
        var results: [GroupWithDetails] = []
        for groupId in groupIds {
            guard let group = groupsById[groupId] else { continue }
            results.append(GroupWithDetails(
                group: group,
                memberCount: memberCountByGroup[groupId]?.count ?? 0,
                taskCount: taskCountByGroup[groupId]?.count ?? 0,
                role: roleByGroup[groupId] ?? "member"
            ))
        }
        return results
    }

    func fetchGroupDetail(groupId: UUID) async throws -> (ProjectGroup, [MemberInfo], [GroupTask]) {
        let group: ProjectGroup = try await supabase
            .from("groups")
            .select()
            .eq("id", value: groupId.uuidString)
            .single()
            .execute()
            .value

        // 1. Fetch all members for this group
        let members: [GroupMember] = try await supabase
            .from("group_members")
            .select()
            .eq("group_id", value: groupId.uuidString)
            .execute()
            .value

        // 2. Fetch all profiles in ONE query instead of N queries
        let userIdStrings = members.map { $0.userId.uuidString }
        let profiles: [Profile] = try await supabase
            .from("profiles")
            .select()
            .in("id", values: userIdStrings)
            .execute()
            .value

        // 3. Index profiles by ID for fast lookup
        let profilesById = Dictionary(uniqueKeysWithValues: profiles.map { ($0.id, $0) })

        // 4. Join client-side
        let memberInfos = members.map { member in
            MemberInfo(
                userId: member.userId,
                fullName: profilesById[member.userId]?.fullName ?? "User",
                role: member.role
            )
        }

        let tasks: [GroupTask] = try await supabase
            .from("tasks")
            .select()
            .eq("group_id", value: groupId.uuidString)
            .order("created_at", ascending: false)
            .execute()
            .value

        return (group, memberInfos, tasks)
    }

    func createGroup(name: String, description: String?) async throws -> ProjectGroup {
        guard let userId = await authService.currentUserId else {
            throw NSError(domain: "GroupService", code: 401, userInfo: [NSLocalizedDescriptionKey: "Not authenticated"])
        }

        let inviteCode = generateInviteCode()

        struct NewGroup: Encodable {
            let name: String
            let description: String?
            let invite_code: String
            let created_by: String
        }

        let group: ProjectGroup = try await supabase
            .from("groups")
            .insert(NewGroup(
                name: name,
                description: description,
                invite_code: inviteCode,
                created_by: userId.uuidString
            ))
            .select()
            .single()
            .execute()
            .value

        struct NewMember: Encodable {
            let group_id: String
            let user_id: String
            let role: String
        }

        try await supabase
            .from("group_members")
            .insert(NewMember(
                group_id: group.id.uuidString,
                user_id: userId.uuidString,
                role: "owner"
            ))
            .execute()

        return group
    }

    func joinGroup(inviteCode: String) async throws -> ProjectGroup {
        guard let userId = await authService.currentUserId else {
            throw NSError(domain: "GroupService", code: 401, userInfo: [NSLocalizedDescriptionKey: "Not authenticated"])
        }

        let groups: [ProjectGroup] = try await supabase
            .from("groups")
            .select()
            .eq("invite_code", value: inviteCode.uppercased())
            .execute()
            .value

        guard let group = groups.first else {
            throw NSError(domain: "GroupService", code: 404, userInfo: [NSLocalizedDescriptionKey: "Group not found"])
        }

        let existing: [GroupMember] = try await supabase
            .from("group_members")
            .select()
            .eq("group_id", value: group.id.uuidString)
            .eq("user_id", value: userId.uuidString)
            .execute()
            .value

        if !existing.isEmpty {
            return group
        }

        struct NewMember: Encodable {
            let group_id: String
            let user_id: String
            let role: String
        }

        try await supabase
            .from("group_members")
            .insert(NewMember(
                group_id: group.id.uuidString,
                user_id: userId.uuidString,
                role: "member"
            ))
            .execute()

        return group
    }

    func createTask(groupId: UUID, title: String, description: String?, deadline: Date?) async throws {
        guard let userId = await authService.currentUserId else { return }

        struct NewTask: Encodable {
            let group_id: String
            let title: String
            let description: String?
            let created_by: String
            let status: String
            let deadline: Date?
        }

        try await supabase
            .from("tasks")
            .insert(NewTask(
                group_id: groupId.uuidString,
                title: title,
                description: description,
                created_by: userId.uuidString,
                status: "todo",
                deadline: deadline
            ))
            .execute()
    }

    func updateTaskStatus(taskId: UUID, status: TaskStatus) async throws {
        struct StatusUpdate: Encodable {
            let status: String
            let completed_at: Date?
        }

        try await supabase
            .from("tasks")
            .update(StatusUpdate(
                status: status.rawValue,
                completed_at: status == .done ? Date() : nil
            ))
            .eq("id", value: taskId.uuidString)
            .execute()
    }

    private func generateInviteCode() -> String {
        let chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
        return String((0..<6).map { _ in chars.randomElement()! })
    }
}

struct MemberInfo: Identifiable {
    let userId: UUID
    let fullName: String
    let role: String
    var id: UUID { userId }
}
