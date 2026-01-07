import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { secureLogger } from "@/utils/secureLogger";

// Import the CollaborationClient from the backend service
// Note: This would need to be compiled/bundled appropriately
// For now, we'll create a client-side implementation

// Basic change set for entity updates
export interface EntityChanges {
  [key: string]: unknown;
}

// Generic message handler type
export type MessageHandler = (data: unknown) => void;

interface Participant {
  id: string;
  name: string;
  role: string;
  color: string;
  cursor?: { x: number; y: number };
  selected_entity?: string;
  last_activity: string;
}

interface CollaborationHookResult {
  isConnected: boolean;
  participants: Participant[];
  activeParticipants: Participant[];
  participantStats: {
    total: number;
    active: number;
    byRole: Record<string, number>;
  };
  sendCursorUpdate: (x: number, y: number) => void;
  selectEntity: (entityId: string, entityName?: string) => void;
  updateEntity: (entityId: string, changes: EntityChanges) => void;
  sendChatMessage: (message: string) => void;
  onMessage: (type: string, handler: MessageHandler) => void;
  disconnect: () => void;
}

export function useCollaboration(sessionId: string): CollaborationHookResult {
  const [isConnected, setIsConnected] = useState(false);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const websocketRef = useRef<WebSocket | null>(null);
  const messageHandlersRef = useRef<Map<string, MessageHandler>>(new Map());
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isMounted = useRef(true);

  // Track mount status
  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  // Connect to collaboration server
  useEffect(() => {
    if (!sessionId) return;

    const connect = () => {
      // Don't connect if unmounted
      if (!isMounted.current) return;

      try {
        const ws = new WebSocket(`ws://localhost:8080/ws/session/${sessionId}`);
        websocketRef.current = ws;

        ws.onopen = () => {
          if (!isMounted.current) {
            ws.close();
            return;
          }
          secureLogger.info(
            "COLLABORATION",
            "Connected to collaboration session",
            { sessionId },
          );
          setIsConnected(true);

          // Join session with participant info
          ws.send(
            JSON.stringify({
              type: "join_session",
              name: `User_${Date.now()}`, // In real app, get from user context
              role: "investigator",
              color: "#3b82f6",
            }),
          );
        };

        ws.onmessage = (event) => {
          if (!isMounted.current) return;
          try {
            const data = JSON.parse(event.data);
            secureLogger.debug(
              "COLLABORATION",
              "Collaboration message received",
              { type: data.type },
            );

            // Handle built-in message types
            switch (data.type) {
              case "session_state":
                setParticipants(data.participants || []);
                break;
              case "participant_joined":
                setParticipants((prev) => [...prev, data.participant]);
                break;
              case "participant_left":
                setParticipants((prev) =>
                  prev.filter((p) => p.id !== data.participant_id),
                );
                break;
              case "cursor_update":
                setParticipants((prev) =>
                  prev.map((p) =>
                    p.id === data.participant_id
                      ? {
                          ...p,
                          cursor: data.cursor,
                          last_activity: data.cursor.timestamp,
                        }
                      : p,
                  ),
                );
                break;
              case "entity_selected":
                setParticipants((prev) =>
                  prev.map((p) =>
                    p.id === data.participant_id
                      ? {
                          ...p,
                          selected_entity: data.entity_id,
                          last_activity: new Date().toISOString(),
                        }
                      : p,
                  ),
                );
                break;
              case "entity_updated":
              case "chat_message": {
                // Pass to custom handlers
                const handler = messageHandlersRef.current.get(data.type);
                if (handler) {
                  handler(data);
                }
                break;
              }
              default: {
                // Pass to custom handlers for any other message types
                const customHandler = messageHandlersRef.current.get(data.type);
                if (customHandler) {
                  customHandler(data);
                }
              }
            }
          } catch (error) {
            secureLogger.error(
              "COLLABORATION",
              "Error parsing collaboration message",
              {
                error: error instanceof Error ? error.message : String(error),
              },
            );
          }
        };

        ws.onclose = () => {
          if (!isMounted.current) return;
          secureLogger.info(
            "COLLABORATION",
            "Disconnected from collaboration session",
          );
          setIsConnected(false);
          setParticipants([]);
          websocketRef.current = null;

          // Attempt reconnection after 5 seconds
          if (isMounted.current) {
            reconnectTimeoutRef.current = setTimeout(() => {
              if (!websocketRef.current && isMounted.current) {
                connect();
              }
            }, 5000);
          }
        };

        ws.onerror = (error) => {
          if (!isMounted.current) return;
          secureLogger.error("COLLABORATION", "WebSocket error", {
            error: error instanceof Error ? error.message : String(error),
          });
        };
      } catch (error) {
        if (!isMounted.current) return;
        secureLogger.error(
          "COLLABORATION",
          "Failed to connect to collaboration server",
          {
            error: error instanceof Error ? error.message : String(error),
          },
        );
      }
    };

    connect();

    return () => {
      if (websocketRef.current) {
        websocketRef.current.close();
        websocketRef.current = null;
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [sessionId]);

  // Send cursor update
  const sendCursorUpdate = useCallback((x: number, y: number) => {
    if (
      websocketRef.current &&
      websocketRef.current.readyState === WebSocket.OPEN
    ) {
      websocketRef.current.send(
        JSON.stringify({
          type: "cursor_update",
          x,
          y,
        }),
      );
    }
  }, []);

  // Select entity
  const selectEntity = useCallback(
    (entityId: string, entityName: string = "") => {
      if (
        websocketRef.current &&
        websocketRef.current.readyState === WebSocket.OPEN
      ) {
        websocketRef.current.send(
          JSON.stringify({
            type: "entity_select",
            entity_id: entityId,
            entity_name: entityName,
          }),
        );
      }
    },
    [],
  );

  // Update entity
  const updateEntity = useCallback(
    (entityId: string, changes: EntityChanges) => {
      if (
        websocketRef.current &&
        websocketRef.current.readyState === WebSocket.OPEN
      ) {
        websocketRef.current.send(
          JSON.stringify({
            type: "entity_update",
            entity_id: entityId,
            changes,
          }),
        );
      }
    },
    [],
  );

  // Send chat message
  const sendChatMessage = useCallback((message: string) => {
    if (
      websocketRef.current &&
      websocketRef.current.readyState === WebSocket.OPEN
    ) {
      websocketRef.current.send(
        JSON.stringify({
          type: "chat_message",
          message,
        }),
      );
    }
  }, []);

  // Register message handler
  const onMessage = useCallback((type: string, handler: MessageHandler) => {
    messageHandlersRef.current.set(type, handler);
  }, []);

  // Disconnect
  const disconnect = useCallback(() => {
    if (websocketRef.current) {
      websocketRef.current.close();
      websocketRef.current = null;
    }
    setIsConnected(false);
    setParticipants([]);
  }, []);

  // Memoize expensive computations
  const activeParticipants = useMemo(() => {
    return participants.filter((p) => {
      const lastActivity = new Date(p.last_activity);
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
      return lastActivity > fiveMinutesAgo;
    });
  }, [participants]);

  const participantStats = useMemo(() => {
    return {
      total: participants.length,
      active: activeParticipants.length,
      byRole: participants.reduce(
        (acc, p) => {
          acc[p.role] = (acc[p.role] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>,
      ),
    };
  }, [participants, activeParticipants]);

  return {
    isConnected,
    participants,
    activeParticipants,
    participantStats,
    sendCursorUpdate,
    selectEntity,
    updateEntity,
    sendChatMessage,
    onMessage,
    disconnect,
  };
}
