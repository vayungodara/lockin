'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useState, useCallback } from 'react';

const PARTICLE_COLORS = ['#5B5EF5', '#7C4DFF', '#E040CB', '#F5A623', '#FFD700', '#2DDF8E'];

function randomBetween(min, max) {
  return Math.random() * (max - min) + min;
}

function prefersReducedMotion() {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function Particle({ color, startX, startY, delay }) {
  const angle = randomBetween(0, Math.PI * 2);
  const velocity = randomBetween(60, 140);
  const endX = Math.cos(angle) * velocity;
  const endY = Math.sin(angle) * velocity - 40;
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
    if (prefersReducedMotion()) return;
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

// =============================================
// LEGACY SHIMS — backwards compatibility for components
// not yet migrated to useConfetti. Will be removed when
// PactCard (Task 5) and FocusTimer (Task 6) are rewritten.
// =============================================

export function fireConfetti() {
  // no-op: legacy canvas-confetti removed, use useConfetti() hook instead
}

export function fireConfettiFromElement() {
  // no-op: legacy canvas-confetti removed, use useConfetti() hook instead
}

export function fireSideConfetti() {
  // no-op: legacy canvas-confetti removed, use useConfetti() hook instead
}

export function fireStars() {
  // no-op: legacy canvas-confetti removed, use useConfetti() hook instead
}
