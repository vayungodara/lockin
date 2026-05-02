'use client';

import { motion } from 'framer-motion';
import { stampSlam } from '@/lib/animations';
import styles from './Stamp.module.css';

/**
 * Rubber-stamp resolution label — the hero mechanic of the editorial redesign.
 *
 * Variants map to semantic pact outcomes:
 *  - `kept`      → "KEPT"      (moss green)
 *  - `missed`    → "MISSED"    (red pen)
 *  - `locked-in` → "LOCKED IN" (carbon blue)
 *  - `pending`   → "PENDING"   (highlighter yellow, dark-ink text for legibility)
 *  - `void`      → "VOID"      (muted neutral)
 *
 * At rest the stamp rotates `-3deg` (pass `rotate={null}` to disable). When
 * `slam` is true, the component wraps in `motion.span` and plays the approved
 * `stampSlam` preset — scale overshoot + compression + recoil, gated by
 * `prefersReducedMotion()` in the preset itself.
 *
 * @example
 *   <Stamp kind="kept" size="lg" slam />
 *
 * @param {Object} props
 * @param {"kept"|"missed"|"locked-in"|"pending"|"void"} props.kind
 * @param {"sm"|"md"|"lg"|"xl"} [props.size="md"]
 * @param {boolean} [props.slam=false]
 * @param {number|null} [props.rotate=-3]  deg; pass null for no rotation
 * @param {string} [props.className]
 */
export default function Stamp({
  kind,
  size = 'md',
  slam = false,
  rotate = -3,
  className = '',
}) {
  const variant = VARIANTS[kind] || VARIANTS.void;

  const classNames = [
    styles.stamp,
    styles[variant.kindClass],
    styles[SIZE_CLASS[size] || SIZE_CLASS.md],
    className,
  ]
    .filter(Boolean)
    .join(' ');

  // When slamming, the Framer preset owns the final rotate value (-3deg at rest,
  // baked into the animate target). Passing inline transform would fight the
  // motion component's generated transform. So: only set inline rotation when
  // NOT slamming. `rotate={null}` bypasses rotation entirely.
  const staticStyle =
    !slam && rotate != null ? { transform: `rotate(${rotate}deg)` } : undefined;

  if (slam) {
    return (
      <motion.span
        className={classNames}
        variants={stampSlam}
        initial="initial"
        animate="animate"
        aria-label={variant.label}
      >
        {variant.label}
      </motion.span>
    );
  }

  return (
    <span className={classNames} style={staticStyle} aria-label={variant.label}>
      {variant.label}
    </span>
  );
}

const VARIANTS = {
  kept: { label: 'KEPT', kindClass: 'stampKept' },
  missed: { label: 'MISSED', kindClass: 'stampMissed' },
  'locked-in': { label: 'LOCKED IN', kindClass: 'stampLockedIn' },
  pending: { label: 'PENDING', kindClass: 'stampPending' },
  void: { label: 'VOID', kindClass: 'stampVoid' },
};

const SIZE_CLASS = {
  sm: 'stampSm',
  md: 'stampMd',
  lg: 'stampLg',
  xl: 'stampXl',
};
