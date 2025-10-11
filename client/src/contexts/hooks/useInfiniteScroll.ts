/**
 * LOW-007: Infinite Scroll Hook
 */
import { useEffect, useRef, useCallback, RefObject } from 'react';

interface UseInfiniteScrollOptions {
  threshold?: number;
  rootMargin?: string;
  enabled?: boolean;
}

export function useInfiniteScroll<T extends HTMLElement = HTMLDivElement>(
  callback: () => void,
  options: UseInfiniteScrollOptions = {}
): RefObject<T> {
  const {
    threshold = 0.5,
    rootMargin = '100px',
    enabled = true
  } = options;

  const observerRef = useRef<IntersectionObserver | null>(null);
  const elementRef = useRef<T>(null);

  const handleIntersection = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      const [entry] = entries;
      if (entry.isIntersecting && enabled) {
        callback();
      }
    },
    [callback, enabled]
  );

  useEffect(() => {
    const element = elementRef.current;
    if (!element || !enabled) return;

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
export function useInfiniteScrollList<T>(
  fetchMore: () => void,
  hasMore: boolean,
  isLoading: boolean
) {
  const sentinelRef = useInfiniteScroll<HTMLDivElement>(
    () => {
      if (hasMore && !isLoading) {
        fetchMore();
      }
    },
    {
      enabled: hasMore && !isLoading,
      threshold: 0.5,
      rootMargin: '200px'
    }
  );

  return sentinelRef;
}
