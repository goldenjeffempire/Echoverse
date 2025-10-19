/**
 * LOW-007: Infinite Scroll List Component
 */
import React from 'react';
import { useInfiniteScrollList } from '@/hooks/useInfiniteScroll';
import { Skeleton } from './LoadingSkeletons';
export function InfiniteScrollList({ items, renderItem, fetchMore, hasMore, isLoading, LoadingComponent, EmptyComponent, className = '' }) {
    const sentinelRef = useInfiniteScrollList(fetchMore, hasMore, isLoading);
    if (items.length === 0 && !isLoading && EmptyComponent) {
        return <EmptyComponent />;
    }
    return (<div className={className}>
      {items.map((item, index) => (<React.Fragment key={index}>
          {renderItem(item, index)}
        </React.Fragment>))}
      
      {hasMore && (<div ref={sentinelRef} className="py-4">
          {isLoading && (LoadingComponent ? <LoadingComponent /> :
                <div className="space-y-2">
              <Skeleton className="h-20 w-full"/>
              <Skeleton className="h-20 w-full"/>
            </div>)}
        </div>)}
    </div>);
}
