/**
 * MEDIUM PRIORITY FIX #67: Copy to clipboard hook
 */

import { useState, useCallback } from 'react';

export function useCopyToClipboard() {
  const [copiedText, setCopiedText] = useState<string | null>(null);
  const [error, setError] = useState<Error | null>(null);

  const copy = useCallback(async (text: string): Promise<boolean> => {
    if (!navigator?.clipboard) {
      const err = new Error('Clipboard API not available');
      setError(err);
      console.warn('[Clipboard] API not available');
      return false;
    }

    try {
      await navigator.clipboard.writeText(text);
      setCopiedText(text);
      setError(null);
      return true;
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      setCopiedText(null);
      console.error('[Clipboard] Copy failed:', error);
      return false;
    }
  }, []);

  const reset = useCallback(() => {
    setCopiedText(null);
    setError(null);
  }, []);

  return {
    copiedText,
    error,
    copy,
    reset,
  };
}
