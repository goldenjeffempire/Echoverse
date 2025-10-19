import { useState, useCallback } from 'react';
export function useLoadingState(initialLoading = false) {
    const [isLoading, setIsLoading] = useState(initialLoading);
    const [error, setError] = useState(null);
    const startLoading = useCallback(() => {
        setIsLoading(true);
        setError(null);
    }, []);
    const stopLoading = useCallback(() => {
        setIsLoading(false);
    }, []);
    const handleSetError = useCallback((err) => {
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
export async function withLoading(loadingState, operation) {
    loadingState.startLoading();
    try {
        const result = await operation();
        loadingState.stopLoading();
        return result;
    }
    catch (error) {
        loadingState.setError(error instanceof Error ? error.message : 'An error occurred');
        return null;
    }
}
