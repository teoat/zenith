import { secureLogger } from "@/utils/secureLogger";

type EventType =
  | "DISCREPANCY_FLAGGED"
  | "CASE_CREATED"
  | "EVIDENCE_LINKED"
  | "TRANSACTION_RECONCILED";

interface EventPayload {
  type: string;
  entityType?: string;
  entityId?: string;
  data?: Record<string, unknown>;
}

type Listener = (payload: EventPayload) => void;

class SyncOrchestrator {
  private listeners: Record<string, Listener[]> = {};

  subscribe(event: EventType, callback: Listener): () => void {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(callback);

    // Return unsubscribe function
    return () => {
      this.listeners[event] = this.listeners[event].filter(
        (cb) => cb !== callback,
      );
    };
  }

  emit(event: EventType, payload: EventPayload): void {
    if (this.listeners[event]) {
      this.listeners[event].forEach((callback) => {
        try {
          callback(payload);
        } catch (error) {
          secureLogger.error(
            `Error in SyncOrchestrator listener for event ${event}:`,
            error,
          );
        }
      });
    }
  }
}

export const syncOrchestrator = new SyncOrchestrator();
