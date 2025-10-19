/**
 * MEDIUM PRIORITY FIX #61: Debounce hook for search inputs
 * Delays execution until user stops typing
 */
import { useEffect, useState } from 'react';
export function useDebounce(value, delay = 500) {
    const [debouncedValue, setDebouncedValue] = useState(value);
    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);
        return () => {
            clearTimeout(handler);
        };
    }, [value, delay]);
    return debouncedValue;
}
export function useDebouncedCallback(callback, delay = 500) {
    const [timeoutId, setTimeoutId] = useState(null);
    return (...args) => {
        if (timeoutId) {
            clearTimeout(timeoutId);
        }
        const newTimeoutId = setTimeout(() => {
            callback(...args);
        }, delay);
        setTimeoutId(newTimeoutId);
    };
}
