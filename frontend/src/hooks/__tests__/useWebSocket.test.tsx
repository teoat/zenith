import { describe, it, jest, beforeEach } from '@jest/globals';
import { renderHook, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import { useWebSocket } from '@/useWebSocket';

// Mock WebSocket
global.WebSocket = jest.fn(() => ({
  send: jest.fn(),
  close: jest.fn(),
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  readyState: WebSocket.OPEN
})) as any;

describe('useWebSocket', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('initialization', () => {
    it('should initialize with disconnected state', () => {
      const { result } = renderHook(() => useWebSocket('ws://localhost:8080'));

      expect(result.current.isConnected).toBe(false);
      expect(result.current.lastMessage).toBeNull();
    });

    it('should connect on mount', async () => {
      const { result, waitFor } = renderHook(() => useWebSocket('ws://localhost:8080'));

      await waitFor(() => {
        expect(WebSocket).toHaveBeenCalledWith('ws://localhost:8080');
      });
    });
  });

  describe('sending messages', () => {
    it('should send messages when connected', async () => {
      const mockSend = jest.fn();
      (WebSocket as jest.Mock).mockImplementation(() => ({
        send: mockSend,
        close: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        readyState: WebSocket.OPEN
      }));

      const { result, waitFor } = renderHook(() => useWebSocket('ws://localhost:8080'));

      await waitFor(() => expect(WebSocket).toHaveBeenCalled());

      act(() => {
        result.current.sendMessage({ type: 'test', data: 'hello' });
      });

      expect(mockSend).toHaveBeenCalledWith(
        JSON.stringify({ type: 'test', data: 'hello' })
      );
    });

    it('should queue messages when disconnected', () => {
      const mockSend = jest.fn();
      (WebSocket as jest.Mock).mockImplementation(() => ({
        send: mockSend,
        close: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        readyState: WebSocket.CLOSED
      }));

      const { result } = renderHook(() => useWebSocket('ws://localhost:8080'));

      act(() => {
        result.current.sendMessage({ type: 'test' });
      });

      expect(mockSend).not.toHaveBeenCalled();
    });
  });

  describe('connection management', () => {
    it('should reconnect on connection drop', async () => {
      jest.useFakeTimers();

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

      renderHook(() => useWebSocket('ws://localhost:8080', { reconnectInterval: 1000 }));

      // Simulate close
      act(() => {
        onclose?.();
      });

      // Fast forward
      act(() => {
        jest.advanceTimersByTime(1000);
      });

      expect(WebSocket).toHaveBeenCalledTimes(2);

      jest.useRealTimers();
    });
  });

  describe('cleanup', () => {
    it('should close connection on unmount', async () => {
      const mockClose = jest.fn();
      (WebSocket as jest.Mock).mockImplementation(() => ({
        close: mockClose,
        send: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        readyState: WebSocket.OPEN
      }));

      const { unmount, waitFor } = renderHook(() => useWebSocket('ws://localhost:8080'));

      await waitFor(() => expect(WebSocket).toHaveBeenCalled());

      unmount();

      expect(mockClose).toHaveBeenCalled();
    });
  });
});
