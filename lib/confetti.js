'use client';

import { useCallback } from 'react';

const BRAND_COLORS = ['#6366F1', '#8B5CF6', '#D946EF', '#F5A623', '#FFD700', '#2DDF8E'];

function prefersReducedMotion() {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

let canvasConfettiModule = null;
let canvasConfettiLoadFailed = false;

async function getCanvasConfetti() {
  if (canvasConfettiModule) return canvasConfettiModule;
  if (canvasConfettiLoadFailed) return null;
  try {
    const mod = await import('canvas-confetti');
    canvasConfettiModule = mod.default || mod;
    return canvasConfettiModule;
  } catch (err) {
    console.warn('[confetti] canvas-confetti failed to load, falling back to DOM renderer', err);
    canvasConfettiLoadFailed = true;
    return null;
  }
}

function fireDomConfetti(bursts) {
  if (typeof document === 'undefined') return;
  const container = document.createElement('div');
  container.setAttribute('aria-hidden', 'true');
  container.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:9999;overflow:hidden';
  document.body.appendChild(container);

  const particles = [];
  for (const burst of bursts) {
    const { count, x, y, spreadDeg, velocity, angleDeg } = burst;
    const originPx = {
      x: x * window.innerWidth,
      y: y * window.innerHeight,
    };
    for (let i = 0; i < count; i++) {
      const el = document.createElement('div');
      const color = BRAND_COLORS[Math.floor(Math.random() * BRAND_COLORS.length)];
      const size = 6 + Math.random() * 6;
      const rotation = Math.random() * 360;
      el.style.cssText = `position:absolute;left:${originPx.x}px;top:${originPx.y}px;width:${size}px;height:${size * 0.4}px;background:${color};transform:rotate(${rotation}deg);border-radius:1px;will-change:transform,opacity`;
      container.appendChild(el);
      const baseAngle = (angleDeg ?? 90) * (Math.PI / 180);
      const spread = (spreadDeg / 2) * (Math.PI / 180);
      const angle = baseAngle - Math.PI + (Math.random() - 0.5) * 2 * spread;
      const speed = velocity * (0.6 + Math.random() * 0.8);
      particles.push({
        el,
        x: originPx.x,
        y: originPx.y,
        vx: Math.cos(angle) * speed,
        vy: -Math.sin(angle) * speed,
        rotation,
        rotationSpeed: (Math.random() - 0.5) * 12,
        opacity: 1,
      });
    }
  }

  const gravity = 0.55;
  const drag = 0.985;
  const start = performance.now();
  let last = start;
  function tick(now) {
    const dt = Math.min(32, now - last);
    last = now;
    const elapsed = now - start;
    for (const p of particles) {
      p.vy += gravity * (dt / 16);
      p.vx *= drag;
      p.vy *= drag;
      p.x += p.vx * (dt / 16);
      p.y += p.vy * (dt / 16);
      p.rotation += p.rotationSpeed;
      p.opacity = Math.max(0, 1 - elapsed / 2200);
      p.el.style.transform = `translate(${p.x - parseFloat(p.el.style.left)}px, ${p.y - parseFloat(p.el.style.top)}px) rotate(${p.rotation}deg)`;
      p.el.style.opacity = String(p.opacity);
    }
    if (elapsed < 2400) {
      requestAnimationFrame(tick);
    } else {
      container.remove();
    }
  }
  requestAnimationFrame(tick);
}

async function fireCanvas(options) {
  const confetti = await getCanvasConfetti();
  if (!confetti) return false;
  try {
    confetti(options);
    return true;
  } catch (err) {
    console.warn('[confetti] canvas-confetti threw, falling back to DOM', err);
    return false;
  }
}

export function fireConfetti() {
  if (prefersReducedMotion()) return;
  const options = {
    particleCount: 80, spread: 70, origin: { y: 0.6 }, colors: BRAND_COLORS, zIndex: 9999,
    disableForReducedMotion: false,
  };
  fireCanvas(options).then((ok) => {
    if (!ok) fireDomConfetti([{ count: 80, x: 0.5, y: 0.6, spreadDeg: 70, velocity: 22, angleDeg: 90 }]);
  });
}

export function fireConfettiFromElement(element) {
  if (!element) return;
  const rect = element.getBoundingClientRect();
  const x = (rect.left + rect.width / 2) / window.innerWidth;
  const y = (rect.top + rect.height / 2) / window.innerHeight;
  fireCanvas({
    particleCount: 60, spread: 55, origin: { x, y }, colors: BRAND_COLORS, zIndex: 9999,
    disableForReducedMotion: false,
  }).then((ok) => { if (!ok) fireDomConfetti([{ count: 60, x, y, spreadDeg: 55, velocity: 20, angleDeg: 90 }]); });
}

export function fireSideConfetti() {
  const defaults = { colors: BRAND_COLORS, startVelocity: 30, spread: 360, ticks: 60, zIndex: 9999, disableForReducedMotion: false };
  fireCanvas({ ...defaults, particleCount: 40, origin: { x: 0, y: 0.5 }, angle: 60 });
  fireCanvas({ ...defaults, particleCount: 40, origin: { x: 1, y: 0.5 }, angle: 120 });
}

export function fireStars() {
  const defaults = { spread: 360, ticks: 80, decay: 0.94, startVelocity: 20, zIndex: 9999, colors: BRAND_COLORS, disableForReducedMotion: false };
  fireCanvas({ ...defaults, particleCount: 30, shapes: ['star'], scalar: 1.2 });
  setTimeout(() => {
    fireCanvas({ ...defaults, particleCount: 20, shapes: ['star'], scalar: 0.8 });
  }, 150);
}

export function fireMilestoneConfetti() {
  const GOLD_COLORS = ['#FFD700', '#FFA500', '#FF8C00', '#6366F1', '#8B5CF6', '#D946EF'];
  const bursts = [
    { count: 120, x: 0.5, y: 0.5, spreadDeg: 100, velocity: 45, angleDeg: 90 },
    { count: 50, x: 0.1, y: 0.6, spreadDeg: 80, velocity: 35, angleDeg: 60 },
    { count: 50, x: 0.9, y: 0.6, spreadDeg: 80, velocity: 35, angleDeg: 120 },
  ];
  fireCanvas({
    particleCount: 120, spread: 100, origin: { y: 0.5 }, colors: GOLD_COLORS,
    startVelocity: 45, ticks: 100, zIndex: 9999, disableForReducedMotion: false,
  }).then((ok) => { if (!ok) fireDomConfetti(bursts); });
  setTimeout(() => {
    const sideDefaults = {
      colors: GOLD_COLORS, startVelocity: 35, spread: 80, ticks: 90, zIndex: 9999,
      shapes: ['star'], scalar: 1.3, disableForReducedMotion: false,
    };
    fireCanvas({ ...sideDefaults, particleCount: 50, origin: { x: 0.1, y: 0.6 }, angle: 60 });
    fireCanvas({ ...sideDefaults, particleCount: 50, origin: { x: 0.9, y: 0.6 }, angle: 120 });
  }, 300);
}

export function useConfetti() {
  const fire = useCallback((opts = {}) => {
    const { x, y } = opts;
    const originX = x !== undefined ? (typeof x === 'string' ? 0.5 : x / window.innerWidth) : 0.5;
    const originY = y !== undefined ? (typeof y === 'string' ? 0.6 : y / window.innerHeight) : 0.6;

    const defaults = {
      colors: BRAND_COLORS, zIndex: 9999, disableForReducedMotion: false,
    };

    const centerBurst = {
      ...defaults, particleCount: 90, spread: 75,
      origin: { x: originX, y: originY },
      startVelocity: 45, ticks: 90,
    };
    const leftBurst = {
      ...defaults, particleCount: 50, spread: 100,
      origin: { x: 0.15, y: 0.7 }, angle: 60,
      startVelocity: 40, ticks: 80,
    };
    const rightBurst = {
      ...defaults, particleCount: 50, spread: 100,
      origin: { x: 0.85, y: 0.7 }, angle: 120,
      startVelocity: 40, ticks: 80,
    };

    const fallbackBursts = [
      { count: 90, x: originX, y: originY, spreadDeg: 75, velocity: 22, angleDeg: 90 },
      { count: 50, x: 0.15, y: 0.7, spreadDeg: 100, velocity: 20, angleDeg: 60 },
      { count: 50, x: 0.85, y: 0.7, spreadDeg: 100, velocity: 20, angleDeg: 120 },
    ];

    fireCanvas(centerBurst).then((ok) => {
      if (!ok) {
        fireDomConfetti(fallbackBursts);
        return;
      }
      setTimeout(() => {
        fireCanvas(leftBurst);
        fireCanvas(rightBurst);
      }, 150);
    });
  }, []);

  return { fire, ConfettiComponent: null };
}
