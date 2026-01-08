import { secureLogger } from "@/utils/secureLogger";
import { request } from "./client";

export const syncService = {
  getSyncStatus: async (): Promise<any> => {
    return request("/sync/status");
  },

  forceSync: async (): Promise<void> => {
    secureLogger.info("SYNC", "Force sync triggered in web mode");
    return request("/sync/force", { method: "POST" });
  },

  resolveConflict: async (
    conflictId: string,
    resolution: "local" | "remote",
  ): Promise<void> => {
    return request(`/sync/conflicts/${conflictId}/resolve`, {
      method: "POST",
      body: JSON.stringify({ resolution }),
    });
  },
};
