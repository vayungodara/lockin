'use client';

import { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { logActivity } from '@/lib/activity';

const FocusContext = createContext(null);

const DEFAULT_WORK_MINUTES = 25;
const DEFAULT_BREAK_MINUTES = 5;

const STORAGE_KEYS = {
  workDuration: 'lockin-work-duration',
  breakDuration: 'lockin-break-duration',
  soundEnabled: 'lockin-sound-enabled',
};

function getWorkDurationSeconds() {
  if (typeof window === 'undefined') return DEFAULT_WORK_MINUTES * 60;
  const saved = localStorage.getItem(STORAGE_KEYS.workDuration);
  return (saved ? parseInt(saved, 10) : DEFAULT_WORK_MINUTES) * 60;
}

function getBreakDurationSeconds() {
  if (typeof window === 'undefined') return DEFAULT_BREAK_MINUTES * 60;
  const saved = localStorage.getItem(STORAGE_KEYS.breakDuration);
  return (saved ? parseInt(saved, 10) : DEFAULT_BREAK_MINUTES) * 60;
}

function isSoundEnabled() {
  if (typeof window === 'undefined') return true;
  const saved = localStorage.getItem(STORAGE_KEYS.soundEnabled);
  return saved === null ? true : saved === 'true';
}

// Play completion sound using Web Audio API
function playCompletionSound() {
  if (!isSoundEnabled()) return;
  try {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;

    const audioContext = new AudioContextClass();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    // Pleasant chime sound
    oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
    oscillator.frequency.setValueAtTime(600, audioContext.currentTime + 0.1);
    oscillator.frequency.setValueAtTime(800, audioContext.currentTime + 0.2);

    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.4);

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.4);
  } catch (err) {
    console.error('Error playing sound:', err);
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

  // Track current durations (can change from settings)
  const workDurationRef = useRef(getWorkDurationSeconds());
  const breakDurationRef = useRef(getBreakDurationSeconds());

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
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [isRunning, mode]);

  const startFocusSession = useCallback(async () => {
    try {
      const supabase = supabaseRef.current;
      if (!supabase) return;

      const { data: authData } = await supabase.auth.getUser();
      const user = authData?.user;
      if (!user) return;

      const startedAt = new Date().toISOString();
      startTimeRef.current = startedAt;

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

      if (error) throw error;

      sessionIdRef.current = data?.id || null;
      await logActivity(supabase, 'focus_session_started', null, { duration_minutes: durationMinutes });
    } catch (err) {
      console.error('Error starting focus session:', err);
    }
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

  const handleTimerComplete = useCallback(async () => {
    setIsRunning(false);
    playCompletionSound();

    if (mode === 'work') {
      setSessionsCompleted((prev) => prev + 1);
      await endFocusSession(new Date());
      setMode('break');
      setTimeLeft(getBreakDurationSeconds());
    } else {
      setMode('work');
      setTimeLeft(getWorkDurationSeconds());
    }
  }, [mode, endFocusSession]);

  // Keep ref in sync with latest callback to avoid re-registering the interval
  useEffect(() => {
    handleTimerCompleteRef.current = handleTimerComplete;
  }, [handleTimerComplete]);

  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            handleTimerCompleteRef.current();
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
  }, [isRunning]);

  // Cleanup orphaned focus sessions on unmount (e.g. navigation away)
  useEffect(() => {
    return () => {
      if (sessionIdRef.current && startTimeRef.current) {
        const supabase = supabaseRef.current;
        if (supabase) {
          const endedAt = new Date();
          const startedAt = new Date(startTimeRef.current);
          const durationMinutes = Math.max(1, Math.round((endedAt - startedAt) / 60000));
          supabase
            .from('focus_sessions')
            .update({ ended_at: endedAt.toISOString(), duration_minutes: durationMinutes })
            .eq('id', sessionIdRef.current)
            .then(() => {});
        }
      }
    };
  }, []);

  const toggleTimer = useCallback(async () => {
    if (!isRunning && mode === 'work') {
      await startFocusSession();
    } else if (isRunning && mode === 'work') {
      await endFocusSession(new Date());
    }
    setIsRunning(!isRunning);
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
      setMode('break');
      setTimeLeft(getBreakDurationSeconds());
    } else {
      setMode('work');
      setTimeLeft(getWorkDurationSeconds());
    }
  }, [mode, endFocusSession]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Get current durations for progress calculation
  const currentWorkDuration = workDurationRef.current;
  const currentBreakDuration = breakDurationRef.current;

  const progress = mode === 'work'
    ? ((currentWorkDuration - timeLeft) / currentWorkDuration) * 100
    : ((currentBreakDuration - timeLeft) / currentBreakDuration) * 100;

  const value = {
    timeLeft,
    isRunning,
    mode,
    sessionsCompleted,
    progress,
    formatTime,
    toggleTimer,
    resetTimer,
    skipToNext,
    WORK_DURATION: currentWorkDuration,
    BREAK_DURATION: currentBreakDuration,
  };

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

export function useFocusSafe() {
  return useContext(FocusContext);
}
