'use client';

import { createContext, useContext, useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import { logActivity } from '@/lib/activity';
import { playTimerChime } from '@/lib/sounds';

const FocusContext = createContext(null);

const DEFAULT_WORK_MINUTES = 25;
const DEFAULT_BREAK_MINUTES = 5;
const DEFAULT_LONG_BREAK_MINUTES = 15;

const STORAGE_KEYS = {
  workDuration: 'lockin-work-duration',
  breakDuration: 'lockin-break-duration',
  longBreakDuration: 'lockin-long-break-duration',
  soundEnabled: 'lockin_sounds',
};

function getWorkDurationSeconds() {
  if (typeof window === 'undefined') return DEFAULT_WORK_MINUTES * 60;
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.workDuration);
    const parsed = saved ? parseInt(saved, 10) : DEFAULT_WORK_MINUTES;
    return (Number.isFinite(parsed) && parsed > 0 ? parsed : DEFAULT_WORK_MINUTES) * 60;
  } catch {
    return DEFAULT_WORK_MINUTES * 60;
  }
}

function getBreakDurationSeconds() {
  if (typeof window === 'undefined') return DEFAULT_BREAK_MINUTES * 60;
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.breakDuration);
    const parsed = saved ? parseInt(saved, 10) : DEFAULT_BREAK_MINUTES;
    return (Number.isFinite(parsed) && parsed > 0 ? parsed : DEFAULT_BREAK_MINUTES) * 60;
  } catch {
    return DEFAULT_BREAK_MINUTES * 60;
  }
}

function getLongBreakDurationSeconds() {
  if (typeof window === 'undefined') return DEFAULT_LONG_BREAK_MINUTES * 60;
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.longBreakDuration);
    const parsed = saved ? parseInt(saved, 10) : DEFAULT_LONG_BREAK_MINUTES;
    return (Number.isFinite(parsed) && parsed > 0 ? parsed : DEFAULT_LONG_BREAK_MINUTES) * 60;
  } catch {
    return DEFAULT_LONG_BREAK_MINUTES * 60;
  }
}

function isSoundEnabled() {
  if (typeof window === 'undefined') return true;
  try {
    return localStorage.getItem(STORAGE_KEYS.soundEnabled) !== 'false';
  } catch {
    return true;
  }
}

export function FocusProvider({ children }) {
  const [timeLeft, setTimeLeft] = useState(() => getWorkDurationSeconds());
  const [isRunning, setIsRunning] = useState(false);
  const [mode, setMode] = useState('work');
  const [sessionsCompleted, setSessionsCompleted] = useState(0);

  const intervalRef = useRef(null);
  const startTimeRef = useRef(null);
  const sessionIdRef = useRef(null);
  const supabaseRef = useRef(null);
  const cleanupInProgressRef = useRef(false);

  // Track current durations (can change from settings)
  const workDurationRef = useRef(getWorkDurationSeconds());
  const breakDurationRef = useRef(getBreakDurationSeconds());
  const longBreakDurationRef = useRef(getLongBreakDurationSeconds());

  useEffect(() => {
    supabaseRef.current = createClient();
  }, []);

  // Listen for settings changes
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === STORAGE_KEYS.workDuration) {
        workDurationRef.current = getWorkDurationSeconds();
        // Update timeLeft if not running and in work mode
        if (!isRunning && mode === 'work') {
          setTimeLeft(getWorkDurationSeconds());
        }
      }
      if (e.key === STORAGE_KEYS.breakDuration) {
        breakDurationRef.current = getBreakDurationSeconds();
        // Update timeLeft if not running and in break mode
        if (!isRunning && mode === 'break') {
          setTimeLeft(getBreakDurationSeconds());
        }
      }
      if (e.key === STORAGE_KEYS.longBreakDuration) {
        longBreakDurationRef.current = getLongBreakDurationSeconds();
        if (!isRunning && mode === 'longBreak') {
          setTimeLeft(getLongBreakDurationSeconds());
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [isRunning, mode]);

  const startFocusSession = useCallback(async () => {
    const supabase = supabaseRef.current;
    if (!supabase) return false;

    const { data: authData } = await supabase.auth.getUser();
    const user = authData?.user;
    if (!user) return false;

    const startedAt = new Date().toISOString();
    const durationMinutes = Math.round(workDurationRef.current / 60);

    const { data, error } = await supabase
      .from('focus_sessions')
      .insert({
        user_id: user.id,
        duration_minutes: durationMinutes,
        started_at: startedAt,
        ended_at: null
      })
      .select('id')
      .single();

    if (error) {
      console.error('Error starting focus session:', error);
      return false;
    }

    if (!data?.id) {
      console.error('Focus session insert returned no id — skipping session tracking');
      return false;
    }

    startTimeRef.current = startedAt;
    sessionIdRef.current = data.id;
    await logActivity(supabase, 'focus_session_started', null, { duration_minutes: durationMinutes });
    return true;
  }, []);

  const endFocusSession = useCallback(async (endTime) => {
    try {
      const supabase = supabaseRef.current;
      if (!supabase || !sessionIdRef.current || !startTimeRef.current) return;

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
  }, []);

  const handleTimerCompleteRef = useRef(null);
  // Initialize ref eagerly so the interval never calls null on first render
  // (the sync effect below keeps it current after each re-render)

  const handleTimerComplete = useCallback(async () => {
    setIsRunning(false);
    playTimerChime();

    if (mode === 'work') {
      setSessionsCompleted((prev) => prev + 1);
      await endFocusSession(new Date());
      window.dispatchEvent(new CustomEvent('focus-session-completed'));
      if ((sessionsCompleted + 1) % 4 === 0) {
        setMode('longBreak');
        setTimeLeft(getLongBreakDurationSeconds());
      } else {
        setMode('break');
        setTimeLeft(getBreakDurationSeconds());
      }
    } else {
      setMode('work');
      setTimeLeft(getWorkDurationSeconds());
    }
  }, [mode, sessionsCompleted, endFocusSession]);

  // Keep ref in sync with latest callback to avoid re-registering the interval.
  // Also assign synchronously on first render so the ref is never null when
  // the interval fires.
  handleTimerCompleteRef.current = handleTimerComplete;
  useEffect(() => {
    handleTimerCompleteRef.current = handleTimerComplete;
  }, [handleTimerComplete]);

  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) return 0;
          return prev - 1;
        });
      }, 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isRunning]);

  // Trigger completion OUTSIDE the state updater to avoid double-firing
  // in React Strict Mode (which calls updater functions twice).
  useEffect(() => {
    if (isRunning && timeLeft === 0) {
      handleTimerCompleteRef.current?.();
    }
  }, [isRunning, timeLeft]);

  // Cleanup orphaned focus sessions on unmount (e.g. navigation away)
  useEffect(() => {
    return () => {
      if (cleanupInProgressRef.current) return;
      if (sessionIdRef.current && startTimeRef.current) {
        const supabase = supabaseRef.current;
        if (supabase) {
          cleanupInProgressRef.current = true;
          const sessionId = sessionIdRef.current;
          const endedAt = new Date();
          const startedAt = new Date(startTimeRef.current);
          const durationMinutes = Math.max(1, Math.round((endedAt - startedAt) / 60000));

          // Clear refs synchronously so a quick remount won't double-cleanup
          sessionIdRef.current = null;
          startTimeRef.current = null;

          (async () => {
            try {
              const { error } = await supabase
                .from('focus_sessions')
                .update({ ended_at: endedAt.toISOString(), duration_minutes: durationMinutes })
                .eq('id', sessionId);
              if (error) throw error;
            } catch (err) {
              console.error('Failed to end focus session on cleanup:', err);
            } finally {
              cleanupInProgressRef.current = false;
            }
          })();
        }
      }
    };
  }, []);

  const toggleTimer = useCallback(async () => {
    if (!isRunning && mode === 'work') {
      const started = await startFocusSession();
      if (!started) return; // Don't start timer without a backing session
      setIsRunning(true);
    } else if (isRunning && mode === 'work') {
      await endFocusSession(new Date());
      setIsRunning(false);
    } else {
      setIsRunning(!isRunning);
    }
  }, [isRunning, mode, startFocusSession, endFocusSession]);

  const resetTimer = useCallback(async () => {
    setIsRunning(false);
    if (mode === 'work') {
      await endFocusSession(new Date());
    }
    setMode('work');
    setTimeLeft(getWorkDurationSeconds());
  }, [mode, endFocusSession]);

  const skipToNext = useCallback(async () => {
    setIsRunning(false);
    if (mode === 'work') {
      await endFocusSession(new Date());
      // Increment sessions and use the new count for the long break check
      const nextCount = sessionsCompleted + 1;
      setSessionsCompleted(nextCount);
      if (nextCount % 4 === 0) {
        setMode('longBreak');
        setTimeLeft(getLongBreakDurationSeconds());
      } else {
        setMode('break');
        setTimeLeft(getBreakDurationSeconds());
      }
    } else {
      setMode('work');
      setTimeLeft(getWorkDurationSeconds());
    }
  }, [mode, sessionsCompleted, endFocusSession]);

  const switchMode = useCallback(async (newMode) => {
    if (newMode === mode) return;
    if (isRunning) {
      setIsRunning(false);
      if (mode === 'work') {
        await endFocusSession(new Date());
      }
    }
    setMode(newMode);
    if (newMode === 'work') setTimeLeft(getWorkDurationSeconds());
    else if (newMode === 'longBreak') setTimeLeft(getLongBreakDurationSeconds());
    else setTimeLeft(getBreakDurationSeconds());
  }, [mode, isRunning, endFocusSession]);

  const formatTime = useCallback((seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }, []);

  // Get current durations for progress calculation
  const currentWorkDuration = workDurationRef.current;
  const currentBreakDuration = breakDurationRef.current;
  const currentLongBreakDuration = longBreakDurationRef.current;

  const totalDuration = mode === 'work'
    ? currentWorkDuration
    : mode === 'longBreak'
      ? currentLongBreakDuration
      : currentBreakDuration;
  const progress = ((totalDuration - timeLeft) / totalDuration) * 100;

  const value = useMemo(() => ({
    timeLeft,
    isRunning,
    mode,
    sessionsCompleted,
    progress,
    formatTime,
    toggleTimer,
    resetTimer,
    skipToNext,
    switchMode,
    WORK_DURATION: currentWorkDuration,
    BREAK_DURATION: currentBreakDuration,
    LONG_BREAK_DURATION: currentLongBreakDuration,
  }), [timeLeft, isRunning, mode, sessionsCompleted, progress, formatTime, toggleTimer, resetTimer, skipToNext, switchMode, currentWorkDuration, currentBreakDuration, currentLongBreakDuration]);

  return (
    <FocusContext.Provider value={value}>
      {children}
    </FocusContext.Provider>
  );
}

export function useFocus() {
  const context = useContext(FocusContext);
  if (!context) {
    throw new Error('useFocus must be used within a FocusProvider');
  }
  return context;
}

/**
 * Safe version of useFocus that returns null when called outside a FocusProvider
 * instead of throwing. Use this in components that may render before the
 * provider is mounted (e.g. layout shells, shared UI).
 * @returns {object | null} Focus context value, or null if no provider exists.
 */
export function useFocusSafe() {
  return useContext(FocusContext);
}
