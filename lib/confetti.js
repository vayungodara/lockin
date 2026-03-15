'use client';

import { useCallback, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const BRAND_COLORS = ['#6366F1', '#8B5CF6', '#D946EF', '#F5A623', '#FFD700', '#2DDF8E'];

function prefersReducedMotion() {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function randomBetween(min, max) {
  return Math.random() * (max - min) + min;
}

function createParticles(count = 40, origin = { x: 0.5, y: 0.6 }) {
  const w = typeof window !== 'undefined' ? window.innerWidth : 800;
  const h = typeof window !== 'undefined' ? window.innerHeight : 600;
  return Array.from({ length: count }, (_, i) => ({
    id: `${Date.now()}-${i}`,
    x: origin.x * w,
    y: origin.y * h,
    color: BRAND_COLORS[Math.floor(Math.random() * BRAND_COLORS.length)],
    size: randomBetween(6, 12),
    angle: randomBetween(0, 360),
    velocity: randomBetween(200, 500),
    rotation: randomBetween(-180, 180),
  }));
}

function Particle({ particle }) {
  const rad = (particle.angle * Math.PI) / 180;
  const dx = Math.cos(rad) * particle.velocity;
  const dy = Math.sin(rad) * particle.velocity - 200;

  return (
    <motion.div
      initial={{
        x: particle.x,
        y: particle.y,
        scale: 1,
        rotate: 0,
        opacity: 1,
      }}
      animate={{
        x: particle.x + dx,
        y: particle.y + dy + 400,
        scale: 0,
        rotate: particle.rotation,
        opacity: 0,
      }}
      transition={{ duration: 1.5, ease: [0.22, 1, 0.36, 1] }}
      style={{
        position: 'fixed',
        width: particle.size,
        height: particle.size,
        borderRadius: particle.size > 9 ? '2px' : '50%',
        backgroundColor: particle.color,
        pointerEvents: 'none',
        zIndex: 9999,
      }}
    />
  );
}

function ConfettiExplosion({ particles }) {
  if (!particles || particles.length === 0) return null;
  return (
    <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 9999 }}>
      <AnimatePresence>
        {particles.map((p) => (
          <Particle key={p.id} particle={p} />
        ))}
      </AnimatePresence>
    </div>
  );
}

/**
 * React hook for triggering confetti from a component.
 * Returns { fire, ConfettiComponent }.
 */
export function useConfetti() {
  const [particles, setParticles] = useState([]);

  const fire = useCallback((opts = {}) => {
    if (prefersReducedMotion()) return;
    const w = typeof window !== 'undefined' ? window.innerWidth : 800;
    const h = typeof window !== 'undefined' ? window.innerHeight : 600;
    const origin = {
      x: opts.x !== undefined ? opts.x / w : 0.5,
      y: opts.y !== undefined ? opts.y / h : 0.6,
    };
    const newParticles = createParticles(opts.count || 40, origin);
    setParticles(newParticles);
    const timer = setTimeout(() => setParticles([]), 2000);
    return () => clearTimeout(timer);
  }, []);

  const ConfettiComponent = <ConfettiExplosion particles={particles} />;

  return { fire, ConfettiComponent };
}

// Legacy named exports — these are no-ops since the hook-based system
// manages its own rendering. Use useConfetti() in components instead.
export function fireConfetti() {}
export function fireConfettiFromElement() {}
export function fireSideConfetti() {}
export function fireStars() {}
