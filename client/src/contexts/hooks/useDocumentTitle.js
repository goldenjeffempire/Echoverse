/**
 * MEDIUM PRIORITY FIX #79: Document title hook
 * Update page title dynamically
 */
import { useEffect, useRef } from 'react';
export function useDocumentTitle(title, retainOnUnmount = false) {
    const defaultTitle = useRef(typeof document !== 'undefined' ? document.title : '');
    useEffect(() => {
        if (typeof document === 'undefined')
            return;
        document.title = title;
    }, [title]);
    useEffect(() => {
        return () => {
            if (!retainOnUnmount && typeof document !== 'undefined') {
                document.title = defaultTitle.current;
            }
        };
    }, [retainOnUnmount]);
}
