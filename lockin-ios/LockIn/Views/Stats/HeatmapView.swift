import SwiftUI

struct HeatmapView: View {
    let data: [HeatmapDay]

    private let columns = Array(repeating: GridItem(.fixed(14), spacing: 3), count: 7)

    private func colorForLevel(_ level: Int) -> Color {
        switch level {
        case 0: return Color(.systemFill)
        case 1: return Theme.indigo.opacity(0.25)
        case 2: return Theme.purple.opacity(0.4)
        case 3: return Theme.magenta.opacity(0.55)
        case 4: return Theme.pink.opacity(0.7)
        default: return Color(.systemFill)
        }
    }

    private let weekColumns = Array(repeating: GridItem(.fixed(14), spacing: 3), count: 13)

    private var summaryLabel: String {
        let totalPacts = data.reduce(0) { $0 + $1.pactCount }
        let totalSessions = data.reduce(0) { $0 + $1.focusCount }
        let activeDays = data.filter { $0.level > 0 }.count
        return "Activity heatmap: \(activeDays) active days, \(totalPacts) pacts completed, \(totalSessions) focus sessions in the last \(data.count) days"
    }

    var body: some View {
        LazyVGrid(columns: weekColumns, spacing: 3) {
            ForEach(data) { day in
                RoundedRectangle(cornerRadius: 3)
                    .fill(colorForLevel(day.level))
                    .frame(width: 14, height: 14)
                    .accessibilityLabel("\(day.date): \(day.pactCount) pacts, \(day.focusCount) sessions")
            }
        }
        .accessibilityElement(children: .ignore)
        .accessibilityLabel(summaryLabel)
    }
}
