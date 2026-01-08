import { useState, useEffect, useCallback } from 'react';
import { useWebSocket } from '../providers/WebSocketProvider';

export interface QueueItem {
  id: string;
  type: 'review' | 'alert' | 'system';
  msg: string;
  time: string;
  priority: 'high' | 'medium' | 'low';
  caseId?: string;
}

interface UseWebSocketQueueOptions {
  maxItems?: number;
  fallbackToSimulation?: boolean;
}

export function useWebSocketQueue(options: UseWebSocketQueueOptions = {}) {
  const { 
    maxItems = 20,
    fallbackToSimulation = true 
  } = options;

  const { isConnected, addListener } = useWebSocket();
  const [queue, setQueue] = useState<QueueItem[]>([]);
  
  // NOTE: This queue state is LOCAL to the component using the hook.
  // Ideally, if we want GLOBAL queue state, we should move this to a Provider.
  // For now, addressing the "connection leak" is the priority.
  // The "sync" issue might persist if different components mount at different times 
  // and miss the "batch" message. 
  // However, since we share the connection, if the backend broadcasts updates, 
  // all mounted components will receive them simultaneously, fixing one aspect of sync.

  const addItem = useCallback((item: QueueItem) => {
    setQueue(prev => {
        const newQueue = [item, ...prev];
        return newQueue.slice(0, maxItems);
    });
  }, [maxItems]);

  useEffect(() => {
    if (!isConnected) return;

    const unsubscribe = addListener((data) => {
      if (data.type === 'queue_item') {
        const id = typeof data.id === 'string' ? data.id : Date.now().toString();
        const type = (typeof data.item_type === 'string' && ['review', 'alert', 'system'].includes(data.item_type) 
            ? data.item_type : 'alert') as QueueItem['type'];
        const msg = typeof data.message === 'string' ? data.message : 'Unknown message';
        const time = typeof data.time === 'string' ? data.time : 'just now';
        const priority = (typeof data.priority === 'string' && ['high', 'medium', 'low'].includes(data.priority)
            ? data.priority : 'medium') as QueueItem['priority'];
        const caseId = typeof data.case_id === 'string' ? data.case_id : undefined;

        addItem({
          id,
          type,
          msg,
          time,
          priority,
          caseId,
        });
      } else if (data.type === 'queue_batch') {
        if (Array.isArray(data.items)) {
            const items = (data.items as Record<string, unknown>[]).map(item => ({
                id: typeof item.id === 'string' ? item.id : Date.now().toString(),
                type: (['review', 'alert', 'system'].includes(item.type as string) ? item.type : 'alert') as QueueItem['type'],
                msg: typeof item.msg === 'string' ? item.msg : '',
                time: typeof item.time === 'string' ? item.time : 'just now',
                priority: (['high', 'medium', 'low'].includes(item.priority as string) ? item.priority : 'medium') as QueueItem['priority'],
                caseId: typeof item.caseId === 'string' ? item.caseId : undefined
            }));
            setQueue(items.slice(0, maxItems));
        }
      }
    });

    return unsubscribe;
  }, [isConnected, addListener, addItem, maxItems]);

  // Simulation Fallback Effect
  useEffect(() => {
    if (!fallbackToSimulation || isConnected) return;
    
    console.log('[LiveQueue] Simulation mode active (No WebSocket)');
    
    // Only set initial mock data if queue is empty
    // Wrapped in timeout to avoid synchronous state update in effect warning
    const initTimer = setTimeout(() => {
      setQueue(prev => {
          if (prev.length > 0) return prev;
          return [
              { id: '1', type: 'review', msg: 'Case #492 requires adjudication', time: '2m ago', priority: 'high' },
              { id: '2', type: 'alert', msg: 'Structuring pattern detected (User A)', time: '5m ago', priority: 'high' },
              { id: '3', type: 'system', msg: 'Daily backup completed', time: '12m ago', priority: 'low' },
              { id: '4', type: 'review', msg: 'KYC Verification pending for New Corp', time: '15m ago', priority: 'medium' },
          ];
      });
    }, 0);

    const interval = setInterval(() => {
        const newActivities: QueueItem[] = [
          { id: Date.now().toString(), type: 'alert', msg: 'New login from unusual IP', time: 'just now', priority: 'medium' },
          { id: Date.now().toString() + 'b', type: 'review', msg: 'Large transaction flagged ($45,000)', time: 'just now', priority: 'high' },
          { id: Date.now().toString() + 'c', type: 'system', msg: 'Compliance report generated', time: 'just now', priority: 'low' },
        ];
        
        const randomMsg = newActivities[Math.floor(Math.random() * newActivities.length)];
        
        if (Math.random() > 0.7) {
          addItem(randomMsg);
        }
      }, 4000);

      const cleanup = () => {
        clearTimeout(initTimer);
        clearInterval(interval);
      };
      return cleanup;

  }, [fallbackToSimulation, isConnected, addItem]);

  return {
    queue,
    isConnected,
    error: isConnected ? null : 'Disconnected',
    reconnect: () => {}, // Handled by provider
    disconnect: () => {}, // Handled by provider
    addItem,
  };
}

export default useWebSocketQueue;

