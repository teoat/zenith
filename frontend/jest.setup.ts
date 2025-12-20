import '@testing-library/jest-dom';

// Extend Jest matchers for testing-library
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace jest {
    interface Matchers<R> {
      toBeInTheDocument(): R;
      toHaveTextContent(text?: string | RegExp): R;
    }
  }
}

// Mock WebSocket for tests
class MockWebSocket {
  static CONNECTING = 0;
  static OPEN = 1;
  static CLOSING = 2;
  static CLOSED = 3;

  readyState = MockWebSocket.OPEN;
  url: string;
  
  onopen: ((event: Event) => void) | null = null;
  onclose: ((event: CloseEvent) => void) | null = null;
  onmessage: ((event: MessageEvent) => void) | null = null;
  onerror: ((event: Event) => void) | null = null;

  constructor(url: string) {
    this.url = url;
    // Simulate async connection
    setTimeout(() => {
      if (this.onopen) {
        this.onopen(new Event('open'));
      }
    }, 0);
  }

  send(_data: string | ArrayBufferLike | Blob | ArrayBufferView) {
    // Mock send - do nothing in tests
  }

  close(_code?: number, _reason?: string) {
    this.readyState = MockWebSocket.CLOSED;
    if (this.onclose) {
      const event = new CloseEvent('close', { code: _code, reason: _reason });
      this.onclose(event);
    }
  }

  addEventListener(_type: string, _listener: EventListenerOrEventListenerObject) {
    // Mock addEventListener
  }

  removeEventListener(_type: string, _listener: EventListenerOrEventListenerObject) {
    // Mock removeEventListener
  }

  dispatchEvent(_event: Event): boolean {
    return true;
  }
}

// Set global WebSocket mock
global.WebSocket = MockWebSocket as typeof WebSocket;

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  takeRecords() { return []; }
  unobserve() {}
} as unknown as typeof IntersectionObserver;

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
} as unknown as typeof ResizeObserver;

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock scrollTo
global.scrollTo = jest.fn();

// Suppress console errors in tests (optional - comment out if you want to see them)
const originalError = console.error;
beforeAll(() => {
  console.error = (...args: unknown[]) => {
    // Suppress React Query errors
    if (typeof args[0] === 'string' && args[0].includes('No QueryClient set')) {
      return;
    }
    // Suppress router errors
    if (typeof args[0] === 'string' && args[0].includes('useNavigate')) {
      return;
    }
    originalError.call(console, ...args);
  };
});

afterAll(() => {
  console.error = originalError;
});
