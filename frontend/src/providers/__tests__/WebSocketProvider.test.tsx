import {  render, screen, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import { describe, it, jest, beforeEach } from '@jest/globals';
import { WebSocketProvider, useWebSocket } from '../WebSocketProvider';
import { ReactNode } from 'react';

// Mock WebSocket
global.WebSocket = jest.fn().mockImplementation(() => ({
  send: jest.fn(),
  close: jest.fn(),
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  readyState: WebSocket.OPEN
})) as any;

describe('WebSocketProvider', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  describe('initialization', () => {
    it('should render children', () => {
      render(
        <WebSocketProvider>
          <div data-testid="child">Test Child</div>
        </WebSocketProvider>
      );

      expect(screen.getByTestId('child')).toBeInTheDocument();
    });

    it('should not connect without token', () => {
      render(
        <WebSocketProvider>
          <div>Child</div>
        </WebSocketProvider>
      );

      expect(WebSocket).not.toHaveBeenCalled();
    });

    it('should connect with token', async () => {
      localStorage.setItem('token', 'valid-token');
      
      render(
        <WebSocketProvider>
          <div>Child</div>
        </WebSocketProvider>
      );

      await waitFor(() => {
        expect(WebSocket).toHaveBeenCalled();
      });
    });
  });

  describe('connection management', () => {
    it('should connect to WebSocket on mount', async () => {
      localStorage.setItem('token', 'token-123');
      
      render(
        <WebSocketProvider>
          <div>Test</div>
        </WebSocketProvider>
      );

      await waitFor(() => {
        expect(WebSocket).toHaveBeenCalledWith(
          expect.stringContaining('ws://')
        );
      });
    });

    it('should close connection on unmount', async () => {
      localStorage.setItem('token', 'token-123');
      const mockClose = jest.fn();
      (WebSocket as jest.Mock).mockImplementation(() => ({
        close: mockClose,
        send: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        readyState: WebSocket.OPEN
      }));

      const { unmount } = render(
        <WebSocketProvider>
          <div>Test</div>
        </WebSocketProvider>
      );

      await waitFor(() => {
        expect(WebSocket).toHaveBeenCalled();
      });

      unmount();

      expect(mockClose).toHaveBeenCalled();
    });

    it('should reconnect on connection drop', async () => {
      jest.useFakeTimers();
      localStorage.setItem('token', 'token-123');
      
      let onclose: (() => void) | null = null;
      (WebSocket as jest.Mock).mockImplementation(() => ({
        close: jest.fn(),
        send: jest.fn(),
        addEventListener: jest.fn((event, handler) => {
          if (event === 'close') onclose = handler;
        }),
        removeEventListener: jest.fn(),
        readyState: WebSocket.OPEN
      }));

      render(
        <WebSocketProvider reconnectInterval={1000}>
          <div>Test</div>
        </WebSocketProvider>
      );

      await waitFor(() => {
        expect(WebSocket).toHaveBeenCalledTimes(1);
      });

      // Simulate connection close
      act(() => {
        onclose?.();
      });

      // Fast forward time
      act(() => {
        jest.advanceTimersByTime(1000);
      });

      await waitFor(() => {
        expect(WebSocket).toHaveBeenCalledTimes(2);
      });

      jest.useRealTimers();
    });
  });

  describe('message handling', () => {
    it('should receive and process messages', async () => {
      localStorage.setItem('token', 'token-123');
      let onmessage: ((event: MessageEvent) => void) | null = null;
      
      (WebSocket as jest.Mock).mockImplementation(() => ({
        close: jest.fn(),
        send: jest.fn(),
        addEventListener: jest.fn((event, handler) => {
          if (event === 'message') onmessage = handler;
        }),
        removeEventListener: jest.fn(),
        readyState: WebSocket.OPEN
      }));

      const TestComponent = () => {
        const { lastMessage } = useWebSocket();
        return <div>{lastMessage ? 'Message received' : 'No message'}</div>;
      };

      render(
        <WebSocketProvider>
          <TestComponent />
        </WebSocketProvider>
      );

      await waitFor(() => {
        expect(screen.getByText('No message')).toBeInTheDocument();
      });

      // Simulate message receipt
      act(() => {
        onmessage?.(new MessageEvent('message', {
          data: JSON.stringify({ type: 'test', payload: 'data' })
        }));
      });

      await waitFor(() => {
        expect(screen.getByText('Message received')).toBeInTheDocument();
      });
    });

    it('should notify listeners of messages', async () => {
      localStorage.setItem('token', 'token-123');
      const mockListener = jest.fn();
      let onmessage: ((event: MessageEvent) => void) | null = null;
      
      (WebSocket as jest.Mock).mockImplementation(() => ({
        close: jest.fn(),
        send: jest.fn(),
        addEventListener: jest.fn((event, handler) => {
          if (event === 'message') onmessage = handler;
        }),
        removeEventListener: jest.fn(),
        readyState: WebSocket.OPEN
      }));

      const TestComponent = () => {
        const { addListener } = useWebSocket();
        
        React.useEffect(() => {
          const unsubscribe = addListener(mockListener);
          return unsubscribe;
        }, [addListener]);

        return <div>Test</div>;
      };

      render(
        <WebSocketProvider>
          <TestComponent />
        </WebSocketProvider>
      );

      act(() => {
        onmessage?.(new MessageEvent('message', {
          data: JSON.stringify({ type: 'notification', message: 'Hello' })
        }));
      });

      await waitFor(() => {
        expect(mockListener).toHaveBeenCalledWith(
          expect.objectContaining({ type: 'notification', message: 'Hello' })
        );
      });
    });
  });

  describe('sending messages', () => {
    it('should send messages when connected', async () => {
      localStorage.setItem('token', 'token-123');
      const mockSend = jest.fn();
      
      (WebSocket as jest.Mock).mockImplementation(() => ({
        close: jest.fn(),
        send: mockSend,
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        readyState: WebSocket.OPEN
      }));

      const TestComponent = () => {
        const { sendMessage } = useWebSocket();
        
        return (
          <button onClick={() => sendMessage({ type: 'test', data: 'hello' })}>
            Send
          </button>
        );
      };

      render(
        <WebSocketProvider>
          <TestComponent />
        </WebSocketProvider>
      );

      await waitFor(() => {
        expect(WebSocket).toHaveBeenCalled();
      });

      const sendButton = screen.getByText('Send');
      fireEvent.click(sendButton);

      expect(mockSend).toHaveBeenCalledWith(
        JSON.stringify({ type: 'test', data: 'hello' })
      );
    });

    it('should not send when disconnected', () => {
      const mockSend = jest.fn();
      
      (WebSocket as jest.Mock).mockImplementation(() => ({
        close: jest.fn(),
        send: mockSend,
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        readyState: WebSocket.CLOSED
      }));

      const TestComponent = () => {
        const { sendMessage, isConnected } = useWebSocket();
        
        if (!isConnected) {
          sendMessage({ type: 'test' });
        }

        return <div>Test</div>;
      };

      render(
        <WebSocketProvider>
          <TestComponent />
        </WebSocketProvider>
      );

      expect(mockSend).not.toHaveBeenCalled();
    });
  });

  describe('connection state', () => {
    it('should track connection state', async () => {
      localStorage.setItem('token', 'token-123');
      let onopen: (() => void) | null = null;
      
      (WebSocket as jest.Mock).mockImplementation(() => ({
        close: jest.fn(),
        send: jest.fn(),
        addEventListener: jest.fn((event, handler) => {
          if (event === 'open') onopen = handler;
        }),
        removeEventListener: jest.fn(),
        readyState: WebSocket.CONNECTING
      }));

      const TestComponent = () => {
        const { isConnected } = useWebSocket();
        return <div>{isConnected ? 'Connected' : 'Disconnected'}</div>;
      };

      render(
        <WebSocketProvider>
          <TestComponent />
        </WebSocketProvider>
      );

      expect(screen.getByText('Disconnected')).toBeInTheDocument();

      act(() => {
        onopen?.();
      });

      await waitFor(() => {
        expect(screen.getByText('Connected')).toBeInTheDocument();
      });
    });
  });

  describe('error handling', () => {
    it('should handle connection errors', async () => {
      localStorage.setItem('token', 'token-123');
      let onerror: (() => void) | null = null;
      
      (WebSocket as jest.Mock).mockImplementation(() => ({
        close: jest.fn(),
        send: jest.fn(),
        addEventListener: jest.fn((event, handler) => {
          if (event === 'error') onerror = handler;
        }),
        removeEventListener: jest.fn(),
        readyState: WebSocket.OPEN
      }));

      render(
        <WebSocketProvider>
          <div>Test</div>
        </WebSocketProvider>
      );

      await waitFor(() => {
        expect(WebSocket).toHaveBeenCalled();
      });

      // Simulate error
      act(() => {
        onerror?.();
      });

      // Should attempt reconnect
      await waitFor(() => {
        expect(WebSocket).toHaveBeenCalledTimes(1); // Initial + no auto-reconnect on error
      });
    });

    it('should handle malformed messages', async () => {
      localStorage.setItem('token', 'token-123');
      const mockListener = jest.fn();
      let onmessage: ((event: MessageEvent) => void) | null = null;
      
      (WebSocket as jest.Mock).mockImplementation(() => ({
        close: jest.fn(),
        send: jest.fn(),
        addEventListener: jest.fn((event, handler) => {
          if (event === 'message') onmessage = handler;
        }),
        removeEventListener: jest.fn(),
        readyState: WebSocket.OPEN
      }));

      const TestComponent = () => {
        const { addListener } = useWebSocket();
        
        React.useEffect(() => {
          return addListener(mockListener);
        }, [addListener]);

        return <div>Test</div>;
      };

      render(
        <WebSocketProvider>
          <TestComponent />
        </WebSocketProvider>
      );

      // Send invalid JSON
      act(() => {
        onmessage?.(new MessageEvent('message', {
          data: 'invalid json'
        }));
      });

      // Listener should not be called with invalid data
      expect(mockListener).not.toHaveBeenCalled();
    });
  });

  describe('custom URL', () => {
    it('should use custom WebSocket URL', async () => {
      localStorage.setItem('token', 'token-123');
      const customUrl = 'ws://custom.server.com/socket';

      render(
        <WebSocketProvider url={customUrl}>
          <div>Test</div>
        </WebSocketProvider>
      );

      await waitFor(() => {
        expect(WebSocket).toHaveBeenCalledWith(customUrl);
      });
    });
  });

  describe('listener management', () => {
    it('should remove listener on cleanup', async () => {
      localStorage.setItem('token', 'token-123');
      const mockListener = jest.fn();
      let onmessage: ((event: MessageEvent) => void) | null = null;
      
      (WebSocket as jest.Mock).mockImplementation(() => ({
        close: jest.fn(),
        send: jest.fn(),
        addEventListener: jest.fn((event, handler) => {
          if (event === 'message') onmessage = handler;
        }),
        removeEventListener: jest.fn(),
        readyState: WebSocket.OPEN
      }));

      const TestComponent = () => {
        const { addListener } = useWebSocket();
        
        React.useEffect(() => {
          const unsubscribe = addListener(mockListener);
          return unsubscribe;
        }, [addListener]);

        return <div>Test</div>;
      };

      const { unmount } = render(
        <WebSocketProvider>
          <TestComponent />
        </WebSocketProvider>
      );

      await waitFor(() => {
        expect(WebSocket).toHaveBeenCalled();
      });

      unmount();

      // Send message after unmount
      act(() => {
        onmessage?.(new MessageEvent('message', {
          data: JSON.stringify({ type: 'test' })
        }));
      });

      // Listener should not be called after cleanup
      expect(mockListener).not.toHaveBeenCalled();
    });
  });
});
