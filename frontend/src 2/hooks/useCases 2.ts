import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import { Case } from '../types/schema';

export const useCases = (params?: Record<string, unknown>) => {
  return useQuery({
    queryKey: ['cases', params],
    queryFn: () => api.getCases(params),
  });
};

export const useCreateCase = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (newCase: Partial<Case>) => api.createCase(newCase),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cases'] });
    },
  });
};
