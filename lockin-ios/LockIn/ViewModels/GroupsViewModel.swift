import Foundation

@MainActor @Observable
final class GroupsViewModel {
    var groups: [GroupWithDetails] = []
    var isLoading = false
    var showCreateSheet = false
    var showJoinSheet = false
    var errorMessage: String?

    // Detail view state
    var selectedGroup: ProjectGroup?
    var members: [MemberInfo] = []
    var tasks: [GroupTask] = []
    var showAddTaskSheet = false

    private let service = GroupService()

    func loadGroups() async {
        isLoading = true
        do {
            groups = try await service.fetchUserGroups()
        } catch {
            errorMessage = error.localizedDescription
        }
        isLoading = false
    }

    func loadGroupDetail(groupId: UUID) async {
        do {
            let (group, memberInfos, groupTasks) = try await service.fetchGroupDetail(groupId: groupId)
            selectedGroup = group
            members = memberInfos
            tasks = groupTasks
        } catch {
            errorMessage = error.localizedDescription
        }
    }

    func createGroup(name: String, description: String?) async {
        do {
            _ = try await service.createGroup(name: name, description: description)
            await loadGroups()
        } catch {
            errorMessage = error.localizedDescription
        }
    }

    func joinGroup(code: String) async {
        do {
            _ = try await service.joinGroup(inviteCode: code)
            await loadGroups()
        } catch {
            errorMessage = error.localizedDescription
        }
    }

    func createTask(groupId: UUID, title: String, description: String?, deadline: Date?) async {
        do {
            try await service.createTask(groupId: groupId, title: title, description: description, deadline: deadline)
            await loadGroupDetail(groupId: groupId)
        } catch {
            errorMessage = error.localizedDescription
        }
    }

    func updateTaskStatus(taskId: UUID, status: TaskStatus, groupId: UUID) async {
        do {
            try await service.updateTaskStatus(taskId: taskId, status: status)
            await loadGroupDetail(groupId: groupId)
        } catch {
            errorMessage = error.localizedDescription
        }
    }

    var todoTasks: [GroupTask] { tasks.filter { $0.status == .todo } }
    var inProgressTasks: [GroupTask] { tasks.filter { $0.status == .inProgress } }
    var doneTasks: [GroupTask] { tasks.filter { $0.status == .done } }
}
