/**
 * MEDIUM PRIORITY FIX #71: Media query hook
 * Responsive design helper
 */
import { useState, useEffect } from 'react';
export function useMediaQuery(query) {
    const [matches, setMatches] = useState(false);
    useEffect(() => {
        if (typeof window === 'undefined')
            return;
        const mediaQuery = window.matchMedia(query);
        setMatches(mediaQuery.matches);
        const handler = (event) => {
            setMatches(event.matches);
        };
        mediaQuery.addEventListener('change', handler);
        return () => mediaQuery.removeEventListener('change', handler);
    }, [query]);
    return matches;
}
export function useBreakpoint() {
    const isMobile = useMediaQuery('(max-width: 640px)');
    const isTablet = useMediaQuery('(min-width: 641px) and (max-width: 1024px)');
    const isDesktop = useMediaQuery('(min-width: 1025px)');
    const isLargeDesktop = useMediaQuery('(min-width: 1440px)');
    return {
        isMobile,
        isTablet,
        isDesktop,
        isLargeDesktop,
        currentBreakpoint: isMobile ? 'mobile' : isTablet ? 'tablet' : isDesktop ? 'desktop' : 'large',
    };
}
