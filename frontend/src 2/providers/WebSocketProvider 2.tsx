import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';

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
    if (url) return url;

    // Auto-detect host/port for dev vs prod
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    // Use 8000 for local dev matching backend default
    const host = window.location.hostname === 'localhost' ? 'localhost:8000' : window.location.host;

    // Get or generate ephemeral user ID
    let userId = localStorage.getItem('userId');
    if (!userId) {
        userId = 'anon_' + Math.random().toString(36).substr(2, 9);
        localStorage.setItem('userId', userId);
    }

    return `${protocol}//${host}/api/v1/communication/sync/ws/${userId}`;
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
        console.log('[WebSocketProvider] Connecting to', targetUrl);
        const ws = new WebSocket(targetUrl);
        wsRef.current = ws;

        ws.onopen = () => {
          console.log('[WebSocketProvider] Connected');
          setIsConnected(true);
        };

        ws.onmessage = (event) => {
          setLastMessage(event);
          try {
            const data = JSON.parse(event.data);
            listenersRef.current.forEach(listener => listener(data));
          } catch (_e) {
            console.warn('[WebSocketProvider] Failed to parse message', event.data);
          }
        };

        ws.onclose = (event) => {
          console.log('[WebSocketProvider] Disconnected', event.reason);
          setIsConnected(false);
          wsRef.current = null;
          
          // Auto-reconnect if not strictly cleaned up by unmount
          if (!event.wasClean) {
            reconnectTimeout = setTimeout(() => {
              console.log('[WebSocketProvider] Attempting reconnect...');
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
      console.warn('[WebSocketProvider] Cannot send message: Not connected');
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
