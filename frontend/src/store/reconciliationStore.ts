import { create } from "zustand";
import type { ReconciliationItem } from "@/lib/api";
import { api } from "@/lib/api";
import { secureLogger } from "@/utils/secureLogger";

interface ReconciliationState {
  items: ReconciliationItem[];
  loading: boolean;
  error: string | null;
  fetchItems: () => Promise<void>;
  reconcileItem: (itemId: string) => Promise<void>;
  flagItem: (itemId: string, reason?: string) => Promise<void>;
}

export const useReconciliationStore = create<ReconciliationState>(
  (set, get) => ({
    items: [],
    loading: false,
    error: null,

    fetchItems: async () => {
      set({ loading: true, error: null });
      try {
        const data = await api.getReconciliationItems();
        const mappedData = (Array.isArray(data) ? data : []).map(
          (item, idx) => {
            // Keep the mock linkage for demonstration
            if (idx === 0)
              return { ...item, evidenceId: "EVI-001", evidenceRegionId: "1" };
            if (idx === 1)
              return { ...item, evidenceId: "EVI-001", evidenceRegionId: "2" };
            return item;
          },
        );
        set({ items: mappedData, loading: false });
      } catch (err: any) {
        set({ error: err.message || "Failed to fetch items", loading: false });
      }
    },

    reconcileItem: async (itemId) => {
      const { items } = get();
      const item = items.find((i) => i.id === itemId);
      if (!item) return;

      try {
        await api.reconcileTransaction(item.transactionId);
        set({
          items: items.map((i) =>
            i.id === itemId ? { ...i, status: "matched" } : i,
          ),
        });
      } catch (err: any) {
        secureLogger.error("Failed to reconcile item:", err);
      }
    },

    flagItem: async (itemId, reason = "User flagged from UI") => {
      const { items } = get();
      const item = items.find((i) => i.id === itemId);
      if (!item) return;

      try {
        await api.flagTransaction(item.transactionId, reason);
        set({
          items: items.map((i) =>
            i.id === itemId ? { ...i, status: "discrepancy" } : i,
          ),
        });
      } catch (err: any) {
        secureLogger.error("Failed to flag item:", err);
      }
    },
  }),
);
