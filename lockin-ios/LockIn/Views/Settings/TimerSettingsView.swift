import SwiftUI

struct TimerSettingsView: View {
    @AppStorage("workDuration") private var workDuration = 25
    @AppStorage("breakDuration") private var breakDuration = 5
    @AppStorage("longBreakDuration") private var longBreakDuration = 15
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        NavigationStack {
            Form {
                Section("Focus") {
                    Stepper("\(workDuration) minutes", value: $workDuration, in: 5...120, step: 5)
                }

                Section("Short Break") {
                    Stepper("\(breakDuration) minutes", value: $breakDuration, in: 1...30, step: 1)
                }

                Section("Long Break") {
                    Stepper("\(longBreakDuration) minutes", value: $longBreakDuration, in: 5...60, step: 5)
                }

                Section {
                    Button("Reset to Defaults") {
                        workDuration = 25
                        breakDuration = 5
                        longBreakDuration = 15
                    }
                    .foregroundStyle(.secondary)
                }
            }
            .navigationTitle("Timer Settings")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .confirmationAction) {
                    Button("Done") { dismiss() }
                }
            }
        }
    }
}
