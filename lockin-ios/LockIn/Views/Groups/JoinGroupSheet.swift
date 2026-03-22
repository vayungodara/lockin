import SwiftUI

struct JoinGroupSheet: View {
    let onJoin: (String) async -> Void
    @Environment(\.dismiss) private var dismiss
    @State private var inviteCode = ""
    @State private var isSubmitting = false

    var body: some View {
        NavigationStack {
            Form {
                Section {
                    TextField("ABC123", text: $inviteCode)
                        .font(.title2.bold().monospaced())
                        .multilineTextAlignment(.center)
                        .textInputAutocapitalization(.characters)
                        .accessibilityLabel("Invite code")
                        .onChange(of: inviteCode) { _, newValue in
                            inviteCode = String(newValue.prefix(6)).uppercased()
                        }
                } header: {
                    Text("Enter invite code")
                } footer: {
                    Text("Ask your group admin for the 6-character code")
                }
            }
            .scrollDismissesKeyboard(.interactively)
            .navigationTitle("Join Group")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") { dismiss() }
                }
                ToolbarItem(placement: .confirmationAction) {
                    Button("Join") {
                        isSubmitting = true
                        Task {
                            await onJoin(inviteCode)
                            isSubmitting = false
                            dismiss()
                        }
                    }
                    .disabled(inviteCode.count != 6 || isSubmitting)
                }
            }
        }
    }
}
