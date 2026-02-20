'use client';

import confetti from 'canvas-confetti';
import { ACCENT_PALETTES, DEFAULT_PALETTE_ID } from '@/lib/accentColors';

const defaults = {
  origin: { y: 0.7 },
  zIndex: 9999,
};

function getAccentColors() {
  if (typeof window === 'undefined') return ['#6366F1', '#8B5CF6', '#D946EF'];
  const id = localStorage.getItem('lockin-accent') || DEFAULT_PALETTE_ID;
  const palette = ACCENT_PALETTES.find((p) => p.id === id);
  if (!palette) return ['#6366F1', '#8B5CF6', '#D946EF'];
  return [palette.primary, palette.secondary, palette.tertiary];
}

export function fireConfetti() {
  const count = 200;
  const colors = getAccentColors();

  function fire(particleRatio, opts) {
    confetti({
      ...defaults,
      ...opts,
      particleCount: Math.floor(count * particleRatio),
    });
  }

  fire(0.25, {
    spread: 26,
    startVelocity: 55,
    colors,
  });

  fire(0.2, {
    spread: 60,
    colors,
  });

  fire(0.35, {
    spread: 100,
    decay: 0.91,
    scalar: 0.8,
    colors: [...colors, '#F59E0B', '#10B981'],
  });

  fire(0.1, {
    spread: 120,
    startVelocity: 25,
    decay: 0.92,
    scalar: 1.2,
    colors,
  });

  fire(0.1, {
    spread: 120,
    startVelocity: 45,
    colors: [...colors, '#10B981'],
  });
}

export function fireConfettiFromElement(element) {
  if (!element) return fireConfetti();

  const rect = element.getBoundingClientRect();
  const x = (rect.left + rect.width / 2) / window.innerWidth;
  const y = (rect.top + rect.height / 2) / window.innerHeight;
  const colors = getAccentColors();

  confetti({
    particleCount: 100,
    spread: 70,
    origin: { x, y },
    colors: [...colors, '#10B981', '#F59E0B'],
    zIndex: 9999,
  });
}

export function fireStars() {
  const colors = getAccentColors();
  const defaults = {
    spread: 360,
    ticks: 100,
    gravity: 0,
    decay: 0.94,
    startVelocity: 30,
    colors,
    zIndex: 9999,
  };

  function shoot() {
    confetti({
      ...defaults,
      particleCount: 40,
      scalar: 1.2,
      shapes: ['circle', 'square'],
      origin: { x: Math.random(), y: Math.random() * 0.5 },
    });

    confetti({
      ...defaults,
      particleCount: 20,
      scalar: 0.75,
      shapes: ['circle'],
      origin: { x: Math.random(), y: Math.random() * 0.5 },
    });
  }

  setTimeout(shoot, 0);
  setTimeout(shoot, 100);
  setTimeout(shoot, 200);
}

export function fireSideConfetti() {
  const end = Date.now() + 1000;
  const colors = getAccentColors();

  (function frame() {
    confetti({
      particleCount: 3,
      angle: 60,
      spread: 55,
      origin: { x: 0 },
      colors: colors,
      zIndex: 9999,
    });

    confetti({
      particleCount: 3,
      angle: 120,
      spread: 55,
      origin: { x: 1 },
      colors: colors,
      zIndex: 9999,
    });

    if (Date.now() < end) {
      requestAnimationFrame(frame);
    }
  })();
}
