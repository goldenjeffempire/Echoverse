/**
 * ISSUE #35 FIX: Optimistic UI Updates
 *
 * Hook for implementing optimistic updates with automatic rollback on error
 */
import { useState, useCallback } from 'react';
import { queryClient } from '@/lib/queryClient';
export function useOptimisticUpdate(options) {
    const { queryKey, updateFn, rollbackFn } = options;
    const [isOptimistic, setIsOptimistic] = useState(false);
    const applyOptimistic = useCallback((optimisticValue) => {
        setIsOptimistic(true);
        // Cancel any outgoing refetches
        queryClient.cancelQueries({ queryKey });
        // Snapshot the previous value
        const previousData = queryClient.getQueryData(queryKey);
        // Optimistically update to the new value
        queryClient.setQueryData(queryKey, (old) => updateFn(old, optimisticValue));
        return { previousData };
    }, [queryKey, updateFn]);
    const revert = useCallback((context, optimisticValue) => {
        setIsOptimistic(false);
        // Rollback to the previous value
        if (rollbackFn && optimisticValue) {
            queryClient.setQueryData(queryKey, (old) => rollbackFn(old, optimisticValue));
        }
        else if (context?.previousData !== undefined) {
            queryClient.setQueryData(queryKey, context.previousData);
        }
    }, [queryKey, rollbackFn]);
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
export function useOptimisticList(queryKey) {
    return {
        // Add item to list
        add: useOptimisticUpdate({
            queryKey,
            updateFn: (old = [], item) => [...old, item],
        }),
        // Update item in list
        update: useOptimisticUpdate({
            queryKey,
            updateFn: (old = [], updated) => old.map((item) => (item.id === updated.id ? updated : item)),
        }),
        // Remove item from list
        remove: useOptimisticUpdate({
            queryKey,
            updateFn: (old = [], id) => old.filter((item) => item.id !== id),
        }),
    };
}
/**
 * Specialized hook for object optimistic updates
 */
export function useOptimisticObject(queryKey) {
    return useOptimisticUpdate({
        queryKey,
        updateFn: (old, updates) => ({ ...(old || {}), ...updates }),
    });
}
