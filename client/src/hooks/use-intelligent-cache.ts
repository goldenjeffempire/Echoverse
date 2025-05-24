import { useState, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';

export function useIntelligentCache<T>(key: string, ttl: number = 5000) {
  const queryClient = useQueryClient();
  // State can be T or null initially
  const [data, setData] = useState<T | null>(null);

  useEffect(() => {
    // Use array key here
    const cached = queryClient.getQueryData<T>([key]);

    if (cached !== undefined) {
      // Explicitly cast cached to T | null to satisfy TypeScript
      setData(cached as T | null);
    }

    return () => {
      // Cancel any ongoing queries with this key array
      queryClient.cancelQueries({ queryKey: [key] });
    };
  }, [key, queryClient]);

  const updateCache = (newData: T) => {
    // Set cache with array key
    queryClient.setQueryData([key], newData);
    setData(newData);
  };

  return { data, updateCache };
}
