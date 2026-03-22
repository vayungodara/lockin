import Foundation
import AuthenticationServices
import CryptoKit
import UIKit

@MainActor @Observable
final class AuthViewModel {
    var isAuthenticated = false
    var isLoading = true
    var errorMessage: String?
    var isRealAuth = false

    private let authService = AuthService()
    private var currentNonce: String?

    func checkSession() async {
        isLoading = true
        let session = await authService.currentSession
        isAuthenticated = session != nil
        isLoading = false
    }

    func handleAppleSignIn(result: Result<ASAuthorization, Error>) async {
        switch result {
        case .success(let authorization):
            guard let appleCredential = authorization.credential as? ASAuthorizationAppleIDCredential,
                  let identityTokenData = appleCredential.identityToken,
                  let idToken = String(data: identityTokenData, encoding: .utf8),
                  let nonce = currentNonce else {
                errorMessage = "Failed to get Apple credentials"
                return
            }

            do {
                try await authService.signInWithApple(idToken: idToken, nonce: nonce)
                isAuthenticated = true
                isRealAuth = true
                errorMessage = nil
            } catch {
                errorMessage = error.localizedDescription
            }

        case .failure(let error):
            if (error as NSError).code != ASAuthorizationError.canceled.rawValue {
                errorMessage = error.localizedDescription
            }
        }
    }

    func prepareNonce() -> String {
        let nonce = randomNonceString()
        currentNonce = nonce
        return sha256(nonce)
    }

    func handleGoogleSignIn() async {
        do {
            try await authService.signInWithGoogle()
            isAuthenticated = true
            isRealAuth = true
            errorMessage = nil
        } catch {
            errorMessage = error.localizedDescription
        }
    }

    #if DEBUG
    func skipAuth() {
        isAuthenticated = true
        errorMessage = nil
    }
    #endif

    func signOut() async {
        do {
            try await authService.signOut()
            isAuthenticated = false
        } catch {
            errorMessage = error.localizedDescription
        }
    }

    // MARK: - Nonce helpers

    private func randomNonceString(length: Int = 32) -> String {
        precondition(length > 0)
        var randomBytes = [UInt8](repeating: 0, count: length)
        let errorCode = SecRandomCopyBytes(kSecRandomDefault, randomBytes.count, &randomBytes)
        precondition(errorCode == errSecSuccess)
        let charset: [Character] = Array("0123456789ABCDEFGHIJKLMNOPQRSTUVXYZabcdefghijklmnopqrstuvwxyz-._")
        return String(randomBytes.map { charset[Int($0) % charset.count] })
    }

    private func sha256(_ input: String) -> String {
        let data = Data(input.utf8)
        let hash = SHA256.hash(data: data)
        return hash.compactMap { String(format: "%02x", $0) }.joined()
    }
}
