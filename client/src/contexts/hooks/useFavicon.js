/**
 * MEDIUM PRIORITY FIX #80: Favicon hook
 * Update favicon dynamically
 */
import { useEffect } from 'react';
export function useFavicon(href) {
    useEffect(() => {
        if (typeof document === 'undefined')
            return;
        const link = document.querySelector("link[rel*='icon']") || document.createElement('link');
        link.type = 'image/x-icon';
        link.rel = 'shortcut icon';
        link.href = href;
        if (!document.querySelector("link[rel*='icon']")) {
            document.getElementsByTagName('head')[0].appendChild(link);
        }
    }, [href]);
}
