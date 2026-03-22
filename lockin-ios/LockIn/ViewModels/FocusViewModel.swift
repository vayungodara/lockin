import Foundation
import UIKit

enum TimerState {
    case idle, running, paused
}

enum TimerPhase: String {
    case work = "Focus"
    case shortBreak = "Short Break"
    case longBreak = "Long Break"
}

@MainActor @Observable
final class FocusViewModel {
    var timeRemaining: Int
    var state: TimerState = .idle
    var phase: TimerPhase = .work
    var completedPomodoros: Int = 0
    var todaySessions: [FocusSession] = []
    var errorMessage: String?

    var workDuration: Int { UserDefaults.standard.object(forKey: "workDuration") as? Int ?? 25 }
    var breakDuration: Int { UserDefaults.standard.object(forKey: "breakDuration") as? Int ?? 5 }
    var longBreakDuration: Int { UserDefaults.standard.object(forKey: "longBreakDuration") as? Int ?? 15 }

    nonisolated(unsafe) private var timer: Timer?
    private var sessionStartTime: Date?
    private let focusService = FocusService()
    private let authService = AuthService()

    init() {
        let work = UserDefaults.standard.object(forKey: "workDuration") as? Int ?? 25
        timeRemaining = work * 60
    }

    var displayTime: String {
        let minutes = timeRemaining / 60
        let seconds = timeRemaining % 60
        return String(format: "%02d:%02d", minutes, seconds)
    }

    var progress: Double {
        let total: Int
        switch phase {
        case .work: total = workDuration * 60
        case .shortBreak: total = breakDuration * 60
        case .longBreak: total = longBreakDuration * 60
        }
        guard total > 0 else { return 0 }
        return Double(total - timeRemaining) / Double(total)
    }

    var todayTotalMinutes: Int {
        todaySessions.reduce(0) { $0 + $1.durationMinutes }
    }

    func start() {
        state = .running
        if sessionStartTime == nil {
            sessionStartTime = Date()
        }
        let t = Timer(timeInterval: 1, repeats: true) { [weak self] _ in
            Task { @MainActor in self?.tick() }
        }
        RunLoop.main.add(t, forMode: .common)
        timer = t
    }

    deinit {
        timer?.invalidate()
    }

    func pause() {
        state = .paused
        timer?.invalidate()
        timer = nil
    }

    func reset() {
        timer?.invalidate()
        timer = nil
        state = .idle
        sessionStartTime = nil
        phase = .work
        timeRemaining = workDuration * 60
    }

    func skip() {
        timer?.invalidate()
        timer = nil
        advancePhase()
    }

    func reloadDurations() {
        if state == .idle {
            timeRemaining = workDuration * 60
        }
    }

    private var currentPhaseDuration: Int {
        switch phase {
        case .work: return workDuration * 60
        case .shortBreak: return breakDuration * 60
        case .longBreak: return longBreakDuration * 60
        }
    }

    private func tick() {
        if timeRemaining > 0 {
            timeRemaining -= 1
        } else {
            timer?.invalidate()
            timer = nil

            if phase == .work {
                Task { await saveSession() }
                completedPomodoros += 1
                NotificationService.shared.scheduleTimerComplete()
                UINotificationFeedbackGenerator().notificationOccurred(.success)
            }

            advancePhase()
        }
    }

    private func advancePhase() {
        state = .idle
        sessionStartTime = nil

        switch phase {
        case .work:
            if completedPomodoros % 4 == 0 && completedPomodoros > 0 {
                phase = .longBreak
                timeRemaining = longBreakDuration * 60
            } else {
                phase = .shortBreak
                timeRemaining = breakDuration * 60
            }
        case .shortBreak, .longBreak:
            phase = .work
            timeRemaining = workDuration * 60
        }
    }

    private func saveSession() async {
        guard let userId = await authService.currentUserId,
              let startTime = sessionStartTime else { return }

        let endTime = Date()
        do {
            try await focusService.logSession(
                userId: userId,
                durationMinutes: workDuration,
                startedAt: startTime,
                endedAt: endTime
            )
            clearPendingSession()
            todaySessions = try await focusService.fetchTodaySessions(userId: userId)
            errorMessage = nil
        } catch {
            // Persist session locally so it can be retried
            savePendingSession(userId: userId, duration: workDuration, start: startTime, end: endTime)
            errorMessage = error.localizedDescription
        }
    }

    // MARK: - Pending session recovery

    private static let pendingSessionKey = "pendingFocusSession"

    private func savePendingSession(userId: UUID, duration: Int, start: Date, end: Date) {
        let data: [String: Any] = [
            "userId": userId.uuidString,
            "duration": duration,
            "start": start.timeIntervalSince1970,
            "end": end.timeIntervalSince1970
        ]
        UserDefaults.standard.set(data, forKey: Self.pendingSessionKey)
    }

    private func clearPendingSession() {
        UserDefaults.standard.removeObject(forKey: Self.pendingSessionKey)
    }

    func retryPendingSession() async {
        guard let data = UserDefaults.standard.dictionary(forKey: Self.pendingSessionKey),
              let userIdString = data["userId"] as? String,
              let userId = UUID(uuidString: userIdString),
              let duration = data["duration"] as? Int,
              let startInterval = data["start"] as? TimeInterval,
              let endInterval = data["end"] as? TimeInterval else { return }

        do {
            try await focusService.logSession(
                userId: userId,
                durationMinutes: duration,
                startedAt: Date(timeIntervalSince1970: startInterval),
                endedAt: Date(timeIntervalSince1970: endInterval)
            )
            clearPendingSession()
        } catch {
            // Will retry on next launch
        }
    }

    func loadTodaySessions() async {
        guard let userId = await authService.currentUserId else { return }
        do {
            todaySessions = try await focusService.fetchTodaySessions(userId: userId)
        } catch {
            errorMessage = error.localizedDescription
        }
    }
}
