import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import { secureLogger } from '../utils/secureLogger';
import { secureRandom } from '../utils/secureRandom';

// Define a generic message type - expand as needed
export interface WebSocketMessage {
  type: string;
  [key: string]: unknown;
}

interface WebSocketContextType {
  isConnected: boolean;
  sendMessage: (data: unknown) => void;
  lastMessage: MessageEvent | null;
  addListener: (callback: (data: WebSocketMessage) => void) => () => void;
}

const WebSocketContext = createContext<WebSocketContextType | null>(null);

interface WebSocketProviderProps {
  children: React.ReactNode;
  url?: string;
  reconnectInterval?: number;
}

export const WebSocketProvider: React.FC<WebSocketProviderProps> = ({
  children,
  url, // Optional override
  reconnectInterval = 5000
}) => {
  // Determine correct WS URL dynamically
  const getWsUrl = useCallback(() => {
    // Check for authentication token - required for WS connection
    const token = localStorage.getItem('token');
    if (!token) return ''; // Do not connect without token

    // Determine correct WS URL dynamically
    if (url) return url;

    // Auto-detect host/port for dev vs prod
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    // Use 8000 for local dev matching backend default
    const host = window.location.hostname === 'localhost' ? 'localhost:8000' : window.location.host;

    // Get or generate ephemeral user ID - but prefer authenticated user info if available
    // For now, we rely on the token for auth, but the URL param might still be used for routing
    let userId = localStorage.getItem('userId');
    if (!userId) {
        userId = 'anon_' + secureRandom.id();
        localStorage.setItem('userId', userId);
    }

    return `${protocol}//${host}/api/v1/sync/ws/${userId}?token=${token}`;
  }, [url]);

  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<MessageEvent | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const listenersRef = useRef<Set<(data: WebSocketMessage) => void>>(new Set());

  useEffect(() => {
    let reconnectTimeout: NodeJS.Timeout;

    const connect = () => {
      // Clean up previous connection if any
      if (wsRef.current) {
        wsRef.current.close();
      }

      try {
        const targetUrl = getWsUrl();
        if (!targetUrl) {
           secureLogger.info('WEBSOCKET', 'No URL (waiting for auth), skipping connection');
           return;
        }
        secureLogger.info('WEBSOCKET', `Connecting to ${targetUrl.split('?')[0]}...`);
        const ws = new WebSocket(targetUrl);
        wsRef.current = ws;

        ws.onopen = () => {
          secureLogger.info('WEBSOCKET', 'Connected successfully');
          setIsConnected(true);
        };

        ws.onmessage = (event) => {
          setLastMessage(event);
          try {
            const data = JSON.parse(event.data);
            listenersRef.current.forEach(listener => listener(data));
          } catch (_e) {
            secureLogger.warn('WEBSOCKET', 'Failed to parse message', { data: event.data });
          }
        };

        ws.onclose = (event) => {
          secureLogger.info('WEBSOCKET', `Disconnected: ${event.reason || 'No reason'}`);
          setIsConnected(false);
          wsRef.current = null;
          
          // Auto-reconnect if not strictly cleaned up by unmount
          if (!event.wasClean) {
            reconnectTimeout = setTimeout(() => {
              secureLogger.info('WEBSOCKET', 'Attempting reconnect...');
              connect();
            }, reconnectInterval);
          }
        };

        ws.onerror = () => {
          // WebSocket error - handled by onclose event
        };

      } catch {
        // Connection failed - will retry automatically
        reconnectTimeout = setTimeout(connect, reconnectInterval);
      }
    };

    connect();

    // Cleanup on unmount or url change
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
      if (reconnectTimeout) {
        clearTimeout(reconnectTimeout);
      }
    };
  }, [getWsUrl, reconnectInterval]);

  const sendMessage = useCallback((data: unknown) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(data));
    } else {
      secureLogger.warn('WEBSOCKET', 'Cannot send message: Not connected');
    }
  }, []);

  const addListener = useCallback((callback: (data: WebSocketMessage) => void) => {
    listenersRef.current.add(callback);
    return () => {
      listenersRef.current.delete(callback);
    };
  }, []);

  return (
    <WebSocketContext.Provider value={{ isConnected, sendMessage, lastMessage, addListener }}>
      {children}
    </WebSocketContext.Provider>
  );
};

export const useWebSocket = () => {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error('useWebSocket must be used within a WebSocketProvider');
  }
  return context;
};
