import { useQuery } from '@tanstack/react-query';
import { newsAPI } from '../services/api';

export function useNewsSearch(query: string, page = 1, limit = 9) {
  return useQuery({
    queryKey: ['news', query, page, limit],
    queryFn: async () => {
      const response = await newsAPI.search(query, page, limit);
      // Normalize the response structure
      return {
        ...response.data,
        articles: response.data.data?.articles || []
      };
    },
    enabled: !!query && query.length > 0,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
    retry: 2,
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
}

export function useNewsStatus() {
  return useQuery({
    queryKey: ['news-status'],
    queryFn: () => newsAPI.getStatus(),
    refetchInterval: 30000, // Refetch every 30 seconds
    staleTime: 25000,
  });
}