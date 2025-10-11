/**
 * MEDIUM-004: React Query Configuration with Caching
 */
import { QueryClient, DefaultOptions } from '@tanstack/react-query';

const queryConfig: DefaultOptions = {
  queries: {
    // Cache configuration
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 30, // 30 minutes (formerly cacheTime)
    
    // Retry configuration
    retry: (failureCount, error: any) => {
      // Don't retry on 4xx errors
      if (error?.status >= 400 && error?.status < 500) {
        return false;
      }
      return failureCount < 3;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    
    // Refetch configuration
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
    refetchOnMount: true,
    
    // Error handling
    throwOnError: false,
  },
  
  mutations: {
    retry: false,
    // Global mutation error handling
    onError: (error: any) => {
      console.error('Mutation error:', error);
    },
  },
};

export const queryClient = new QueryClient({
  defaultOptions: queryConfig,
});

// Query key factory for consistent cache management
export const queryKeys = {
  users: {
    all: ['users'] as const,
    lists: () => [...queryKeys.users.all, 'list'] as const,
    list: (filters: Record<string, any>) => [...queryKeys.users.lists(), filters] as const,
    details: () => [...queryKeys.users.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.users.details(), id] as const,
  },
  
  products: {
    all: ['products'] as const,
    lists: () => [...queryKeys.products.all, 'list'] as const,
    list: (filters: Record<string, any>) => [...queryKeys.products.lists(), filters] as const,
    details: () => [...queryKeys.products.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.products.details(), id] as const,
  },
  
  posts: {
    all: ['posts'] as const,
    lists: () => [...queryKeys.posts.all, 'list'] as const,
    list: (filters: Record<string, any>) => [...queryKeys.posts.lists(), filters] as const,
    details: () => [...queryKeys.posts.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.posts.details(), id] as const,
  },
  
  orders: {
    all: ['orders'] as const,
    lists: () => [...queryKeys.orders.all, 'list'] as const,
    list: (filters: Record<string, any>) => [...queryKeys.orders.lists(), filters] as const,
    details: () => [...queryKeys.orders.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.orders.details(), id] as const,
  },
} as const;

// Cache invalidation utilities
export const invalidateQueries = {
  users: () => queryClient.invalidateQueries({ queryKey: queryKeys.users.all }),
  products: () => queryClient.invalidateQueries({ queryKey: queryKeys.products.all }),
  posts: () => queryClient.invalidateQueries({ queryKey: queryKeys.posts.all }),
  orders: () => queryClient.invalidateQueries({ queryKey: queryKeys.orders.all }),
  all: () => queryClient.invalidateQueries(),
};

// Prefetch utilities
export const prefetchQueries = {
  user: (id: string) => queryClient.prefetchQuery({
    queryKey: queryKeys.users.detail(id),
    queryFn: () => fetch(`/api/users/${id}`).then(r => r.json()),
  }),
  
  product: (id: string) => queryClient.prefetchQuery({
    queryKey: queryKeys.products.detail(id),
    queryFn: () => fetch(`/api/products/${id}`).then(r => r.json()),
  }),
};
