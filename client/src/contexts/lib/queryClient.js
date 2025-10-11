import { QueryClient } from "@tanstack/react-query";
async function throwIfResNotOk(res) {
    if (!res.ok) {
        const text = (await res.text()) || res.statusText;
        throw new Error(`${res.status}: ${text}`);
    }
}
export async function apiRequest(method, url, data) {
    const res = await fetch(url, {
        method,
        headers: data ? { "Content-Type": "application/json" } : {},
        body: data ? JSON.stringify(data) : undefined,
        credentials: "include",
    });
    await throwIfResNotOk(res);
    return res;
}
export const getQueryFn = ({ on401: unauthorizedBehavior }) => async ({ queryKey }) => {
    const res = await fetch(queryKey.join("/"), {
        credentials: "include",
    });
    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
        return null;
    }
    await throwIfResNotOk(res);
    return await res.json();
};
// HIGH PRIORITY FIX #28: Configure proper cache strategy for offline support
export const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            queryFn: getQueryFn({ on401: "throw" }),
            refetchInterval: false,
            refetchOnWindowFocus: false,
            staleTime: 5 * 60 * 1000, // 5 minutes - data considered fresh
            cacheTime: 10 * 60 * 1000, // 10 minutes - keep in cache for offline
            retry: 1, // Retry failed queries once
            retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
        },
        mutations: {
            retry: false, // Don't retry mutations automatically
        },
    },
});
