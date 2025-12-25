import React, { useEffect } from 'react';
import { secureLogger } from '../utils/secureLogger';
import { useQueryClient } from '@tanstack/react-query';
import { useWebSocket } from '@/providers/WebSocketProvider';

export const WebSocketSync: React.FC = () => {
  const { addListener } = useWebSocket();
  const queryClient = useQueryClient();

  useEffect(() => {
    const unsubscribe = addListener((data) => {
      // Handle generic data refresh requests
      if (data.type === 'refresh_data') {
        const { target } = data; // e.g., 'cases', 'alerts'
        if (target && typeof target === 'string') {
            secureLogger.info(`[WebSocketSync] Invalidating queries for: ${target}`);
            queryClient.invalidateQueries({ queryKey: [target] });
        }
      }

      // Handle specific entity updates
      if (data.type === 'entity_update') {
          const { entity } = data; // e.g. 'case', 'audit_log'
          if (entity && typeof entity === 'string') {
              // Convert singular to plural roughly or use exact mapping
              // For now, naive mapping:
              const key = entity.endsWith('s') ? entity : `${entity}s`;
              secureLogger.info(`[WebSocketSync] Entity update: ${entity}, invalidating ${key}`);
              queryClient.invalidateQueries({ queryKey: [key] });
          }
      }
      
      // Handle queue items (if we ever fetch queue via REST)
      if (data.type === 'queue_item') {
          queryClient.invalidateQueries({ queryKey: ['queue'] });
      }
    });

    return unsubscribe;
  }, [addListener, queryClient]);

  return null;
};
