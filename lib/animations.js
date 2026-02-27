'use client';

// === EASING CURVES ===
const easeOutQuint = [0.22, 1, 0.36, 1];
const easeOutExpo = [0.16, 1, 0.3, 1];
const easeOutBack = [0.34, 1.56, 0.64, 1];
const easeInOutCubic = [0.65, 0, 0.35, 1];

// === SPRING CONFIGS ===
export const smoothSpring = {
  type: "spring",
  stiffness: 150,
  damping: 20,
  mass: 1,
};

const snappySpring = {
  type: "spring",
  stiffness: 400,
  damping: 30,
};

const gentleSpring = {
  type: "spring",
  stiffness: 120,
  damping: 18,
};

const bouncySpring = {
  type: "spring",
  stiffness: 500,
  damping: 15,
  mass: 0.8,
};

// =============================================
// TIER 1: AMBIENT (always running, barely noticed)
// =============================================

export const ambientFloat = {
  animate: {
    y: [0, -6, 0],
    transition: { duration: 3, repeat: Infinity, ease: "easeInOut" },
  },
};

export const ambientBreathing = {
  animate: {
    opacity: [0.4, 0.8, 0.4],
    scale: [1, 1.02, 1],
    transition: { duration: 4, repeat: Infinity, ease: "easeInOut" },
  },
};

export const ambientGlow = {
  animate: {
    boxShadow: [
      "0 0 20px rgba(91, 94, 245, 0.15)",
      "0 0 35px rgba(91, 94, 245, 0.28)",
      "0 0 20px rgba(91, 94, 245, 0.15)",
    ],
    transition: { duration: 3, repeat: Infinity, ease: "easeInOut" },
  },
};

export const ambientGradientShift = {
  animate: {
    backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
    transition: { duration: 8, repeat: Infinity, ease: "linear" },
  },
};

// =============================================
// TIER 2: RESPONSIVE (reacts to interaction)
// =============================================

export const fadeIn = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.3, ease: easeOutQuint } },
  exit: { opacity: 0, transition: { duration: 0.15 } },
};

export const fadeInUp = {
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.4, ease: easeOutQuint } },
  exit: { opacity: 0, y: 8, transition: { duration: 0.2 } },
};

export const fadeInDown = {
  initial: { opacity: 0, y: -14 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.4, ease: easeOutQuint } },
  exit: { opacity: 0, y: -8, transition: { duration: 0.2 } },
};

export const fadeInScale = {
  initial: { opacity: 0, scale: 0.95 },
  animate: { opacity: 1, scale: 1, transition: { duration: 0.35, ease: easeOutExpo } },
  exit: { opacity: 0, scale: 0.97, transition: { duration: 0.15 } },
};

export const slideInLeft = {
  initial: { opacity: 0, x: -18 },
  animate: { opacity: 1, x: 0, transition: { duration: 0.35, ease: easeOutQuint } },
  exit: { opacity: 0, x: -12, transition: { duration: 0.2 } },
};

export const slideInRight = {
  initial: { opacity: 0, x: 18 },
  animate: { opacity: 1, x: 0, transition: { duration: 0.35, ease: easeOutQuint } },
  exit: { opacity: 0, x: 12, transition: { duration: 0.2 } },
};

export const scaleIn = {
  initial: { scale: 0.88, opacity: 0 },
  animate: { scale: 1, opacity: 1, transition: smoothSpring },
  exit: { scale: 0.95, opacity: 0, transition: { duration: 0.15 } },
};

export const staggerContainer = {
  initial: {},
  animate: { transition: { staggerChildren: 0.045, delayChildren: 0.02 } },
};

export const staggerContainerFast = {
  initial: {},
  animate: { transition: { staggerChildren: 0.025, delayChildren: 0 } },
};

export const staggerItem = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.35, ease: easeOutQuint } },
};

export const staggerItemScale = {
  initial: { opacity: 0, scale: 0.94 },
  animate: { opacity: 1, scale: 1, transition: { duration: 0.3, ease: easeOutExpo } },
};

export const buttonHover = { scale: 1.03, transition: snappySpring };
export const buttonTap = { scale: 0.96, transition: { duration: 0.08 } };

export const cardHover = {
  y: -4,
  transition: { duration: 0.25, ease: easeOutQuint },
};

export const cardHoverLift = {
  y: -6,
  boxShadow: "0 16px 32px -8px rgba(91, 94, 245, 0.15)",
  transition: { duration: 0.25, ease: easeOutQuint },
};

export const iconHover = { scale: 1.1, rotate: 4, transition: snappySpring };

export const checkSnap = {
  initial: { scale: 1 },
  animate: { scale: [1, 1.25, 0.95, 1.05, 1], transition: { duration: 0.4, ease: easeOutBack } },
};

// =============================================
// TIER 3: CELEBRATION (earned moments)
// =============================================

export const celebrationBounce = {
  initial: { scale: 1 },
  animate: { scale: [1, 1.25, 0.92, 1.08, 0.98, 1], transition: { duration: 0.6, ease: easeOutExpo } },
};

export const celebrationGlow = {
  initial: { boxShadow: "0 0 0px rgba(245, 166, 35, 0)" },
  animate: {
    boxShadow: [
      "0 0 0px rgba(245, 166, 35, 0)",
      "0 0 40px rgba(245, 166, 35, 0.5)",
      "0 0 60px rgba(245, 166, 35, 0.3)",
      "0 0 0px rgba(245, 166, 35, 0)",
    ],
    transition: { duration: 1.2, ease: easeOutQuint },
  },
};

export const streakCelebration = {
  initial: { scale: 1, rotate: 0 },
  animate: {
    scale: [1, 1.3, 0.9, 1.1, 1],
    rotate: [0, -5, 5, -2, 0],
    transition: { duration: 0.8, ease: easeOutExpo },
  },
};

export const xpFillFlash = {
  animate: {
    opacity: [1, 0.6, 1],
    filter: ["brightness(1)", "brightness(1.4)", "brightness(1)"],
    transition: { duration: 0.5, ease: "easeInOut" },
  },
};

// =============================================
// MODAL ANIMATIONS
// =============================================

export const modalOverlay = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.2 } },
  exit: { opacity: 0, transition: { duration: 0.15 } },
};

export const modalContent = {
  initial: { opacity: 0, scale: 0.94, y: 12 },
  animate: { opacity: 1, scale: 1, y: 0, transition: { type: "spring", stiffness: 350, damping: 25 } },
  exit: { opacity: 0, scale: 0.96, y: 8, transition: { duration: 0.15 } },
};

export const modalSlideUp = {
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.3, ease: easeOutQuint } },
  exit: { opacity: 0, y: 12, transition: { duration: 0.15 } },
};

// =============================================
// HERO / LANDING
// =============================================

export const heroText = {
  initial: { opacity: 0, y: 30 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.7, ease: easeOutQuint } },
};

export const floatAnimation = ambientFloat;
export const pulseGlow = ambientGlow;

// =============================================
// PAGE TRANSITIONS
// =============================================

export const pageTransition = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.4, ease: easeOutQuint } },
  exit: { opacity: 0, transition: { duration: 0.2 } },
};

// =============================================
// LIST ITEM ANIMATIONS
// =============================================

export const listItem = {
  initial: { opacity: 0, x: -12 },
  animate: { opacity: 1, x: 0, transition: { duration: 0.3, ease: easeOutQuint } },
  exit: { opacity: 0, x: 12, transition: { duration: 0.15 } },
};

export const listItemPop = {
  initial: { opacity: 0, scale: 0.88 },
  animate: { opacity: 1, scale: 1, transition: smoothSpring },
  exit: { opacity: 0, scale: 0.95, transition: { duration: 0.1 } },
};

// =============================================
// COUNTER/NUMBER ANIMATIONS
// =============================================

export const counterAnimation = {
  initial: { opacity: 0, scale: 0.75 },
  animate: { opacity: 1, scale: 1, transition: { duration: 0.4, ease: easeOutExpo } },
};

// =============================================
// SCROLL-TRIGGERED (whileInView)
// =============================================

export const revealUp = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0, transition: { duration: 0.5, ease: easeOutQuint } },
  viewport: { once: true, amount: 0.3 },
};

export const revealScale = {
  initial: { opacity: 0, scale: 0.94 },
  whileInView: { opacity: 1, scale: 1, transition: { duration: 0.45, ease: easeOutExpo } },
  viewport: { once: true, amount: 0.3 },
};

// =============================================
// TRANSITION PRESETS
// =============================================

export const springTransition = smoothSpring;
export const snappyTransition = snappySpring;
export const bouncyTransition = bouncySpring;
export const smoothTransition = { duration: 0.35, ease: easeOutQuint };
export const quickTransition = { duration: 0.2, ease: easeOutQuint };

// =============================================
// LAYOUT ANIMATION HELPERS
// =============================================

export const layoutSpring = { type: "spring", stiffness: 300, damping: 30 };
export const layoutSmooth = { duration: 0.3, ease: easeOutQuint };

// =============================================
// NAV PILL (layoutId animated element)
// =============================================

export const navPillSpring = { type: "spring", stiffness: 350, damping: 30, mass: 0.8 };

// =============================================
// REDUCED MOTION SUPPORT
// =============================================

/**
 * Returns true if the user prefers reduced motion.
 * Safe for SSR (returns false on server).
 */
export function prefersReducedMotion() {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Returns a variant that degrades to opacity-only
 * when the user prefers reduced motion.
 */
export function withReducedMotion(variant) {
  if (prefersReducedMotion()) {
    return {
      ...variant,
      initial: { opacity: 0 },
      animate: { opacity: 1, transition: { duration: 0.2 } },
      exit: variant.exit ? { opacity: 0, transition: { duration: 0.1 } } : undefined,
    };
  }
  return variant;
}
