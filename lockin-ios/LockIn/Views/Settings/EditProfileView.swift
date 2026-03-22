import SwiftUI

struct EditProfileView: View {
    @Binding var profile: Profile?
    @State private var fullName: String = ""
    @State private var isSaving = false
    @State private var errorMessage: String?
    @Environment(\.dismiss) private var dismiss

    private let supabase = SupabaseService.shared.client

    var body: some View {
        Form {
            Section("Name") {
                TextField("Full Name", text: $fullName)
            }
        }
        .scrollDismissesKeyboard(.interactively)
        .navigationTitle("Edit Profile")
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            ToolbarItem(placement: .confirmationAction) {
                Button("Save") {
                    Task { await save() }
                }
                .disabled(fullName.trimmingCharacters(in: .whitespaces).isEmpty || isSaving)
            }
        }
        .alert("Error", isPresented: Binding(
            get: { errorMessage != nil },
            set: { if !$0 { errorMessage = nil } }
        )) {
            Button("OK") {}
        } message: {
            Text(errorMessage ?? "")
        }
        .onAppear {
            fullName = profile?.fullName ?? ""
        }
    }

    private func save() async {
        guard let userId = await AuthService().currentUserId else { return }
        isSaving = true
        do {
            try await supabase
                .from("profiles")
                .update(["full_name": fullName.trimmingCharacters(in: .whitespaces)])
                .eq("id", value: userId.uuidString)
                .execute()

            profile?.fullName = fullName.trimmingCharacters(in: .whitespaces)
            dismiss()
        } catch {
            errorMessage = error.localizedDescription
        }
        isSaving = false
    }
}
