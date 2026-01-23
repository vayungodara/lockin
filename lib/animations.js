'use client';

// Premium ease curves
const easeOutQuint = [0.22, 1, 0.36, 1];
const easeOutExpo = [0.16, 1, 0.3, 1];
const easeInOutCubic = [0.65, 0, 0.35, 1];

// Buttery smooth spring - natural feel, no bounce
export const smoothSpring = {
  type: "spring",
  stiffness: 150,
  damping: 20,
  mass: 1,
};

// Snappy spring - for interactive feedback
const snappySpring = {
  type: "spring",
  stiffness: 400,
  damping: 30,
};

// Gentle spring - for large movements
const gentleSpring = {
  type: "spring",
  stiffness: 120,
  damping: 18,
};

// === FADE VARIANTS ===

export const fadeIn = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.3, ease: easeOutQuint } },
  exit: { opacity: 0, transition: { duration: 0.15 } },
};

export const fadeInUp = {
  initial: { opacity: 0, y: 12 },
  animate: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.4, ease: easeOutQuint }
  },
  exit: { opacity: 0, y: 8, transition: { duration: 0.2 } },
};

export const fadeInDown = {
  initial: { opacity: 0, y: -12 },
  animate: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.4, ease: easeOutQuint }
  },
  exit: { opacity: 0, y: -8, transition: { duration: 0.2 } },
};

export const fadeInScale = {
  initial: { opacity: 0, scale: 0.96 },
  animate: { 
    opacity: 1, 
    scale: 1,
    transition: { duration: 0.35, ease: easeOutExpo }
  },
  exit: { opacity: 0, scale: 0.98, transition: { duration: 0.15 } },
};

// === SLIDE VARIANTS ===

export const slideInLeft = {
  initial: { opacity: 0, x: -16 },
  animate: { 
    opacity: 1, 
    x: 0,
    transition: { duration: 0.35, ease: easeOutQuint }
  },
  exit: { opacity: 0, x: -12, transition: { duration: 0.2 } },
};

export const slideInRight = {
  initial: { opacity: 0, x: 16 },
  animate: { 
    opacity: 1, 
    x: 0,
    transition: { duration: 0.35, ease: easeOutQuint }
  },
  exit: { opacity: 0, x: 12, transition: { duration: 0.2 } },
};

export const scaleIn = {
  initial: { scale: 0.9, opacity: 0 },
  animate: { 
    scale: 1, 
    opacity: 1,
    transition: smoothSpring
  },
  exit: { scale: 0.95, opacity: 0, transition: { duration: 0.15 } },
};

// === STAGGER VARIANTS (for lists) ===

export const staggerContainer = {
  initial: {},
  animate: {
    transition: {
      staggerChildren: 0.04,
      delayChildren: 0.02,
    },
  },
};

export const staggerContainerFast = {
  initial: {},
  animate: {
    transition: {
      staggerChildren: 0.025,
      delayChildren: 0,
    },
  },
};

export const staggerItem = {
  initial: { opacity: 0, y: 10 },
  animate: { 
    opacity: 1, 
    y: 0,
    transition: {
      duration: 0.35,
      ease: easeOutQuint,
    }
  },
};

export const staggerItemScale = {
  initial: { opacity: 0, scale: 0.95 },
  animate: { 
    opacity: 1, 
    scale: 1,
    transition: {
      duration: 0.3,
      ease: easeOutExpo,
    }
  },
};

// === HERO/LANDING ANIMATIONS ===

export const heroText = {
  initial: { opacity: 0, y: 24 },
  animate: { 
    opacity: 1, 
    y: 0,
    transition: {
      duration: 0.6,
      ease: easeOutQuint,
    }
  },
};

export const floatAnimation = {
  animate: {
    y: [0, -6, 0],
    transition: {
      duration: 3,
      repeat: Infinity,
      ease: "easeInOut",
    },
  },
};

export const pulseGlow = {
  animate: {
    boxShadow: [
      "0 0 20px rgba(99, 102, 241, 0.15)",
      "0 0 35px rgba(99, 102, 241, 0.25)",
      "0 0 20px rgba(99, 102, 241, 0.15)",
    ],
    transition: {
      duration: 2.5,
      repeat: Infinity,
      ease: "easeInOut",
    },
  },
};

// === INTERACTIVE FEEDBACK ===

export const buttonHover = {
  scale: 1.02,
  transition: snappySpring,
};

export const buttonTap = {
  scale: 0.97,
  transition: { duration: 0.1 },
};

export const cardHover = {
  y: -3,
  transition: {
    duration: 0.2,
    ease: easeOutQuint,
  },
};

export const cardHoverLift = {
  y: -6,
  boxShadow: "0 12px 24px -8px rgba(0, 0, 0, 0.12)",
  transition: {
    duration: 0.25,
    ease: easeOutQuint,
  },
};

export const iconHover = {
  scale: 1.08,
  rotate: 3,
  transition: snappySpring,
};

// === MODAL ANIMATIONS ===

export const modalOverlay = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.2 } },
  exit: { opacity: 0, transition: { duration: 0.15 } },
};

export const modalContent = {
  initial: { opacity: 0, scale: 0.96, y: 10 },
  animate: { 
    opacity: 1, 
    scale: 1, 
    y: 0,
    transition: {
      duration: 0.25,
      ease: easeOutExpo,
    }
  },
  exit: { 
    opacity: 0, 
    scale: 0.97, 
    y: 8,
    transition: { duration: 0.15 }
  },
};

export const modalSlideUp = {
  initial: { opacity: 0, y: 20 },
  animate: { 
    opacity: 1, 
    y: 0,
    transition: {
      duration: 0.3,
      ease: easeOutQuint,
    }
  },
  exit: { 
    opacity: 0, 
    y: 10,
    transition: { duration: 0.15 }
  },
};

// === PAGE TRANSITIONS ===

export const pageTransition = {
  initial: { opacity: 0, y: 6 },
  animate: { 
    opacity: 1, 
    y: 0,
    transition: {
      duration: 0.35,
      ease: easeOutQuint,
    }
  },
  exit: { 
    opacity: 0,
    transition: { duration: 0.2 }
  },
};

// === LIST ITEM ANIMATIONS ===

export const listItem = {
  initial: { opacity: 0, x: -10 },
  animate: { 
    opacity: 1, 
    x: 0,
    transition: {
      duration: 0.3,
      ease: easeOutQuint,
    }
  },
  exit: { 
    opacity: 0, 
    x: 10,
    transition: { duration: 0.15 }
  },
};

export const listItemPop = {
  initial: { opacity: 0, scale: 0.9 },
  animate: { 
    opacity: 1, 
    scale: 1,
    transition: smoothSpring,
  },
  exit: { 
    opacity: 0, 
    scale: 0.95,
    transition: { duration: 0.1 }
  },
};

// === COUNTER/NUMBER ANIMATIONS ===

export const counterAnimation = {
  initial: { opacity: 0, scale: 0.8 },
  animate: { 
    opacity: 1, 
    scale: 1,
    transition: {
      duration: 0.4,
      ease: easeOutExpo,
    }
  },
};

// === SCROLL-TRIGGERED (whileInView) ===

export const revealUp = {
  initial: { opacity: 0, y: 20 },
  whileInView: { 
    opacity: 1, 
    y: 0,
    transition: {
      duration: 0.5,
      ease: easeOutQuint,
    }
  },
  viewport: { once: true, amount: 0.3 },
};

export const revealScale = {
  initial: { opacity: 0, scale: 0.95 },
  whileInView: { 
    opacity: 1, 
    scale: 1,
    transition: {
      duration: 0.45,
      ease: easeOutExpo,
    }
  },
  viewport: { once: true, amount: 0.3 },
};

// === TRANSITION PRESETS ===

export const springTransition = smoothSpring;

export const snappyTransition = snappySpring;

export const smoothTransition = {
  duration: 0.35,
  ease: easeOutQuint,
};

export const quickTransition = {
  duration: 0.2,
  ease: easeOutQuint,
};

// === LAYOUT ANIMATION HELPERS ===

export const layoutSpring = {
  type: "spring",
  stiffness: 300,
  damping: 30,
};

export const layoutSmooth = {
  duration: 0.3,
  ease: easeOutQuint,
};
