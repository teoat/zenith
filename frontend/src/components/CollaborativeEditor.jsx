import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Textarea } from './ui/textarea';
import { 
  Users, 
  Wifi, 
  WifiOff, 
  Sync, 
  Clock
} from 'lucide-react';

const CollaborativeEditor = ({ documentId, userId }) => {
  const [content, setContent] = useState('');
  const [connected, setConnected] = useState(false);
  const [operations, setOperations] = useState([]);
  const [vectorClock, setVectorClock] = useState({});
  const [clientId, setClientId] = useState('');
  const [syncStatus, setSyncStatus] = useState('disconnected');
  const [lastSync, setLastSync] = useState(null);
  
  const websocket = useRef(null);
  const reconnectTimeout = useRef(null);
  const operationQueue = useRef([]);
  const isApplyingRemoteOperation = useRef(false);

  // Initialize WebSocket connection
  const connectWebSocket = useCallback(() => {
    try {
      const wsUrl = `ws://localhost:8000/api/v1/sync/ws/${userId}`;
      websocket.current = new WebSocket(wsUrl);

      websocket.current.onopen = () => {
        console.log('WebSocket connected');
        setConnected(true);
        setSyncStatus('connected');
        
        // Clear reconnect timeout
        if (reconnectTimeout.current) {
          clearTimeout(reconnectTimeout.current);
        }
        
        // Subscribe to document
        sendMessage({
          type: 'subscribe',
          document_id: documentId
        });
        
        // Request sync
        sendMessage({
          type: 'sync',
          document_id: documentId,
          vector_clock: vectorClock
        });
      };

      websocket.current.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          handleWebSocketMessage(message);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      websocket.current.onclose = () => {
        console.log('WebSocket disconnected');
        setConnected(false);
        setSyncStatus('disconnected');
        
        // Attempt to reconnect after 3 seconds
        reconnectTimeout.current = setTimeout(() => {
          setSyncStatus('reconnecting');
          connectWebSocket();
        }, 3000);
      };

      websocket.current.onerror = (error) => {
        console.error('WebSocket error:', error);
        setSyncStatus('error');
      };

    } catch (error) {
      console.error('Error creating WebSocket connection:', error);
      setSyncStatus('error');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- handleWebSocketMessage and sendMessage are stable, including them causes infinite loops
  }, [documentId, userId, vectorClock]);

  // Handle incoming WebSocket messages
  const handleWebSocketMessage = useCallback((message) => {
    switch (message.type) {
      case 'connected':
        setClientId(message.client_id);
        break;
        
      case 'document_state':
        // Update content with server state
        if (!isApplyingRemoteOperation.current) {
          setContent(message.state.content || '');
          setVectorClock(message.state.vector_clock || {});
          setLastSync(new Date());
        }
        break;
        
      case 'operation':
        // Apply remote operation
        applyRemoteOperation(message.operation);
        break;
        
      case 'welcome':
        console.log('Welcome message:', message);
        break;
        
      case 'pong':
        // Heartbeat response
        break;
        
      case 'error':
        console.error('Server error:', message.message);
        break;
        
      default:
        console.log('Unknown message type:', message.type);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- applyRemoteOperation is stable and including it causes infinite re-renders
  }, []);

  // Apply remote operation to local content
  const applyRemoteOperation = useCallback((operation) => {
    isApplyingRemoteOperation.current = true;
    
    try {
      let newContent = content;
      
      switch (operation.type) {
        case 'insert': {
          const position = Math.min(operation.position, newContent.length);
          newContent = newContent.slice(0, position) + operation.content + newContent.slice(position);
          break;
        }
          
        case 'delete': {
          const deletePos = Math.min(operation.position, newContent.length);
          const length = Math.min(operation.length || 1, newContent.length - deletePos);
          newContent = newContent.slice(0, deletePos) + newContent.slice(deletePos + length);
          break;
        }
          
        default:
          console.warn('Unknown operation type:', operation.type);
          return;
      }
      
      setContent(newContent);
      setVectorClock(operation.vector_clock || {});
      setLastSync(new Date());
      
      // Add to operations history
      setOperations(prev => [...prev.slice(-9), operation]);
      
    } finally {
      isApplyingRemoteOperation.current = false;
    }
  }, [content]);

  // Send message to WebSocket
  const sendMessage = useCallback((message) => {
    if (websocket.current && websocket.current.readyState === WebSocket.OPEN) {
      websocket.current.send(JSON.stringify(message));
    } else {
      // Queue message for when connection is restored
      operationQueue.current.push(message);
    }
  }, []);

  // Handle local content change
  const handleContentChange = useCallback((newContent) => {
    if (isApplyingRemoteOperation.current) return;
    
    // Generate operations to transform old content to new content
    const operations = generateOperations(content, newContent);
    
    // Apply each operation locally and send to server
    operations.forEach(op => {
      // Apply locally
      applyLocalOperation(op);
      
      // Send to server
      sendMessage({
        type: 'operation',
        document_id: documentId,
        operation: {
          ...op,
          client_id: clientId,
          vector_clock: vectorClock
        }
      });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- applyLocalOperation is intentionally excluded to prevent infinite loops
  }, [content, clientId, vectorClock, documentId, sendMessage]);

  // Generate operations to transform old content to new content
  const generateOperations = (oldContent, newContent) => {
    const operations = [];
    
    // Simple diff algorithm - in production, use a more sophisticated approach
    let oldIndex = 0;
    let newIndex = 0;
    
    while (oldIndex < oldContent.length || newIndex < newContent.length) {
      if (oldIndex >= oldContent.length) {
        // Insert remaining characters
        operations.push({
          id: `insert_${Date.now()}_${newIndex}`,
          type: 'insert',
          position: newIndex,
          content: newContent.slice(newIndex)
        });
        break;
      }
      
      if (newIndex >= newContent.length) {
        // Delete remaining characters
        operations.push({
          id: `delete_${Date.now()}_${oldIndex}`,
          type: 'delete',
          position: newIndex,
          length: oldContent.length - oldIndex
        });
        break;
      }
      
      if (oldContent[oldIndex] === newContent[newIndex]) {
        oldIndex++;
        newIndex++;
      } else {
        // Find the next matching character
        let foundMatch = false;
        for (let i = 1; i <= 10; i++) {
          if (oldIndex + i < oldContent.length && 
              oldContent[oldIndex + i] === newContent[newIndex]) {
            // Delete characters that don't match
            operations.push({
              id: `delete_${Date.now()}_${oldIndex}`,
              type: 'delete',
              position: newIndex,
              length: i
            });
            oldIndex += i;
            foundMatch = true;
            break;
          }
          
          if (newIndex + i < newContent.length && 
              oldContent[oldIndex] === newContent[newIndex + i]) {
            // Insert characters that don't match
            operations.push({
              id: `insert_${Date.now()}_${newIndex}`,
              type: 'insert',
              position: newIndex,
              content: newContent.slice(newIndex, newIndex + i)
            });
            newIndex += i;
            foundMatch = true;
            break;
          }
        }
        
        if (!foundMatch) {
          // Replace character with delete + insert
          operations.push({
            id: `delete_${Date.now()}_${oldIndex}`,
            type: 'delete',
            position: newIndex,
            length: 1
          });
          operations.push({
            id: `insert_${Date.now()}_${newIndex}`,
            type: 'insert',
            position: newIndex,
            content: newContent[newIndex]
          });
          oldIndex++;
          newIndex++;
        }
      }
    }
    
    return operations;
  };

  // Apply operation locally
  const applyLocalOperation = (operation) => {
    let newContent = content;
    
    switch (operation.type) {
      case 'insert': {
        const position = Math.min(operation.position, newContent.length);
        newContent = newContent.slice(0, position) + operation.content + newContent.slice(position);
        break;
      }
        
      case 'delete': {
        const deletePos = Math.min(operation.position, newContent.length);
        const length = Math.min(operation.length || 1, newContent.length - deletePos);
        newContent = newContent.slice(0, deletePos) + newContent.slice(deletePos + length);
        break;
      }
    }
    
    setContent(newContent);
  };

  // Initialize connection
  useEffect(() => {
    connectWebSocket();
    
    return () => {
      if (reconnectTimeout.current) {
        clearTimeout(reconnectTimeout.current);
      }
      if (websocket.current) {
        websocket.current.close();
      }
    };
  }, [connectWebSocket]);

  // Send heartbeat every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      if (connected) {
        sendMessage({ type: 'ping' });
      }
    }, 30000);
    
    return () => clearInterval(interval);
  }, [connected, sendMessage]);

  // Process queued operations when connection is restored
  useEffect(() => {
    if (connected && operationQueue.current.length > 0) {
      operationQueue.current.forEach(message => {
        sendMessage(message);
      });
      operationQueue.current = [];
    }
  }, [connected, sendMessage]);

  const getStatusColor = () => {
    switch (syncStatus) {
      case 'connected': return 'text-green-600';
      case 'reconnecting': return 'text-yellow-600';
      case 'error': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getStatusIcon = () => {
    switch (syncStatus) {
      case 'connected': return <Wifi className="w-4 h-4" />;
      case 'reconnecting': return <Sync className="w-4 h-4 animate-spin" />;
      case 'error': return <WifiOff className="w-4 h-4" />;
      default: return <WifiOff className="w-4 h-4" />;
    }
  };

  return (
    <div className="space-y-4">
      {/* Connection Status */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Collaborative Editor
            </CardTitle>
            <div className="flex items-center gap-4">
              <div className={`flex items-center gap-2 ${getStatusColor()}`}>
                {getStatusIcon()}
                <span className="text-sm font-medium">
                  {syncStatus.charAt(0).toUpperCase() + syncStatus.slice(1)}
                </span>
              </div>
              {lastSync && (
                <div className="flex items-center gap-1 text-sm text-gray-600">
                  <Clock className="w-4 h-4" />
                  Last sync: {lastSync.toLocaleTimeString()}
                </div>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
            {/* Main Editor */}
            <div className="lg:col-span-3">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Badge variant="outline">Document: {documentId}</Badge>
                  <Badge variant="outline">User: {userId}</Badge>
                  <Badge variant="outline">Client: {clientId.slice(-8)}</Badge>
                </div>
                <Textarea
                  value={content}
                  onChange={(e) => handleContentChange(e.target.value)}
                  placeholder="Start typing to collaborate..."
                  className="min-h-[400px] font-mono"
                  disabled={!connected}
                />
                <div className="flex justify-between items-center text-sm text-gray-600">
                  <span>Characters: {content.length}</span>
                  <span>Operations: {operations.length}</span>
                </div>
              </div>
            </div>
            
            {/* Sidebar */}
            <div className="space-y-4">
              {/* Connection Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Connection</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span>Status:</span>
                    <Badge 
                      variant={connected ? "default" : "destructive"}
                      className={getStatusColor()}
                    >
                      {syncStatus}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Client ID:</span>
                    <span className="text-xs font-mono">
                      {clientId.slice(-8)}
                    </span>
                  </div>
                  <Button 
                    onClick={connectWebSocket}
                    size="sm" 
                    variant="outline"
                    className="w-full"
                  >
                    <Sync className="w-4 h-4 mr-2" />
                    Reconnect
                  </Button>
                </CardContent>
              </Card>
              
              {/* Recent Operations */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Recent Operations</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {operations.length === 0 ? (
                      <p className="text-sm text-gray-600">No operations yet</p>
                    ) : (
                      operations.slice(-5).reverse().map((op, index) => (
                        <div key={op.id || index} className="text-xs border-l-2 border-blue-500 pl-2">
                          <div className="font-medium">
                            {op.type} at position {op.position}
                          </div>
                          {op.content && (
                            <div className="text-gray-600 truncate">
                              "{op.content}"
                            </div>
                          )}
                          {op.length && (
                            <div className="text-gray-600">
                              Length: {op.length}
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CollaborativeEditor;