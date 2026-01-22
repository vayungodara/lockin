'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { createClient } from '@/lib/supabase/client';
import { fireSideConfetti } from '@/lib/confetti';
import { logActivity } from '@/lib/activity';
import { buttonHover, buttonTap, pulseGlow } from '@/lib/animations';
import styles from './FocusTimer.module.css';

const WORK_DURATION = 25 * 60;
const BREAK_DURATION = 5 * 60;

export default function FocusTimer() {
  const [timeLeft, setTimeLeft] = useState(WORK_DURATION);
  const [isRunning, setIsRunning] = useState(false);
  const [mode, setMode] = useState('work');
  const [sessionsCompleted, setSessionsCompleted] = useState(0);
  const intervalRef = useRef(null);
  const startTimeRef = useRef(null);
  const sessionIdRef = useRef(null);
  const supabase = createClient();

  const startFocusSession = useCallback(async () => {
    try {
      const { data: authData } = await supabase.auth.getUser();
      const user = authData?.user;
      if (!user) return;

      const startedAt = new Date().toISOString();
      startTimeRef.current = startedAt;

      const { data, error } = await supabase
        .from('focus_sessions')
        .insert({
          user_id: user.id,
          duration_minutes: 25,
          started_at: startedAt,
          ended_at: null
        })
        .select('id')
        .single();

      if (error) throw error;

      sessionIdRef.current = data?.id || null;
      await logActivity(supabase, 'focus_session_started', null, { duration_minutes: 25 });
    } catch (err) {
      console.error('Error starting focus session:', err);
    }
  }, [supabase]);

  const endFocusSession = useCallback(async (endTime) => {
    try {
      if (!sessionIdRef.current || !startTimeRef.current) return;

      const startedAt = new Date(startTimeRef.current);
      const endedAt = endTime || new Date();
      const durationMinutes = Math.max(1, Math.round((endedAt - startedAt) / 60000));

      const { error } = await supabase
        .from('focus_sessions')
        .update({
          ended_at: endedAt.toISOString(),
          duration_minutes: durationMinutes
        })
        .eq('id', sessionIdRef.current);

      if (error) throw error;

      await logActivity(supabase, 'focus_session_completed', null, { duration_minutes: durationMinutes });
    } catch (err) {
      console.error('Error ending focus session:', err);
    } finally {
      sessionIdRef.current = null;
      startTimeRef.current = null;
    }
  }, [supabase]);

  const handleTimerComplete = useCallback(async () => {
    setIsRunning(false);
    
    if (mode === 'work') {
      setSessionsCompleted((prev) => prev + 1);
      
      fireSideConfetti();
      
      await endFocusSession(new Date());

      setMode('break');
      setTimeLeft(BREAK_DURATION);
    } else {
      setMode('work');
      setTimeLeft(WORK_DURATION);
    }
  }, [mode, endFocusSession]);

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            handleTimerComplete();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isRunning, handleTimerComplete]);

  const toggleTimer = async () => {
    if (!isRunning && mode === 'work') {
      await startFocusSession();
    }
    setIsRunning(!isRunning);
  };

  const resetTimer = async () => {
    setIsRunning(false);
    if (mode === 'work') {
      await endFocusSession(new Date());
    }
    setMode('work');
    setTimeLeft(WORK_DURATION);
  };

  const skipToNext = async () => {
    setIsRunning(false);
    if (mode === 'work') {
      await endFocusSession(new Date());
      setMode('break');
      setTimeLeft(BREAK_DURATION);
    } else {
      setMode('work');
      setTimeLeft(WORK_DURATION);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = mode === 'work' 
    ? ((WORK_DURATION - timeLeft) / WORK_DURATION) * 100
    : ((BREAK_DURATION - timeLeft) / BREAK_DURATION) * 100;

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
            <span className={styles.statValue}>{sessionsCompleted * 25}m</span>
            <span className={styles.statLabel}>Focus time</span>
          </div>
        </div>
      </div>
    </div>
  );
}
