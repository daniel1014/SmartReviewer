/**
 * Custom React hooks for interacting with the article analysis API.
 * 
 * Why:
 * - Encapsulates logic for analyzing articles, batch analysis, fetching analysis history, and status.
 * - Promotes code reuse and separation of concerns across the app.
 * - Simplifies API usage in components by providing easy-to-use hooks.
 * 
 * All hooks use React Query for caching, mutation, and async state management.
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { analysisAPI } from '../services/api';

export function useAnalyzeArticle() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: analysisAPI.analyzeArticle,
    onSuccess: (data) => {
      console.log('✅ Analysis mutation successful:', data);
      // Invalidate history to show new analysis
      queryClient.invalidateQueries({ queryKey: ['analysis-history'] });
    },
    onError: (error) => {
      console.error('❌ Analysis mutation failed:', error);
      console.error('Error details:', {
        message: (error as any).message,
        response: (error as any).response?.data,
        status: (error as any).response?.status
      });
    }
  });
}

export function useAnalyzeBatch() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: analysisAPI.analyzeBatch,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['analysis-history'] });
    },
    onError: (error) => {
      console.error('Batch analysis failed:', error);
    }
  });
}

export function useAnalysisHistory(filters = {}) {
  return useQuery({
    queryKey: ['analysis-history', filters],
    queryFn: () => analysisAPI.getHistory(filters),
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useAnalysisStatus() {
  return useQuery({
    queryKey: ['analysis-status'],
    queryFn: () => analysisAPI.getStatus(),
    refetchInterval: 30000, // Refetch every 30 seconds
    staleTime: 25000,
  });
}