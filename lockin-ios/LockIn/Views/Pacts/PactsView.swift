import SwiftUI

struct PactsView: View {
    var isPreview: Bool = false
    @State private var viewModel = PactsViewModel()
    @State private var pactToMiss: Pact?
    @State private var completeFeedback = false
    @State private var missFeedback = false

    private var displayPacts: [Pact] {
        if isPreview {
            switch viewModel.filter {
            case .all: return MockData.pacts
            case .active: return MockData.pacts.filter { $0.status == .active }
            case .completed: return MockData.pacts.filter { $0.status == .completed }
            case .missed: return MockData.pacts.filter { $0.status == .missed }
            }
        }
        return viewModel.filteredPacts
    }

    var body: some View {
        NavigationStack {
            List {
                Section {
                    Picker("Filter", selection: $viewModel.filter) {
                        ForEach(PactFilter.allCases, id: \.self) { filter in
                            Text(filter.rawValue).tag(filter)
                        }
                    }
                    .pickerStyle(.segmented)
                    .listRowInsets(EdgeInsets())
                    .listRowBackground(Color.clear)
                }
                .listSectionSeparator(.hidden)

                if viewModel.isLoading && !isPreview {
                    // Skeleton placeholder rows while loading
                    ForEach(0..<5, id: \.self) { _ in
                        HStack(spacing: 12) {
                            Circle()
                                .fill(.quaternary)
                                .frame(width: 24, height: 24)
                            VStack(alignment: .leading, spacing: 6) {
                                RoundedRectangle(cornerRadius: 4)
                                    .fill(.quaternary)
                                    .frame(width: 160, height: 14)
                                RoundedRectangle(cornerRadius: 4)
                                    .fill(.quaternary)
                                    .frame(width: 100, height: 10)
                            }
                            Spacer()
                        }
                        .redacted(reason: .placeholder)
                        .shimmering()
                        .listRowSeparator(.hidden)
                    }
                } else if displayPacts.isEmpty {
                    ContentUnavailableView {
                        Label {
                            Text("No Pacts")
                        } icon: {
                            Image(systemName: "checkmark.circle")
                                .symbolEffect(.pulse, options: .repeating.speed(0.3))
                        }
                    } description: {
                        Text("Tap + to create your first pact and start building momentum")
                    }
                    .listRowBackground(Color.clear)
                    .listRowSeparator(.hidden)
                } else {
                    ForEach(displayPacts) { pact in
                        pactRow(pact)
                            .swipeActions(edge: .leading, allowsFullSwipe: true) {
                                if pact.status == .active {
                                    Button {
                                        completeFeedback = true
                                        if !isPreview {
                                            Task { await viewModel.completePact(pact) }
                                        }
                                    } label: {
                                        Label("Complete", systemImage: "checkmark")
                                    }
                                    .tint(Theme.success)
                                }
                            }
                            .swipeActions(edge: .trailing, allowsFullSwipe: false) {
                                if pact.status == .active && !isPreview {
                                    Button {
                                        pactToMiss = pact
                                    } label: {
                                        Label("Miss", systemImage: "xmark")
                                    }
                                    .tint(Theme.danger)
                                }
                                if !isPreview {
                                    Button(role: .destructive) {
                                        Task { await viewModel.deletePact(pact) }
                                    } label: {
                                        Label("Delete", systemImage: "trash")
                                    }
                                }
                            }
                    }
                }
            }
            .listStyle(.insetGrouped)
            .animation(.spring(response: 0.35, dampingFraction: 0.85), value: viewModel.filter)
            .sensoryFeedback(.impact(flexibility: .solid, intensity: 0.6), trigger: completeFeedback)
            .sensoryFeedback(.impact(flexibility: .rigid, intensity: 0.5), trigger: missFeedback)
            .navigationTitle("Pacts")
            .toolbar {
                ToolbarItem(placement: .primaryAction) {
                    Button {
                        viewModel.showCreateSheet = true
                    } label: {
                        Label("Create Pact", systemImage: "plus")
                    }
                }
            }
            .refreshable {
                if !isPreview { await viewModel.loadPacts() }
            }
            .sheet(isPresented: $viewModel.showCreateSheet) {
                CreatePactSheet { title, description, deadline, isRecurring, recurrenceType in
                    await viewModel.createPact(
                        title: title, description: description,
                        deadline: deadline, isRecurring: isRecurring,
                        recurrenceType: recurrenceType
                    )
                }
                .presentationDetents([.large])
            }
            .confirmationDialog(
                "Mark as missed?",
                isPresented: Binding(
                    get: { pactToMiss != nil },
                    set: { if !$0 { pactToMiss = nil } }
                ),
                presenting: pactToMiss
            ) { pact in
                Button("Miss Pact", role: .destructive) {
                    missFeedback = true
                    Task { await viewModel.missPact(pact) }
                }
                Button("Cancel", role: .cancel) {}
            } message: { pact in
                Text("Are you sure you want to mark \"\(pact.title)\" as missed?")
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
            if !isPreview { await viewModel.loadPacts() }
        }
    }

    @ViewBuilder
    private func pactRow(_ pact: Pact) -> some View {
        HStack(spacing: 12) {
            // Status icon
            statusIcon(for: pact)

            // Content
            VStack(alignment: .leading, spacing: 2) {
                Text(pact.title)
                    .font(.body)
                    .foregroundStyle(pact.status == .completed ? .secondary : .primary)
                    .strikethrough(pact.status == .completed)

                if let description = pact.description, !description.isEmpty {
                    Text(description)
                        .font(.subheadline)
                        .foregroundStyle(.secondary)
                        .lineLimit(1)
                }

                HStack(spacing: 8) {
                    if pact.isRecurring == true, let type = pact.recurrenceType {
                        Label(type.rawValue.capitalized, systemImage: "repeat")
                            .font(.caption)
                            .foregroundStyle(.secondary)
                    }

                    Label(deadlineText(for: pact), systemImage: "clock")
                        .font(.caption)
                        .foregroundStyle(pact.deadline < Date() && pact.status == .active ? Theme.danger : .secondary)
                }
            }

            Spacer()
        }
        .opacity(pact.status == .completed ? 0.7 : 1)
        .accessibilityElement(children: .combine)
        .accessibilityLabel(accessibilityLabel(for: pact))
        .accessibilityHint(pact.status == .active ? "Swipe right to complete, swipe left for more options" : "")
    }

    @ViewBuilder
    private func statusIcon(for pact: Pact) -> some View {
        switch pact.status {
        case .active:
            Image(systemName: "circle")
                .font(.title3)
                .foregroundStyle(pact.deadline < Date() ? Theme.danger : Theme.indigo)
                .accessibilityLabel("Active")
        case .completed:
            Image(systemName: "checkmark.circle.fill")
                .font(.title3)
                .foregroundStyle(Theme.success)
                .accessibilityLabel("Completed")
        case .missed:
            Image(systemName: "xmark.circle.fill")
                .font(.title3)
                .foregroundStyle(Theme.danger)
                .accessibilityLabel("Missed")
        case .unknown:
            Image(systemName: "questionmark.circle")
                .font(.title3)
                .foregroundStyle(.secondary)
                .accessibilityLabel("Unknown")
        }
    }

    private func accessibilityLabel(for pact: Pact) -> String {
        var parts = [pact.title]
        switch pact.status {
        case .active: parts.append("Active")
        case .completed: parts.append("Completed")
        case .missed: parts.append("Missed")
        case .unknown: parts.append("Unknown status")
        }
        parts.append(deadlineText(for: pact))
        if pact.isRecurring == true, let type = pact.recurrenceType {
            parts.append("Repeats \(type.rawValue)")
        }
        return parts.joined(separator: ", ")
    }

    private func deadlineText(for pact: Pact) -> String {
        let calendar = Calendar.current
        guard pact.status == .active else {
            return pact.status == .completed ? "Completed" : "Missed"
        }
        if calendar.isDateInToday(pact.deadline) {
            let formatter = DateFormatter()
            formatter.dateFormat = "h:mm a"
            return "Due today at \(formatter.string(from: pact.deadline))"
        } else if calendar.isDateInTomorrow(pact.deadline) {
            return "Due tomorrow"
        } else if pact.deadline < Date() {
            return "Overdue"
        } else {
            let days = calendar.dateComponents([.day], from: Date(), to: pact.deadline).day ?? 0
            return "Due in \(days) days"
        }
    }
}

// MARK: - Shimmer Effect for Skeleton Loading

private struct ShimmerModifier: ViewModifier {
    @State private var phase: CGFloat = 0

    func body(content: Content) -> some View {
        content
            .overlay(
                LinearGradient(
                    colors: [.clear, .white.opacity(0.12), .clear],
                    startPoint: .leading,
                    endPoint: .trailing
                )
                .offset(x: phase)
                .onAppear {
                    withAnimation(.linear(duration: 1.2).repeatForever(autoreverses: false)) {
                        phase = 200
                    }
                }
            )
            .clipped()
    }
}

private extension View {
    func shimmering() -> some View {
        modifier(ShimmerModifier())
    }
}
