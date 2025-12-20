import { createContext } from 'react';

export interface QueuedRequest {
  id: string;
  url: string;
  method: string;
  body: any;
  timestamp: number;
  synced?: boolean;
}

export interface OfflineQueueContextType {
  queue: QueuedRequest[];
  addToQueue: (request: Omit<QueuedRequest, 'id' | 'timestamp'>) => void;
  removeFromQueue: (id: string) => void;
  clearQueue: () => void;
  isSyncing: boolean;
}

export const OfflineQueueContext = createContext<OfflineQueueContextType>({
  queue: [],
  addToQueue: () => {},
  removeFromQueue: () => {},
  clearQueue: () => {},
  isSyncing: false,
});
