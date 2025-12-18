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
            console.log('[WS] Connected to', path);
            if (this.reconnectTimeout) {
                clearTimeout(this.reconnectTimeout);
                this.reconnectTimeout = null;
            }
        };

        this.ws.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                this.handlers.forEach(handler => handler(data));
            } catch (e) {
                console.error('[WS] Failed to parse message:', e);
            }
        };

        this.ws.onclose = () => {
            console.log('[WS] Disconnected');
            if (!this.isIntentionalClose) {
                this.reconnect();
            }
        };

        this.ws.onerror = (error) => {
            console.error('[WS] Error:', error);
            this.ws?.close();
        };

    } catch (e) {
        console.error('[WS] Connection failed:', e);
        this.reconnect();
    }
  }

  private reconnect() {
      if (this.reconnectTimeout) return;
      this.reconnectTimeout = setTimeout(() => {
          console.log('[WS] Attempting reconnect...');
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
