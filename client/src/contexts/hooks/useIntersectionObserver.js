/**
 * MEDIUM PRIORITY FIX #72: Intersection Observer hook
 * Detects when elements enter viewport - for lazy loading
 */
import { useEffect, useRef, useState } from 'react';
export function useIntersectionObserver(options = {}) {
    const { threshold = 0, root = null, rootMargin = '0px', freezeOnceVisible = false } = options;
    const ref = useRef(null);
    const [entry, setEntry] = useState(null);
    const frozen = entry?.isIntersecting && freezeOnceVisible;
    useEffect(() => {
        const node = ref.current;
        if (!node || frozen)
            return;
        const observer = new IntersectionObserver(([entry]) => setEntry(entry), { threshold, root, rootMargin });
        observer.observe(node);
        return () => observer.disconnect();
    }, [threshold, root, rootMargin, frozen]);
    return {
        ref,
        entry,
        isIntersecting: !!entry?.isIntersecting,
        isVisible: !!entry?.isIntersecting,
    };
}
