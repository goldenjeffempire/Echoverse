/**
 * Optimistic Updates System
 * Provides instant UI feedback with automatic rollback on failure
 */

import { useState, useCallback } from 'react';

interface OptimisticUpdate<T> {
  id: string;
  data: T;
  timestamp: number;
}

interface OptimisticState<T> {
  data: T;
  isOptimistic: boolean;
  error: Error | null;
}

/**
 * Hook for optimistic updates with automatic rollback
 */
export function useOptimisticUpdate<T>(
  initialData: T,
  updateFn: (data: T) => Promise<T>
) {
  const [state, setState] = useState<OptimisticState<T>>({
    data: initialData,
    isOptimistic: false,
    error: null
  });

  const [previousData, setPreviousData] = useState<T>(initialData);

  const update = useCallback(async (optimisticData: T) => {
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
    } catch (error) {
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
export class OptimisticListManager<T extends { id: string }> {
  private items: T[];
  private pendingUpdates: Map<string, OptimisticUpdate<T>>;

  constructor(initialItems: T[] = []) {
    this.items = initialItems;
    this.pendingUpdates = new Map();
  }

  getItems(): T[] {
    return this.items;
  }

  optimisticAdd(item: T): void {
    this.items = [...this.items, item];
    this.pendingUpdates.set(item.id, {
      id: item.id,
      data: item,
      timestamp: Date.now()
    });
  }

  confirmAdd(id: string, serverData: T): void {
    const index = this.items.findIndex(item => item.id === id);
    if (index !== -1) {
      this.items[index] = serverData;
    }
    this.pendingUpdates.delete(id);
  }

  rollbackAdd(id: string): void {
    this.items = this.items.filter(item => item.id !== id);
    this.pendingUpdates.delete(id);
  }

  optimisticRemove(id: string): void {
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

  confirmRemove(id: string): void {
    this.pendingUpdates.delete(id);
  }

  rollbackRemove(id: string): void {
    const pending = this.pendingUpdates.get(id);
    if (pending) {
      this.items = [...this.items, pending.data];
      this.pendingUpdates.delete(id);
    }
  }

  optimisticUpdate(id: string, updates: Partial<T>): void {
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

  confirmUpdate(id: string, serverData: T): void {
    const index = this.items.findIndex(item => item.id === id);
    if (index !== -1) {
      this.items[index] = serverData;
    }
    this.pendingUpdates.delete(id);
  }

  rollbackUpdate(id: string): void {
    const pending = this.pendingUpdates.get(id);
    if (pending) {
      const index = this.items.findIndex(item => item.id === id);
      if (index !== -1) {
        this.items[index] = pending.data;
      }
      this.pendingUpdates.delete(id);
    }
  }

  isPending(id: string): boolean {
    return this.pendingUpdates.has(id);
  }

  clearPending(): void {
    this.pendingUpdates.clear();
  }
}
