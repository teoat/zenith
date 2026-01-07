import { secureLogger } from '@/utils/secureLogger';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { Case } from '@/types/schema';

export const useCases = (params?: Record<string, unknown>) => {
  return useQuery({
    queryKey: ['cases', params],
    queryFn: () => api.getCases(params),
    staleTime: 2 * 60 * 1000, // 2 minutes - cases change moderately frequently
    gcTime: 10 * 60 * 1000, // 10 minutes - keep in cache
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    refetchOnWindowFocus: true, // Refetch when window regains focus for cases
    refetchOnMount: 'always', // Always refetch on mount to ensure fresh data
    placeholderData: (previousData) => previousData, // Keep previous data while loading
  });
};

export const useCreateCase = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (newCase: Partial<Case>) => api.createCase(newCase),
    onSuccess: (newCaseData, _variables) => {
      // Optimistically add the new case to the cache
      queryClient.setQueryData(['cases'], (oldData: any) => {
        if (!oldData) return oldData;
        return {
          ...oldData,
          cases: [newCaseData, ...(oldData.cases || oldData.items || [])],
          total: oldData.total + 1,
        };
      });

      // Invalidate to ensure consistency
      queryClient.invalidateQueries({ queryKey: ['cases'] });
    },
    onError: (error, _variables) => {
      secureLogger.error('Case creation failed:', error);
      // Could show toast notification
    },
    retry: 2,
    retryDelay: 2000,
  });
};
