'use client';

// === EASING CURVES ===
export const easeOutQuint = [0.22, 1, 0.36, 1];
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
 * Wraps a variant object so its properties check prefers-reduced-motion
 * at access time (i.e., when spread into a component during render).
 *
 * Tier 1 (ambient) + Tier 3 (celebration): fully disabled — returns empty objects.
 * Tier 2 (responsive): degrades to opacity-only transitions.
 */
function motionSafe(variant, tier) {
  const result = {};
  for (const [key, value] of Object.entries(variant)) {
    Object.defineProperty(result, key, {
      get() {
        if (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
          if (tier === 1 || tier === 3) {
            // Kill ambient and celebration animations entirely
            return {};
          }
          if (tier === 2) {
            if (key === 'initial') return { opacity: 0 };
            if (key === 'animate' || key === 'whileInView') return { opacity: 1, transition: { duration: 0.2 } };
            if (key === 'exit') return { opacity: 0, transition: { duration: 0.1 } };
          }
        }
        return value;
      },
      enumerable: true,
    });
  }
  return result;
}

/**
 * Returns a variant that degrades to opacity-only
 * when the user prefers reduced motion.
 */
export function withReducedMotion(variant) {
  return motionSafe(variant, 2);
}

// =============================================
// TIER 1: AMBIENT (always running, barely noticed)
// Fully disabled when prefers-reduced-motion
// =============================================

export const ambientFloat = motionSafe({
  animate: {
    y: [0, -6, 0],
    transition: { duration: 3, repeat: Infinity, ease: "easeInOut" },
  },
}, 1);

export const ambientBreathing = motionSafe({
  animate: {
    opacity: [0.4, 0.8, 0.4],
    scale: [1, 1.02, 1],
    transition: { duration: 4, repeat: Infinity, ease: "easeInOut" },
  },
}, 1);

export const ambientGlow = motionSafe({
  animate: {
    boxShadow: [
      "0 0 20px rgba(91, 94, 245, 0.15)",
      "0 0 35px rgba(91, 94, 245, 0.28)",
      "0 0 20px rgba(91, 94, 245, 0.15)",
    ],
    transition: { duration: 3, repeat: Infinity, ease: "easeInOut" },
  },
}, 1);

export const ambientGradientShift = motionSafe({
  animate: {
    backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
    transition: { duration: 8, repeat: Infinity, ease: "linear" },
  },
}, 1);

// =============================================
// TIER 2: RESPONSIVE (reacts to interaction)
// Degrades to opacity-only when prefers-reduced-motion
// =============================================

export const fadeIn = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.3, ease: easeOutQuint } },
  exit: { opacity: 0, transition: { duration: 0.15 } },
};

export const fadeInUp = motionSafe({
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.4, ease: easeOutQuint } },
  exit: { opacity: 0, y: 8, transition: { duration: 0.2 } },
}, 2);

export const fadeInDown = motionSafe({
  initial: { opacity: 0, y: -14 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.4, ease: easeOutQuint } },
  exit: { opacity: 0, y: -8, transition: { duration: 0.2 } },
}, 2);

export const fadeInScale = motionSafe({
  initial: { opacity: 0, scale: 0.95 },
  animate: { opacity: 1, scale: 1, transition: { duration: 0.35, ease: easeOutExpo } },
  exit: { opacity: 0, scale: 0.97, transition: { duration: 0.15 } },
}, 2);

export const slideInLeft = motionSafe({
  initial: { opacity: 0, x: -18 },
  animate: { opacity: 1, x: 0, transition: { duration: 0.35, ease: easeOutQuint } },
  exit: { opacity: 0, x: -12, transition: { duration: 0.2 } },
}, 2);

export const slideInRight = motionSafe({
  initial: { opacity: 0, x: 18 },
  animate: { opacity: 1, x: 0, transition: { duration: 0.35, ease: easeOutQuint } },
  exit: { opacity: 0, x: 12, transition: { duration: 0.2 } },
}, 2);

export const scaleIn = motionSafe({
  initial: { scale: 0.88, opacity: 0 },
  animate: { scale: 1, opacity: 1, transition: smoothSpring },
  exit: { scale: 0.95, opacity: 0, transition: { duration: 0.15 } },
}, 2);

export const staggerContainer = {
  initial: {},
  animate: { transition: { staggerChildren: 0.045, delayChildren: 0.02 } },
};

export const staggerContainerFast = {
  initial: {},
  animate: { transition: { staggerChildren: 0.025, delayChildren: 0 } },
};

export const staggerItem = motionSafe({
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.35, ease: easeOutQuint } },
}, 2);

export const staggerItemScale = motionSafe({
  initial: { opacity: 0, scale: 0.94 },
  animate: { opacity: 1, scale: 1, transition: { duration: 0.3, ease: easeOutExpo } },
}, 2);

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

export const checkSnap = motionSafe({
  initial: { scale: 1 },
  animate: { scale: [1, 1.25, 0.95, 1.05, 1], transition: { duration: 0.4, ease: easeOutBack } },
}, 2);

// =============================================
// TIER 3: CELEBRATION (earned moments)
// Fully disabled when prefers-reduced-motion
// =============================================

export const celebrationBounce = motionSafe({
  initial: { scale: 1 },
  animate: { scale: [1, 1.25, 0.92, 1.08, 0.98, 1], transition: { duration: 0.6, ease: easeOutExpo } },
}, 3);

export const celebrationGlow = motionSafe({
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
}, 3);

export const streakCelebration = motionSafe({
  initial: { scale: 1, rotate: 0 },
  animate: {
    scale: [1, 1.3, 0.9, 1.1, 1],
    rotate: [0, -5, 5, -2, 0],
    transition: { duration: 0.8, ease: easeOutExpo },
  },
}, 3);

export const xpFillFlash = motionSafe({
  animate: {
    opacity: [1, 0.6, 1],
    filter: ["brightness(1)", "brightness(1.4)", "brightness(1)"],
    transition: { duration: 0.5, ease: "easeInOut" },
  },
}, 3);

// =============================================
// EDITORIAL REDESIGN — stamp + reward presets
// Physical-stamp metaphor for pact resolution.
// All four respect prefers-reduced-motion (tier 3 / tier 2 appropriately
// via motionSafe) — reduced motion collapses to instant opacity fades.
// =============================================

// Approved overshoot curve — matches --ease-stamp CSS var
// (cubic-bezier(.22, 1.6, .36, 1)). Kept local to this module as a
// Framer-Motion-readable array since Framer doesn't consume CSS vars in
// transition.ease fields directly.
const easeStamp = [0.22, 1.6, 0.36, 1];

/**
 * Stamp slam — rest rotation variant. Scale overshoot + small rotate.
 * Used when the stamp should land at -3deg at rest (Stamp component).
 */
export const stampSlam = motionSafe({
  initial: { scale: 1.5, opacity: 0, rotate: -3 },
  animate: {
    scale: 1,
    opacity: 1,
    rotate: -3,
    transition: { duration: 0.48, ease: easeStamp },
  },
}, 3);

/**
 * Stamp slam (clean) — multi-keyframe impact curve ported from
 * globals.css @keyframes stampSlamClean. Stamp is invisible until 22%,
 * then appears at 1.5x, compresses to 0.72x, recoils, damped oscillation.
 * Composes with a pre-rotated parent — rotation lives on the wrapper.
 */
export const stampSlamClean = motionSafe({
  initial: { scale: 1.5, opacity: 0 },
  animate: {
    scale: [1.5, 1.5, 1.3, 0.72, 1.15, 0.9, 1.05, 0.97, 1.015, 1],
    opacity: [0, 0, 1, 1, 1, 1, 1, 1, 1, 1],
    transition: {
      duration: 0.68,
      delay: 0.25,
      ease: 'linear',
      times: [0, 0.22, 0.24, 0.34, 0.44, 0.56, 0.68, 0.80, 0.90, 1],
    },
  },
}, 3);

/**
 * Reward pop — for the "+50 XP" burst on pact completion. Rises,
 * blooms, drifts up, fades. 1900ms total, ease-out-expo throughout.
 */
export const rewardPop = motionSafe({
  initial: { scale: 0.4, opacity: 0, rotate: -10, filter: 'blur(6px)' },
  animate: {
    scale: [0.4, 1.15, 1, 0.92],
    opacity: [0, 1, 1, 0],
    rotate: [-10, -4, -2, -2],
    y: [0, 0, 0, -14],
    filter: ['blur(6px)', 'blur(0px)', 'blur(0px)', 'blur(0px)'],
    transition: {
      duration: 1.9,
      ease: easeOutExpo,
      times: [0, 0.35, 0.70, 1],
    },
  },
}, 3);

/**
 * Achievement-in — supersedes the old sealIn keyframe. Scale + rotate
 * entrance for achievement / badge reveals. Lands at -3deg at rest to
 * match the stamp rhythm.
 */
export const achievementIn = motionSafe({
  initial: { scale: 0.6, opacity: 0, rotate: -6 },
  animate: {
    scale: 1,
    opacity: 1,
    rotate: -3,
    transition: { duration: 0.52, ease: easeStamp },
  },
}, 3);

// =============================================
// MODAL ANIMATIONS
// =============================================

export const modalOverlay = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.2 } },
  exit: { opacity: 0, transition: { duration: 0.15 } },
};

export const modalContent = motionSafe({
  initial: { opacity: 0, scale: 0.94, y: 12 },
  animate: { opacity: 1, scale: 1, y: 0, transition: { type: "spring", stiffness: 350, damping: 25 } },
  exit: { opacity: 0, scale: 0.96, y: 8, transition: { duration: 0.15 } },
}, 2);

export const modalSlideUp = motionSafe({
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.3, ease: easeOutQuint } },
  exit: { opacity: 0, y: 12, transition: { duration: 0.15 } },
}, 2);

// =============================================
// HERO / LANDING
// =============================================

export const heroText = motionSafe({
  initial: { opacity: 0, y: 30 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.7, ease: easeOutQuint } },
}, 2);

export const floatAnimation = ambientFloat;
export const pulseGlow = ambientGlow;

// =============================================
// PAGE TRANSITIONS
// =============================================

export const pageTransition = motionSafe({
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.4, ease: easeOutQuint } },
  exit: { opacity: 0, transition: { duration: 0.2 } },
}, 2);

// =============================================
// LIST ITEM ANIMATIONS
// =============================================

export const listItem = motionSafe({
  initial: { opacity: 0, x: -12 },
  animate: { opacity: 1, x: 0, transition: { duration: 0.3, ease: easeOutQuint } },
  exit: { opacity: 0, x: 12, transition: { duration: 0.15 } },
}, 2);

export const listItemPop = motionSafe({
  initial: { opacity: 0, scale: 0.88 },
  animate: { opacity: 1, scale: 1, transition: smoothSpring },
  exit: { opacity: 0, scale: 0.95, transition: { duration: 0.1 } },
}, 2);

// =============================================
// COUNTER/NUMBER ANIMATIONS
// =============================================

export const counterAnimation = motionSafe({
  initial: { opacity: 0, scale: 0.75 },
  animate: { opacity: 1, scale: 1, transition: { duration: 0.4, ease: easeOutExpo } },
}, 2);

// =============================================
// SCROLL-TRIGGERED (whileInView)
// =============================================

export const revealUp = motionSafe({
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0, transition: { duration: 0.5, ease: easeOutQuint } },
  viewport: { amount: 0.3 },
}, 2);

export const revealScale = {
  initial: { opacity: 0, scale: 0.94 },
  whileInView: { opacity: 1, scale: 1, transition: { duration: 0.45, ease: easeOutExpo } },
  viewport: { amount: 0.3 },
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

export const navPillSpring = { type: "spring", stiffness: 300, damping: 28, mass: 0.8 };

// =============================================
// FORM MICRO-INTERACTIONS
// =============================================

export const inputFocus = {
  whileFocus: { scale: 1.01 },
  transition: { type: 'spring', stiffness: 400, damping: 25 }
};

export const errorShake = {
  animate: { x: [0, -4, 4, -4, 4, 0] },
  transition: { duration: 0.3 }
};

export const successCheck = motionSafe({
  initial: { scale: 0, opacity: 0 },
  animate: { scale: 1, opacity: 1 },
  transition: { type: 'spring', stiffness: 500, damping: 15 }
}, 2);

export const toastProgress = {
  initial: { scaleX: 1, transformOrigin: 'left' },
  animate: { scaleX: 0 },
  transition: { duration: 4, ease: 'linear' }
};

export const filterTabSlide = {
  layout: true,
  transition: { type: 'spring', stiffness: 500, damping: 30 }
};

// =============================================
// SIDEBAR ANIMATIONS
// =============================================

/** Spring for the sidebar width expand/collapse. */
export const sidebarSpring = { type: 'spring', stiffness: 200, damping: 25, mass: 1 };

/** Short tween for inner elements that reveal/hide during expand/collapse. */
export const sidebarExpandTransition = { duration: 0.2, ease: [0.25, 1, 0.5, 1] };

/** whileTap for sidebar action buttons (slightly less scale than buttonTap). */
export const sidebarTap = { scale: 0.95 };

/** Pulsing dot animation for the running-timer indicator. */
export const timerPulse = motionSafe({
  animate: {
    scale: [1, 1.15, 1],
    opacity: [0.3, 0.6, 0.3],
  },
  transition: { duration: 2, repeat: Infinity, ease: 'easeInOut' },
}, 1);
