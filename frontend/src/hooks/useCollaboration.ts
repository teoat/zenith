import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { secureLogger } from "@/utils/secureLogger";

export interface EntityChanges {
  [key: string]: unknown;
}

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

interface CollaborationState {
  isConnected: boolean;
  participants: Participant[];
}

interface CollaborationActions {
  sendCursorUpdate: (x: number, y: number) => void;
  selectEntity: (entityId: string, entityName?: string) => void;
  updateEntity: (entityId: string, changes: EntityChanges) => void;
  sendChatMessage: (message: string) => void;
  onMessage: (type: string, handler: MessageHandler) => void;
  disconnect: () => void;
}

interface UseCollaborationReturn extends CollaborationState {
  activeParticipants: Participant[];
  participantStats: {
    total: number;
    active: number;
    byRole: Record<string, number>;
  };
}

const COLLABORATION_WS_URL = process.env.VITE_COLLABORATION_WS_URL || "ws://localhost:8080";

function createParticipantStats(
  participants: Participant[],
  activeCount: number
): { total: number; active: number; byRole: Record<string, number> } {
  const byRole: Record<string, number> = {};
  for (const p of participants) {
    byRole[p.role] = (byRole[p.role] || 0) + 1;
  }
  return {
    total: participants.length,
    active: activeCount,
    byRole,
  };
}

export function useCollaboration(sessionId: string): UseCollaborationReturn & CollaborationActions {
  const [state, setState] = useState<CollaborationState>({
    isConnected: false,
    participants: [],
  });

  const websocketRef = useRef<WebSocket | null>(null);
  const messageHandlersRef = useRef<Map<string, MessageHandler>>(new Map());
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isMountedRef = useRef(true);
  const reconnectAttemptsRef = useRef(0);
  const maxReconnectAttempts = 5;
  const reconnectInterval = 5000;

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (!sessionId) return;

    const maxReconnectAttempts = 5;
    const reconnectInterval = 5000;

    const connect = (): void => {
      if (!isMountedRef.current || reconnectAttemptsRef.current >= maxReconnectAttempts) return;

      try {
        const ws = new WebSocket(`${COLLABORATION_WS_URL}/ws/session/${sessionId}`);
        websocketRef.current = ws;

        ws.onopen = (): void => {
          if (!isMountedRef.current) {
            ws.close();
            return;
          }
          secureLogger.info("COLLABORATION", "Connected to collaboration session", { sessionId });
          reconnectAttemptsRef.current = 0;
          setState((prev) => ({ ...prev, isConnected: true }));

          ws.send(
            JSON.stringify({
              type: "join_session",
              name: `User_${Date.now()}`,
              role: "investigator",
              color: "#3b82f6",
            })
          );
        };

        ws.onmessage = (event): void => {
          if (!isMountedRef.current) return;
          try {
            const data = JSON.parse(event.data);
            secureLogger.debug("COLLABORATION", "Collaboration message received", { type: data.type });

            switch (data.type) {
              case "session_state":
                setState((prev) => ({ ...prev, participants: data.participants || [] }));
                break;
              case "participant_joined":
                setState((prev) => ({
                  ...prev,
                  participants: [...prev.participants, data.participant],
                }));
                break;
              case "participant_left":
                setState((prev) => ({
                  ...prev,
                  participants: prev.participants.filter((p) => p.id !== data.participant_id),
                }));
                break;
              case "cursor_update":
                setState((prev) => ({
                  ...prev,
                  participants: prev.participants.map((p) =>
                    p.id === data.participant_id
                      ? { ...p, cursor: data.cursor, last_activity: data.cursor.timestamp }
                      : p
                  ),
                }));
                break;
              case "entity_selected":
                setState((prev) => ({
                  ...prev,
                  participants: prev.participants.map((p) =>
                    p.id === data.participant_id
                      ? { ...p, selected_entity: data.entity_id, last_activity: new Date().toISOString() }
                      : p
                  ),
                }));
                break;
              case "entity_updated":
              case "chat_message": {
                const handler = messageHandlersRef.current.get(data.type);
                if (handler) handler(data);
                break;
              }
              default: {
                const customHandler = messageHandlersRef.current.get(data.type);
                if (customHandler) customHandler(data);
              }
            }
          } catch (error) {
            secureLogger.error("COLLABORATION", "Error parsing collaboration message", {
              error: error instanceof Error ? error.message : String(error),
            });
          }
        };

        ws.onclose = (): void => {
          if (!isMountedRef.current) return;
          secureLogger.info("COLLABORATION", "Disconnected from collaboration session");
          setState((prev) => ({ ...prev, isConnected: false, participants: [] }));
          websocketRef.current = null;

          if (isMountedRef.current && reconnectAttemptsRef.current < maxReconnectAttempts) {
            reconnectAttemptsRef.current++;
            reconnectTimeoutRef.current = setTimeout(() => {
              if (!websocketRef.current && isMountedRef.current) {
                connect();
              }
            }, reconnectInterval);
          }
        };

        ws.onerror = (error: Event): void => {
          if (!isMountedRef.current) return;
          secureLogger.error("COLLABORATION", "WebSocket error", {
            error: error instanceof Error ? error.message : String(error),
          });
        };
      } catch (error) {
        if (!isMountedRef.current) return;
        secureLogger.error("COLLABORATION", "Failed to connect to collaboration server", {
          error: error instanceof Error ? error.message : String(error),
        });
      }
    };

    connect();

    return (): void => {
      if (websocketRef.current) {
        websocketRef.current.close();
        websocketRef.current = null;
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [sessionId]);

  const sendCursorUpdate = useCallback((x: number, y: number): void => {
    if (websocketRef.current?.readyState === WebSocket.OPEN) {
      websocketRef.current.send(JSON.stringify({ type: "cursor_update", x, y }));
    }
  }, []);

  const selectEntity = useCallback(
    (entityId: string, entityName = ""): void => {
      if (websocketRef.current?.readyState === WebSocket.OPEN) {
        websocketRef.current.send(
          JSON.stringify({ type: "entity_select", entity_id: entityId, entity_name: entityName })
        );
      }
    },
    []
  );

  const updateEntity = useCallback(
    (entityId: string, changes: EntityChanges): void => {
      if (websocketRef.current?.readyState === WebSocket.OPEN) {
        websocketRef.current.send(
          JSON.stringify({ type: "entity_update", entity_id: entityId, changes })
        );
      }
    },
    []
  );

  const sendChatMessage = useCallback((message: string): void => {
    if (websocketRef.current?.readyState === WebSocket.OPEN) {
      websocketRef.current.send(JSON.stringify({ type: "chat_message", message }));
    }
  }, []);

  const onMessage = useCallback((type: string, handler: MessageHandler): void => {
    messageHandlersRef.current.set(type, handler);
  }, []);

  const disconnect = useCallback((): void => {
    if (websocketRef.current) {
      websocketRef.current.close();
      websocketRef.current = null;
    }
    reconnectAttemptsRef.current = maxReconnectAttempts;
    setState((prev) => ({ ...prev, isConnected: false, participants: [] }));
  }, []);

  const activeParticipants = useMemo((): Participant[] => {
    const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
    return state.participants.filter((p) => new Date(p.last_activity).getTime() > fiveMinutesAgo);
  }, [state.participants]);

  const participantStats = useMemo(
    () => createParticipantStats(state.participants, activeParticipants.length),
    [state.participants, activeParticipants.length]
  );

  return {
    ...state,
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
