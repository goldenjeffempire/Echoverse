/**
 * MEDIUM PRIORITY FIX #73: Click outside hook
 * Detects clicks outside an element - for dropdowns/modals
 */
import { useEffect, useRef } from 'react';
export function useClickOutside(handler, enabled = true) {
    const ref = useRef(null);
    useEffect(() => {
        if (!enabled)
            return;
        const listener = (event) => {
            const element = ref.current;
            if (!element || element.contains(event.target)) {
                return;
            }
            handler(event);
        };
        document.addEventListener('mousedown', listener);
        document.addEventListener('touchstart', listener);
        return () => {
            document.removeEventListener('mousedown', listener);
            document.removeEventListener('touchstart', listener);
        };
    }, [handler, enabled]);
    return ref;
}
