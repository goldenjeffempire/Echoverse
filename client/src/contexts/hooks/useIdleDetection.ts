/**
 * MEDIUM PRIORITY FIX #76: Idle detection hook
 * Detect user inactivity
 */

import { useState, useEffect, useCallback, useRef } from 'react';

export function useIdleDetection(timeoutMs: number = 300000): boolean {
  const [isIdle, setIsIdle] = useState(false);
  const timeoutIdRef = useRef<NodeJS.Timeout | null>(null);

  const resetIdleTimer = useCallback(() => {
    if (timeoutIdRef.current) {
      clearTimeout(timeoutIdRef.current);
    }

    setIsIdle(false);
    timeoutIdRef.current = setTimeout(() => {
      setIsIdle(true);
    }, timeoutMs);
  }, [timeoutMs]);

  useEffect(() => {
    const events = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart', 'click'];

    events.forEach((event) => {
      document.addEventListener(event, resetIdleTimer);
    });

    resetIdleTimer();

    return () => {
      events.forEach((event) => {
        document.removeEventListener(event, resetIdleTimer);
      });
      if (timeoutIdRef.current) {
        clearTimeout(timeoutIdRef.current);
      }
    };
  }, [resetIdleTimer]);

  return isIdle;
}
