import Foundation

enum MockData {
    static let pacts: [Pact] = [
        Pact(
            id: UUID(), userId: UUID(),
            title: "Finish CS assignment",
            description: "Complete the data structures homework before midnight",
            deadline: Date().addingTimeInterval(3600 * 4),
            completedAt: nil, status: .active,
            isRecurring: false, recurrenceType: nil,
            createdAt: Date().addingTimeInterval(-86400)
        ),
        Pact(
            id: UUID(), userId: UUID(),
            title: "Read 30 pages",
            description: "Psychology textbook chapter 7",
            deadline: Date().addingTimeInterval(3600 * 8),
            completedAt: nil, status: .active,
            isRecurring: true, recurrenceType: .daily,
            createdAt: Date().addingTimeInterval(-86400 * 3)
        ),
        Pact(
            id: UUID(), userId: UUID(),
            title: "Go to the gym",
            description: nil,
            deadline: Date().addingTimeInterval(-3600),
            completedAt: nil, status: .active,
            isRecurring: true, recurrenceType: .weekdays,
            createdAt: Date().addingTimeInterval(-86400 * 7)
        ),
        Pact(
            id: UUID(), userId: UUID(),
            title: "Submit lab report",
            description: "Physics 201 — wave mechanics lab",
            deadline: Date().addingTimeInterval(-86400),
            completedAt: Date().addingTimeInterval(-86400 + 3600),
            status: .completed,
            isRecurring: false, recurrenceType: nil,
            createdAt: Date().addingTimeInterval(-86400 * 2)
        ),
        Pact(
            id: UUID(), userId: UUID(),
            title: "Practice piano",
            description: "At least 20 minutes of Chopin",
            deadline: Date().addingTimeInterval(-86400 * 2),
            completedAt: nil, status: .missed,
            isRecurring: true, recurrenceType: .daily,
            createdAt: Date().addingTimeInterval(-86400 * 5)
        ),
        Pact(
            id: UUID(), userId: UUID(),
            title: "Write essay outline",
            description: "English 102 — argumentative essay",
            deadline: Date().addingTimeInterval(3600 * 12),
            completedAt: nil, status: .active,
            isRecurring: false, recurrenceType: nil,
            createdAt: Date().addingTimeInterval(-86400)
        ),
        Pact(
            id: UUID(), userId: UUID(),
            title: "Review lecture notes",
            description: "Organic chemistry chapters 5-7",
            deadline: Date().addingTimeInterval(3600 * 6),
            completedAt: nil, status: .active,
            isRecurring: true, recurrenceType: .daily,
            createdAt: Date().addingTimeInterval(-86400 * 2)
        ),
        Pact(
            id: UUID(), userId: UUID(),
            title: "Meditate 10 minutes",
            description: nil,
            deadline: Date().addingTimeInterval(3600 * 10),
            completedAt: nil, status: .active,
            isRecurring: true, recurrenceType: .daily,
            createdAt: Date().addingTimeInterval(-86400 * 10)
        ),
        Pact(
            id: UUID(), userId: UUID(),
            title: "Apply to internships",
            description: "Send at least 3 applications",
            deadline: Date().addingTimeInterval(86400 * 2),
            completedAt: nil, status: .active,
            isRecurring: false, recurrenceType: nil,
            createdAt: Date().addingTimeInterval(-86400 * 4)
        ),
        Pact(
            id: UUID(), userId: UUID(),
            title: "Clean dorm room",
            description: nil,
            deadline: Date().addingTimeInterval(-86400 * 3),
            completedAt: Date().addingTimeInterval(-86400 * 3 + 7200),
            status: .completed,
            isRecurring: false, recurrenceType: nil,
            createdAt: Date().addingTimeInterval(-86400 * 4)
        ),
        Pact(
            id: UUID(), userId: UUID(),
            title: "Drink 8 glasses of water",
            description: "Stay hydrated throughout the day",
            deadline: Date().addingTimeInterval(3600 * 14),
            completedAt: nil, status: .active,
            isRecurring: true, recurrenceType: .daily,
            createdAt: Date().addingTimeInterval(-86400 * 8)
        ),
        Pact(
            id: UUID(), userId: UUID(),
            title: "Call mom",
            description: nil,
            deadline: Date().addingTimeInterval(86400),
            completedAt: nil, status: .active,
            isRecurring: true, recurrenceType: .weekly,
            createdAt: Date().addingTimeInterval(-86400 * 14)
        ),
        Pact(
            id: UUID(), userId: UUID(),
            title: "Complete math problem set",
            description: "Linear algebra — eigenvalues",
            deadline: Date().addingTimeInterval(-86400 * 1),
            completedAt: nil, status: .missed,
            isRecurring: false, recurrenceType: nil,
            createdAt: Date().addingTimeInterval(-86400 * 3)
        ),
        Pact(
            id: UUID(), userId: UUID(),
            title: "Run 5K",
            description: "Training for campus marathon",
            deadline: Date().addingTimeInterval(3600 * 16),
            completedAt: nil, status: .active,
            isRecurring: true, recurrenceType: .weekdays,
            createdAt: Date().addingTimeInterval(-86400 * 6)
        ),
        Pact(
            id: UUID(), userId: UUID(),
            title: "Debug iOS project",
            description: "Fix the tab bar collapse issue",
            deadline: Date().addingTimeInterval(3600 * 2),
            completedAt: nil, status: .active,
            isRecurring: false, recurrenceType: nil,
            createdAt: Date().addingTimeInterval(-3600)
        ),
    ]

    static let streak = StreakData(currentStreak: 12, longestStreak: 23, totalCompleted: 87)

    static func heatmapData() -> [HeatmapDay] {
        var data: [HeatmapDay] = []
        let formatter = DateFormatter()
        formatter.dateFormat = "yyyy-MM-dd"

        for i in stride(from: 89, through: 0, by: -1) {
            let date = Calendar.current.date(byAdding: .day, value: -i, to: Date())!
            let dateStr = formatter.string(from: date)
            let random = Int.random(in: 0...6)
            let level: Int
            switch random {
            case 0...2: level = 0
            case 3: level = 1
            case 4: level = 2
            case 5: level = 3
            default: level = 4
            }
            data.append(HeatmapDay(date: dateStr, pactCount: random > 2 ? random - 2 : 0, focusCount: random > 3 ? 1 : 0, level: level))
        }
        return data
    }

    static let profile = Profile(
        id: UUID(),
        fullName: "Vayun Godara",
        avatarUrl: nil,
        currentStreak: 12,
        longestStreak: 23,
        lastActivityDate: nil,
        totalXp: 870,
        level: 9,
        createdAt: Date().addingTimeInterval(-86400 * 30),
        updatedAt: Date()
    )

    // Groups mock data
    private static let groupId1 = UUID()
    private static let groupId2 = UUID()
    private static let userId1 = UUID()
    private static let userId2 = UUID()
    private static let userId3 = UUID()

    static let groups: [GroupWithDetails] = [
        GroupWithDetails(
            group: ProjectGroup(
                id: groupId1,
                name: "CS 201 Study Group",
                description: "Data structures & algorithms prep",
                inviteCode: "ABC123",
                createdBy: userId1,
                createdAt: Date().addingTimeInterval(-86400 * 14)
            ),
            memberCount: 4,
            taskCount: 7,
            role: "owner"
        ),
        GroupWithDetails(
            group: ProjectGroup(
                id: groupId2,
                name: "Gym Accountability",
                description: "5 days a week no excuses",
                inviteCode: "GYM456",
                createdBy: userId2,
                createdAt: Date().addingTimeInterval(-86400 * 30)
            ),
            memberCount: 3,
            taskCount: 4,
            role: "member"
        ),
    ]

    static let groupDetail = ProjectGroup(
        id: groupId1,
        name: "CS 201 Study Group",
        description: "Data structures & algorithms prep",
        inviteCode: "ABC123",
        createdBy: userId1,
        createdAt: Date().addingTimeInterval(-86400 * 14)
    )

    static let memberInfos: [MemberInfo] = [
        MemberInfo(userId: userId1, fullName: "Vayun Godara", role: "owner"),
        MemberInfo(userId: userId2, fullName: "Alex Chen", role: "member"),
        MemberInfo(userId: userId3, fullName: "Sarah Kim", role: "member"),
    ]

    static let groupTasks: [GroupTask] = [
        GroupTask(id: UUID(), groupId: groupId1, title: "Implement binary search tree", description: "Chapter 4 exercises", ownerId: userId1, createdBy: userId1, status: .inProgress, deadline: Date().addingTimeInterval(86400 * 2), completedAt: nil, createdAt: Date().addingTimeInterval(-86400)),
        GroupTask(id: UUID(), groupId: groupId1, title: "Write unit tests for sorting", description: nil, ownerId: userId2, createdBy: userId2, status: .todo, deadline: Date().addingTimeInterval(86400 * 3), completedAt: nil, createdAt: Date().addingTimeInterval(-86400 * 2)),
        GroupTask(id: UUID(), groupId: groupId1, title: "Review graph algorithms", description: "BFS and DFS", ownerId: nil, createdBy: userId1, status: .todo, deadline: nil, completedAt: nil, createdAt: Date().addingTimeInterval(-86400 * 3)),
        GroupTask(id: UUID(), groupId: groupId1, title: "Submit homework 3", description: nil, ownerId: userId3, createdBy: userId3, status: .done, deadline: Date().addingTimeInterval(-86400), completedAt: Date().addingTimeInterval(-86400 + 3600), createdAt: Date().addingTimeInterval(-86400 * 5)),
    ]
}
