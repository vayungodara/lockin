import Foundation

enum PactFilter: String, CaseIterable {
    case all = "All"
    case active = "Active"
    case completed = "Completed"
    case missed = "Missed"
}

@MainActor @Observable
final class PactsViewModel {
    var pacts: [Pact] = []
    var filter: PactFilter = .all
    var isLoading = false
    var errorMessage: String?
    var showCreateSheet = false

    private let pactService = PactService()
    private let authService = AuthService()

    var filteredPacts: [Pact] {
        switch filter {
        case .all: return pacts
        case .active: return pacts.filter { $0.status == .active }
        case .completed: return pacts.filter { $0.status == .completed }
        case .missed: return pacts.filter { $0.status == .missed }
        }
    }

    func loadPacts() async {
        guard let userId = await authService.currentUserId else { return }
        isLoading = true
        do {
            pacts = try await pactService.fetchPacts(userId: userId)
            errorMessage = nil
        } catch {
            errorMessage = error.localizedDescription
        }
        isLoading = false
    }

    func createPact(title: String, description: String?, deadline: Date, isRecurring: Bool, recurrenceType: Pact.RecurrenceType?) async {
        guard let userId = await authService.currentUserId else { return }
        do {
            let pact = try await pactService.createPact(
                userId: userId, title: title, description: description,
                deadline: deadline, isRecurring: isRecurring, recurrenceType: recurrenceType
            )
            pacts.insert(pact, at: 0)
            pacts.sort { $0.deadline < $1.deadline }
            try? await pactService.logActivity(userId: userId, action: "pact_created", metadata: ["pact_description": title])
            NotificationService.shared.schedulePactReminder(pactId: pact.id, title: title, deadline: deadline)
            errorMessage = nil
        } catch {
            errorMessage = error.localizedDescription
        }
    }

    func completePact(_ pact: Pact) async {
        guard let userId = await authService.currentUserId else { return }
        do {
            try await pactService.completePact(pactId: pact.id)
            if let index = pacts.firstIndex(where: { $0.id == pact.id }) {
                pacts[index].status = .completed
                pacts[index].completedAt = Date()
            }
            try? await pactService.logActivity(userId: userId, action: "pact_completed", metadata: ["pact_description": pact.title])
            NotificationService.shared.cancelPactReminder(pactId: pact.id)
        } catch {
            errorMessage = error.localizedDescription
        }
    }

    func missPact(_ pact: Pact) async {
        guard let userId = await authService.currentUserId else { return }
        do {
            try await pactService.missPact(pactId: pact.id)
            if let index = pacts.firstIndex(where: { $0.id == pact.id }) {
                pacts[index].status = .missed
            }
            try? await pactService.logActivity(userId: userId, action: "pact_missed", metadata: ["pact_description": pact.title])
            NotificationService.shared.cancelPactReminder(pactId: pact.id)
        } catch {
            errorMessage = error.localizedDescription
        }
    }

    func deletePact(_ pact: Pact) async {
        do {
            try await pactService.deletePact(pactId: pact.id)
            pacts.removeAll { $0.id == pact.id }
            NotificationService.shared.cancelPactReminder(pactId: pact.id)
        } catch {
            errorMessage = error.localizedDescription
        }
    }
}
