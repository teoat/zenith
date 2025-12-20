import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import { secureLogger } from '../utils/secureLogger';
import type { AppSettings } from '../types/api';

export type UserSettings = AppSettings;

export const useSettings = () => {
  return useQuery({
    queryKey: ['user-settings'],
    queryFn: (): Promise<UserSettings> => api.getSettings(),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
};

export const useUpdateSettings = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (updates: Partial<UserSettings>) => api.updateSettings(updates),
    onMutate: async (updates) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['user-settings'] });

      // Snapshot the previous value
      const previousSettings = queryClient.getQueryData<UserSettings>(['user-settings']);

      // Optimistically update to the new value
      if (previousSettings) {
        queryClient.setQueryData<UserSettings>(['user-settings'], {
          ...previousSettings,
          ...updates,
        });
      }

      // Return a context object with the snapshotted value
      return { previousSettings };
    },
    onSuccess: (_data, _variables) => {
      // Invalidate and refetch to ensure consistency
      queryClient.invalidateQueries({ queryKey: ['user-settings'] });
    },
    onError: (error, _variables, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      if (context?.previousSettings) {
        queryClient.setQueryData(['user-settings'], context.previousSettings);
      }
      secureLogger.error('Settings update failed:', error);
    },
    onSettled: () => {
      // Always refetch after error or success to ensure cache consistency
      queryClient.invalidateQueries({ queryKey: ['user-settings'] });
    },
    retry: 2,
    retryDelay: 1000,
  });
};