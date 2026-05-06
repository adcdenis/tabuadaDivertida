import { useState, useRef, useCallback, useEffect } from 'react';

export function useTimer() {
  const [elapsed, setElapsed] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const runningRef = useRef(false);

  const start = useCallback(() => {
    if (runningRef.current) return;
    runningRef.current = true;
    intervalRef.current = setInterval(() => {
      setElapsed(prev => prev + 1);
    }, 1000);
  }, []);

  const stop = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    runningRef.current = false;
  }, []);

  const reset = useCallback(() => {
    stop();
    setElapsed(0);
  }, [stop]);

  const restart = useCallback(() => {
    reset();
    start();
  }, [reset, start]);

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  return { elapsed, setElapsed, start, stop, reset, restart };
}

export function useTimerWithInactivity(onInactive: () => void, inactivityLimit: number) {
  const [elapsed, setElapsed] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const inactivityRef = useRef(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const resetInactivity = useCallback(() => {
    inactivityRef.current = 0;
    setIsPaused(false);
  }, []);

  const start = useCallback(() => {
    intervalRef.current = setInterval(() => {
      if (inactivityRef.current < inactivityLimit) {
        setElapsed(prev => prev + 1);
        inactivityRef.current += 1;
      } else {
        setIsPaused(true);
        onInactive();
      }
    }, 1000);
  }, [inactivityLimit, onInactive]);

  const stop = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const reset = useCallback(() => {
    stop();
    setElapsed(0);
    inactivityRef.current = 0;
    setIsPaused(false);
  }, [stop]);

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  return { elapsed, setElapsed, isPaused, start, stop, reset, resetInactivity };
}
