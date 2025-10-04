import { useState, useCallback } from 'react';

export interface LoadingState {
  isLoading: boolean;
  error: string | null;
  startLoading: () => void;
  stopLoading: () => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

export function useLoadingState(initialLoading = false): LoadingState {
  const [isLoading, setIsLoading] = useState(initialLoading);
  const [error, setError] = useState<string | null>(null);

  const startLoading = useCallback(() => {
    setIsLoading(true);
    setError(null);
  }, []);

  const stopLoading = useCallback(() => {
    setIsLoading(false);
  }, []);

  const handleSetError = useCallback((err: string | null) => {
    setError(err);
    setIsLoading(false);
  }, []);

  const reset = useCallback(() => {
    setIsLoading(false);
    setError(null);
  }, []);

  return {
    isLoading,
    error,
    startLoading,
    stopLoading,
    setError: handleSetError,
    reset,
  };
}

export async function withLoading<T>(
  loadingState: LoadingState,
  operation: () => Promise<T>
): Promise<T | null> {
  loadingState.startLoading();
  try {
    const result = await operation();
    loadingState.stopLoading();
    return result;
  } catch (error) {
    loadingState.setError(error instanceof Error ? error.message : 'An error occurred');
    return null;
  }
}
