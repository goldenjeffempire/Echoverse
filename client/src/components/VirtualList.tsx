/**
 * MEDIUM PRIORITY FIX #62: Virtual scrolling for large lists
 * Renders only visible items for performance
 */

import { useState, useRef, useEffect, useMemo } from 'react';

export interface VirtualListProps<T> {
  items: T[];
  height: number;
  itemHeight: number;
  renderItem: (item: T, index: number) => React.ReactNode;
  overscan?: number;
  className?: string;
}

export function VirtualList<T>({
  items,
  height,
  itemHeight,
  renderItem,
  overscan = 3,
  className = '',
}: VirtualListProps<T>) {
  const [scrollTop, setScrollTop] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const { visibleRange, totalHeight, offsetY } = useMemo(() => {
    const visibleCount = Math.ceil(height / itemHeight);
    const start = Math.floor(scrollTop / itemHeight);
    const visibleStart = Math.max(0, start - overscan);
    const visibleEnd = Math.min(items.length, start + visibleCount + overscan);

    return {
      visibleRange: { start: visibleStart, end: visibleEnd },
      totalHeight: items.length * itemHeight,
      offsetY: visibleStart * itemHeight,
    };
  }, [items.length, height, itemHeight, scrollTop, overscan]);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  };

  const visibleItems = items.slice(visibleRange.start, visibleRange.end);

  return (
    <div
      ref={containerRef}
      onScroll={handleScroll}
      className={className}
      style={{
        height: `${height}px`,
        overflow: 'auto',
        position: 'relative',
      }}
    >
      <div style={{ height: `${totalHeight}px`, position: 'relative' }}>
        <div
          style={{
            transform: `translateY(${offsetY}px)`,
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
          }}
        >
          {visibleItems.map((item, index) => (
            <div
              key={visibleRange.start + index}
              style={{ height: `${itemHeight}px` }}
            >
              {renderItem(item, visibleRange.start + index)}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
