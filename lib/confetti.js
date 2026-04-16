'use client';

import { useCallback } from 'react';

const BRAND_COLORS = ['#6366F1', '#8B5CF6', '#D946EF', '#F5A623', '#FFD700', '#2DDF8E'];
const GOLD_COLORS = ['#FFD700', '#FFA500', '#FF8C00', '#6366F1', '#8B5CF6', '#D946EF'];

function fireParticles({
  count = 80,
  originX = 0.5,
  originY = 0.6,
  spreadDeg = 70,
  angleDeg = 90,
  velocity = 28,
  colors = BRAND_COLORS,
  shape = 'rect',
  durationMs = 2400,
}) {
  if (typeof document === 'undefined') return;

  const container = document.createElement('div');
  container.setAttribute('aria-hidden', 'true');
  container.style.cssText =
    'position:fixed;inset:0;pointer-events:none;z-index:9999;overflow:visible';
  document.body.appendChild(container);

  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const startX = originX * vw;
  const startY = originY * vh;
  const baseAngleRad = (angleDeg - 180) * (Math.PI / 180); // upward when angleDeg=90 → -pi/2
  const spreadRad = (spreadDeg / 2) * (Math.PI / 180);

  const particles = [];

  for (let i = 0; i < count; i++) {
    const color = colors[i % colors.length];
    const size = 6 + Math.random() * 6;
    const width = shape === 'rect' ? size : size * 0.9;
    const height = shape === 'rect' ? size * 0.4 : size * 0.9;
    const radius = shape === 'rect' ? '1px' : '50%';
    const startRotation = Math.random() * 360;

    const el = document.createElement('span');
    el.style.cssText = `position:absolute;left:${startX}px;top:${startY}px;width:${width}px;height:${height}px;background:${color};border-radius:${radius};transform:translate(-50%,-50%) rotate(${startRotation}deg);will-change:transform,opacity`;
    container.appendChild(el);

    const theta = baseAngleRad + (Math.random() - 0.5) * 2 * spreadRad;
    const speed = velocity * (0.55 + Math.random() * 0.95);
    const vx = Math.cos(theta) * speed;
    const vy = Math.sin(theta) * speed; // negative = upward
    const rotationEnd = startRotation + (Math.random() - 0.5) * 720;

    particles.push({ el, vx, vy, startRotation, rotationEnd });
  }

  const gravity = 0.6;
  const drag = 0.985;
  const start = performance.now();

  function frame(now) {
    const elapsed = now - start;
    const t = elapsed / durationMs;
    if (t >= 1) {
      container.remove();
      return;
    }

    for (const p of particles) {
      // Analytic integration: position at time = integral of velocity
      // Simple discrete step per frame instead
      p.vy += gravity * (elapsed > 0 ? 0.4 : 0);
      p.vx *= drag;
      p.vy *= drag;

      const simX = p.vx * (elapsed / 16);
      const simY = p.vy * (elapsed / 16) + 0.5 * gravity * Math.pow(elapsed / 16, 2) * 0.55;
      const rot = p.startRotation + (p.rotationEnd - p.startRotation) * t;
      const opacity = Math.max(0, 1 - t * 1.1);

      p.el.style.transform = `translate(calc(-50% + ${simX}px), calc(-50% + ${simY}px)) rotate(${rot}deg)`;
      p.el.style.opacity = String(opacity);
    }

    requestAnimationFrame(frame);
  }

  requestAnimationFrame(frame);
}

export function fireConfetti() {
  fireParticles({ count: 80, originY: 0.6, velocity: 28 });
}

export function fireConfettiFromElement(element) {
  if (!element) return;
  const rect = element.getBoundingClientRect();
  const originX = (rect.left + rect.width / 2) / window.innerWidth;
  const originY = (rect.top + rect.height / 2) / window.innerHeight;
  fireParticles({ count: 60, originX, originY, velocity: 24, spreadDeg: 55 });
}

export function fireSideConfetti() {
  fireParticles({ count: 40, originX: 0, originY: 0.5, angleDeg: 60, spreadDeg: 55, velocity: 32 });
  fireParticles({ count: 40, originX: 1, originY: 0.5, angleDeg: 120, spreadDeg: 55, velocity: 32 });
}

export function fireStars() {
  fireParticles({ count: 30, originY: 0.5, shape: 'circle', velocity: 22 });
  setTimeout(() => {
    fireParticles({ count: 20, originY: 0.5, shape: 'circle', velocity: 20 });
  }, 150);
}

export function fireMilestoneConfetti() {
  fireParticles({ count: 120, originY: 0.5, spreadDeg: 100, velocity: 42, colors: GOLD_COLORS });
  setTimeout(() => {
    fireParticles({
      count: 50, originX: 0.1, originY: 0.6, angleDeg: 60, spreadDeg: 80,
      velocity: 36, colors: GOLD_COLORS, shape: 'circle',
    });
    fireParticles({
      count: 50, originX: 0.9, originY: 0.6, angleDeg: 120, spreadDeg: 80,
      velocity: 36, colors: GOLD_COLORS, shape: 'circle',
    });
  }, 300);
  setTimeout(() => {
    fireParticles({
      count: 40, originX: 0.5, originY: 0.3, spreadDeg: 360,
      velocity: 18, colors: GOLD_COLORS, shape: 'circle',
    });
  }, 700);
}

export function useConfetti() {
  const fire = useCallback((opts = {}) => {
    const { x, y } = opts;
    const originX = x !== undefined ? x / window.innerWidth : 0.5;
    const originY = y !== undefined ? y / window.innerHeight : 0.6;
    fireParticles({ count: 90, originX, originY, velocity: 30, spreadDeg: 75 });
    setTimeout(() => {
      fireParticles({
        count: 45, originX: 0.15, originY: 0.7, angleDeg: 60, spreadDeg: 90, velocity: 28,
      });
      fireParticles({
        count: 45, originX: 0.85, originY: 0.7, angleDeg: 120, spreadDeg: 90, velocity: 28,
      });
    }, 120);
  }, []);

  return { fire, ConfettiComponent: null };
}
