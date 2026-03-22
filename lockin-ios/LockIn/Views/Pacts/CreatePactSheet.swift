import SwiftUI

struct CreatePactSheet: View {
    @Environment(\.dismiss) private var dismiss
    let onCreate: (String, String?, Date, Bool, Pact.RecurrenceType?) async -> Void

    @State private var title = ""
    @State private var description = ""
    @State private var deadline = Date().addingTimeInterval(86400)
    @State private var isRecurring = false
    @State private var recurrenceType: Pact.RecurrenceType = .daily
    @State private var isSubmitting = false

    var body: some View {
        NavigationStack {
            Form {
                Section("What's the pact?") {
                    TextField("Title", text: $title)
                    TextField("Description (optional)", text: $description, axis: .vertical)
                        .lineLimit(3...6)
                }

                Section("Deadline") {
                    DatePicker("Due", selection: $deadline, in: Date()..., displayedComponents: [.date, .hourAndMinute])
                }

                Section("Recurring") {
                    Toggle("Repeat this pact", isOn: $isRecurring)

                    if isRecurring {
                        Picker("Frequency", selection: $recurrenceType) {
                            Text("Daily").tag(Pact.RecurrenceType.daily)
                            Text("Weekly").tag(Pact.RecurrenceType.weekly)
                            Text("Weekdays").tag(Pact.RecurrenceType.weekdays)
                            Text("Monthly").tag(Pact.RecurrenceType.monthly)
                        }
                    }
                }
            }
            .scrollDismissesKeyboard(.interactively)
            .navigationTitle("New Pact")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") { dismiss() }
                }
                ToolbarItem(placement: .confirmationAction) {
                    Button("Lock It In") {
                        isSubmitting = true
                        Task {
                            await onCreate(
                                title.trimmingCharacters(in: .whitespaces),
                                description.isEmpty ? nil : description.trimmingCharacters(in: .whitespaces),
                                deadline,
                                isRecurring,
                                isRecurring ? recurrenceType : nil
                            )
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
