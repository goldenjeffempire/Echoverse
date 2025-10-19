/**
 * MEDIUM PRIORITY FIX #66: Auto-save hook for forms
 * Automatically saves form data at intervals
 */
import { useEffect, useRef, useCallback } from 'react';
import { useDebounce } from './useDebounce';
export function useAutoSave({ data, onSave, interval = 30000, // 30 seconds
debounceMs = 2000, // 2 seconds
enabled = true, }) {
    const debouncedData = useDebounce(data, debounceMs);
    const lastSavedData = useRef(data);
    const isSaving = useRef(false);
    const save = useCallback(async () => {
        if (!enabled || isSaving.current)
            return;
        if (JSON.stringify(debouncedData) === JSON.stringify(lastSavedData.current))
            return;
        isSaving.current = true;
        try {
            await onSave(debouncedData);
            lastSavedData.current = debouncedData;
            // Data saved successfully
        }
        catch (error) {
            // Failed to save data
        }
        finally {
            isSaving.current = false;
        }
    }, [debouncedData, onSave, enabled]);
    useEffect(() => {
        if (!enabled)
            return;
        save();
    }, [debouncedData, save, enabled]);
    useEffect(() => {
        if (!enabled || !interval)
            return;
        const intervalId = setInterval(save, interval);
        return () => clearInterval(intervalId);
    }, [save, interval, enabled]);
    return {
        save: () => save(),
        isSaving: isSaving.current,
    };
}
