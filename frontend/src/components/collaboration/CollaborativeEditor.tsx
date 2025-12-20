// frontend/src/components/collaboration/CollaborativeEditor.tsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '../ui/Button';
// Input import removed as unused
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Users, User, Edit3, Save, X } from 'lucide-react';
import { secureLogger } from '../../utils/secureLogger';

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

// Hook for using collaborative editing
export function useCollaborativeEditor(documentId: string, initialContent: string = '') {
  const [content, setContent] = useState(initialContent);
  const [isConnected, setIsConnected] = useState(false);
  const [users, setUsers] = useState<UserPresence[]>([]);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    const ws = new WebSocket(`ws://localhost:8000/ws/${documentId}`);

    ws.onopen = () => {
      secureLogger.info('Connected to collaborative editing');
      setIsConnected(true);
      wsRef.current = ws;
      
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
        case 'content_update':
          if (message.user_id !== documentId) {
            setContent(message.content);
          }
          break;
        case 'cursor_update':
          setUsers(prev => prev.map(user =>
            user.user_id === message.user_id
              ? { ...user, cursor_position: message.cursor_position }
              : user
          ));
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

  const updateContent = useCallback((newContent: string) => {
    setContent(newContent);
    if (wsRef.current?.readyState === WebSocket.OPEN) {
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

  const updateCursor = useCallback((position: number) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'cursor_update',
        case_id: documentId,
        cursor_position: position
      }));
    }
  }, [documentId]);

  return {
    content,
    isConnected,
    users,
    updateContent,
    updateCursor
  };
}

export function CollaborativeEditor({
  documentId,
  initialContent = '',
  onSave,
  onClose,
  className = ''
}: CollaborativeEditorProps) {
  const {
    content,
    isConnected,
    users,
    updateContent,
    updateCursor
  } = useCollaborativeEditor(documentId, initialContent);

  const [isEditing, setIsEditing] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleContentChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value;
    updateContent(newContent);
    setHasUnsavedChanges(true);
    setIsEditing(true);
  }, [updateContent]);

  const handleCursorMove = useCallback((e: React.SyntheticEvent<HTMLTextAreaElement>) => {
    updateCursor(e.currentTarget.selectionStart);
  }, [updateCursor]);

  const handleSave = useCallback(() => {
    onSave?.(content);
    setHasUnsavedChanges(false);
    setIsEditing(false);
  }, [content, onSave]);

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
            <div className="flex items-center gap-1 text-sm">
              <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
              {isConnected ? 'Connected' : 'Disconnected'}
            </div>

            <div className="flex items-center gap-1 text-sm text-gray-600">
              <Users className="h-4 w-4" />
              {users.length + 1} user{users.length !== 0 ? 's' : ''}
            </div>

            <div className="flex gap-1">
              {isEditing && (
                <Button size="sm" variant="outline" onClick={handleStopEditing}>
                  <X className="h-4 w-4" />
                </Button>
              )}
              {hasUnsavedChanges && (
                <Button size="sm" onClick={handleSave}>
                  <Save className="h-4 w-4" />
                </Button>
              )}
              {onClose && (
                <Button size="sm" variant="outline" onClick={onClose}>
                  Close
                </Button>
              )}
            </div>
          </div>
        </div>

        {users.length > 0 && (
          <div className="flex items-center gap-2 mt-2">
            <span className="text-sm text-gray-600">Active users:</span>
            {users.map(user => (
              <div
                key={user.user_id}
                className="flex items-center gap-1 text-sm"
                style={{ ['--user-color' as string]: user.color, color: 'var(--user-color)' } as React.CSSProperties}
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
          className="flex-1 w-full p-3 border border-gray-300 rounded-md resize-none focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono text-sm min-h-[300px]"
        />

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