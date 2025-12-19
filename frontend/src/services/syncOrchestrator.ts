import { secureLogger } from '../utils/secureLogger';

type EventType = 'DISCREPANCY_FLAGGED' | 'CASE_CREATED' | 'EVIDENCE_LINKED' | 'TRANSACTION_RECONCILED';

type Listener = (payload: any) => void;

class SyncOrchestrator {
  private listeners: Record<string, Listener[]> = {};

  subscribe(event: EventType, callback: Listener): () => void {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(callback);

    // Return unsubscribe function
    return () => {
      this.listeners[event] = this.listeners[event].filter(cb => cb !== callback);
    };
  }

  emit(event: EventType, payload: any): void {
    if (this.listeners[event]) {
      this.listeners[event].forEach(callback => {
        try {
          callback(payload);
        } catch (error) {
          secureLogger.error(`Error in SyncOrchestrator listener for event ${event}:`, error);
        }
      });
    }
  }
}

export const syncOrchestrator = new SyncOrchestrator();
