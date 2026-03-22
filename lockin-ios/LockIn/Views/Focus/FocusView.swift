import SwiftUI

struct FocusView: View {
    @State private var viewModel = FocusViewModel()
    @State private var showTimerSettings = false
    @State private var isPulsing = false
    @State private var playPauseTrigger = false
    @State private var resetTrigger = false
    @State private var skipTrigger = false
    @Environment(\.accessibilityReduceMotion) var reduceMotion

    private var ringColor: Color {
        switch viewModel.phase {
        case .work: return Theme.indigo
        case .shortBreak: return Theme.success
        case .longBreak: return Theme.purple
        }
    }

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: 24) {
                    // Phase label
                    Text(viewModel.phase.rawValue)
                        .textCase(.uppercase)
                        .font(.caption.weight(.bold))
                        .tracking(2)
                        .foregroundStyle(ringColor)
                        .padding(.top, 20)

                    // Timer ring
                    ZStack {
                        Circle()
                            .fill(ringColor.opacity(viewModel.state == .running ? 0.12 : 0.06))
                            .frame(width: 240, height: 240)
                            .blur(radius: 50)
                            .scaleEffect(isPulsing ? 1.08 : 1.0)
                            .animation(
                                viewModel.state == .running && !reduceMotion
                                    ? .easeInOut(duration: 2).repeatForever(autoreverses: true)
                                    : .default,
                                value: isPulsing
                            )
                            .onChange(of: viewModel.state) { _, newState in
                                isPulsing = newState == .running
                            }

                        Circle()
                            .stroke(Color(.tertiarySystemFill), lineWidth: 6)
                            .frame(width: 200, height: 200)

                        Circle()
                            .trim(from: 0, to: viewModel.progress)
                            .stroke(
                                AngularGradient(
                                    colors: [Theme.indigo, Theme.purple, Theme.magenta, Theme.pink],
                                    center: .center,
                                    startAngle: .degrees(-90),
                                    endAngle: .degrees(270)
                                ),
                                style: StrokeStyle(lineWidth: 6, lineCap: .round)
                            )
                            .frame(width: 200, height: 200)
                            .rotationEffect(.degrees(-90))
                            .animation(reduceMotion ? nil : .linear(duration: 1), value: viewModel.progress)
                            .shadow(color: ringColor.opacity(0.4), radius: 12)

                        VStack(spacing: 6) {
                            Text(viewModel.displayTime)
                                .font(.system(size: 48, weight: .heavy, design: .monospaced))
                                .foregroundStyle(.primary)
                                .contentTransition(.numericText())

                            if viewModel.completedPomodoros > 0 {
                                HStack(spacing: 4) {
                                    ForEach(0..<min(viewModel.completedPomodoros, 4), id: \.self) { _ in
                                        Circle()
                                            .fill(Theme.brandGradient)
                                            .frame(width: 6, height: 6)
                                    }
                                }
                                .accessibilityHidden(true)
                            }
                        }
                    }
                    .padding(.vertical, 8)
                    .accessibilityElement(children: .ignore)
                    .accessibilityLabel("\(viewModel.phase.rawValue): \(viewModel.displayTime) remaining")

                    // Controls
                    HStack(spacing: 36) {
                        Button {
                            resetTrigger.toggle()
                            viewModel.reset()
                        } label: {
                            Image(systemName: "arrow.counterclockwise")
                                .font(.body.weight(.medium))
                                .frame(width: 48, height: 48)
                                .foregroundStyle(.secondary)
                                .background(.fill.tertiary)
                                .clipShape(Circle())
                        }
                        .accessibilityLabel("Reset timer")
                        .sensoryFeedback(.impact(weight: .medium), trigger: resetTrigger)

                        Button {
                            playPauseTrigger.toggle()
                            if viewModel.state == .running {
                                viewModel.pause()
                            } else {
                                viewModel.start()
                            }
                        } label: {
                            Image(systemName: viewModel.state == .running ? "pause.fill" : "play.fill")
                                .contentTransition(.symbolEffect(.replace))
                                .font(.title2.weight(.semibold))
                                .frame(width: 64, height: 64)
                                .background(Theme.brandGradient)
                                .foregroundStyle(.white)
                                .clipShape(Circle())
                                .shadow(color: Theme.indigo.opacity(0.4), radius: 20)
                        }
                        .accessibilityLabel(viewModel.state == .running ? "Pause" : "Start focus session")
                        .sensoryFeedback(.impact(weight: .medium), trigger: playPauseTrigger)

                        Button {
                            skipTrigger.toggle()
                            viewModel.skip()
                        } label: {
                            Image(systemName: "forward.fill")
                                .font(.body.weight(.medium))
                                .frame(width: 48, height: 48)
                                .foregroundStyle(.secondary)
                                .background(.fill.tertiary)
                                .clipShape(Circle())
                        }
                        .accessibilityLabel("Skip to next phase")
                        .sensoryFeedback(.impact(weight: .medium), trigger: skipTrigger)
                    }
                    .padding(.top, 8)

                    // Today's stats
                    if viewModel.completedPomodoros > 0 || !viewModel.todaySessions.isEmpty {
                        HStack(spacing: 0) {
                            VStack(spacing: 4) {
                                Text("\(viewModel.completedPomodoros)")
                                    .font(.title2.bold())
                                Text("Sessions")
                                    .font(.caption2.weight(.medium))
                                    .foregroundStyle(.secondary)
                            }
                            .frame(maxWidth: .infinity)
                            .accessibilityElement(children: .combine)

                            Divider().frame(height: 32)

                            VStack(spacing: 4) {
                                Text("\(viewModel.todayTotalMinutes)")
                                    .font(.title2.bold())
                                Text("Minutes")
                                    .font(.caption2.weight(.medium))
                                    .foregroundStyle(.secondary)
                            }
                            .frame(maxWidth: .infinity)
                            .accessibilityElement(children: .combine)
                        }
                        .padding(.top, 16)
                        .padding(.horizontal, 20)
                    } else {
                        VStack(spacing: 8) {
                            Text("No sessions yet today")
                                .font(.subheadline)
                                .foregroundStyle(.secondary)
                            Text("Start a focus session to track your progress")
                                .font(.caption)
                                .foregroundStyle(.tertiary)
                        }
                        .padding(.top, 24)
                    }
                }
                .frame(maxWidth: .infinity)
            }
            .scrollBounceBehavior(.basedOnSize)
            .toolbar {
                ToolbarItem(placement: .primaryAction) {
                    Button {
                        showTimerSettings = true
                    } label: {
                        Image(systemName: "gearshape")
                    }
                }
            }
            .navigationTitle("Focus")
            .sheet(isPresented: $showTimerSettings, onDismiss: {
                viewModel.reloadDurations()
            }) {
                TimerSettingsView()
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
            await viewModel.retryPendingSession()
            await viewModel.loadTodaySessions()
        }
    }
}
