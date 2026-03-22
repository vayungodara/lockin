'use client';

import confetti from 'canvas-confetti';
import { useCallback } from 'react';

const BRAND_COLORS = ['#6366F1', '#8B5CF6', '#D946EF', '#F5A623', '#FFD700', '#2DDF8E'];

function prefersReducedMotion() {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Fire a confetti burst from the center of the screen.
 */
export function fireConfetti() {
  if (prefersReducedMotion()) return;
  confetti({
    particleCount: 80,
    spread: 70,
    origin: { y: 0.6 },
    colors: BRAND_COLORS,
  });
}

/**
 * Fire confetti from a specific DOM element's position.
 */
export function fireConfettiFromElement(element) {
  if (prefersReducedMotion() || !element) return;
  const rect = element.getBoundingClientRect();
  const x = (rect.left + rect.width / 2) / window.innerWidth;
  const y = (rect.top + rect.height / 2) / window.innerHeight;
  confetti({
    particleCount: 60,
    spread: 55,
    origin: { x, y },
    colors: BRAND_COLORS,
  });
}

/**
 * Fire confetti from both sides of the screen.
 */
export function fireSideConfetti() {
  if (prefersReducedMotion()) return;
  const defaults = { colors: BRAND_COLORS, startVelocity: 30, spread: 360, ticks: 60, zIndex: 9999 };
  confetti({ ...defaults, particleCount: 40, origin: { x: 0, y: 0.5 }, angle: 60 });
  confetti({ ...defaults, particleCount: 40, origin: { x: 1, y: 0.5 }, angle: 120 });
}

/**
 * Fire star-shaped confetti.
 */
export function fireStars() {
  if (prefersReducedMotion()) return;
  const defaults = { spread: 360, ticks: 80, decay: 0.94, startVelocity: 20, zIndex: 9999, colors: BRAND_COLORS };
  confetti({ ...defaults, particleCount: 30, shapes: ['star'], scalar: 1.2 });
  setTimeout(() => {
    confetti({ ...defaults, particleCount: 20, shapes: ['star'], scalar: 0.8 });
  }, 150);
}

/**
 * Fire a dramatic multi-burst confetti for streak milestones (7, 14, 30, 50, 100 days).
 * Uses gold + brand colors, star shapes, and three staggered bursts.
 */
export function fireMilestoneConfetti() {
  if (prefersReducedMotion()) return;

  const GOLD_COLORS = ['#FFD700', '#FFA500', '#FF8C00', '#6366F1', '#8B5CF6', '#D946EF'];

  // First burst — wide center shower
  confetti({
    particleCount: 120,
    spread: 100,
    origin: { y: 0.5 },
    colors: GOLD_COLORS,
    startVelocity: 45,
    ticks: 100,
    zIndex: 9999,
  });

  // Second burst — stars from both sides (delayed)
  setTimeout(() => {
    const sideDefaults = {
      colors: GOLD_COLORS,
      startVelocity: 35,
      spread: 80,
      ticks: 90,
      zIndex: 9999,
      shapes: ['star'],
      scalar: 1.3,
    };
    confetti({ ...sideDefaults, particleCount: 50, origin: { x: 0.1, y: 0.6 }, angle: 60 });
    confetti({ ...sideDefaults, particleCount: 50, origin: { x: 0.9, y: 0.6 }, angle: 120 });
  }, 300);

  // Third burst — floating stars from top center
  setTimeout(() => {
    confetti({
      particleCount: 40,
      spread: 360,
      origin: { x: 0.5, y: 0.3 },
      colors: GOLD_COLORS,
      shapes: ['star'],
      scalar: 1.5,
      startVelocity: 15,
      ticks: 120,
      decay: 0.92,
      gravity: 0.6,
      zIndex: 9999,
    });
  }, 700);
}

/**
 * React hook for triggering confetti from a component.
 * Returns { fire, ConfettiComponent } — ConfettiComponent is null (canvas-confetti manages its own canvas).
 */
export function useConfetti() {
  const fire = useCallback((opts = {}) => {
    if (prefersReducedMotion()) return;
    const { x, y } = opts;
    const origin = {};
    if (x !== undefined) origin.x = typeof x === 'string' ? 0.5 : x / window.innerWidth;
    if (y !== undefined) origin.y = typeof y === 'string' ? 0.5 : y / window.innerHeight;
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6, ...origin },
      colors: BRAND_COLORS,
    });
  }, []);

  // No component needed — canvas-confetti creates its own canvas
  return { fire, ConfettiComponent: null };
}
