import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

export const useAlerts = () => {
  return useQuery({
    queryKey: ["alerts"],
    queryFn: () => api.getAlerts(),
    refetchInterval: 45 * 1000, // Slightly longer interval for performance (45 seconds)
    refetchIntervalInBackground: false, // Don't refetch when tab is not active
    staleTime: 15 * 1000, // 15 seconds - alerts need to be relatively fresh
    gcTime: 2 * 60 * 1000, // 2 minutes - keep in cache
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(2000 * 2 ** attemptIndex, 10000),
    refetchOnWindowFocus: true, // Refetch when window regains focus for alerts
    placeholderData: (previousData) => previousData, // Keep previous alerts while loading
  });
};
