/**
 * MEDIUM-004: React Query Configuration with Caching
 */
import { QueryClient } from '@tanstack/react-query';
const queryConfig = {
    queries: {
        // Cache configuration
        staleTime: 1000 * 60 * 5, // 5 minutes
        gcTime: 1000 * 60 * 30, // 30 minutes (formerly cacheTime)
        // Retry configuration
        retry: (failureCount, error) => {
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
        onError: (error) => {
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
        all: ['users'],
        lists: () => [...queryKeys.users.all, 'list'],
        list: (filters) => [...queryKeys.users.lists(), filters],
        details: () => [...queryKeys.users.all, 'detail'],
        detail: (id) => [...queryKeys.users.details(), id],
    },
    products: {
        all: ['products'],
        lists: () => [...queryKeys.products.all, 'list'],
        list: (filters) => [...queryKeys.products.lists(), filters],
        details: () => [...queryKeys.products.all, 'detail'],
        detail: (id) => [...queryKeys.products.details(), id],
    },
    posts: {
        all: ['posts'],
        lists: () => [...queryKeys.posts.all, 'list'],
        list: (filters) => [...queryKeys.posts.lists(), filters],
        details: () => [...queryKeys.posts.all, 'detail'],
        detail: (id) => [...queryKeys.posts.details(), id],
    },
    orders: {
        all: ['orders'],
        lists: () => [...queryKeys.orders.all, 'list'],
        list: (filters) => [...queryKeys.orders.lists(), filters],
        details: () => [...queryKeys.orders.all, 'detail'],
        detail: (id) => [...queryKeys.orders.details(), id],
    },
};
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
    user: (id) => queryClient.prefetchQuery({
        queryKey: queryKeys.users.detail(id),
        queryFn: () => fetch(`/api/users/${id}`).then(r => r.json()),
    }),
    product: (id) => queryClient.prefetchQuery({
        queryKey: queryKeys.products.detail(id),
        queryFn: () => fetch(`/api/products/${id}`).then(r => r.json()),
    }),
};
