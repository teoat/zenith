import { useState, useEffect, useCallback, useRef } from 'react';

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

  // Connect to collaboration server
  useEffect(() => {
    if (!sessionId) return;

    const connect = () => {
      try {
        const ws = new WebSocket(`ws://localhost:8080/ws/session/${sessionId}`);
        websocketRef.current = ws;

        ws.onopen = () => {
          console.log('Connected to collaboration session:', sessionId);
          setIsConnected(true);

          // Join session with participant info
          ws.send(JSON.stringify({
            type: 'join_session',
            name: `User_${Date.now()}`, // In real app, get from user context
            role: 'investigator',
            color: '#3b82f6'
          }));
        };

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            console.log('Collaboration message:', data);

            // Handle built-in message types
            switch (data.type) {
              case 'session_state':
                setParticipants(data.participants || []);
                break;
              case 'participant_joined':
                setParticipants(prev => [...prev, data.participant]);
                break;
              case 'participant_left':
                setParticipants(prev => prev.filter(p => p.id !== data.participant_id));
                break;
              case 'cursor_update':
                setParticipants(prev => prev.map(p =>
                  p.id === data.participant_id
                    ? { ...p, cursor: data.cursor, last_activity: data.cursor.timestamp }
                    : p
                ));
                break;
              case 'entity_selected':
                setParticipants(prev => prev.map(p =>
                  p.id === data.participant_id
                    ? { ...p, selected_entity: data.entity_id, last_activity: new Date().toISOString() }
                    : p
                ));
                break;
              case 'entity_updated':
              case 'chat_message': {
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
          } catch (_error) {
            console.error('Error parsing collaboration message:', error);
          }
        };

        ws.onclose = () => {
          console.log('Disconnected from collaboration session');
          setIsConnected(false);
          setParticipants([]);
          websocketRef.current = null;

          // Attempt reconnection after 5 seconds
          setTimeout(() => {
            if (!websocketRef.current) {
              connect();
            }
          }, 5000);
        };

        ws.onerror = (error) => {
          console.error('WebSocket error:', error);
        };

      } catch (_error) {
        console.error('Failed to connect to collaboration server:', error);
      }
    };

    connect();

    return () => {
      if (websocketRef.current) {
        websocketRef.current.close();
        websocketRef.current = null;
      }
    };
  }, [sessionId]);

  // Send cursor update
  const sendCursorUpdate = useCallback((x: number, y: number) => {
    if (websocketRef.current && websocketRef.current.readyState === WebSocket.OPEN) {
      websocketRef.current.send(JSON.stringify({
        type: 'cursor_update',
        x,
        y
      }));
    }
  }, []);

  // Select entity
  const selectEntity = useCallback((entityId: string, entityName: string = '') => {
    if (websocketRef.current && websocketRef.current.readyState === WebSocket.OPEN) {
      websocketRef.current.send(JSON.stringify({
        type: 'entity_select',
        entity_id: entityId,
        entity_name: entityName
      }));
    }
  }, []);

  // Update entity
  const updateEntity = useCallback((entityId: string, changes: EntityChanges) => {
    if (websocketRef.current && websocketRef.current.readyState === WebSocket.OPEN) {
      websocketRef.current.send(JSON.stringify({
        type: 'entity_update',
        entity_id: entityId,
        changes
      }));
    }
  }, []);

  // Send chat message
  const sendChatMessage = useCallback((message: string) => {
    if (websocketRef.current && websocketRef.current.readyState === WebSocket.OPEN) {
      websocketRef.current.send(JSON.stringify({
        type: 'chat_message',
        message
      }));
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

  return {
    isConnected,
    participants,
    sendCursorUpdate,
    selectEntity,
    updateEntity,
    sendChatMessage,
    onMessage,
    disconnect
  };
}