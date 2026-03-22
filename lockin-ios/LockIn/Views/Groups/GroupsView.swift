import SwiftUI

struct GroupsView: View {
    var isPreview: Bool = false
    @State private var viewModel = GroupsViewModel()
    @State private var selectedGroupId: UUID?
    @State private var showGroupDetail = false

    private var displayGroups: [GroupWithDetails] {
        isPreview ? MockData.groups : viewModel.groups
    }

    var body: some View {
        NavigationStack {
            List {
                if viewModel.isLoading && displayGroups.isEmpty {
                    HStack {
                        Spacer()
                        ProgressView()
                        Spacer()
                    }
                    .listRowBackground(Color.clear)
                    .listRowSeparator(.hidden)
                } else if displayGroups.isEmpty {
                    ContentUnavailableView(
                        "No Groups",
                        systemImage: "person.3",
                        description: Text("Create a group or join one with an invite code")
                    )
                    .listRowBackground(Color.clear)
                    .listRowSeparator(.hidden)
                } else {
                    ForEach(displayGroups) { item in
                        Button {
                            selectedGroupId = item.group.id
                            showGroupDetail = true
                        } label: {
                            groupRow(item)
                        }
                        .buttonStyle(.plain)
                        .accessibilityElement(children: .combine)
                    }
                }
            }
            .listStyle(.insetGrouped)
            .animation(.spring(response: 0.35, dampingFraction: 0.85), value: displayGroups.map(\.group.id))
            .navigationTitle("Groups")
            .toolbar {
                ToolbarItemGroup(placement: .primaryAction) {
                    Button {
                        viewModel.showJoinSheet = true
                    } label: {
                        Label("Join Group", systemImage: "link.badge.plus")
                    }
                    Button {
                        viewModel.showCreateSheet = true
                    } label: {
                        Label("Create Group", systemImage: "plus")
                    }
                }
            }
            .refreshable {
                if !isPreview { await viewModel.loadGroups() }
            }
            .navigationDestination(isPresented: $showGroupDetail) {
                if let groupId = selectedGroupId {
                    GroupDetailView(groupId: groupId, isPreview: isPreview)
                }
            }
            .sheet(isPresented: $viewModel.showCreateSheet) {
                CreateGroupSheet { name, description in
                    await viewModel.createGroup(name: name, description: description)
                }
                .presentationDetents([.medium])
            }
            .sheet(isPresented: $viewModel.showJoinSheet) {
                JoinGroupSheet { code in
                    await viewModel.joinGroup(code: code)
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
        }
        .task {
            if !isPreview { await viewModel.loadGroups() }
        }
    }

    @ViewBuilder
    private func groupRow(_ item: GroupWithDetails) -> some View {
        HStack(spacing: 14) {
            ZStack {
                RoundedRectangle(cornerRadius: 10)
                    .fill(Theme.brandGradient)
                    .frame(width: 40, height: 40)
                Text(item.group.name.prefix(1).uppercased())
                    .font(.headline)
                    .foregroundStyle(.white)
            }
            .accessibilityHidden(true)

            VStack(alignment: .leading, spacing: 2) {
                HStack(spacing: 6) {
                    Text(item.group.name)
                        .font(.body.weight(.medium))
                        .lineLimit(1)
                    if item.role == "owner" {
                        Text("OWNER")
                            .font(.caption2.bold())
                            .padding(.horizontal, 5)
                            .padding(.vertical, 1)
                            .background(Theme.warning.opacity(0.15))
                            .foregroundStyle(Theme.warning)
                            .clipShape(Capsule())
                    }
                }

                HStack(spacing: 10) {
                    Label("\(item.memberCount)", systemImage: "person.2")
                        .font(.caption)
                        .foregroundStyle(.secondary)
                    Label("\(item.taskCount)", systemImage: "checklist")
                        .font(.caption)
                        .foregroundStyle(.secondary)
                }
            }

            Spacer()

            Image(systemName: "chevron.right")
                .font(.caption.weight(.semibold))
                .foregroundStyle(.tertiary)
                .accessibilityHidden(true)
        }
    }
}
