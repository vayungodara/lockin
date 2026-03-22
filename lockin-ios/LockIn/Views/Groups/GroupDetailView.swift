import SwiftUI

struct GroupDetailView: View {
    let groupId: UUID
    var isPreview: Bool = false
    @State private var viewModel = GroupsViewModel()
    @State private var copiedCode = false

    private var group: ProjectGroup? {
        isPreview ? MockData.groupDetail : viewModel.selectedGroup
    }
    private var members: [MemberInfo] {
        isPreview ? MockData.memberInfos : viewModel.members
    }
    private var tasks: [GroupTask] {
        isPreview ? MockData.groupTasks : viewModel.tasks
    }
    private var todoTasks: [GroupTask] { tasks.filter { $0.status == .todo } }
    private var inProgressTasks: [GroupTask] { tasks.filter { $0.status == .inProgress } }
    private var doneTasks: [GroupTask] { tasks.filter { $0.status == .done } }

    var body: some View {
        List {
            // Group info
            if let group = group {
                Section {
                    if let desc = group.description, !desc.isEmpty {
                        Text(desc)
                            .font(.subheadline)
                            .foregroundStyle(.secondary)
                    }

                    HStack {
                        Label("\(members.count) members", systemImage: "person.2")
                            .font(.subheadline)
                        Spacer()
                        Label("\(tasks.count) tasks", systemImage: "checklist")
                            .font(.subheadline)
                    }
                    .foregroundStyle(.secondary)

                    Button {
                        UIPasteboard.general.string = group.inviteCode
                        copiedCode = true
                        UIAccessibility.post(notification: .announcement, argument: "Invite code copied")
                        Task {
                            try? await Task.sleep(for: .seconds(2))
                            copiedCode = false
                        }
                    } label: {
                        HStack {
                            Label("Invite Code", systemImage: "doc.on.doc")
                            Spacer()
                            Text(copiedCode ? "Copied!" : group.inviteCode)
                                .font(.body.monospaced())
                                .foregroundStyle(copiedCode ? Theme.success : Theme.indigo)
                        }
                    }
                    .sensoryFeedback(.impact(weight: .light), trigger: copiedCode)
                    .buttonStyle(.plain)
                    .accessibilityElement(children: .combine)
                }
            }

            // Members
            Section("Members") {
                ForEach(members) { member in
                    HStack(spacing: 10) {
                        ZStack {
                            Circle()
                                .fill(Theme.brandGradient)
                                .frame(width: 32, height: 32)
                            Text(member.fullName.prefix(1).uppercased())
                                .font(.caption.bold())
                                .foregroundStyle(.white)
                        }
                        .accessibilityHidden(true)
                        Text(member.fullName)
                            .font(.body)
                        if member.role == "owner" {
                            Spacer()
                            Text("Owner")
                                .font(.caption)
                                .foregroundStyle(Theme.warning)
                        }
                    }
                }
            }

            // Tasks by status
            taskSection("To Do", tasks: todoTasks, color: Theme.active, status: .todo)
            taskSection("In Progress", tasks: inProgressTasks, color: Theme.warning, status: .inProgress)
            taskSection("Done", tasks: doneTasks, color: Theme.success, status: .done)
        }
        .listStyle(.insetGrouped)
        .navigationTitle(group?.name ?? "Group")
        .toolbar {
            ToolbarItem(placement: .primaryAction) {
                Button {
                    viewModel.showAddTaskSheet = true
                } label: {
                    Label("Add Task", systemImage: "plus")
                }
            }
        }
        .sheet(isPresented: $viewModel.showAddTaskSheet) {
            AddTaskSheet { title, description, deadline in
                await viewModel.createTask(groupId: groupId, title: title, description: description, deadline: deadline)
            }
            .presentationDetents([.medium])
        }
        .alert("Error", isPresented: Binding(
            get: { viewModel.errorMessage != nil },
            set: { if !$0 { viewModel.errorMessage = nil } }
        )) {
            Button("OK") { viewModel.errorMessage = nil }
        } message: {
            Text(viewModel.errorMessage ?? "")
        }
        .task {
            if !isPreview { await viewModel.loadGroupDetail(groupId: groupId) }
        }
    }

    @ViewBuilder
    private func taskSection(_ title: String, tasks: [GroupTask], color: Color, status: TaskStatus) -> some View {
        Section {
            if tasks.isEmpty {
                Text("No tasks")
                    .font(.subheadline)
                    .foregroundStyle(.tertiary)
            } else {
                ForEach(tasks) { task in
                    taskRow(task)
                        .swipeActions(edge: .trailing, allowsFullSwipe: true) {
                            if !isPreview {
                                if task.status == .todo {
                                    Button {
                                        Task { await viewModel.updateTaskStatus(taskId: task.id, status: .inProgress, groupId: groupId) }
                                    } label: {
                                        Label("Start", systemImage: "arrow.forward.circle")
                                    }
                                    .tint(Theme.warning)
                                }
                                if task.status == .inProgress {
                                    Button {
                                        Task { await viewModel.updateTaskStatus(taskId: task.id, status: .done, groupId: groupId) }
                                    } label: {
                                        Label("Done", systemImage: "checkmark.circle")
                                    }
                                    .tint(Theme.success)
                                }
                                if task.status == .done {
                                    Button {
                                        Task { await viewModel.updateTaskStatus(taskId: task.id, status: .todo, groupId: groupId) }
                                    } label: {
                                        Label("Reopen", systemImage: "arrow.uturn.backward.circle")
                                    }
                                    .tint(Theme.active)
                                }
                            }
                        }
                }
            }
        } header: {
            HStack(spacing: 6) {
                Circle().fill(color).frame(width: 8, height: 8)
                    .accessibilityHidden(true)
                Text(title)
                Text("(\(tasks.count))")
                    .foregroundStyle(.secondary)
            }
        }
    }

    @ViewBuilder
    private func taskRow(_ task: GroupTask) -> some View {
        VStack(alignment: .leading, spacing: 4) {
            Text(task.title)
                .font(.body)
                .foregroundStyle(task.status == .done ? .secondary : .primary)
                .strikethrough(task.status == .done)

            if let desc = task.description, !desc.isEmpty {
                Text(desc)
                    .font(.subheadline)
                    .foregroundStyle(.secondary)
                    .lineLimit(2)
            }

            if let deadline = task.deadline {
                Label(deadline.formatted(date: .abbreviated, time: .shortened), systemImage: "clock")
                    .font(.caption)
                    .foregroundStyle(.tertiary)
            }
        }
    }
}

struct AddTaskSheet: View {
    let onSave: (String, String?, Date?) async -> Void
    @Environment(\.dismiss) private var dismiss
    @State private var title = ""
    @State private var description = ""
    @State private var hasDeadline = false
    @State private var deadline = Date().addingTimeInterval(86400)
    @State private var isSubmitting = false

    var body: some View {
        NavigationStack {
            Form {
                Section("Task") {
                    TextField("Title", text: $title)
                    TextField("Description (optional)", text: $description, axis: .vertical)
                        .lineLimit(3...5)
                }

                Section {
                    Toggle("Set deadline", isOn: $hasDeadline)
                    if hasDeadline {
                        DatePicker("Deadline", selection: $deadline, in: Date()..., displayedComponents: [.date, .hourAndMinute])
                    }
                }
            }
            .scrollDismissesKeyboard(.interactively)
            .navigationTitle("New Task")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") { dismiss() }
                }
                ToolbarItem(placement: .confirmationAction) {
                    Button("Add") {
                        isSubmitting = true
                        Task {
                            await onSave(title, description.isEmpty ? nil : description, hasDeadline ? deadline : nil)
                            isSubmitting = false
                            dismiss()
                        }
                    }
                    .disabled(title.trimmingCharacters(in: .whitespaces).isEmpty || isSubmitting)
                }
            }
        }
    }
}
