import Foundation
import AuthenticationServices
import Supabase
import GoogleSignIn

final class AuthService {
    private let supabase = SupabaseService.shared.client

    func signInWithApple(idToken: String, nonce: String) async throws {
        try await supabase.auth.signInWithIdToken(
            credentials: .init(
                provider: .apple,
                idToken: idToken,
                nonce: nonce
            )
        )
    }

    func signInWithGoogle() async throws {
        try await supabase.auth.signInWithOAuth(
            provider: .google,
            redirectTo: URL(string: "com.vayungodara.LockIn://login-callback")
        )
    }

    func signOut() async throws {
        try await supabase.auth.signOut()
    }

    var currentSession: Session? {
        get async {
            try? await supabase.auth.session
        }
    }

    var currentUserId: UUID? {
        get async {
            let session = await currentSession
            return session?.user.id
        }
    }

    enum AuthError: LocalizedError {
        case missingToken
        case missingWindow

        var errorDescription: String? {
            switch self {
            case .missingToken: return "Failed to get authentication token"
            case .missingWindow: return "Cannot find app window"
            }
        }
    }
}
