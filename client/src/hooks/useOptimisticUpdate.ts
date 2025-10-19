/**
 * ISSUE #35 FIX: Optimistic UI Updates
 * 
 * Hook for implementing optimistic updates with automatic rollback on error
 */

import { useState, useCallback } from 'react';
import { queryClient } from '@/lib/queryClient';

export interface OptimisticUpdateOptions<T, TData = any> {
  queryKey: unknown[];
  updateFn: (oldData: TData | undefined, optimisticValue: T) => TData;
  rollbackFn?: (oldData: TData | undefined, optimisticValue: T) => TData;
}

export function useOptimisticUpdate<T, TData = any>(
  options: OptimisticUpdateOptions<T, TData>
) {
  const { queryKey, updateFn, rollbackFn } = options;
  const [isOptimistic, setIsOptimistic] = useState(false);

  const applyOptimistic = useCallback(
    (optimisticValue: T) => {
      setIsOptimistic(true);

      // Cancel any outgoing refetches
      queryClient.cancelQueries({ queryKey });

      // Snapshot the previous value
      const previousData = queryClient.getQueryData<TData>(queryKey);

      // Optimistically update to the new value
      queryClient.setQueryData<TData>(queryKey, (old) =>
        updateFn(old, optimisticValue)
      );

      return { previousData };
    },
    [queryKey, updateFn]
  );

  const revert = useCallback(
    (context: { previousData?: TData }, optimisticValue?: T) => {
      setIsOptimistic(false);

      // Rollback to the previous value
      if (rollbackFn && optimisticValue) {
        queryClient.setQueryData<TData>(queryKey, (old) =>
          rollbackFn(old, optimisticValue)
        );
      } else if (context?.previousData !== undefined) {
        queryClient.setQueryData<TData>(queryKey, context.previousData);
      }
    },
    [queryKey, rollbackFn]
  );

  const confirm = useCallback(() => {
    setIsOptimistic(false);
    // Invalidate and refetch to ensure data consistency
    queryClient.invalidateQueries({ queryKey });
  }, [queryKey]);

  return {
    applyOptimistic,
    revert,
    confirm,
    isOptimistic,
  };
}

/**
 * Example usage:
 * 
 * const { applyOptimistic, revert, confirm } = useOptimisticUpdate({
 *   queryKey: ['/api/todos'],
 *   updateFn: (old, newTodo) => [...(old || []), newTodo],
 * });
 * 
 * const mutation = useMutation({
 *   mutationFn: createTodo,
 *   onMutate: (newTodo) => applyOptimistic(newTodo),
 *   onError: (err, newTodo, context) => revert(context, newTodo),
 *   onSuccess: () => confirm(),
 * });
 */

/**
 * Specialized hook for list optimistic updates
 */
export function useOptimisticList<T extends { id: string | number }>(
  queryKey: unknown[]
) {
  return {
    // Add item to list
    add: useOptimisticUpdate<T, T[]>({
      queryKey,
      updateFn: (old = [], item) => [...old, item],
    }),

    // Update item in list
    update: useOptimisticUpdate<T, T[]>({
      queryKey,
      updateFn: (old = [], updated) =>
        old.map((item) => (item.id === updated.id ? updated : item)),
    }),

    // Remove item from list
    remove: useOptimisticUpdate<string | number, T[]>({
      queryKey,
      updateFn: (old = [], id) => old.filter((item) => item.id !== id),
    }),
  };
}

/**
 * Specialized hook for object optimistic updates
 */
export function useOptimisticObject<T extends Record<string, any>>(
  queryKey: unknown[]
) {
  return useOptimisticUpdate<Partial<T>, T>({
    queryKey,
    updateFn: (old, updates) => ({ ...(old || {} as T), ...updates }),
  });
}
