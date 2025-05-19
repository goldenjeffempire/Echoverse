
import { useState, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';

export function useIntelligentCache<T>(key: string, ttl: number = 5000) {
  const queryClient = useQueryClient();
  const [data, setData] = useState<T | null>(null);

  useEffect(() => {
    const cached = queryClient.getQueryData<T>(key);
    if (cached) {
      setData(cached);
    }

    return () => {
      queryClient.cancelQueries({ queryKey: [key] });
    };
  }, [key, queryClient]);

  const updateCache = (newData: T) => {
    queryClient.setQueryData(key, newData);
    setData(newData);
  };

  return { data, updateCache };
}
