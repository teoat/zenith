import { secureLogger } from '../utils/secureLogger';
import { API_BASE } from './client';

type MessageHandler = (data: any) => void;

class WebSocketService {
  private ws: WebSocket | null = null;
  private handlers: Set<MessageHandler> = new Set();
  private reconnectTimeout: NodeJS.Timeout | null = null;
  private isIntentionalClose = false;

  connect(path: string = '/ws/alerts') {
    this.isIntentionalClose = false;
    const wsUrl = API_BASE.replace('http', 'ws') + path;

    try {
        this.ws = new WebSocket(wsUrl);

        this.ws.onopen = () => {
            secureLogger.info('WEBSOCKET', `Connected successfully to ${path}`);
            if (this.reconnectTimeout) {
                clearTimeout(this.reconnectTimeout);
                this.reconnectTimeout = null;
            }
        };

        this.ws.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                this.handlers.forEach(handler => handler(data));
            } catch (error) {
                secureLogger.warn('WEBSOCKET', 'Failed to parse message', { 
                  data: event.data,
                  error: error instanceof Error ? error.message : String(error) 
                });
            }
        };

        this.ws.onclose = () => {
            secureLogger.info('WEBSOCKET', 'Disconnected');
            if (!this.isIntentionalClose) {
                this.reconnect();
            }
        };

        this.ws.onerror = (error) => {
            secureLogger.error('WEBSOCKET', 'WebSocket error', { error });
            this.ws?.close();
        };

    } catch (error) {
        secureLogger.error('WEBSOCKET', 'Connection attempt failed', { 
          path,
          error: error instanceof Error ? error.message : String(error) 
        });
        this.reconnect();
    }
  }

  private reconnect() {
      if (this.reconnectTimeout) return;
      this.reconnectTimeout = setTimeout(() => {
          secureLogger.info('WEBSOCKET', 'Attempting reconnect...');
          this.connect();
      }, 5000);
  }

  subscribe(handler: MessageHandler) {
      this.handlers.add(handler);
      return () => this.handlers.delete(handler);
  }

  disconnect() {
      this.isIntentionalClose = true;
      this.ws?.close();
      this.ws = null;
      this.handlers.clear();
      if (this.reconnectTimeout) {
          clearTimeout(this.reconnectTimeout);
      }
  }
}

export const socketService = new WebSocketService();
