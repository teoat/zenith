/**
 * Mock Helpers - Utilities for properly typing Jest mocks
 * 
 * These utilities help avoid the `never` type narrowing issue with Jest mocks
 * by providing proper TypeScript typing for mocked functions.
 */

import type { MockedFunction } from 'jest-mock';

/**
 * Type-safe wrapper for mocking service methods
 * 
 * Usage:
 * ```typescript
 * const mockedLogin = mockServiceMethod(api.login);
 * mockedLogin.mockResolvedValue({ data: { token: '...' }, success: true });
 * ```
 * 
 * @param method - The service method to mock
 * @returns Properly typed MockedFunction
 */
export const mockServiceMethod = <T extends (...args: any[]) => any>(
  method: T
): MockedFunction<T> => {
  return method as MockedFunction<T>;
};

/**
 * Create a typed Jest mock for Promise-returning functions
 * 
 * Usage:
 * ```typescript
 * const mockFetch = createMockPromise<ApiResponse<User>>();
 * mockFetch.mockResolvedValue({ data: mockUser, success: true });
 * ```
 */
export const createMockPromise = <T>(): jest.MockedFunction<() => Promise<T>> => {
  return jest.fn() as unknown as jest.MockedFunction<() => Promise<T>>;
};

/**
 * Create a typed Jest mock for synchronous functions
 * 
 * Usage:
 * ```typescript
 * const mockCalculate = createMockFunction<number, [number, number]>();
 * mockCalculate.mockReturnValue(42);
 * ```
 */
export const createMockFunction = <TReturn, TArgs extends any[] = any[]>(): jest.MockedFunction<(...args: TArgs) => TReturn> => {
  return jest.fn() as unknown as jest.MockedFunction<(...args: TArgs) => TReturn>;
};

/**
 * Type-safe mock for API client methods
 * 
 * Automatically handles common API response patterns
 * 
 * Usage:
 * ```typescript
 * const mockGetUser = mockApiMethod<User>();
 * mockGetUser.mockSuccess({ id: '1', name: 'Test' });
 * mockGetUser.mockError('User not found');
 * ```
 */
export const mockApiMethod = <TData>() => {
  const mock = jest.fn() as unknown as MockedFunction<() => Promise<{
    data?: TData;
    success: boolean;
    error?: { message: string; code?: string };
  }>>;

  return Object.assign(mock, {
    mockSuccess: (data: TData) => {
      mock.mockResolvedValue({ data, success: true });
      return mock;
    },
    mockError: (message:string, code?: string) => {
      mock.mockResolvedValue({
        success: false,
        error: { message, code }
      });
      return mock;
    }
  });
};

/**
 * Mock Fetch API with proper typing
 * 
 * Usage:
 * ```typescript
 * const mockFetch = createMockFetch();
 * mockFetch.mockJsonResponse({ data: 'test' });
 * global.fetch = mockFetch as any; // Type assertion needed for global
 * ```
 */
export const createMockFetch = () => {
  const mock = jest.fn() as unknown as MockedFunction<typeof fetch>;

  return Object.assign(mock, {
    mockJsonResponse: <T>(data: T, status: number = 200, ok: boolean = true) => {
      mock.mockResolvedValue({
        ok,
        status,
        json: async () => data,
        text: async () => JSON.stringify(data),
        headers: new Headers(),
        redirected: false,
        statusText: ok ? 'OK' : 'Error',
        type: 'basic',
        url: '',
        clone: jest.fn(),
        body: null,
        bodyUsed: false,
        arrayBuffer: jest.fn(),
        blob: jest.fn(),
        formData: jest.fn()
      } as unknown as Response);
      return mock;
    },
    mockError: (error: Error) => {
      mock.mockRejectedValue(error);
      return mock;
    }
  });
};

/**
 * Create a mock WebSocket with common event handlers
 */
export const createMockWebSocket = () => {
  const listeners: Record<string, Function[]> = {};
  
  const mock = {
    send: jest.fn(),
    close: jest.fn(),
    addEventListener: jest.fn((event: string, callback: Function) => {
      if (!listeners[event]) listeners[event] = [];
      listeners[event].push(callback);
    }),
    removeEventListener: jest.fn((event: string, callback: Function) => {
      if (listeners[event]) {
        listeners[event] = listeners[event].filter(cb => cb !== callback);
      }
    }),
    readyState: WebSocket.OPEN,
    // Trigger events for testing
    triggerEvent: (event: string, data?: any) => {
      listeners[event]?.forEach(callback => callback(data));
    }
  };

  return mock;
};

/**
 * Mock localStorage with proper typing
 */
export const createMockLocalStorage = () => {
  const store: Record<string, string> = {};

  return {
    getItem: jest.fn((key: string) => store[key] || null),
    setItem: jest.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: jest.fn((key: string) => {
      delete store[key];
    }),
    clear: jest.fn(() => {
      Object.keys(store).forEach(key => delete store[key]);
    }),
    get length() {
      return Object.keys(store).length;
    },
    key: jest.fn((index: number) => Object.keys(store)[index] || null),
    // Helper to access internal store
    __store: store
  };
};

/**
 * Type guard to check if a value is a MockedFunction
 */
export const isMockedFunction = <T extends (...args: any[]) => any>(
  value: any
): value is MockedFunction<T> => {
  return typeof value === 'function' && '_isMockFunction' in value;
};

/**
 * Reset all mocks in an object
 * 
 * Usage:
 * ```typescript
 * const mocks = {
 *   login: jest.fn(),
 *   logout: jest.fn()
 * };
 * resetAllMocks(mocks);
 * ```
 */
export const resetAllMocks = (mocks: Record<string, any>) => {
  Object.values(mocks).forEach(mock => {
    if (isMockedFunction(mock)) {
      mock.mockReset();
    }
  });
};

/**
 * Create a properly typed mock for service methods that return ApiResponse<T>
 */
export const mockServiceMethodTyped = <TArgs extends any[], TReturn>() => {
  return jest.fn() as jest.MockedFunction<(...args: TArgs) => Promise<TReturn>>;
};

/**
 * Mock factory for collection responses with pagination
 */
export const mockCollectionResponse = <T>() => {
  const mock = jest.fn() as unknown as jest.MockedFunction<() => Promise<{
    success: true;
    data: { items: T[]; total: number; page: number; pageSize: number };
    pagination: { total: number; page: number; pageSize: number; totalPages: number };
  }>>;

  return Object.assign(mock, {
    mockData: (items: T[], total = items.length) => {
      mock.mockResolvedValue({
        success: true,
        data: { items, total, page: 1, pageSize: items.length },
        pagination: { total, page: 1, pageSize: items.length, totalPages: Math.ceil(total / items.length) || 1 }
      });
    },
    mockEmpty: () => {
      mock.mockResolvedValue({
        success: true,
        data: { items: [], total: 0, page: 1, pageSize: 10 },
        pagination: { total: 0, page: 1, pageSize: 10, totalPages: 0 }
      });
    }
  });
};

/**
 * Create a mock that properly handles ApiResponse<T> types
 */
export const mockApiResponse = <T>() => {
  const mock = jest.fn() as unknown as jest.MockedFunction<() => Promise<{
    success: boolean;
    data?: T;
    error?: { message: string; code?: string };
  }>>;

  return Object.assign(mock, {
    mockSuccess: (data: T) => {
      mock.mockResolvedValue({ success: true, data });
    },
    mockError: (message: string, code?: string) => {
      mock.mockResolvedValue({ success: false, error: { message, code } });
    }
  });
};

/**
 * Create a fully typed mock service that preserves method signatures
 */
export const createTypedMock = <T extends Record<string, any>>(
  serviceShape: T
): jest.Mocked<T> => {
  const mock = {} as jest.Mocked<T>;

  for (const key of Object.keys(serviceShape)) {
    if (typeof serviceShape[key] === 'function') {
      (mock as any)[key] = jest.fn();
    } else {
      (mock as any)[key] = serviceShape[key];
    }
  }

  return mock;
};

/**
 * Enhanced service mock factory with proper typing
 */
export const createMockService = <T extends Record<string, any>>(
  ServiceClass: new () => T
): jest.Mocked<T> => {
  // Create instance to get method signatures
  const instance = new ServiceClass();
  return createTypedMock(instance);
};

/**
 * Mock factory for complex objects with nested methods
 */
export const createMockWithMethods = <T>(
  methods: Record<string, jest.MockedFunction<any>>
): jest.Mocked<T> => {
  return methods as jest.Mocked<T>;
};

/**
 * Safe mock assertion helper to avoid 'never' type issues
 */
export const mockResolvedValue = <T>(
  mock: jest.MockedFunction<any>,
  value: T
): void => {
  mock.mockResolvedValue(value);
};

export const mockRejectedValue = <T>(
  mock: jest.MockedFunction<any>,
  error: T
): void => {
  mock.mockRejectedValue(error);
};

/**
 * Create a mock that returns a specific value to avoid 'never' type issues
 */
export const createTypedMockReturn = <TArgs extends any[], TReturn>(
  returnValue: TReturn
): jest.MockedFunction<(...args: TArgs) => TReturn> => {
  const mock = jest.fn() as jest.MockedFunction<(...args: TArgs) => TReturn>;
  mock.mockReturnValue(returnValue);
  return mock;
};

/**
 * Create a mock that resolves to a specific value
 */
export const createAsyncMockReturn = <TArgs extends any[], TReturn>(
  returnValue: TReturn
): jest.MockedFunction<(...args: TArgs) => Promise<TReturn>> => {
  const mock = jest.fn() as jest.MockedFunction<(...args: TArgs) => Promise<TReturn>>;
  mock.mockResolvedValue(returnValue);
  return mock;
};

/**
 * Create a comprehensive service mock factory
 */
export const createServiceMockFactory = <T extends Record<string, any>>() => {
  return <K extends keyof T>(
    service: T,
    methodName: K,
    returnValue?: T[K] extends (...args: any[]) => any ? ReturnType<T[K]> : T[K]
  ): jest.MockedFunction<any> => {
    if (typeof service[methodName] === 'function') {
      const mock = jest.fn();
      if (returnValue !== undefined) {
        mock.mockResolvedValue(returnValue);
      }
      return mock as jest.MockedFunction<any>;
    }
    return jest.fn() as jest.MockedFunction<any>;
  };
};

/**
 * Mock all services with proper typing
 */
export const createMockServices = () => {
  const mockFactory = createServiceMockFactory();

  return {
    authService: {
      login: mockFactory({ login: jest.fn() }, 'login', { access_token: 'mock-token' }),
      logout: jest.fn(),
      getCurrentUser: jest.fn(),
      refreshToken: jest.fn(),
      register: jest.fn(),
      verifyEmail: jest.fn(),
      resetPassword: jest.fn(),
      changePassword: jest.fn()
    },
    caseService: {
      getCases: jest.fn(),
      getCase: jest.fn(),
      getCaseById: jest.fn(),
      createCase: jest.fn(),
      updateCase: jest.fn(),
      deleteCase: jest.fn(),
      getCaseNotes: jest.fn(),
      addCaseNote: jest.fn(),
      updateCaseNote: jest.fn(),
      getCaseStatistics: jest.fn(),
      bulkUpdateCases: jest.fn()
    },
    aiService: {
      chat: jest.fn(),
      getMultiPersonaAnalysis: jest.fn(),
      investigateSubject: jest.fn(),
      getProactiveSuggestions: jest.fn(),
      search: jest.fn(),
      indexEvidence: jest.fn(),
      generateInsights: jest.fn(),
      getConversationHistory: jest.fn(),
      getSuggestions: jest.fn(),
      predictFraudRisk: jest.fn(),
      analyzeSentiment: jest.fn()
    },
    evidenceService: {
      uploadEvidence: jest.fn(),
      getEvidence: jest.fn(),
      deleteEvidence: jest.fn(),
      searchEvidence: jest.fn()
    }
  };
};
