/**
 * MEDIUM PRIORITY FIX #77: Previous value hook
 * Access previous value of a variable
 */

import { useEffect, useRef } from 'react';

export function usePrevious<T>(value: T): T | undefined {
  const ref = useRef<T>();

  useEffect(() => {
    ref.current = value;
  }, [value]);

  return ref.current;
}
