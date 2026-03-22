import SwiftUI

struct StatsView: View {
    var isPreview: Bool = false
    @State private var viewModel = StatsViewModel()

    private var streak: StreakData {
        isPreview ? MockData.streak : viewModel.streak
    }

    private var heatmap: [HeatmapDay] {
        isPreview ? MockData.heatmapData() : viewModel.heatmapData
    }

    private var level: Int {
        isPreview ? 9 : (streak.totalCompleted / 10 + 1)
    }

    var body: some View {
        NavigationStack {
            List {
                // Hero streak
                Section {
                    if viewModel.isLoading && !isPreview {
                        VStack(spacing: 8) {
                            ProgressView()
                                .controlSize(.large)
                        }
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 24)
                        .listRowBackground(Color.clear)
                    } else {
                        VStack(spacing: 8) {
                            Image(systemName: "flame.fill")
                                .font(.largeTitle)
                                .foregroundStyle(Theme.brandGradient)
                                .accessibilityHidden(true)

                            Text("\(streak.currentStreak)")
                                .font(.system(size: 56, weight: .heavy, design: .rounded))
                                .contentTransition(.numericText())

                            Text("Day Streak")
                                .font(.subheadline.weight(.medium))
                                .foregroundStyle(.secondary)
                        }
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 12)
                        .padding(.horizontal)
                        .background(.ultraThinMaterial, in: RoundedRectangle(cornerRadius: 16))
                        .listRowBackground(Color.clear)
                        .accessibilityElement(children: .combine)
                        .accessibilityLabel("\(streak.currentStreak) day streak")
                    }
                }
                .listRowSeparator(.hidden)

                // Secondary stats
                Section {
                    HStack {
                        Label("Longest Streak", systemImage: "trophy.fill")
                            .foregroundStyle(.primary)
                        Spacer()
                        Text("\(streak.longestStreak) days")
                            .foregroundStyle(.secondary)
                    }
                    .accessibilityElement(children: .combine)

                    HStack {
                        Label("Total Completed", systemImage: "checkmark.circle.fill")
                            .foregroundStyle(.primary)
                        Spacer()
                        Text("\(streak.totalCompleted)")
                            .foregroundStyle(.secondary)
                    }
                    .accessibilityElement(children: .combine)

                    HStack {
                        Label("Level", systemImage: "star.fill")
                            .foregroundStyle(.primary)
                        Spacer()
                        Text("\(level)")
                            .foregroundStyle(.secondary)
                    }
                    .accessibilityElement(children: .combine)
                }

                // Heatmap
                Section {
                    HeatmapView(data: heatmap)
                        .padding(.vertical, 4)

                    HStack(spacing: 4) {
                        Text("Less")
                            .font(.caption2)
                            .foregroundStyle(.tertiary)
                        ForEach(0..<5, id: \.self) { level in
                            RoundedRectangle(cornerRadius: 2)
                                .fill(legendColor(level))
                                .frame(width: 12, height: 12)
                        }
                        Text("More")
                            .font(.caption2)
                            .foregroundStyle(.tertiary)
                    }
                    .accessibilityElement(children: .combine)
                    .accessibilityLabel("Activity level legend, from less to more")
                } header: {
                    HStack {
                        Text("Activity")
                        Spacer()
                        Text("Last 90 days")
                            .font(.caption)
                            .foregroundStyle(.secondary)
                    }
                }
            }
            .listStyle(.insetGrouped)
            .navigationTitle("Stats")
            .refreshable {
                if !isPreview { await viewModel.loadStats() }
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
            if !isPreview { await viewModel.loadStats() }
        }
    }

    private func legendColor(_ level: Int) -> Color {
        switch level {
        case 0: return Color(.systemFill)
        case 1: return Theme.indigo.opacity(0.25)
        case 2: return Theme.purple.opacity(0.4)
        case 3: return Theme.magenta.opacity(0.55)
        case 4: return Theme.pink.opacity(0.7)
        default: return Color(.systemFill)
        }
    }
}
