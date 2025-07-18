import { useQuery, useInfiniteQuery } from '@tanstack/react-query';
import { newsAPI } from '../services/api';

export function useNewsSearch(query: string, page = 1, limit = 9, filters?: { country?: string; language?: string }) {
  return useQuery({
    queryKey: ['news', query, page, limit, filters],
    queryFn: async () => {
      const response = await newsAPI.search(query, page, limit, filters);
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

// infinite scroll hook for pagination
export function useInfiniteNewsSearch(query: string, limit = 9, filters?: { country?: string; language?: string }) {
  return useInfiniteQuery({
    queryKey: ['news-infinite', query, limit, filters],
    initialPageParam: 1,
    queryFn: async ({ pageParam }: { pageParam: number }) => {
      const response = await newsAPI.search(query, pageParam, limit, filters);
      const data = response.data.data || response.data;
      
      return {
        articles: data.articles || [],
        currentPage: pageParam,
        hasMore: data.hasMore || false,
        totalResults: data.totalResults || 0,
        meta: response.data.meta || {}
      };
    },
    getNextPageParam: (lastPage: any) => {
      if (lastPage.hasMore) {
        return lastPage.currentPage + 1;
      }
      return undefined;
    },
    enabled: !!query && query.length > 0,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
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