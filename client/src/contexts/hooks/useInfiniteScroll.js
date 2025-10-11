/**
 * LOW-007: Infinite Scroll Hook
 */
import { useEffect, useRef, useCallback } from 'react';
export function useInfiniteScroll(callback, options = {}) {
    const { threshold = 0.5, rootMargin = '100px', enabled = true } = options;
    const observerRef = useRef(null);
    const elementRef = useRef(null);
    const handleIntersection = useCallback((entries) => {
        const [entry] = entries;
        if (entry.isIntersecting && enabled) {
            callback();
        }
    }, [callback, enabled]);
    useEffect(() => {
        const element = elementRef.current;
        if (!element || !enabled)
            return;
        observerRef.current = new IntersectionObserver(handleIntersection, {
            threshold,
            rootMargin,
        });
        observerRef.current.observe(element);
        return () => {
            if (observerRef.current) {
                observerRef.current.disconnect();
            }
        };
    }, [handleIntersection, threshold, rootMargin, enabled]);
    return elementRef;
}
// Variation for list-based infinite scroll
export function useInfiniteScrollList(fetchMore, hasMore, isLoading) {
    const sentinelRef = useInfiniteScroll(() => {
        if (hasMore && !isLoading) {
            fetchMore();
        }
    }, {
        enabled: hasMore && !isLoading,
        threshold: 0.5,
        rootMargin: '200px'
    });
    return sentinelRef;
}
