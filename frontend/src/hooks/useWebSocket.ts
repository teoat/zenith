import { useEffect, useRef, useState, useCallback } from 'react';

interface WebSocketMessage {
  type: string;
  payload: any;
  timestamp: number;
}

interface UseWebSocketOptions {
  url: string;
  protocols?: string | string[];
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
  onMessage?: (message: WebSocketMessage) => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
  onError?: (error: Event) => void;
}

interface UseWebSocketReturn {
  socket: WebSocket | null;
  isConnected: boolean;
  isConnecting: boolean;
  lastMessage: WebSocketMessage | null;
  sendMessage: (message: any) => void;
  connect: () => void;
  disconnect: () => void;
  reconnectCount: number;
}

/**
 * @deprecated Use `useWebSocket` from `@/providers/WebSocketProvider` instead.
 * This standalone hook does not integrate with the application's WebSocket context.
 */
export function useWebSocket(options: UseWebSocketOptions): UseWebSocketReturn {
  const {
    url,
    protocols,
    reconnectInterval = 5000,
    maxReconnectAttempts = 5,
    onMessage,
    onConnect,
    onDisconnect,
    onError
  } = options;

  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null);
  const [reconnectCount, setReconnectCount] = useState(0);

  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptsRef = useRef(0);

  const connect = useCallback(() => {
    if (isConnecting || (socket && socket.readyState === WebSocket.OPEN)) {
      return;
    }

    setIsConnecting(true);

    try {
      const ws = new WebSocket(url, protocols);

      ws.onopen = () => {
        setSocket(ws);
        setIsConnected(true);
        setIsConnecting(false);
        setReconnectCount(reconnectAttemptsRef.current);
        reconnectAttemptsRef.current = 0;
        onConnect?.();
      };

      ws.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          setLastMessage(message);
          onMessage?.(message);
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error);
        }
      };

      ws.onclose = () => {
        setSocket(null);
        setIsConnected(false);
        setIsConnecting(false);
        onDisconnect?.();

        // Auto-reconnect if not manually disconnected and under max attempts
        if (reconnectAttemptsRef.current < maxReconnectAttempts) {
          reconnectAttemptsRef.current++;
          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, reconnectInterval);
        }
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        onError?.(error);
      };

    } catch (error) {
      console.error('Failed to create WebSocket connection:', error);
      setIsConnecting(false);
      onError?.(error as Event);
    }
  }, [url, protocols, reconnectInterval, maxReconnectAttempts, onMessage, onConnect, onDisconnect, onError, isConnecting, socket]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    reconnectAttemptsRef.current = maxReconnectAttempts; // Prevent auto-reconnect
    socket?.close();
  }, [socket, maxReconnectAttempts]);

  const sendMessage = useCallback((message: any) => {
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify(message));
    } else {
      console.warn('WebSocket is not connected. Message not sent:', message);
    }
  }, [socket]);

  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  // Auto-connect on mount if URL is provided
  useEffect(() => {
    if (url) {
      connect();
    }
  }, [url, connect]);

  return {
    socket,
    isConnected,
    isConnecting,
    lastMessage,
    sendMessage,
    connect,
    disconnect,
    reconnectCount
  };
}