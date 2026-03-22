import SwiftUI
import AuthenticationServices

struct LoginView: View {
    let authViewModel: AuthViewModel
    @State private var showContent = false

    var body: some View {
        ZStack {
            Color(.systemBackground)
                .ignoresSafeArea()

            // Gradient orbs
            Canvas { context, size in
                context.fill(
                    Path(ellipseIn: CGRect(x: -60, y: size.height * 0.15, width: 280, height: 280)),
                    with: .color(Theme.indigo.opacity(0.12))
                )
                context.fill(
                    Path(ellipseIn: CGRect(x: size.width - 100, y: size.height * 0.55, width: 220, height: 220)),
                    with: .color(Theme.magenta.opacity(0.08))
                )
                context.fill(
                    Path(ellipseIn: CGRect(x: size.width * 0.3, y: -40, width: 200, height: 200)),
                    with: .color(Theme.purple.opacity(0.06))
                )
            }
            .blur(radius: 80)
            .ignoresSafeArea()

            VStack(spacing: 0) {
                Spacer()

                // Lock icon
                Image("LockIcon")
                    .resizable()
                    .scaledToFit()
                    .frame(height: 80)
                    .padding(.bottom, 12)
                    .opacity(showContent ? 1 : 0)
                    .offset(y: showContent ? 0 : 20)
                    .accessibilityHidden(true)

                // Text logo
                Image("LockInLogo")
                    .resizable()
                    .scaledToFit()
                    .frame(height: 36)
                    .padding(.bottom, 20)
                    .opacity(showContent ? 1 : 0)
                    .offset(y: showContent ? 0 : 20)
                    .accessibilityLabel("LockIn")

                Text("Stop procrastinating.\nStart delivering.")
                    .font(.body.weight(.medium))
                    .foregroundStyle(.secondary)
                    .multilineTextAlignment(.center)
                    .lineSpacing(4)
                    .opacity(showContent ? 1 : 0)

                Spacer()
                Spacer()

                // Buttons
                VStack(spacing: 14) {
                    SignInWithAppleButton(.signIn) { request in
                        let hashedNonce = authViewModel.prepareNonce()
                        request.requestedScopes = [.fullName, .email]
                        request.nonce = hashedNonce
                    } onCompletion: { result in
                        Task {
                            await authViewModel.handleAppleSignIn(result: result)
                        }
                    }
                    .signInWithAppleButtonStyle(.white)
                    .frame(height: 52)
                    .clipShape(RoundedRectangle(cornerRadius: 14))

                    Button {
                        Task {
                            await authViewModel.handleGoogleSignIn()
                        }
                    } label: {
                        HStack(spacing: 8) {
                            Image(systemName: "g.circle.fill")
                                .font(.title2)
                                .accessibilityHidden(true)
                            Text("Sign in with Google")
                                .font(.body.weight(.semibold))
                        }
                        .frame(maxWidth: .infinity)
                        .frame(height: 52)
                        .background(.fill.tertiary)
                        .foregroundStyle(.primary)
                        .clipShape(RoundedRectangle(cornerRadius: 14))
                    }
                }
                .padding(.horizontal, 28)
                .opacity(showContent ? 1 : 0)
                .offset(y: showContent ? 0 : 30)

                if let error = authViewModel.errorMessage {
                    Text(error)
                        .font(.caption)
                        .foregroundStyle(Theme.danger)
                        .padding(.top, 12)
                        .padding(.horizontal, 28)
                        .onAppear {
                            UIAccessibility.post(notification: .announcement, argument: error)
                        }
                }

                #if DEBUG
                Button {
                    authViewModel.skipAuth()
                } label: {
                    Text("Skip for now")
                        .font(.footnote.weight(.medium))
                        .foregroundStyle(.tertiary)
                }
                .frame(minHeight: 44)
                .padding(.top, 16)
                .padding(.bottom, 50)
                .opacity(showContent ? 1 : 0)
                #else
                Spacer()
                    .frame(height: 50)
                #endif
            }
        }
        .onAppear {
            withAnimation(.spring(response: 0.7, dampingFraction: 0.75).delay(0.2)) {
                showContent = true
            }
        }
    }
}
