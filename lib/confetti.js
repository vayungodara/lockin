'use client';

import { useCallback } from 'react';
import confetti from 'canvas-confetti';

const BRAND_COLORS = ['#6366F1', '#8B5CF6', '#D946EF', '#F5A623', '#FFD700', '#2DDF8E'];
const GOLD_COLORS = ['#FFD700', '#FFA500', '#FF8C00', '#6366F1', '#8B5CF6', '#D946EF'];

export function fireConfetti() {
  confetti({
    particleCount: 80,
    spread: 70,
    origin: { y: 0.6 },
    colors: BRAND_COLORS,
    zIndex: 9999,
    disableForReducedMotion: false,
  });
}

export function fireConfettiFromElement(element) {
  if (!element) return;
  const rect = element.getBoundingClientRect();
  const x = (rect.left + rect.width / 2) / window.innerWidth;
  const y = (rect.top + rect.height / 2) / window.innerHeight;
  confetti({
    particleCount: 60,
    spread: 55,
    origin: { x, y },
    colors: BRAND_COLORS,
    zIndex: 9999,
    disableForReducedMotion: false,
  });
}

export function fireSideConfetti() {
  const defaults = {
    colors: BRAND_COLORS,
    startVelocity: 30,
    spread: 360,
    ticks: 60,
    zIndex: 9999,
    disableForReducedMotion: false,
  };
  confetti({ ...defaults, particleCount: 40, origin: { x: 0, y: 0.5 }, angle: 60 });
  confetti({ ...defaults, particleCount: 40, origin: { x: 1, y: 0.5 }, angle: 120 });
}

export function fireStars() {
  const defaults = {
    spread: 360,
    ticks: 80,
    decay: 0.94,
    startVelocity: 20,
    zIndex: 9999,
    colors: BRAND_COLORS,
    disableForReducedMotion: false,
  };
  confetti({ ...defaults, particleCount: 30, shapes: ['star'], scalar: 1.2 });
  setTimeout(() => {
    confetti({ ...defaults, particleCount: 20, shapes: ['star'], scalar: 0.8 });
  }, 150);
}

export function fireMilestoneConfetti() {
  confetti({
    particleCount: 120,
    spread: 100,
    origin: { y: 0.5 },
    colors: GOLD_COLORS,
    startVelocity: 45,
    ticks: 100,
    zIndex: 9999,
    disableForReducedMotion: false,
  });
  setTimeout(() => {
    const sideDefaults = {
      colors: GOLD_COLORS,
      startVelocity: 35,
      spread: 80,
      ticks: 90,
      zIndex: 9999,
      shapes: ['star'],
      scalar: 1.3,
      disableForReducedMotion: false,
    };
    confetti({ ...sideDefaults, particleCount: 50, origin: { x: 0.1, y: 0.6 }, angle: 60 });
    confetti({ ...sideDefaults, particleCount: 50, origin: { x: 0.9, y: 0.6 }, angle: 120 });
  }, 300);
}

export function useConfetti() {
  const fire = useCallback((opts = {}) => {
    const { x, y } = opts;
    const originX = x !== undefined ? x / window.innerWidth : 0.5;
    const originY = y !== undefined ? y / window.innerHeight : 0.6;
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { x: originX, y: originY },
      colors: BRAND_COLORS,
      zIndex: 9999,
      disableForReducedMotion: false,
    });
  }, []);

  return { fire, ConfettiComponent: null };
}
