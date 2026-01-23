'use client';

import { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { logActivity } from '@/lib/activity';

const FocusContext = createContext(null);

const WORK_DURATION = 25 * 60;
const BREAK_DURATION = 5 * 60;

export function FocusProvider({ children }) {
  const [timeLeft, setTimeLeft] = useState(WORK_DURATION);
  const [isRunning, setIsRunning] = useState(false);
  const [mode, setMode] = useState('work');
  const [sessionsCompleted, setSessionsCompleted] = useState(0);
  
  const intervalRef = useRef(null);
  const startTimeRef = useRef(null);
  const sessionIdRef = useRef(null);
  const supabaseRef = useRef(null);

  useEffect(() => {
    supabaseRef.current = createClient();
  }, []);

  const startFocusSession = useCallback(async () => {
    try {
      const supabase = supabaseRef.current;
      if (!supabase) return;
      
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

  const handleTimerComplete = useCallback(async () => {
    setIsRunning(false);
    
    if (mode === 'work') {
      setSessionsCompleted((prev) => prev + 1);
      await endFocusSession(new Date());
      setMode('break');
      setTimeLeft(BREAK_DURATION);
    } else {
      setMode('work');
      setTimeLeft(WORK_DURATION);
    }
  }, [mode, endFocusSession]);

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
    setTimeLeft(WORK_DURATION);
  }, [mode, endFocusSession]);

  const skipToNext = useCallback(async () => {
    setIsRunning(false);
    if (mode === 'work') {
      await endFocusSession(new Date());
      setMode('break');
      setTimeLeft(BREAK_DURATION);
    } else {
      setMode('work');
      setTimeLeft(WORK_DURATION);
    }
  }, [mode, endFocusSession]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = mode === 'work' 
    ? ((WORK_DURATION - timeLeft) / WORK_DURATION) * 100
    : ((BREAK_DURATION - timeLeft) / BREAK_DURATION) * 100;

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
    WORK_DURATION,
    BREAK_DURATION,
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
