import { useQuery, UseQueryOptions, QueryObserverResult } from '@tanstack/react-query';

export interface Recommendation {
  id: string;
  title: string;
  author?: string;
  description?: string;
  coverImageUrl?: string;
  // add more fields as needed
}

async function fetchRecommendations(): Promise<Recommendation[]> {
  const response = await fetch('/api/recommendations');

  if (!response.ok) {
    // You could add logging to an error monitoring service here if needed
    throw new Error(`Failed to fetch recommendations: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();

  // Basic validation, ensure data is an array
  if (!Array.isArray(data)) {
    throw new Error('Unexpected response format for recommendations');
  }

  return data;
}

/**
 * React Query hook to fetch book recommendations.
 * 
 * @param options Optional React Query options for customizing the query behavior.
 * @returns QueryObserverResult with data, error, loading states.
 */
export function useRecommendations(
  options?: UseQueryOptions<Recommendation[], Error>
): QueryObserverResult<Recommendation[], Error> {
  return useQuery<Recommendation[], Error>({
    queryKey: ['recommendations'],
    queryFn: fetchRecommendations,
    staleTime: 1000 * 60 * 10,         // 10 minutes cache freshness
    retry: 2,                          // Retry twice on failure
    refetchOnWindowFocus: false,       // Don't refetch when window focuses
    ...options,                        // Allow overrides/customizations
  });
}
