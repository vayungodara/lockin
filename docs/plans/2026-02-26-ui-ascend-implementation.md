# UI Ascend Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Complete visual redesign of LockIn — evolve design tokens, animation system, and every component CSS module to deliver a premium, "delightfully alive" aesthetic across both light and dark modes.

**Architecture:** Token Evolution approach — redesign the design token layer (globals.css) first, expand the animation system (animations.js + new confetti.js), then cascade visual changes through all 22+ CSS modules. No JS logic, data fetching, or routing changes.

**Tech Stack:** CSS Modules, CSS Custom Properties, Framer Motion, vanilla JS (confetti utility)

**Worktree:** `/Users/vayun/projects/lockin-ui-ascend` on branch `ui-ascend`

**Design doc:** `docs/plans/2026-02-26-ui-ascend-design.md`

---

## Task 1: Evolve Design Tokens — Color System

**Files:**
- Modify: `app/globals.css:1-158` (`:root` light mode tokens)
- Modify: `app/globals.css:160-215` (`[data-theme="dark"]` tokens)
- Modify: `app/globals.css:218-274` (`prefers-color-scheme: dark` media query)

**Step 1: Update light mode color tokens**

Replace the `:root` color section (lines 8-77) with evolved "Luminous" palette:

```css
:root {
  /* === LIGHT MODE — "Luminous" === */

  /* Background colors — warm off-whites with violet undertone */
  --bg-primary: #FAFAFF;
  --bg-secondary: #F5F4FF;
  --bg-tertiary: #EEEDF6;
  --bg-elevated: #FFFFFF;
  --bg-hover: #ECEAFF;

  /* Surface colors — frosted glass foundations */
  --surface-1: rgba(255, 255, 255, 0.85);
  --surface-2: rgba(245, 244, 255, 0.7);
  --surface-3: rgba(236, 234, 255, 0.6);
  --surface-overlay: rgba(99, 102, 241, 0.02);
  --surface-glass: rgba(255, 255, 255, 0.65);

  /* Text colors — Rich, readable (unchanged contrast ratios) */
  --text-primary: #161529;
  --text-secondary: #524E68;
  --text-tertiary: #837F96;
  --text-muted: #A9A5BC;
  --text-inverse: #FFFFFF;

  /* Gradient Accents — richer, deeper stops */
  --gradient-primary: linear-gradient(135deg, #5B5EF5 0%, #7C4DFF 40%, #B44AE6 70%, #E040CB 100%);
  --gradient-secondary: linear-gradient(135deg, #3B7BF6 0%, #5B5EF5 100%);
  --gradient-success: linear-gradient(135deg, #0DBF73 0%, #2DDFAC 100%);
  --gradient-warm: linear-gradient(135deg, #F5A623 0%, #FF6B35 100%);
  --gradient-celebration: linear-gradient(135deg, #F5A623 0%, #FFD700 50%, #F5A623 100%);
  --gradient-subtle: linear-gradient(135deg, rgba(var(--accent-primary-rgb), 0.1) 0%, rgba(var(--accent-tertiary-rgb), 0.1) 100%);
  --gradient-glow: linear-gradient(135deg, rgba(var(--accent-primary-rgb), 0.22) 0%, rgba(var(--accent-tertiary-rgb), 0.22) 100%);

  /* Solid accent colors */
  --accent-primary: #5B5EF5;
  --accent-primary-hover: #4745E0;
  --accent-secondary: #7C4DFF;
  --accent-tertiary: #E040CB;
  --accent-text: #5B5EF5;
  --accent-glow: rgba(var(--accent-primary-rgb), 0.18);
  --accent-primary-rgb: 91, 94, 245;
  --accent-tertiary-rgb: 224, 64, 203;
  --accent-celebration: #F5A623;
  --accent-celebration-rgb: 245, 166, 35;

  /* Status colors — with personality */
  --success: #0DBF73;
  --success-light: #CFFCE8;
  --success-bg: rgba(13, 191, 115, 0.1);
  --success-glow: rgba(13, 191, 115, 0.25);
  --warning: #F5A623;
  --warning-light: #FFF4DC;
  --warning-bg: rgba(245, 166, 35, 0.1);
  --warning-glow: rgba(245, 166, 35, 0.25);
  --danger: #EF4444;
  --danger-light: #FEE2E2;
  --danger-bg: rgba(239, 68, 68, 0.1);
  --danger-glow: rgba(239, 68, 68, 0.25);
  --info: #3B7BF6;
  --info-light: #DBEAFE;
  --info-bg: rgba(59, 123, 246, 0.1);
  --info-glow: rgba(59, 123, 246, 0.25);

  /* Borders */
  --border-subtle: rgba(91, 94, 245, 0.06);
  --border-default: rgba(91, 94, 245, 0.10);
  --border-strong: rgba(91, 94, 245, 0.16);
  --border-focus: rgba(var(--accent-primary-rgb), 0.5);

  /* Shadows — accent-tinted atmosphere */
  --shadow-xs: 0 1px 2px rgba(91, 94, 245, 0.04);
  --shadow-sm: 0 1px 3px rgba(91, 94, 245, 0.06), 0 1px 2px rgba(0, 0, 0, 0.03);
  --shadow-md: 0 4px 12px -2px rgba(91, 94, 245, 0.08), 0 2px 4px -2px rgba(0, 0, 0, 0.04);
  --shadow-lg: 0 12px 24px -4px rgba(91, 94, 245, 0.10), 0 4px 8px -4px rgba(0, 0, 0, 0.04);
  --shadow-xl: 0 20px 40px -8px rgba(91, 94, 245, 0.12), 0 8px 16px -6px rgba(0, 0, 0, 0.04);
  --shadow-2xl: 0 32px 64px -16px rgba(91, 94, 245, 0.18);
  --shadow-glow: 0 0 40px rgba(var(--accent-primary-rgb), 0.18);
  --shadow-glow-lg: 0 0 60px rgba(var(--accent-primary-rgb), 0.25);
  --shadow-glow-celebration: 0 0 40px rgba(var(--accent-celebration-rgb), 0.3);
```

**Step 2: Update dark mode tokens**

Replace `[data-theme="dark"]` section with "Deep Space" palette:

```css
[data-theme="dark"] {
  /* Background colors — deep space with blue undertone */
  --bg-primary: #08090D;
  --bg-secondary: #0E1117;
  --bg-tertiary: #161B25;
  --bg-elevated: #1A1F2B;
  --bg-hover: #222838;

  /* Surface colors — subtle luminosity */
  --surface-1: rgba(22, 27, 37, 0.9);
  --surface-2: rgba(26, 31, 43, 0.85);
  --surface-3: rgba(34, 40, 56, 0.8);
  --surface-overlay: rgba(91, 94, 245, 0.03);
  --surface-glass: rgba(14, 17, 23, 0.75);

  /* Text colors */
  --text-primary: #F0F0FF;
  --text-secondary: #A8A3C0;
  --text-tertiary: #6E6990;
  --text-muted: #4A4568;
  --text-inverse: #08090D;

  /* Gradient adjustments — more luminous in dark */
  --gradient-subtle: linear-gradient(135deg, rgba(var(--accent-primary-rgb), 0.14) 0%, rgba(var(--accent-tertiary-rgb), 0.14) 100%);
  --gradient-glow: linear-gradient(135deg, rgba(var(--accent-primary-rgb), 0.3) 0%, rgba(var(--accent-tertiary-rgb), 0.3) 100%);

  /* Status colors — brighter for dark mode */
  --success: #2DDF8E;
  --success-light: rgba(45, 223, 142, 0.15);
  --success-bg: rgba(45, 223, 142, 0.12);
  --success-glow: rgba(45, 223, 142, 0.35);
  --warning: #FFB84D;
  --warning-light: rgba(255, 184, 77, 0.15);
  --warning-bg: rgba(255, 184, 77, 0.12);
  --warning-glow: rgba(255, 184, 77, 0.35);
  --danger: #FF6B6B;
  --danger-light: rgba(255, 107, 107, 0.15);
  --danger-bg: rgba(255, 107, 107, 0.12);
  --danger-glow: rgba(255, 107, 107, 0.35);
  --info: #6EA8FE;
  --info-light: rgba(110, 168, 254, 0.15);
  --info-bg: rgba(110, 168, 254, 0.12);
  --info-glow: rgba(110, 168, 254, 0.35);

  /* Borders — subtle gradient-aware */
  --border-subtle: rgba(91, 94, 245, 0.06);
  --border-default: rgba(91, 94, 245, 0.10);
  --border-strong: rgba(255, 255, 255, 0.12);
  --border-focus: rgba(var(--accent-primary-rgb), 0.6);

  /* Shadows — deep and dramatic */
  --shadow-xs: 0 1px 2px rgba(0, 0, 0, 0.25);
  --shadow-sm: 0 1px 3px rgba(0, 0, 0, 0.35), 0 1px 2px rgba(0, 0, 0, 0.25);
  --shadow-md: 0 4px 12px -2px rgba(0, 0, 0, 0.4), 0 2px 4px -2px rgba(0, 0, 0, 0.3);
  --shadow-lg: 0 12px 24px -4px rgba(0, 0, 0, 0.45), 0 4px 8px -4px rgba(0, 0, 0, 0.35);
  --shadow-xl: 0 20px 40px -8px rgba(0, 0, 0, 0.5), 0 8px 16px -6px rgba(0, 0, 0, 0.35);
  --shadow-2xl: 0 32px 64px -16px rgba(0, 0, 0, 0.65);
  --shadow-glow: 0 0 40px rgba(var(--accent-primary-rgb), 0.25);
  --shadow-glow-lg: 0 0 60px rgba(var(--accent-primary-rgb), 0.35);
  --shadow-glow-celebration: 0 0 40px rgba(var(--accent-celebration-rgb), 0.4);
}
```

**Step 3: Mirror dark mode tokens into `prefers-color-scheme: dark` media query**

Copy the same dark mode values into the `@media (prefers-color-scheme: dark)` block (lines 218-274), replacing the existing values.

**Step 4: Build and verify**

Run: `cd /Users/vayun/projects/lockin-ui-ascend && npm run build`
Expected: Build passes. No CSS errors.

**Step 5: Commit**

```bash
git add app/globals.css
git commit -m "feat(ui-ascend): evolve color tokens — luminous light, deep space dark"
```

---

## Task 2: Evolve Design Tokens — Typography, Shapes, New Keyframes

**Files:**
- Modify: `app/globals.css:79-157` (typography, radius, transitions)
- Modify: `app/globals.css:276-415` (base styles, typography rules)
- Modify: `app/globals.css:416-514` (button styles)
- Modify: `app/globals.css:572-636` (input styles)
- Modify: `app/globals.css:638-679` (badge styles)
- Modify: `app/globals.css:778-906` (keyframes, animation classes)

**Step 1: Update typography tokens**

In the `:root` section, update letter-spacing and add new tokens:

```css
  /* Letter spacing — tighter headlines, spacier labels */
  --tracking-tighter: -0.035em;
  --tracking-tight: -0.025em;
  --tracking-normal: 0;
  --tracking-wide: 0.04em;
  --tracking-wider: 0.06em;

  /* Font weight addition */
  --font-extrabold: 800;
```

**Step 2: Update radius tokens for mixed shape language**

```css
  /* Border radius — rounded interactive, structured containers */
  --radius-sm: 0.5rem;      /* 8px — slightly larger */
  --radius-md: 0.625rem;    /* 10px */
  --radius-lg: 0.875rem;    /* 14px */
  --radius-xl: 1.125rem;    /* 18px */
  --radius-2xl: 1.375rem;   /* 22px */
  --radius-3xl: 1.75rem;    /* 28px */
  --radius-full: 9999px;
```

**Step 3: Update heading styles for tighter tracking**

Replace heading rules:

```css
h1, h2, h3, h4, h5, h6 {
  font-weight: var(--font-bold);
  line-height: var(--leading-tight);
  letter-spacing: var(--tracking-tighter);
  color: var(--text-primary);
}

h1 { font-size: var(--text-5xl); font-weight: var(--font-extrabold); }
h2 { font-size: var(--text-4xl); font-weight: var(--font-extrabold); }
h3 { font-size: var(--text-3xl); }
h4 { font-size: var(--text-2xl); }
h5 { font-size: var(--text-xl); }
h6 { font-size: var(--text-lg); }
```

**Step 4: Update button styles for rounder interactive elements**

Update `.btn` base:
```css
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
  padding: var(--space-3) var(--space-5);
  font-size: var(--text-sm);
  font-weight: var(--font-semibold);
  line-height: 1;
  border-radius: var(--radius-full);
  transition: all var(--transition-base);
  white-space: nowrap;
  position: relative;
  overflow: hidden;
}
```

Update `.btn-primary` for glow hover:
```css
.btn-primary {
  background: var(--gradient-primary);
  color: white;
  border: none;
  box-shadow: var(--shadow-md), 0 0 20px rgba(var(--accent-primary-rgb), 0.2);
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-lg), 0 0 35px rgba(var(--accent-primary-rgb), 0.35);
  filter: brightness(1.05);
}

.btn-primary:active {
  transform: translateY(0) scale(0.97);
  filter: brightness(1.1);
}
```

**Step 5: Update input focus glow**

```css
.input:focus {
  outline: none;
  border-color: var(--accent-primary);
  box-shadow: 0 0 0 3px rgba(var(--accent-primary-rgb), 0.15), 0 0 20px rgba(var(--accent-primary-rgb), 0.08);
}
```

**Step 6: Update badge radius**

Badges already use `radius-full` — no change needed. Update letter-spacing:
```css
.badge {
  display: inline-flex;
  align-items: center;
  gap: var(--space-1);
  padding: var(--space-1) var(--space-3);
  font-size: var(--text-xs);
  font-weight: var(--font-semibold);
  border-radius: var(--radius-full);
  letter-spacing: var(--tracking-wider);
  text-transform: uppercase;
}
```

**Step 7: Add new ambient keyframes**

Add after existing keyframes (line ~857):

```css
@keyframes shimmerGlint {
  0% { transform: translateX(-150%); }
  100% { transform: translateX(250%); }
}

@keyframes breathe {
  0%, 100% { opacity: 0.4; transform: scale(1); }
  50% { opacity: 0.8; transform: scale(1.02); }
}

@keyframes gradientShift {
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}

@keyframes pulseGlow {
  0%, 100% { box-shadow: 0 0 20px rgba(var(--accent-primary-rgb), 0.15); }
  50% { box-shadow: 0 0 35px rgba(var(--accent-primary-rgb), 0.3); }
}

@keyframes celebrationBounce {
  0% { transform: scale(1); }
  30% { transform: scale(1.2); }
  50% { transform: scale(0.95); }
  70% { transform: scale(1.05); }
  100% { transform: scale(1); }
}

@keyframes ringPulse {
  0%, 100% { box-shadow: 0 0 0 0 rgba(var(--accent-primary-rgb), 0.3); }
  50% { box-shadow: 0 0 0 6px rgba(var(--accent-primary-rgb), 0); }
}

@keyframes bellWiggle {
  0% { transform: rotate(0deg); }
  15% { transform: rotate(-8deg); }
  30% { transform: rotate(6deg); }
  45% { transform: rotate(-4deg); }
  60% { transform: rotate(2deg); }
  75% { transform: rotate(-1deg); }
  100% { transform: rotate(0deg); }
}

@keyframes dotPulse {
  0%, 100% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.3); opacity: 0.7; }
}

@keyframes glowPulse {
  0%, 100% { opacity: 0.6; }
  50% { opacity: 1; }
}
```

**Step 8: Update body background orbs**

Replace `body::before`:
```css
body::before {
  content: '';
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background:
    radial-gradient(ellipse 80% 50% at 50% -20%, rgba(var(--accent-primary-rgb), 0.10), transparent),
    radial-gradient(ellipse 50% 40% at 100% 0%, rgba(var(--accent-tertiary-rgb), 0.07), transparent),
    radial-gradient(ellipse 40% 30% at 0% 80%, rgba(var(--accent-celebration-rgb), 0.04), transparent);
  z-index: -1;
  pointer-events: none;
  transition: opacity var(--transition-slow);
}
```

And the dark mode variants:
```css
[data-theme="dark"] body::before {
  background:
    radial-gradient(ellipse 80% 50% at 50% -20%, rgba(var(--accent-primary-rgb), 0.18), transparent),
    radial-gradient(ellipse 50% 40% at 100% 0%, rgba(var(--accent-tertiary-rgb), 0.12), transparent),
    radial-gradient(ellipse 40% 30% at 0% 80%, rgba(var(--accent-celebration-rgb), 0.06), transparent);
}
```

**Step 9: Update `prefers-reduced-motion` to handle new animations**

The existing rule (lines 1081-1089) already covers all animations globally — no change needed.

**Step 10: Build and verify**

Run: `cd /Users/vayun/projects/lockin-ui-ascend && npm run build`
Expected: Build passes.

**Step 11: Commit**

```bash
git add app/globals.css
git commit -m "feat(ui-ascend): evolve typography, shapes, and add ambient keyframes"
```

---

## Task 3: Expand Animation System

**Files:**
- Modify: `lib/animations.js` (expand with 3-tier system)
- Create: `lib/confetti.js` (celebration particle utility)

**Step 1: Rewrite animations.js with 3-tier system**

Replace entire file with:

```javascript
'use client';

// === EASING CURVES ===
const easeOutQuint = [0.22, 1, 0.36, 1];
const easeOutExpo = [0.16, 1, 0.3, 1];
const easeOutBack = [0.34, 1.56, 0.64, 1];
const easeInOutCubic = [0.65, 0, 0.35, 1];

// === SPRING CONFIGS ===

// Buttery smooth — natural feel, no bounce
export const smoothSpring = {
  type: "spring",
  stiffness: 150,
  damping: 20,
  mass: 1,
};

// Snappy — for interactive feedback
const snappySpring = {
  type: "spring",
  stiffness: 400,
  damping: 30,
};

// Gentle — for large movements
const gentleSpring = {
  type: "spring",
  stiffness: 120,
  damping: 18,
};

// Bouncy — for celebrations
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
    transition: {
      duration: 3,
      repeat: Infinity,
      ease: "easeInOut",
    },
  },
};

export const ambientBreathing = {
  animate: {
    opacity: [0.4, 0.8, 0.4],
    scale: [1, 1.02, 1],
    transition: {
      duration: 4,
      repeat: Infinity,
      ease: "easeInOut",
    },
  },
};

export const ambientGlow = {
  animate: {
    boxShadow: [
      "0 0 20px rgba(91, 94, 245, 0.15)",
      "0 0 35px rgba(91, 94, 245, 0.28)",
      "0 0 20px rgba(91, 94, 245, 0.15)",
    ],
    transition: {
      duration: 3,
      repeat: Infinity,
      ease: "easeInOut",
    },
  },
};

export const ambientGradientShift = {
  animate: {
    backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
    transition: {
      duration: 8,
      repeat: Infinity,
      ease: "linear",
    },
  },
};

// =============================================
// TIER 2: RESPONSIVE (reacts to interaction)
// =============================================

// --- Fade variants ---

export const fadeIn = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.3, ease: easeOutQuint } },
  exit: { opacity: 0, transition: { duration: 0.15 } },
};

export const fadeInUp = {
  initial: { opacity: 0, y: 14 },
  animate: {
    opacity: 1, y: 0,
    transition: { duration: 0.4, ease: easeOutQuint }
  },
  exit: { opacity: 0, y: 8, transition: { duration: 0.2 } },
};

export const fadeInDown = {
  initial: { opacity: 0, y: -14 },
  animate: {
    opacity: 1, y: 0,
    transition: { duration: 0.4, ease: easeOutQuint }
  },
  exit: { opacity: 0, y: -8, transition: { duration: 0.2 } },
};

export const fadeInScale = {
  initial: { opacity: 0, scale: 0.95 },
  animate: {
    opacity: 1, scale: 1,
    transition: { duration: 0.35, ease: easeOutExpo }
  },
  exit: { opacity: 0, scale: 0.97, transition: { duration: 0.15 } },
};

// --- Slide variants ---

export const slideInLeft = {
  initial: { opacity: 0, x: -18 },
  animate: {
    opacity: 1, x: 0,
    transition: { duration: 0.35, ease: easeOutQuint }
  },
  exit: { opacity: 0, x: -12, transition: { duration: 0.2 } },
};

export const slideInRight = {
  initial: { opacity: 0, x: 18 },
  animate: {
    opacity: 1, x: 0,
    transition: { duration: 0.35, ease: easeOutQuint }
  },
  exit: { opacity: 0, x: 12, transition: { duration: 0.2 } },
};

export const scaleIn = {
  initial: { scale: 0.88, opacity: 0 },
  animate: {
    scale: 1, opacity: 1,
    transition: smoothSpring
  },
  exit: { scale: 0.95, opacity: 0, transition: { duration: 0.15 } },
};

// --- Stagger variants ---

export const staggerContainer = {
  initial: {},
  animate: {
    transition: {
      staggerChildren: 0.045,
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
  initial: { opacity: 0, y: 12 },
  animate: {
    opacity: 1, y: 0,
    transition: { duration: 0.35, ease: easeOutQuint }
  },
};

export const staggerItemScale = {
  initial: { opacity: 0, scale: 0.94 },
  animate: {
    opacity: 1, scale: 1,
    transition: { duration: 0.3, ease: easeOutExpo }
  },
};

// --- Interactive feedback ---

export const buttonHover = {
  scale: 1.03,
  transition: snappySpring,
};

export const buttonTap = {
  scale: 0.96,
  transition: { duration: 0.08 },
};

export const cardHover = {
  y: -4,
  transition: {
    duration: 0.25,
    ease: easeOutQuint,
  },
};

export const cardHoverLift = {
  y: -6,
  boxShadow: "0 16px 32px -8px rgba(91, 94, 245, 0.15)",
  transition: {
    duration: 0.25,
    ease: easeOutQuint,
  },
};

export const iconHover = {
  scale: 1.1,
  rotate: 4,
  transition: snappySpring,
};

// --- Checkbox/toggle snap ---

export const checkSnap = {
  initial: { scale: 1 },
  animate: {
    scale: [1, 1.25, 0.95, 1.05, 1],
    transition: { duration: 0.4, ease: easeOutBack }
  },
};

// =============================================
// TIER 3: CELEBRATION (earned moments)
// =============================================

export const celebrationBounce = {
  initial: { scale: 1 },
  animate: {
    scale: [1, 1.25, 0.92, 1.08, 0.98, 1],
    transition: {
      duration: 0.6,
      ease: easeOutExpo,
    },
  },
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
    transition: {
      duration: 0.8,
      ease: easeOutExpo,
    },
  },
};

export const xpFillFlash = {
  animate: {
    opacity: [1, 0.6, 1],
    filter: [
      "brightness(1)",
      "brightness(1.4)",
      "brightness(1)",
    ],
    transition: {
      duration: 0.5,
      ease: "easeInOut",
    },
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
  animate: {
    opacity: 1, scale: 1, y: 0,
    transition: {
      type: "spring",
      stiffness: 350,
      damping: 25,
    }
  },
  exit: {
    opacity: 0, scale: 0.96, y: 8,
    transition: { duration: 0.15 }
  },
};

export const modalSlideUp = {
  initial: { opacity: 0, y: 24 },
  animate: {
    opacity: 1, y: 0,
    transition: {
      duration: 0.3,
      ease: easeOutQuint,
    }
  },
  exit: {
    opacity: 0, y: 12,
    transition: { duration: 0.15 }
  },
};

// =============================================
// HERO / LANDING
// =============================================

export const heroText = {
  initial: { opacity: 0, y: 30 },
  animate: {
    opacity: 1, y: 0,
    transition: {
      duration: 0.7,
      ease: easeOutQuint,
    }
  },
};

export const floatAnimation = ambientFloat;
export const pulseGlow = ambientGlow;

// =============================================
// PAGE TRANSITIONS
// =============================================

export const pageTransition = {
  initial: { opacity: 0, y: 8 },
  animate: {
    opacity: 1, y: 0,
    transition: {
      duration: 0.4,
      ease: easeOutQuint,
    }
  },
  exit: {
    opacity: 0,
    transition: { duration: 0.2 }
  },
};

// =============================================
// LIST ITEM ANIMATIONS
// =============================================

export const listItem = {
  initial: { opacity: 0, x: -12 },
  animate: {
    opacity: 1, x: 0,
    transition: { duration: 0.3, ease: easeOutQuint }
  },
  exit: {
    opacity: 0, x: 12,
    transition: { duration: 0.15 }
  },
};

export const listItemPop = {
  initial: { opacity: 0, scale: 0.88 },
  animate: {
    opacity: 1, scale: 1,
    transition: smoothSpring,
  },
  exit: {
    opacity: 0, scale: 0.95,
    transition: { duration: 0.1 }
  },
};

// =============================================
// COUNTER/NUMBER ANIMATIONS
// =============================================

export const counterAnimation = {
  initial: { opacity: 0, scale: 0.75 },
  animate: {
    opacity: 1, scale: 1,
    transition: {
      duration: 0.4,
      ease: easeOutExpo,
    }
  },
};

// =============================================
// SCROLL-TRIGGERED (whileInView)
// =============================================

export const revealUp = {
  initial: { opacity: 0, y: 24 },
  whileInView: {
    opacity: 1, y: 0,
    transition: {
      duration: 0.5,
      ease: easeOutQuint,
    }
  },
  viewport: { once: true, amount: 0.3 },
};

export const revealScale = {
  initial: { opacity: 0, scale: 0.94 },
  whileInView: {
    opacity: 1, scale: 1,
    transition: {
      duration: 0.45,
      ease: easeOutExpo,
    }
  },
  viewport: { once: true, amount: 0.3 },
};

// =============================================
// TRANSITION PRESETS
// =============================================

export const springTransition = smoothSpring;
export const snappyTransition = snappySpring;
export const bouncyTransition = bouncySpring;

export const smoothTransition = {
  duration: 0.35,
  ease: easeOutQuint,
};

export const quickTransition = {
  duration: 0.2,
  ease: easeOutQuint,
};

// =============================================
// LAYOUT ANIMATION HELPERS
// =============================================

export const layoutSpring = {
  type: "spring",
  stiffness: 300,
  damping: 30,
};

export const layoutSmooth = {
  duration: 0.3,
  ease: easeOutQuint,
};

// =============================================
// NAV PILL (layoutId animated element)
// =============================================

export const navPillSpring = {
  type: "spring",
  stiffness: 350,
  damping: 30,
  mass: 0.8,
};
```

**Step 2: Create confetti.js celebration utility**

Create `lib/confetti.js`:

```javascript
'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useState, useCallback } from 'react';

const PARTICLE_COLORS = ['#5B5EF5', '#7C4DFF', '#E040CB', '#F5A623', '#FFD700', '#2DDF8E'];

function randomBetween(min, max) {
  return Math.random() * (max - min) + min;
}

function Particle({ color, startX, startY, delay }) {
  const angle = randomBetween(0, Math.PI * 2);
  const velocity = randomBetween(60, 140);
  const endX = Math.cos(angle) * velocity;
  const endY = Math.sin(angle) * velocity - 40; // bias upward
  const rotation = randomBetween(-180, 180);
  const size = randomBetween(4, 8);

  return (
    <motion.div
      style={{
        position: 'absolute',
        left: startX,
        top: startY,
        width: size,
        height: size,
        borderRadius: size > 6 ? '2px' : '50%',
        background: color,
        pointerEvents: 'none',
      }}
      initial={{ opacity: 1, x: 0, y: 0, rotate: 0, scale: 1 }}
      animate={{
        opacity: [1, 1, 0],
        x: endX,
        y: endY,
        rotate: rotation,
        scale: [1, 1.2, 0.3],
      }}
      transition={{
        duration: 1.2,
        delay,
        ease: [0.22, 1, 0.36, 1],
      }}
    />
  );
}

export function ConfettiExplosion({ x = '50%', y = '50%', count = 20 }) {
  const particles = Array.from({ length: count }, (_, i) => ({
    id: i,
    color: PARTICLE_COLORS[i % PARTICLE_COLORS.length],
    delay: Math.random() * 0.1,
  }));

  return (
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden', zIndex: 50 }}>
      {particles.map((p) => (
        <Particle key={p.id} color={p.color} startX={x} startY={y} delay={p.delay} />
      ))}
    </div>
  );
}

export function useConfetti() {
  const [confetti, setConfetti] = useState(null);

  const fire = useCallback((opts = {}) => {
    const id = Date.now();
    setConfetti({ id, ...opts });
    setTimeout(() => setConfetti(null), 1500);
  }, []);

  const ConfettiComponent = confetti ? (
    <AnimatePresence>
      <ConfettiExplosion key={confetti.id} {...confetti} />
    </AnimatePresence>
  ) : null;

  return { fire, ConfettiComponent };
}
```

**Step 3: Build and verify**

Run: `cd /Users/vayun/projects/lockin-ui-ascend && npm run build`
Expected: Build passes.

**Step 4: Commit**

```bash
git add lib/animations.js lib/confetti.js
git commit -m "feat(ui-ascend): expand animation system with 3 tiers and confetti utility"
```

---

## Task 4: Sidebar — Gradient Background & Animated Nav Pill

**Files:**
- Modify: `components/Sidebar.module.css`
- Modify: `components/Sidebar.js` — animation variant updates only (add layoutId to active pill)

**Step 1: Update Sidebar.module.css**

Key changes:
- Background: add subtle gradient in dark mode, frosted glass in light
- Nav items: remove old active background, prepare for layoutId pill
- Active state: pill background with gradient, animated
- Hover: gray → accent color shift on icons
- Collapsed tooltips: spring pop-in styling

Read current `Sidebar.module.css` fully, then apply these CSS changes:

```css
.sidebar {
  position: fixed;
  top: 0;
  left: 0;
  bottom: 0;
  background: var(--surface-glass);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border-right: 1px solid var(--border-subtle);
  display: flex;
  flex-direction: column;
  z-index: var(--z-sticky);
  overflow: visible;
  will-change: width;
  transform: translateZ(0);
}
```

For nav items, add a `.navItemActive` class with:
```css
.navItemActive {
  color: var(--accent-primary);
}

.navPill {
  position: absolute;
  inset: 2px;
  background: var(--gradient-subtle);
  border-radius: var(--radius-lg);
  z-index: -1;
}
```

For icon hover:
```css
.navItem:hover .navIcon {
  color: var(--accent-primary);
  transition: color var(--transition-fast);
}
```

**Step 2: Update Sidebar.js**

Add `layoutId="nav-pill"` to the active indicator `motion.div`:

```javascript
{isActive && (
  <motion.div
    className={styles.navPill}
    layoutId="nav-pill"
    transition={navPillSpring}
  />
)}
```

Import `navPillSpring` from `@/lib/animations`.

**Step 3: Build and verify**

Run: `cd /Users/vayun/projects/lockin-ui-ascend && npm run build`
Expected: Build passes.

**Step 4: Visual verify**

Run: `cd /Users/vayun/projects/lockin-ui-ascend && npm run dev -- --port 3001`
Check: Navigate between sidebar items. The pill should animate smoothly between them.

**Step 5: Commit**

```bash
git add components/Sidebar.module.css components/Sidebar.js
git commit -m "feat(ui-ascend): sidebar glass background and animated nav pill"
```

---

## Task 5: Card System — PactCard, TaskCard, DailySummaryCard

**Files:**
- Modify: `components/PactCard.module.css`
- Modify: `components/TaskCard.module.css`
- Modify: `components/DailySummaryCard.module.css`

**Step 1: Update PactCard.module.css**

Key changes:
- Card background: frosted glass surface
- Hover: higher lift + accent-tinted shadow
- Left stripe: glowing (radiates via box-shadow on the ::before)
- Completed state: add shimmer sweep

```css
.card {
  background: var(--surface-glass);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-xl);
  padding: var(--space-5);
  transition: all var(--transition-base);
  position: relative;
  overflow: hidden;
}

.card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 3px;
  height: 100%;
  background: var(--accent-primary);
  opacity: 0;
  transition: opacity var(--transition-base);
  box-shadow: 0 0 12px rgba(var(--accent-primary-rgb), 0.4);
}

.card:hover {
  background: var(--surface-1);
  border-color: var(--border-default);
  box-shadow: var(--shadow-lg);
  transform: translateY(-3px);
}

.card.active::before {
  background: var(--gradient-primary);
  opacity: 1;
  box-shadow: 0 0 16px rgba(var(--accent-primary-rgb), 0.5);
}

.card.completed::before {
  background: var(--success);
  opacity: 1;
  box-shadow: 0 0 12px var(--success-glow);
}

.card.missed::before {
  background: var(--danger);
  opacity: 1;
  box-shadow: 0 0 12px var(--danger-glow);
}
```

**Step 2: Update TaskCard.module.css**

Add same left-stripe system that PactCard has. Apply same frosted glass treatment. Read full file first, then add `::before` pseudo-element and status classes matching PactCard pattern.

**Step 3: Update DailySummaryCard.module.css**

Apply frosted glass, accent-tinted shadow on hover. Streak badge gets celebration gold accent.

**Step 4: Build and verify**

Run: `cd /Users/vayun/projects/lockin-ui-ascend && npm run build`

**Step 5: Commit**

```bash
git add components/PactCard.module.css components/TaskCard.module.css components/DailySummaryCard.module.css
git commit -m "feat(ui-ascend): frosted glass cards with glowing stripes"
```

---

## Task 6: Focus Timer — Gradient Ring & Breathing Glow

**Files:**
- Modify: `components/FocusTimer.module.css`
- Modify: `components/FocusTimer.js` — only to update gradient SVG defs if needed

**Step 1: Update FocusTimer.module.css**

Key changes:
- Container: frosted glass
- Timer ring: add breathing glow when active (use `animation: breathe`)
- Background darkens during active session
- Time display: weight 800
- Completion: radial glow burst via CSS animation

```css
.container {
  background: var(--surface-glass);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-2xl);
  overflow: hidden;
}

.timerRing {
  position: relative;
  width: 200px;
  height: 200px;
}

.timerRing::after {
  content: '';
  position: absolute;
  inset: -8px;
  border-radius: 50%;
  background: transparent;
  transition: box-shadow 0.5s ease;
}

.timerRing.active::after {
  animation: breathe 4s ease-in-out infinite;
  box-shadow: 0 0 30px rgba(var(--accent-primary-rgb), 0.2);
}

.time {
  font-size: var(--text-5xl);
  font-weight: 800;
  font-variant-numeric: tabular-nums;
  color: var(--text-primary);
  letter-spacing: -0.03em;
}

.statValue {
  font-size: var(--text-2xl);
  font-weight: 800;
  background: var(--gradient-primary);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  font-variant-numeric: tabular-nums;
}
```

**Step 2: Build and verify**

Run: `cd /Users/vayun/projects/lockin-ui-ascend && npm run build`

**Step 3: Commit**

```bash
git add components/FocusTimer.module.css
git commit -m "feat(ui-ascend): focus timer gradient ring with breathing glow"
```

---

## Task 7: XP Bar — Shine Glint & Elastic Stretch

**Files:**
- Modify: `components/XPBar.module.css`

**Step 1: Update XPBar.module.css**

```css
.container {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
  margin-top: var(--space-3);
  max-width: 180px;
}

.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.levelBadge {
  background: var(--gradient-primary);
  color: white;
  padding: 2px 10px;
  border-radius: var(--radius-full);
  font-size: 11px;
  font-weight: var(--font-extrabold);
  letter-spacing: 0.02em;
  box-shadow: 0 0 12px rgba(var(--accent-primary-rgb), 0.3);
}

.xpText {
  font-size: 11px;
  color: var(--text-tertiary);
  font-weight: var(--font-semibold);
  font-variant-numeric: tabular-nums;
}

.track {
  height: 6px;
  background: var(--surface-3);
  border-radius: var(--radius-full);
  overflow: hidden;
  position: relative;
}

.fill {
  height: 100%;
  background: var(--gradient-primary);
  border-radius: var(--radius-full);
  position: relative;
  transition: width 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
}

/* Shine glint sweep */
.fill::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 40%;
  height: 100%;
  background: linear-gradient(
    90deg,
    transparent,
    rgba(255, 255, 255, 0.35),
    transparent
  );
  animation: shimmerGlint 5s ease-in-out infinite;
}
```

**Step 2: Build and verify**

Run: `cd /Users/vayun/projects/lockin-ui-ascend && npm run build`

**Step 3: Commit**

```bash
git add components/XPBar.module.css
git commit -m "feat(ui-ascend): XP bar with shine glint and elastic fill"
```

---

## Task 8: Monthly Calendar — Hue-Shifted Levels & Today Pulse

**Files:**
- Modify: `components/MonthlyCalendar.module.css`

**Step 1: Update activity level colors**

Replace the level classes with hue-shifted accent palette:

```css
.level0 { background: var(--surface-2); }
.level1 { background: rgba(91, 94, 245, 0.15); }
.level2 { background: rgba(124, 77, 255, 0.3); }
.level3 { background: rgba(180, 74, 230, 0.45); }
.level4 { background: rgba(224, 64, 203, 0.6); }
```

Dark mode variants:
```css
[data-theme="dark"] .level1 { background: rgba(91, 94, 245, 0.25); }
[data-theme="dark"] .level2 { background: rgba(124, 77, 255, 0.4); }
[data-theme="dark"] .level3 { background: rgba(180, 74, 230, 0.55); }
[data-theme="dark"] .level4 { background: rgba(224, 64, 203, 0.75); }
```

**Step 2: Add today pulse**

```css
.today {
  animation: ringPulse 2.5s ease-in-out infinite;
}
```

**Step 3: Update streak badges for celebration gold**

```css
.streakBadge {
  background: rgba(var(--accent-celebration-rgb), 0.15);
  color: var(--accent-celebration);
  box-shadow: 0 0 12px rgba(var(--accent-celebration-rgb), 0.15);
}
```

**Step 4: Build and verify**

Run: `cd /Users/vayun/projects/lockin-ui-ascend && npm run build`

**Step 5: Commit**

```bash
git add components/MonthlyCalendar.module.css
git commit -m "feat(ui-ascend): calendar hue-shifted activity levels and today pulse"
```

---

## Task 9: Modals — Blur Overlay, Spring Scale, Glow Inputs

**Files:**
- Modify: `components/CreatePactModal.module.css`
- Modify: `components/CreateGroupModal.module.css`
- Modify: `components/CreateTaskModal.module.css`
- Modify: `components/OnboardingModal.module.css`

**Step 1: Update shared modal patterns across all 4 files**

For each modal, update the overlay and modal container:

```css
.overlay {
  position: fixed;
  inset: 0;
  background: rgba(8, 9, 13, 0.6);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  z-index: var(--z-modal-backdrop);
  animation: fadeIn 0.2s ease forwards;
}

.modal {
  background: var(--surface-glass);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-2xl);
  box-shadow: var(--shadow-2xl);
  /* spring scale handled by Framer Motion modalContent variant */
}
```

For form inputs in modals:
```css
.input:focus,
.textarea:focus,
.select:focus {
  border-color: var(--accent-primary);
  box-shadow: 0 0 0 3px rgba(var(--accent-primary-rgb), 0.15), 0 0 20px rgba(var(--accent-primary-rgb), 0.08);
}
```

For submit buttons in modals:
```css
.submitBtn {
  background: var(--gradient-primary);
  border-radius: var(--radius-full);
  box-shadow: var(--shadow-md), 0 0 20px rgba(var(--accent-primary-rgb), 0.2);
}

.submitBtn:hover {
  box-shadow: var(--shadow-lg), 0 0 35px rgba(var(--accent-primary-rgb), 0.35);
  filter: brightness(1.05);
}
```

**Step 2: Build and verify**

Run: `cd /Users/vayun/projects/lockin-ui-ascend && npm run build`

**Step 3: Commit**

```bash
git add components/CreatePactModal.module.css components/CreateGroupModal.module.css components/CreateTaskModal.module.css components/OnboardingModal.module.css
git commit -m "feat(ui-ascend): modal blur overlays with spring scale and glow inputs"
```

---

## Task 10: Activity Feed & Items — Gradient Timeline & Framer Stagger

**Files:**
- Modify: `components/ActivityItem.module.css`
- Modify: `components/ActivityFeed.module.css`
- Modify: `components/ActivityItem.js` — replace custom CSS animation with Framer Motion stagger
- Modify: `components/CompactActivityCard.module.css`

**Step 1: Update ActivityFeed.module.css**

Apply frosted glass to container. Make the feed header use uppercase tracking.

**Step 2: Update ActivityItem.module.css**

Remove the custom `@keyframes fadeSlideIn` and stagger delay classes. These will be replaced by Framer Motion variants in the JS.

Update timeline connector line:
```css
.timelineConnector {
  background: linear-gradient(to bottom, var(--accent-primary), transparent);
  opacity: 0.3;
}
```

Update timeline icon backgrounds for richer colors:
```css
.iconPurple { background: rgba(91, 94, 245, 0.15); color: #5B5EF5; }
.iconGreen { background: rgba(13, 191, 115, 0.15); color: #0DBF73; }
.iconYellow { background: rgba(245, 166, 35, 0.15); color: #F5A623; }
.iconBlue { background: rgba(59, 123, 246, 0.15); color: #3B7BF6; }
.iconRed { background: rgba(239, 68, 68, 0.15); color: #EF4444; }
```

Reaction picker: add spring pop-in via Framer Motion in JS.

**Step 3: Update ActivityItem.js**

Replace CSS animation with Framer Motion:
```javascript
import { motion } from 'framer-motion';
import { staggerItem } from '@/lib/animations';

// Wrap the item in motion.div with staggerItem variants
<motion.div variants={staggerItem} className={styles.item}>
```

The parent (ActivityFeed) should use `staggerContainer`.

**Step 4: Update CompactActivityCard.module.css**

Apply same frosted glass and accent-tinted shadow treatment.

**Step 5: Build and verify**

Run: `cd /Users/vayun/projects/lockin-ui-ascend && npm run build`

**Step 6: Commit**

```bash
git add components/ActivityItem.module.css components/ActivityItem.js components/ActivityFeed.module.css components/CompactActivityCard.module.css
git commit -m "feat(ui-ascend): activity feed gradient timeline and Framer Motion stagger"
```

---

## Task 11: Notification Bell, Toast, NudgeButton

**Files:**
- Modify: `components/NotificationBell.module.css`
- Modify: `components/Toast.module.css`
- Modify: `components/NudgeButton.module.css`

**Step 1: Update NotificationBell.module.css**

Badge pulse:
```css
.badge {
  animation: dotPulse 3s ease-in-out infinite;
}
```

Bell wiggle on new notification (add class `.wiggle`):
```css
.wiggle {
  animation: bellWiggle 0.6s ease-in-out;
}
```

Dropdown: frosted glass, spring entrance, staggered items.

**Step 2: Update Toast.module.css**

Add accent-colored left glow border:
```css
.toast {
  border-left: 3px solid;
  position: relative;
  overflow: hidden;
}

.toast.success { border-left-color: var(--success); box-shadow: -4px 0 16px var(--success-glow); }
.toast.error { border-left-color: var(--danger); box-shadow: -4px 0 16px var(--danger-glow); }
.toast.warning { border-left-color: var(--warning); box-shadow: -4px 0 16px var(--warning-glow); }
.toast.info { border-left-color: var(--info); box-shadow: -4px 0 16px var(--info-glow); }

/* Auto-dismiss progress bar */
.toast::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  height: 2px;
  background: var(--accent-primary);
  animation: toastProgress var(--toast-duration, 4s) linear forwards;
}

@keyframes toastProgress {
  from { width: 100%; }
  to { width: 0%; }
}
```

**Step 3: Update NudgeButton.module.css**

Apply rounded radius, hover glow, tap feedback.

**Step 4: Build and verify**

Run: `cd /Users/vayun/projects/lockin-ui-ascend && npm run build`

**Step 5: Commit**

```bash
git add components/NotificationBell.module.css components/Toast.module.css components/NudgeButton.module.css
git commit -m "feat(ui-ascend): notification pulse, toast glow borders, nudge refresh"
```

---

## Task 12: Mobile Nav & Navbar

**Files:**
- Modify: `components/MobileNav.module.css`
- Modify: `components/Navbar.module.css`

**Step 1: Update MobileNav.module.css**

Active tab: dot indicator below, filled icon, spring between tabs:
```css
.navItem.active::after {
  content: '';
  position: absolute;
  bottom: 4px;
  left: 50%;
  transform: translateX(-50%);
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background: var(--accent-primary);
  box-shadow: 0 0 8px rgba(var(--accent-primary-rgb), 0.4);
}

.navItem:active {
  transform: scale(0.92);
  transition: transform 0.08s ease;
}
```

**Step 2: Update Navbar.module.css**

Apply frosted glass treatment, matching sidebar aesthetic.

**Step 3: Build and verify**

Run: `cd /Users/vayun/projects/lockin-ui-ascend && npm run build`

**Step 4: Commit**

```bash
git add components/MobileNav.module.css components/Navbar.module.css
git commit -m "feat(ui-ascend): mobile nav dot indicator and navbar glass treatment"
```

---

## Task 13: Dashboard Layouts & Page Styles

**Files:**
- Modify: `app/dashboard/DashboardLayout.module.css`
- Modify: `app/dashboard/Dashboard.module.css`
- Modify: CSS in `app/dashboard/pacts/`, `app/dashboard/groups/`, `app/dashboard/focus/`, `app/dashboard/stats/`, `app/dashboard/settings/`

**Step 1: Update DashboardLayout.module.css**

Minimal changes — layout is structural. Ensure background inherits properly with new tokens.

**Step 2: Update Dashboard.module.css**

- Stat cards: frosted glass, accent-tinted shadows, hover lift with glow
- Section headers: tighter tracking, weight 800
- Empty states: gradient icon treatment
- Auth card: glassmorphism treatment

Read full file, apply frosted glass to stat cards:
```css
.statCard {
  background: var(--surface-glass);
  backdrop-filter: blur(12px);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-xl);
  transition: all var(--transition-base);
}

.statCard:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-lg);
  border-color: var(--border-default);
}
```

**Step 3: Update remaining dashboard page CSS files**

For each page under `app/dashboard/*/`, read its CSS and apply:
- Frosted glass surfaces where appropriate
- Updated heading weights and tracking
- Hover states with accent-tinted shadows
- Consistent border radius per shape language spec

**Step 4: Build and verify**

Run: `cd /Users/vayun/projects/lockin-ui-ascend && npm run build`

**Step 5: Commit**

```bash
git add app/dashboard/
git commit -m "feat(ui-ascend): dashboard layouts and page styles refreshed"
```

---

## Task 14: Landing Page Showpiece

**Files:**
- Modify: `app/page.js` — update animation variants, add gradient text
- Modify: landing page CSS (inline or module)

**Step 1: Read current landing page**

Read `app/page.js` fully to understand current structure.

**Step 2: Update hero section**

- Headline: gradient text using `--gradient-primary` via `.text-gradient` class
- Tighter letter-spacing on hero text: `-0.04em`
- CTA button: gradient + shimmer + strong hover glow

```css
.heroTitle {
  font-size: var(--text-6xl);
  font-weight: 800;
  letter-spacing: -0.04em;
  line-height: 1.1;
  background: var(--gradient-primary);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.ctaButton {
  background: var(--gradient-primary);
  background-size: 200% 200%;
  animation: gradientShift 4s ease infinite;
  border-radius: var(--radius-full);
  padding: var(--space-4) var(--space-8);
  font-weight: var(--font-bold);
  box-shadow: var(--shadow-glow-lg);
  transition: all var(--transition-base);
}

.ctaButton:hover {
  transform: translateY(-3px);
  box-shadow: 0 0 50px rgba(var(--accent-primary-rgb), 0.4);
}
```

**Step 3: Add ambient background orbs**

```css
.heroBackground {
  position: absolute;
  inset: 0;
  overflow: hidden;
  z-index: -1;
}

.orb {
  position: absolute;
  border-radius: 50%;
  filter: blur(80px);
  opacity: 0.4;
  animation: ambientFloat 6s ease-in-out infinite;
}

.orb1 {
  width: 400px;
  height: 400px;
  background: rgba(var(--accent-primary-rgb), 0.3);
  top: -10%;
  right: 10%;
}

.orb2 {
  width: 300px;
  height: 300px;
  background: rgba(var(--accent-tertiary-rgb), 0.25);
  bottom: 10%;
  left: 5%;
  animation-delay: 2s;
}
```

**Step 4: Add scroll-triggered reveals**

Use `revealUp` from animations.js on feature sections.

**Step 5: Build and verify**

Run: `cd /Users/vayun/projects/lockin-ui-ascend && npm run build`

**Step 6: Commit**

```bash
git add app/page.js
git commit -m "feat(ui-ascend): landing page showpiece with gradient hero and ambient orbs"
```

---

## Task 15: Remaining Components — ThemeToggle, GroupStats, ActivityComments

**Files:**
- Modify: `components/ThemeToggle.module.css`
- Modify: `components/GroupStats.module.css`
- Modify: `components/ActivityComments.module.css`

**Step 1: Update each file**

Apply consistent frosted glass, updated radii, accent-tinted shadows, and hover states matching the rest of the system. Read each file first, then apply the established patterns.

**Step 2: Build and verify**

Run: `cd /Users/vayun/projects/lockin-ui-ascend && npm run build`

**Step 3: Commit**

```bash
git add components/ThemeToggle.module.css components/GroupStats.module.css components/ActivityComments.module.css
git commit -m "feat(ui-ascend): theme toggle, group stats, activity comments refreshed"
```

---

## Task 16: Integration Wiring — Connect Celebrations to Feature Logic

**Files:**
- Modify: `components/PactCard.js` — add confetti on pact completion
- Modify: `components/DailySummaryCard.js` — add streak celebration on milestone display
- Modify: `components/XPBar.js` — add flash animation on XP gain
- Modify: `components/FocusTimer.js` — add completion celebration

**Step 1: Wire confetti to pact completion**

In PactCard.js, import `useConfetti` and fire on the completion handler:

```javascript
import { useConfetti } from '@/lib/confetti';

// Inside component:
const { fire, ConfettiComponent } = useConfetti();

// In completion handler:
const handleComplete = async () => {
  // ...existing completion logic...
  fire({ x: '50%', y: '50%' });
};

// In JSX, add ConfettiComponent inside the card:
<div className={styles.card}>
  {ConfettiComponent}
  {/* ...rest of card */}
</div>
```

**Step 2: Wire streak celebration**

In DailySummaryCard.js, use `celebrationBounce` on streak badge when streak >= 7.

**Step 3: Wire XP flash**

In XPBar.js, use `xpFillFlash` on the fill bar when XP changes.

**Step 4: Wire focus timer completion**

In FocusTimer.js, add celebration glow when session completes.

**Step 5: Build and verify**

Run: `cd /Users/vayun/projects/lockin-ui-ascend && npm run build`

**Step 6: Commit**

```bash
git add components/PactCard.js components/DailySummaryCard.js components/XPBar.js components/FocusTimer.js
git commit -m "feat(ui-ascend): wire celebration animations to feature triggers"
```

---

## Task 17: Accessibility & Reduced Motion Pass

**Files:**
- Modify: `app/globals.css` (update `prefers-reduced-motion` rule)

**Step 1: Verify reduced motion handling**

The existing `@media (prefers-reduced-motion: reduce)` rule at the bottom of globals.css already disables all CSS animations. Verify that Framer Motion celebrations also respect this.

In `lib/confetti.js`, add at the top:

```javascript
function prefersReducedMotion() {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}
```

Update `useConfetti`:
```javascript
const fire = useCallback((opts = {}) => {
  if (prefersReducedMotion()) return; // Skip confetti
  const id = Date.now();
  setConfetti({ id, ...opts });
  setTimeout(() => setConfetti(null), 1500);
}, []);
```

**Step 2: Verify color contrast**

Spot-check key text/background combos with the new tokens:
- `--text-primary` (#16152A) on `--bg-primary` (#FAFAFF) → dark on light, excellent contrast
- `--text-secondary` (#524E68) on `--bg-primary` (#FAFAFF) → check passes AA
- Dark mode: `--text-primary` (#F0F0FF) on `--bg-primary` (#08090D) → excellent

**Step 3: Build and verify**

Run: `cd /Users/vayun/projects/lockin-ui-ascend && npm run build`

**Step 4: Commit**

```bash
git add lib/confetti.js app/globals.css
git commit -m "feat(ui-ascend): accessibility pass — reduced motion and contrast verification"
```

---

## Task 18: Final Build, Visual QA, and E2E Tests

**Step 1: Full production build**

Run: `cd /Users/vayun/projects/lockin-ui-ascend && npm run build`
Expected: Build passes with no errors.

**Step 2: Run existing E2E tests**

Run: `cd /Users/vayun/projects/lockin-ui-ascend && npm run test:e2e`
Expected: All existing tests pass (no feature logic was changed).

**Step 3: Visual QA checklist**

Run dev server on port 3001: `npm run dev -- --port 3001`

Check each page in both light and dark mode:
- [ ] Landing page: gradient hero, ambient orbs, CTA glow
- [ ] Dashboard: frosted cards, stat card hovers, stagger animations
- [ ] Pacts: card stripes glow, completion confetti
- [ ] Groups: task cards with left stripes, Kanban styling
- [ ] Focus: breathing glow ring, gradient stroke, completion burst
- [ ] Stats: calendar hue-shifted levels, today pulse, streak gold
- [ ] Settings: consistent form styling, glow inputs
- [ ] Sidebar: glass background, nav pill animation between items
- [ ] Mobile: bottom nav dot indicator, responsive layouts intact

**Step 4: Final commit if any QA fixes needed**

```bash
git add -A
git commit -m "fix(ui-ascend): visual QA fixes"
```

---

## Execution Complete

After all 18 tasks:
- Branch `ui-ascend` has all changes isolated
- Main branch is untouched
- Run both side-by-side to compare:
  - `cd /Users/vayun/projects/lockin && npm run dev` (port 3000, original)
  - `cd /Users/vayun/projects/lockin-ui-ascend && npm run dev -- --port 3001` (port 3001, redesign)
- When satisfied, create PR: `gh pr create --base main --head ui-ascend`
