import { useQuery, UseQueryOptions, QueryObserverResult } from '@tanstack/react-query';

export interface Recommendation {
  id: string;
  title: string;
  author?: string;
  description?: string;
  coverImageUrl?: string;
  // add fields as per your domain model
}

async function fetchRecommendations(): Promise<Recommendation[]> {
  const response = await fetch('/api/recommendations');

  if (!response.ok) {
    // Log error to monitoring service here (e.g., Sentry, Datadog)
    throw new Error(`Failed to fetch recommendations: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();

  // Basic validation / shape check (optional, use a library like zod or yup for more complex schemas)
  if (!Array.isArray(data)) {
    throw new Error('Unexpected response format for recommendations');
  }

  return data;
}

/**
 * Custom hook for fetching book recommendations with React Query.
 * 
 * @param options Optional React Query configuration options for fine-tuning behavior
 * @returns Query result containing data, error, loading states etc.
 */
export function useRecommendations(
  options?: UseQueryOptions<Recommendation[], Error>
): QueryObserverResult<Recommendation[], Error> {
  return useQuery<Recommendation[], Error>(
    ['recommendations'],
    fetchRecommendations,
    {
      staleTime: 1000 * 60 * 10, // 10 minutes cache freshness to reduce backend load
      retry: 2,                  // Retry twice before failing to handle transient errors
      refetchOnWindowFocus: false, // Avoid unnecessary refetches on window focus in production
      ...options,
    }
  );
}
