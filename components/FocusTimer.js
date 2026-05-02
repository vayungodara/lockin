'use client';

import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useFocus } from '@/lib/FocusContext';
import { useConfetti } from '@/lib/confetti';
import { buttonTap, prefersReducedMotion } from '@/lib/animations';
import Stamp from '@/components/Stamp';
import styles from './FocusTimer.module.css';

/**
 * FocusTimer — editorial monumental-serif port.
 *
 * Renders the timer as a giant clamp-sized serif numeral (mm:ss) above a
 * flat linear progress bar. Resolution stays semantic: blue while running,
 * yellow while paused, green when a work session ends.
 *
 * The LOCKED IN stamp is owned by the page (FocusPageClient) so it can
 * slam onto the timer-card corner, not buried inside this component.
 *
 * @param {Object} props
 * @param {boolean} [props.compact] — narrows numeral clamp + halves padding
 * @param {string} [props.className]
 */
export default function FocusTimer({ compact = false, className = '' }) {
  const {
    timeLeft,
    isRunning,
    mode,
    progress,
    formatTime,
    sessionsCompleted,
    WORK_DURATION,
    BREAK_DURATION,
    LONG_BREAK_DURATION,
  } = useFocus();

  const prevSessionsRef = useRef(sessionsCompleted);
  const { fire: triggerConfetti, ConfettiComponent } = useConfetti();

  useEffect(() => {
    if (sessionsCompleted > prevSessionsRef.current) {
      triggerConfetti();
    }
    prevSessionsRef.current = sessionsCompleted;
  }, [sessionsCompleted, triggerConfetti]);

  // Update document.title with remaining time during active sessions
  useEffect(() => {
    if (isRunning && timeLeft != null) {
      const mins = Math.floor(timeLeft / 60);
      const secs = timeLeft % 60;
      document.title = `${mins}:${String(secs).padStart(2, '0')} — LockIn`;
    } else {
      document.title = 'LockIn';
    }
    return () => {
      document.title = 'LockIn';
    };
  }, [isRunning, timeLeft]);

  // Total duration for the current mode — used to label the right end
  // of the progress bar with the original session length.
  const totalDuration =
    mode === 'work'
      ? WORK_DURATION
      : mode === 'longBreak'
        ? LONG_BREAK_DURATION
        : BREAK_DURATION;
  const totalMinutes = Math.round(totalDuration / 60);

  // The colon blinks once per second while running (the "alive" signal).
  const reduced = prefersReducedMotion();
  const colonBlink = isRunning && !reduced;

  const numeralClass = [
    styles.numeral,
    isRunning ? styles.numeralRunning : '',
    mode === 'work' && !isRunning && timeLeft === 0 ? styles.numeralDone : '',
    compact ? styles.numeralCompact : '',
  ]
    .filter(Boolean)
    .join(' ');

  const fillClass = [
    styles.fill,
    mode === 'work' ? styles.fillWork : '',
    mode === 'break' ? styles.fillBreak : '',
    mode === 'longBreak' ? styles.fillLongBreak : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={`${styles.timerSection} ${className}`.trim()}>
      {ConfettiComponent}

      <NumeralDisplay
        formatted={formatTime(timeLeft)}
        numeralClass={numeralClass}
        colonBlink={colonBlink}
      />

      <div
        className={styles.progressTrack}
        role="progressbar"
        aria-valuenow={Math.round(progress)}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className={fillClass}
          style={{ width: `${Math.max(0, Math.min(100, progress))}%` }}
        />
      </div>

      <div className={styles.progressLabels}>
        <span>00:00</span>
        <span>{String(totalMinutes).padStart(2, '0')}:00</span>
      </div>
    </div>
  );
}

/**
 * Splits the formatted "mm:ss" string into mm + : + ss so the colon can
 * pulse independently while running. Tabular figures keep the left and
 * right halves locked in horizontal place even as digits change.
 */
function NumeralDisplay({ formatted, numeralClass, colonBlink }) {
  const [mm, ss] = formatted.split(':');
  return (
    <div className={numeralClass} aria-live="off">
      <span className={styles.numeralPart}>{mm}</span>
      <motion.span
        className={styles.numeralColon}
        animate={colonBlink ? { opacity: [1, 0.3, 1] } : { opacity: 1 }}
        transition={
          colonBlink
            ? { duration: 1, repeat: Infinity, ease: 'easeInOut' }
            : { duration: 0 }
        }
      >
        :
      </motion.span>
      <span className={styles.numeralPart}>{ss}</span>
    </div>
  );
}

/**
 * Editorial control row — Lock in / Pause / Resume / End / Reset.
 * Exposed as a separate component so the page can render it adjacent to
 * the timer block but inside the same card surface, with the controls
 * mirroring the page's voice ("Lock in for 25m →", not "Start").
 */
export function FocusControls({ targetMinutes }) {
  const {
    isRunning,
    mode,
    timeLeft,
    toggleTimer,
    resetTimer,
    skipToNext,
    WORK_DURATION,
    BREAK_DURATION,
    LONG_BREAK_DURATION,
  } = useFocus();

  const isWork = mode === 'work';
  const fullDuration =
    mode === 'work'
      ? WORK_DURATION
      : mode === 'longBreak'
        ? LONG_BREAK_DURATION
        : BREAK_DURATION;
  // "Fresh" = idle at full duration on the current mode. "Lock in for Nm →"
  // primary CTA only shows on a fresh work session.
  const isFresh = !isRunning && timeLeft === fullDuration;

  return (
    <div className={styles.controls}>
      {isWork && isFresh ? (
        <motion.button
          type="button"
          className={`${styles.btn} ${styles.btnPrimary}`}
          onClick={toggleTimer}
          whileTap={buttonTap}
          aria-label={`Lock in for ${targetMinutes} minutes`}
        >
          Lock in for {targetMinutes}m →
        </motion.button>
      ) : null}

      {isWork && isRunning ? (
        <>
          <motion.button
            type="button"
            className={`${styles.btn} ${styles.btnOutline}`}
            onClick={toggleTimer}
            whileTap={buttonTap}
          >
            Pause
          </motion.button>
          <motion.button
            type="button"
            className={`${styles.btn} ${styles.btnDanger}`}
            onClick={resetTimer}
            whileTap={buttonTap}
          >
            End session
          </motion.button>
        </>
      ) : null}

      {isWork && !isRunning && !isFresh ? (
        <>
          <motion.button
            type="button"
            className={`${styles.btn} ${styles.btnPrimary}`}
            onClick={toggleTimer}
            whileTap={buttonTap}
          >
            Resume
          </motion.button>
          <motion.button
            type="button"
            className={`${styles.btn} ${styles.btnDanger}`}
            onClick={resetTimer}
            whileTap={buttonTap}
          >
            End session
          </motion.button>
        </>
      ) : null}

      {!isWork ? (
        <>
          <motion.button
            type="button"
            className={`${styles.btn} ${styles.btnPrimary}`}
            onClick={toggleTimer}
            whileTap={buttonTap}
          >
            {isRunning ? 'Pause break' : 'Start break'}
          </motion.button>
          <motion.button
            type="button"
            className={`${styles.btn} ${styles.btnOutline}`}
            onClick={skipToNext}
            whileTap={buttonTap}
          >
            Skip break
          </motion.button>
        </>
      ) : null}
    </div>
  );
}

/**
 * Convenience: top-right LOCKED IN stamp wrapper used by the focus page.
 * Stamps in via stampSlam preset only when the timer is running and in
 * work mode. Hidden during breaks and idle states.
 */
export function LockedInBadge() {
  const { isRunning, mode } = useFocus();
  if (!(isRunning && mode === 'work')) return null;
  return (
    <span className={styles.stampWrap}>
      <Stamp kind="locked-in" size="md" slam />
    </span>
  );
}
