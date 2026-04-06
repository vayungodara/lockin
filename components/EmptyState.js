'use client';

import { motion } from 'framer-motion';
import { fadeInUp, prefersReducedMotion } from '@/lib/animations';
import styles from './EmptyState.module.css';

/**
 * Shared empty state component used across Dashboard, Pacts, Groups, and Stats pages.
 *
 * @param {Object} props
 * @param {React.ReactNode} props.icon - Icon or illustration (React node, typically an SVG)
 * @param {string} props.title - Heading text
 * @param {string} props.description - Supporting body text
 * @param {Object|React.ReactNode} [props.action] - CTA button: either { label, onClick } or a React node
 * @param {React.ReactNode} [props.secondaryAction] - Optional secondary CTA (React node)
 * @param {boolean} [props.floating] - Whether to apply the ambient floating animation to the icon
 * @param {string} [props.className] - Additional class name for the wrapper
 */
export default function EmptyState({
  icon,
  title,
  description,
  action,
  secondaryAction,
  floating = true,
  className,
}) {
  // Determine if action is a config object or a React node
  const isActionConfig = action && typeof action === 'object' && action.label && action.onClick;

  return (
    <motion.div
      className={`${styles.wrapper} ${className || ''}`}
      {...fadeInUp}
    >
      {icon && (
        <motion.div
          className={styles.illustration}
          animate={floating && !prefersReducedMotion() ? { y: [0, -6, 0] } : undefined}
          transition={floating && !prefersReducedMotion() ? { duration: 4, repeat: Infinity, ease: 'easeInOut' } : undefined}
        >
          {icon}
        </motion.div>
      )}

      {title && <h3 className={styles.title}>{title}</h3>}

      {description && <p className={styles.description}>{description}</p>}

      {(action || secondaryAction) && (
        <div className={styles.actions}>
          {isActionConfig ? (
            <button className={styles.primaryAction} onClick={action.onClick}>
              {action.label}
            </button>
          ) : action ? (
            action
          ) : null}

          {secondaryAction}
        </div>
      )}
    </motion.div>
  );
}
