import { useQuery } from '@tanstack/react-query';

// Re-export the existing hook for consistency
export { useDashboardMetrics as useDashboardData } from './useDashboardMetrics';

export const useRookieChecklist = () => {
  return useQuery({
    queryKey: ['rookie-checklist'],
    queryFn: async () => {
      try {
        const data = localStorage.getItem('rookieChecklist');
        return data ? JSON.parse(data) : null;
      } catch {
        return null;
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};