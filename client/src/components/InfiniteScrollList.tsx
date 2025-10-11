/**
 * LOW-007: Infinite Scroll List Component
 */
import React from 'react';
import { useInfiniteScrollList } from '@/hooks/useInfiniteScroll';
import { Skeleton } from './LoadingSkeletons';

interface InfiniteScrollListProps<T> {
  items: T[];
  renderItem: (item: T, index: number) => React.ReactNode;
  fetchMore: () => void;
  hasMore: boolean;
  isLoading: boolean;
  LoadingComponent?: React.ComponentType;
  EmptyComponent?: React.ComponentType;
  className?: string;
}

export function InfiniteScrollList<T>({
  items,
  renderItem,
  fetchMore,
  hasMore,
  isLoading,
  LoadingComponent,
  EmptyComponent,
  className = ''
}: InfiniteScrollListProps<T>) {
  const sentinelRef = useInfiniteScrollList(fetchMore, hasMore, isLoading);

  if (items.length === 0 && !isLoading && EmptyComponent) {
    return <EmptyComponent />;
  }

  return (
    <div className={className}>
      {items.map((item, index) => (
        <React.Fragment key={index}>
          {renderItem(item, index)}
        </React.Fragment>
      ))}
      
      {hasMore && (
        <div ref={sentinelRef} className="py-4">
          {isLoading && (
            LoadingComponent ? <LoadingComponent /> : 
            <div className="space-y-2">
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
