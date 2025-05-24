import { QueryClient, QueryFunction } from '@tanstack/react-query';

// Helper to throw error if response not OK
async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

// Type for unauthorized behavior strategy
type UnauthorizedBehavior = "returnNull" | "throw";

// Generic fetcher factory with 401 handling
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const res = await fetch(queryKey[0] as string, {
      credentials: 'include',
    });

    if (unauthorizedBehavior === 'returnNull' && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

// Your properly configured React Query client
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // 5 minutes
      onError: (error: unknown) => {
        console.error('Global query error:', error);
      },
    },
    mutations: {
      retry: 1,
      onError: (error: unknown) => {
        console.error('Global mutation error:', error);
      },
    },
  },
});

// Generic API request helper
export const apiRequest = async (
  method: string,
  endpoint: string,
  data?: any
) => {
  const response = await fetch(endpoint, {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
    body: data ? JSON.stringify(data) : undefined,
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error(`API request failed: ${response.statusText}`);
  }

  return response;
};
