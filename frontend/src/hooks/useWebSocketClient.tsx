import { useEffect, useCallback, useRef, useState } from "react";
import { secureLogger } from "@/utils/secureLogger";

export interface WebSocketConfig {
  url: string;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
  heartbeatInterval?: number;
  onOpen?: (event: Event) => void;
  onClose?: (event: CloseEvent) => void;
  onError?: (event: Event) => void;
  onMessage?: (data: unknown) => void;
}

export interface WebSocketHookReturn {
  isConnected: boolean;
  send: (data: unknown) => void;
  close: () => void;
  reconnect: () => void;
  error: Error | null;
  lastMessage: unknown;
}

/**
 * Enhanced WebSocket hook with automatic reconnection, error recovery,
 * heartbeat mechanism, and message queuing
 */
export function useWebSocketClient(
  config: WebSocketConfig,
): WebSocketHookReturn {
  const {
    url,
    reconnectInterval = 5000,
    maxReconnectAttempts = 5,
    heartbeatInterval = 30000,
    onOpen,
    onClose,
    onError,
    onMessage,
  } = config;

  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [lastMessage, setLastMessage] = useState<unknown>(null);

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectAttempts = useRef(0);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined,
  );
  const heartbeatIntervalRef = useRef<
    ReturnType<typeof setInterval> | undefined
  >(undefined);
  const messageQueueRef = useRef<unknown[]>([]);
  const shouldReconnectRef = useRef(true);

  const clearTimers = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = undefined;
    }
    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current);
      heartbeatIntervalRef.current = undefined;
    }
  }, []);

  const startHeartbeat = useCallback(() => {
    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current);
    }
    heartbeatIntervalRef.current = setInterval(() => {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(
          JSON.stringify({ type: "ping", timestamp: Date.now() }),
        );
      }
    }, heartbeatInterval);
  }, [heartbeatInterval]);

  const flushMessageQueue = useCallback(() => {
    if (
      wsRef.current?.readyState === WebSocket.OPEN &&
      messageQueueRef.current.length > 0
    ) {
      messageQueueRef.current.forEach((msg) => {
        wsRef.current!.send(JSON.stringify(msg));
      });
      messageQueueRef.current = [];
    }
  }, []);

  const connect = useCallback(() => {
    try {
      // Close existing connection
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }

      // Create new WebSocket connection
      const ws = new WebSocket(url);
      wsRef.current = ws;

      ws.onopen = (event) => {
        secureLogger.info("WEBSOCKET", "Connected to", { url });
        setIsConnected(true);
        setError(null);
        reconnectAttempts.current = 0;

        // Flush queued messages
        flushMessageQueue();

        // Start heartbeat
        startHeartbeat();

        onOpen?.(event);
      };

      ws.onclose = (event) => {
        secureLogger.info("WEBSOCKET", "Disconnected", {
          code: event.code,
          reason: event.reason,
        });
        setIsConnected(false);
        clearTimers();

        onClose?.(event);

        // Attempt reconnection if not manually closed
        if (
          shouldReconnectRef.current &&
          reconnectAttempts.current < maxReconnectAttempts
        ) {
          reconnectAttempts.current += 1;
          const delay =
            reconnectInterval * Math.pow(1.5, reconnectAttempts.current - 1);
          secureLogger.info("WEBSOCKET", `Reconnecting in ${delay}ms`, {
            attempt: reconnectAttempts.current,
            maxAttempts: maxReconnectAttempts,
          });

          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, delay);
        } else if (reconnectAttempts.current >= maxReconnectAttempts) {
          setError(new Error("Maximum reconnection attempts exceeded"));
        }
      };

      ws.onerror = (event) => {
        secureLogger.error("WEBSOCKET", "WebSocket error", {
          event: event instanceof ErrorEvent ? event.message : "Unknown event",
        });
        const err = new Error("WebSocket connection error");
        setError(err);
        onError?.(event);
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);

          // Handle pong responses
          if (data.type === "pong") {
            return;
          }

          setLastMessage(data);
          onMessage?.(data);
        } catch (err) {
          secureLogger.warn("WEBSOCKET", "Failed to parse message", {
            data: event.data,
          });
        }
      };
    } catch (err) {
      secureLogger.error("WEBSOCKET", "Connection failed", {
        error: err instanceof Error ? err.message : String(err),
      });
      setError(err instanceof Error ? err : new Error(String(err)));
    }
  }, [
    url,
    reconnectInterval,
    maxReconnectAttempts,
    onOpen,
    onClose,
    onError,
    onMessage,
    flushMessageQueue,
    startHeartbeat,
    clearTimers,
  ]);

  const send = useCallback((data: unknown) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(data));
    } else {
      secureLogger.warn("WEBSOCKET", "Not connected, queuing message");
      messageQueueRef.current.push(data);
    }
  }, []);

  const close = useCallback(() => {
    shouldReconnectRef.current = false;
    clearTimers();
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    setIsConnected(false);
  }, [clearTimers]);

  const reconnect = useCallback(() => {
    shouldReconnectRef.current = true;
    reconnectAttempts.current = 0;
    connect();
  }, [connect]);

  // Initial connection
  useEffect(() => {
    connect();

    return () => {
      shouldReconnectRef.current = false;
      clearTimers();
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [connect, clearTimers]);

  return {
    isConnected,
    send,
    close,
    reconnect,
    error,
    lastMessage,
  };
}
