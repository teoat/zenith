import { useEffect, useRef, useState, useCallback, useMemo } from "react";

interface WebSocketMessage {
  type: string;
  payload: unknown;
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

interface UseWebSocketState {
  isConnected: boolean;
  isConnecting: boolean;
  lastMessage: WebSocketMessage | null;
  reconnectCount: number;
}

interface UseWebSocketActions {
  sendMessage: (message: unknown) => void;
  connect: () => void;
  disconnect: () => void;
}

type UseWebSocketReturn = UseWebSocketState & UseWebSocketActions & { socket: WebSocket | null };

const DEFAULT_RECONNECT_INTERVAL = 5000;
const DEFAULT_MAX_RECONNECT_ATTEMPTS = 5;

export function useWebSocket(options: UseWebSocketOptions): UseWebSocketReturn {
  const {
    url,
    protocols,
    reconnectInterval = DEFAULT_RECONNECT_INTERVAL,
    maxReconnectAttempts = DEFAULT_MAX_RECONNECT_ATTEMPTS,
    onMessage,
    onConnect,
    onDisconnect,
    onError,
  } = options;

  const [state, setState] = useState<UseWebSocketState>({
    isConnected: false,
    isConnecting: false,
    lastMessage: null,
    reconnectCount: 0,
  });

  const socketRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const isManualDisconnectRef = useRef(false);

  const connect = useCallback((): void => {
    if (state.isConnecting || (socketRef.current?.readyState === WebSocket.OPEN)) {
      return;
    }

    setState((prev) => ({ ...prev, isConnecting: true }));
    isManualDisconnectRef.current = false;

    try {
      const ws = new WebSocket(url, protocols);

      socketRef.current = ws;

      ws.onopen = (): void => {
        reconnectAttemptsRef.current = 0;
        setState((prev) => ({
          ...prev,
          isConnected: true,
          isConnecting: false,
          reconnectCount: 0,
        }));
        onConnect?.();
      };

      ws.onmessage = (event): void => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          setState((prev) => ({ ...prev, lastMessage: message }));
          onMessage?.(message);
        } catch (error) {
          console.error("Failed to parse WebSocket message:", error);
        }
      };

      ws.onclose = (): void => {
        setState((prev) => ({
          ...prev,
          isConnected: false,
          isConnecting: false,
        }));
        onDisconnect?.();

        if (!isManualDisconnectRef.current && reconnectAttemptsRef.current < maxReconnectAttempts) {
          reconnectAttemptsRef.current++;
          setState((prev) => ({ ...prev, reconnectCount: reconnectAttemptsRef.current }));
          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, reconnectInterval);
        }
      };

      ws.onerror = (error: Event): void => {
        console.error("WebSocket error:", error);
        onError?.(error);
      };
    } catch (error) {
      console.error("Failed to create WebSocket connection:", error);
      setState((prev) => ({ ...prev, isConnecting: false }));
      onError?.(error as Event);
    }
  }, [url, protocols, reconnectInterval, maxReconnectAttempts, onMessage, onConnect, onDisconnect, onError]);

  const disconnect = useCallback((): void => {
    isManualDisconnectRef.current = true;
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    reconnectAttemptsRef.current = maxReconnectAttempts;
    socketRef.current?.close();
  }, [maxReconnectAttempts]);

  const sendMessage = useCallback((message: unknown): void => {
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify(message));
    } else {
      console.warn("WebSocket is not connected. Message not sent:", message);
    }
  }, []);

  useEffect((): (() => void) => {
    if (url) {
      connect();
    }

    return (): void => {
      disconnect();
    };
  }, [url, connect, disconnect]);

  const socket = useMemo((): WebSocket | null => socketRef.current, [state.isConnected]);

  return {
    socket,
    ...state,
    sendMessage,
    connect,
    disconnect,
  };
}
