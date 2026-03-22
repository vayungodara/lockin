import SwiftUI

enum Theme {
    // MARK: - Brand Colors
    static let indigo = Color(hex: "5B5EF5")
    static let purple = Color(hex: "7C4DFF")
    static let magenta = Color(hex: "B44AE6")
    static let pink = Color(hex: "E040CB")

    // MARK: - Gradients
    // Restricted to: CTA buttons, timer ring, streak flame
    static let brandGradient = LinearGradient(
        colors: [indigo, purple, magenta, pink],
        startPoint: .topLeading,
        endPoint: .bottomTrailing
    )

    // MARK: - Status Colors
    static let success = Color(hex: "2DDF8E")
    static let danger = Color(hex: "FF6B6B")
    static let warning = Color(hex: "FFB84D")
    static let active = Color(hex: "6EA8FE")

    // MARK: - Typography
    static let heroNumber = Font.system(size: 56, weight: .heavy, design: .rounded)
    static let timerDisplay = Font.system(size: 48, weight: .heavy, design: .monospaced)
    static let rowTitle = Font.body.weight(.medium)
    static let rowSubtitle = Font.subheadline
    static let rowMeta = Font.caption
    static let sectionLabel = Font.caption.weight(.bold)

    // MARK: - Spacing (8pt grid)
    static let space2: CGFloat = 2
    static let space4: CGFloat = 4
    static let space8: CGFloat = 8
    static let space12: CGFloat = 12
    static let space16: CGFloat = 16
    static let space20: CGFloat = 20
    static let space24: CGFloat = 24
    static let space32: CGFloat = 32
    static let space40: CGFloat = 40

    // MARK: - Radius
    static let radiusSm: CGFloat = 8
    static let radiusMd: CGFloat = 12
    static let radiusLg: CGFloat = 16
    static let radiusXl: CGFloat = 20
    static let radiusFull: CGFloat = 9999

    // MARK: - Animation
    static let springDefault = Animation.spring(response: 0.5, dampingFraction: 0.8)
    static let springSnappy = Animation.spring(response: 0.35, dampingFraction: 0.85)
    static let springBouncy = Animation.spring(response: 0.5, dampingFraction: 0.6)
}
