/**
 * MEDIUM PRIORITY FIX #75: Session storage hook
 * Session-scoped state persistence
 */

import { useState, useCallback } from 'react';

export function useSessionStorage<T>(key: string, initialValue: T) {
  const [storedValue, setStoredValue] = useState<T>(() => {
    if (typeof window === 'undefined') return initialValue;

    try {
      const item = window.sessionStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(`[SessionStorage] Error reading ${key}:`, error);
      return initialValue;
    }
  });

  const setValue = useCallback(
    (value: T | ((val: T) => T)) => {
      try {
        const valueToStore = value instanceof Function ? value(storedValue) : value;
        setStoredValue(valueToStore);

        if (typeof window !== 'undefined') {
          window.sessionStorage.setItem(key, JSON.stringify(valueToStore));
        }
      } catch (error) {
        console.error(`[SessionStorage] Error setting ${key}:`, error);
      }
    },
    [key, storedValue]
  );

  const remove = useCallback(() => {
    try {
      if (typeof window !== 'undefined') {
        window.sessionStorage.removeItem(key);
      }
      setStoredValue(initialValue);
    } catch (error) {
      console.error(`[SessionStorage] Error removing ${key}:`, error);
    }
  }, [key, initialValue]);

  return [storedValue, setValue, remove] as const;
}
