import { useState, useEffect, useRef, useCallback } from "react";
import { secureLogger } from "@/utils/secureLogger";

interface UserPresence {
  user_id: string;
  user_name: string;
  cursor_position: number;
  color: string;
  last_seen: string;
}

/**
 * Hook for using collaborative editing
 */
export function useCollaborativeEditor(
  documentId: string,
  initialContent: string = "",
) {
  const [content, setContent] = useState(initialContent);
  const [isConnected, setIsConnected] = useState(false);
  const [users, setUsers] = useState<UserPresence[]>([]);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    const ws = new WebSocket(`ws://localhost:8000/ws/${documentId}`);

    ws.onopen = () => {
      secureLogger.info("Connected to collaborative editing");
      setIsConnected(true);
      wsRef.current = ws;

      ws.send(
        JSON.stringify({
          type: "join_case",
          case_id: documentId,
        }),
      );
    };

    ws.onmessage = (event) => {
      const message = JSON.parse(event.data);
      switch (message.type) {
        case "user_joined":
          setUsers((prev) => [...prev, message.user]);
          break;
        case "user_left":
          setUsers((prev) => prev.filter((u) => u.user_id !== message.user_id));
          break;
        case "content_update":
          if (message.user_id !== documentId) {
            setContent(message.content);
          }
          break;
        case "cursor_update":
          setUsers((prev) =>
            prev.map((user) =>
              user.user_id === message.user_id
                ? { ...user, cursor_position: message.cursor_position }
                : user,
            ),
          );
          break;
      }
    };

    ws.onclose = () => {
      setIsConnected(false);
      setUsers([]);
      wsRef.current = null;
    };

    return () => {
      ws.close();
    };
  }, [documentId]);

  const updateContent = useCallback(
    (newContent: string) => {
      setContent(newContent);
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(
          JSON.stringify({
            type: "update_case",
            case_id: documentId,
            data: {
              content: newContent,
              timestamp: new Date().toISOString(),
            },
          }),
        );
      }
    },
    [documentId],
  );

  const updateCursor = useCallback(
    (position: number) => {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(
          JSON.stringify({
            type: "cursor_update",
            case_id: documentId,
            cursor_position: position,
          }),
        );
      }
    },
    [documentId],
  );

  return {
    content,
    isConnected,
    users,
    updateContent,
    updateCursor,
  };
}
