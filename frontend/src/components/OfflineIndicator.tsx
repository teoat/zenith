import React from "react";
import { WifiOff, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { useNetworkStatus } from "@/hooks/useNetworkStatus";
import { useOfflineQueue } from "@/hooks/useOfflineQueue";

const OfflineIndicator: React.FC = () => {
  const { isOnline } = useNetworkStatus();
  const { queue, isSyncing } = useOfflineQueue();

  if (isOnline && queue.length === 0) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "fixed bottom-5 right-5 z-50 flex items-center gap-2.5 rounded-lg px-5 py-2.5 text-white shadow-lg transition-colors duration-300",
        isOnline ? "bg-green-600" : "bg-orange-500",
      )}
    >
      {!isOnline && (
        <>
          <WifiOff className="h-4 w-4" aria-hidden="true" />
          <span className="font-medium">Offline Mode</span>
          {queue.length > 0 && (
            <span className="text-sm opacity-90">
              ({queue.length} actions pending)
            </span>
          )}
        </>
      )}

      {isOnline && queue.length > 0 && (
        <>
          {isSyncing ? (
            <RefreshCw className="h-4 w-4 animate-spin" aria-hidden="true" />
          ) : (
            <RefreshCw className="h-4 w-4" aria-hidden="true" />
          )}
          <span className="font-medium">Syncing {queue.length} items...</span>
        </>
      )}
    </div>
  );
};

export default OfflineIndicator;
