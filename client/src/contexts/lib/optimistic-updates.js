/**
 * Optimistic Updates System
 * Provides instant UI feedback with automatic rollback on failure
 */
import { useState, useCallback } from 'react';
/**
 * Hook for optimistic updates with automatic rollback
 */
export function useOptimisticUpdate(initialData, updateFn) {
    const [state, setState] = useState({
        data: initialData,
        isOptimistic: false,
        error: null
    });
    const [previousData, setPreviousData] = useState(initialData);
    const update = useCallback(async (optimisticData) => {
        // Save previous state for rollback
        setPreviousData(state.data);
        // Apply optimistic update immediately
        setState({
            data: optimisticData,
            isOptimistic: true,
            error: null
        });
        try {
            // Perform actual update
            const result = await updateFn(optimisticData);
            // Update with server response
            setState({
                data: result,
                isOptimistic: false,
                error: null
            });
            return result;
        }
        catch (error) {
            // Rollback on failure
            setState({
                data: previousData,
                isOptimistic: false,
                error: error instanceof Error ? error : new Error('Update failed')
            });
            throw error;
        }
    }, [state.data, previousData, updateFn]);
    const reset = useCallback(() => {
        setState({
            data: initialData,
            isOptimistic: false,
            error: null
        });
    }, [initialData]);
    return {
        data: state.data,
        isOptimistic: state.isOptimistic,
        error: state.error,
        update,
        reset
    };
}
/**
 * Optimistic list manager
 * Manages lists with optimistic add/remove/update operations
 */
export class OptimisticListManager {
    constructor(initialItems = []) {
        this.items = initialItems;
        this.pendingUpdates = new Map();
    }
    getItems() {
        return this.items;
    }
    optimisticAdd(item) {
        this.items = [...this.items, item];
        this.pendingUpdates.set(item.id, {
            id: item.id,
            data: item,
            timestamp: Date.now()
        });
    }
    confirmAdd(id, serverData) {
        const index = this.items.findIndex(item => item.id === id);
        if (index !== -1) {
            this.items[index] = serverData;
        }
        this.pendingUpdates.delete(id);
    }
    rollbackAdd(id) {
        this.items = this.items.filter(item => item.id !== id);
        this.pendingUpdates.delete(id);
    }
    optimisticRemove(id) {
        const item = this.items.find(item => item.id === id);
        if (item) {
            this.pendingUpdates.set(id, {
                id,
                data: item,
                timestamp: Date.now()
            });
        }
        this.items = this.items.filter(item => item.id !== id);
    }
    confirmRemove(id) {
        this.pendingUpdates.delete(id);
    }
    rollbackRemove(id) {
        const pending = this.pendingUpdates.get(id);
        if (pending) {
            this.items = [...this.items, pending.data];
            this.pendingUpdates.delete(id);
        }
    }
    optimisticUpdate(id, updates) {
        const index = this.items.findIndex(item => item.id === id);
        if (index !== -1) {
            const original = this.items[index];
            this.pendingUpdates.set(id, {
                id,
                data: original,
                timestamp: Date.now()
            });
            this.items[index] = { ...original, ...updates };
        }
    }
    confirmUpdate(id, serverData) {
        const index = this.items.findIndex(item => item.id === id);
        if (index !== -1) {
            this.items[index] = serverData;
        }
        this.pendingUpdates.delete(id);
    }
    rollbackUpdate(id) {
        const pending = this.pendingUpdates.get(id);
        if (pending) {
            const index = this.items.findIndex(item => item.id === id);
            if (index !== -1) {
                this.items[index] = pending.data;
            }
            this.pendingUpdates.delete(id);
        }
    }
    isPending(id) {
        return this.pendingUpdates.has(id);
    }
    clearPending() {
        this.pendingUpdates.clear();
    }
}
