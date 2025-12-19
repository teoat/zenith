import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';

export interface EvidenceFilters {
  fileType?: string;
  dateRange?: { start: Date; end: Date };
  searchQuery?: string;
  tags?: string[];
}

export const useEvidence = (caseId?: string, page: number = 1, pageSize: number = 20, query?: string) => {
  return useQuery({
    queryKey: ['evidence', caseId, page, pageSize, query],
    queryFn: () => api.getEvidence(caseId, page, pageSize, query),
    staleTime: 5 * 60 * 1000, // 5 minutes - evidence doesn't change often
    gcTime: 30 * 60 * 1000, // 30 minutes - keep in cache longer (renamed from cacheTime)
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    refetchOnWindowFocus: false, // Don't refetch on window focus for evidence
    refetchOnMount: true, // Refetch when component mounts if stale
    placeholderData: (previousData) => previousData, // Keep previous data while loading
  });
};

export const useEvidenceUpload = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ caseId, file }: { caseId: string; file: File }) =>
      api.uploadEvidence(caseId, file),
    onSuccess: (_data, variables) => {
      // Optimistically update the cache
      queryClient.invalidateQueries({ queryKey: ['evidence', variables.caseId] });
      queryClient.invalidateQueries({ queryKey: ['evidence'] });
    },
    onError: (error, _variables) => {
      // Log error for monitoring
      console.error('Evidence upload failed:', error);
      // Could add toast notification here
    },
    retry: 2,
    retryDelay: 2000,
  });
};