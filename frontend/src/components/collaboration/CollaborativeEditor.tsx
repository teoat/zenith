// frontend/src/components/collaboration/CollaborativeEditor.tsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '../ui/button';
// Input import removed as unused
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Users, User, Edit3, Save, X } from 'lucide-react';

interface UserPresence {
  user_id: string;
  user_name: string;
  cursor_position: number;
  color: string;
  last_seen: string;
}

interface CollaborativeEditorProps {
  documentId: string;
  initialContent?: string;
  onSave?: (content: string) => void;
  onClose?: () => void;
  className?: string;
}

export function CollaborativeEditor({
  documentId,
  initialContent = '',
  onSave,
  onClose,
  className = ''
}: CollaborativeEditorProps) {
  const [content, setContent] = useState(initialContent);
  const [isConnected, setIsConnected] = useState(false);
  const [users, setUsers] = useState<UserPresence[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const wsRef = useRef<WebSocket | null>(null);

  // Connect to WebSocket
  useEffect(() => {
    const connectWebSocket = () => {
      const ws = new WebSocket(`ws://localhost:8000/ws/${documentId}`);

      ws.onopen = () => {
        console.log('Connected to collaborative editing');
        setIsConnected(true);
        wsRef.current = ws;

        // Join the document
        ws.send(JSON.stringify({
          type: 'join_case',
          case_id: documentId
        }));
      };

      ws.onmessage = (event) => {
        const message = JSON.parse(event.data);

        switch (message.type) {
          case 'welcome':
            console.log('Joined collaborative session');
            break;

          case 'user_joined':
            setUsers(prev => [...prev, message.user]);
            break;

          case 'user_left':
            setUsers(prev => prev.filter(u => u.user_id !== message.user_id));
            break;

          case 'content_update':
            if (message.user_id !== documentId) { // Don't update our own changes
              setContent(message.content);
            }
            break;

          case 'cursor_update':
            // Update cursor positions
            setUsers(prev => prev.map(user =>
              user.user_id === message.user_id
                ? { ...user, cursor_position: message.cursor_position }
                : user
            ));
            break;

          case 'error':
            console.error('WebSocket error:', message.message);
            break;
        }
      };

      ws.onclose = () => {
        console.log('Disconnected from collaborative editing');
        setIsConnected(false);
        setUsers([]);
        wsRef.current = null;

        // Attempt to reconnect after 5 seconds
        setTimeout(connectWebSocket, 5000);
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
      };
    };

    connectWebSocket();

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [documentId]);

  // Handle content changes
  const handleContentChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value;
    setContent(newContent);
    setHasUnsavedChanges(true);
    setIsEditing(true);

    // Send update to other users
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'update_case',
        case_id: documentId,
        data: {
          content: newContent,
          timestamp: new Date().toISOString()
        }
      }));
    }
  }, [documentId]);

  // Handle cursor movement
  const handleCursorMove = useCallback((e: React.SyntheticEvent<HTMLTextAreaElement>) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'cursor_update',
        case_id: documentId,
        cursor_position: e.currentTarget.selectionStart
      }));
    }
  }, [documentId]);

  // Save changes
  const handleSave = useCallback(() => {
    onSave?.(content);
    setHasUnsavedChanges(false);
    setIsEditing(false);
  }, [content, onSave]);

  // Stop editing
  const handleStopEditing = useCallback(() => {
    setIsEditing(false);
    setHasUnsavedChanges(false);
  }, []);

  return (
    <Card className={`h-full flex flex-col ${className}`}>
      <CardHeader className="flex-shrink-0">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Edit3 className="h-5 w-5" />
            Collaborative Editor
            {hasUnsavedChanges && (
              <span className="text-sm text-orange-600 font-normal">
                (Unsaved changes)
              </span>
            )}
          </CardTitle>

          <div className="flex items-center gap-2">
            {/* Connection status */}
            <div className="flex items-center gap-1 text-sm">
              <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
              {isConnected ? 'Connected' : 'Disconnected'}
            </div>

            {/* User count */}
            <div className="flex items-center gap-1 text-sm text-gray-600">
              <Users className="h-4 w-4" />
              {users.length + 1} user{users.length !== 0 ? 's' : ''}
            </div>

            {/* Action buttons */}
            <div className="flex gap-1">
              {isEditing && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleStopEditing}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
              {hasUnsavedChanges && (
                <Button
                  size="sm"
                  onClick={handleSave}
                >
                  <Save className="h-4 w-4" />
                </Button>
              )}
              {onClose && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={onClose}
                >
                  Close
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Active users */}
        {users.length > 0 && (
          <div className="flex items-center gap-2 mt-2">
            <span className="text-sm text-gray-600">Active users:</span>
            {users.map(user => (
              <div
                key={user.user_id}
                className="flex items-center gap-1 text-sm"
                style={{ color: user.color }}
              >
                <User className="h-3 w-3" />
                {user.user_name}
              </div>
            ))}
          </div>
        )}
      </CardHeader>

      <CardContent className="flex-1 flex flex-col">
        <textarea
          ref={textareaRef}
          value={content}
          onChange={handleContentChange}
          onKeyUp={handleCursorMove}
          onClick={handleCursorMove}
          onSelect={handleCursorMove}
          placeholder="Start typing to begin collaborative editing..."
          className="flex-1 w-full p-3 border border-gray-300 rounded-md resize-none focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono text-sm"
          style={{ minHeight: '300px' }}
        />

        {/* Editor status */}
        <div className="mt-2 text-xs text-gray-500 flex justify-between">
          <span>
            {content.length} characters
            {isEditing && ' (editing)'}
          </span>
          <span>
            {isConnected ? 'Real-time sync active' : 'Offline mode'}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

// Hook for using collaborative editing
export function useCollaborativeEditor(documentId: string) {
  const [isConnected, setIsConnected] = useState(false);
  const [users, setUsers] = useState<UserPresence[]>([]);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected'>('connecting');

  useEffect(() => {
    const ws = new WebSocket(`ws://localhost:8000/ws/${documentId}`);

    ws.onopen = () => {
      setIsConnected(true);
      setConnectionStatus('connected');
      ws.send(JSON.stringify({
        type: 'join_case',
        case_id: documentId
      }));
    };

    ws.onmessage = (event) => {
      const message = JSON.parse(event.data);

      switch (message.type) {
        case 'user_joined':
          setUsers(prev => [...prev, message.user]);
          break;
        case 'user_left':
          setUsers(prev => prev.filter(u => u.user_id !== message.user_id));
          break;
      }
    };

    ws.onclose = () => {
      setIsConnected(false);
      setConnectionStatus('disconnected');
      setUsers([]);
    };

    ws.onerror = () => {
      setConnectionStatus('disconnected');
    };

    return () => {
      ws.close();
    };
  }, [documentId]);

  return {
    isConnected,
    users,
    connectionStatus
  };
}