import Foundation
import UserNotifications

final class NotificationService {
    static let shared = NotificationService()

    @discardableResult
    func requestPermission() async -> Bool {
        do {
            return try await UNUserNotificationCenter.current()
                .requestAuthorization(options: [.alert, .sound, .badge])
        } catch {
            return false
        }
    }

    func schedulePactReminder(pactId: UUID, title: String, deadline: Date) {
        let reminderDate = deadline.addingTimeInterval(-3600)
        guard reminderDate > Date() else { return }

        let content = UNMutableNotificationContent()
        content.title = "Pact Deadline Approaching"
        content.body = "\"\(title)\" is due in 1 hour"
        content.sound = .default

        let components = Calendar.current.dateComponents(
            [.year, .month, .day, .hour, .minute],
            from: reminderDate
        )
        let trigger = UNCalendarNotificationTrigger(dateMatching: components, repeats: false)

        let request = UNNotificationRequest(
            identifier: "pact-\(pactId.uuidString)",
            content: content,
            trigger: trigger
        )

        UNUserNotificationCenter.current().add(request)
    }

    func cancelPactReminder(pactId: UUID) {
        UNUserNotificationCenter.current()
            .removePendingNotificationRequests(withIdentifiers: ["pact-\(pactId.uuidString)"])
    }

    func scheduleTimerComplete() {
        let content = UNMutableNotificationContent()
        content.title = "Focus Session Complete"
        content.body = "Great work! Time for a break."
        content.sound = .default

        let trigger = UNTimeIntervalNotificationTrigger(timeInterval: 1, repeats: false)
        let request = UNNotificationRequest(identifier: "timer-complete", content: content, trigger: trigger)

        UNUserNotificationCenter.current().add(request)
    }
}
