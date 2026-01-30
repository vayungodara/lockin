'use client';

import { motion } from 'framer-motion';
import { useFocus } from '@/lib/FocusContext';
import { fireSideConfetti } from '@/lib/confetti';
import { buttonHover, buttonTap, pulseGlow } from '@/lib/animations';
import styles from './FocusTimer.module.css';
import { useEffect, useRef } from 'react';

export default function FocusTimer() {
  const {
    timeLeft,
    isRunning,
    mode,
    sessionsCompleted,
    progress,
    formatTime,
    toggleTimer,
    resetTimer,
    skipToNext,
    WORK_DURATION,
    BREAK_DURATION,
  } = useFocus();

  const prevSessionsRef = useRef(sessionsCompleted);

  useEffect(() => {
    if (sessionsCompleted > prevSessionsRef.current) {
      fireSideConfetti();
    }
    prevSessionsRef.current = sessionsCompleted;
  }, [sessionsCompleted]);

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
          <path d="M12 6V12L16 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        </svg>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <h3>Broadcast Session</h3>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', fontWeight: 400 }}>Visible to group</span>
        </div>
      </div>

      <div className={styles.timerSection}>
        <div className={styles.modeIndicator}>
          <span className={`${styles.modeTag} ${mode === 'work' ? styles.workMode : styles.breakMode}`}>
            {mode === 'work' ? 'Focus Time' : 'Break Time'}
          </span>
        </div>

        <div className={styles.timerRing}>
          <svg className={styles.progressRing} viewBox="0 0 120 120">
            <circle
              className={styles.progressBg}
              cx="60"
              cy="60"
              r="54"
              strokeWidth="8"
              fill="none"
            />
            <circle
              className={`${styles.progressBar} ${mode === 'work' ? styles.workProgress : styles.breakProgress}`}
              cx="60"
              cy="60"
              r="54"
              strokeWidth="8"
              fill="none"
              strokeDasharray={339.292}
              strokeDashoffset={339.292 - (339.292 * progress) / 100}
              strokeLinecap="round"
            />
          </svg>
          <div className={styles.timeDisplay}>
            <span className={styles.time}>{formatTime(timeLeft)}</span>
          </div>
        </div>

        <div className={styles.controls}>
          <motion.button 
            className={styles.secondaryBtn} 
            onClick={resetTimer} 
            title="Reset"
            whileHover={buttonHover}
            whileTap={buttonTap}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M1 4V10H7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M3.51 15C4.15839 16.8404 5.38734 18.4202 7.01166 19.5014C8.63598 20.5826 10.5677 21.1066 12.5157 20.9945C14.4637 20.8823 16.3226 20.1402 17.8121 18.8798C19.3017 17.6193 20.3413 15.909 20.7742 14.0064C21.2072 12.1037 21.0101 10.112 20.2126 8.3311C19.4152 6.55025 18.0605 5.07611 16.3528 4.13209C14.6451 3.18807 12.6769 2.82395 10.7447 3.09323C8.81245 3.36252 7.02091 4.25088 5.64 5.64L1 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </motion.button>

          <motion.button 
            className={`${styles.primaryBtn} ${isRunning ? styles.pauseBtn : styles.playBtn}`} 
            onClick={toggleTimer}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            animate={isRunning ? pulseGlow.animate : {}}
          >
            {isRunning ? (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="6" y="4" width="4" height="16" rx="1" fill="currentColor"/>
                <rect x="14" y="4" width="4" height="16" rx="1" fill="currentColor"/>
              </svg>
            ) : (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M5 3L19 12L5 21V3Z" fill="currentColor"/>
              </svg>
            )}
          </motion.button>

          <motion.button 
            className={styles.secondaryBtn} 
            onClick={skipToNext} 
            title="Skip"
            whileHover={buttonHover}
            whileTap={buttonTap}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M5 4L15 12L5 20V4Z" fill="currentColor"/>
              <rect x="17" y="4" width="2" height="16" fill="currentColor"/>
            </svg>
          </motion.button>
        </div>

        <div className={styles.stats}>
          <div className={styles.statItem}>
            <span className={styles.statValue}>{sessionsCompleted}</span>
            <span className={styles.statLabel}>Sessions today</span>
          </div>
          <div className={styles.statDivider}></div>
          <div className={styles.statItem}>
            <span className={styles.statValue}>{sessionsCompleted * (WORK_DURATION / 60)}m</span>
            <span className={styles.statLabel}>Focus time</span>
          </div>
        </div>
      </div>
    </div>
  );
}
