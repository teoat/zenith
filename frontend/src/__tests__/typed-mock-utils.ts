// Typed Mock Utilities - Phase 3 Implementation
// Foundation for typed test infrastructure

import { jest } from "@jest/globals";

interface ApiSuccessResponse<T> {
  success: true;
  data: T;
}

interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
  };
}

/**
 * Creates a properly typed API success response mock
 * Eliminates 'any' types from API testing
 */
export function createApiSuccessMock<T>(): () => Promise<
  ApiSuccessResponse<T>
> {
  return jest.fn<() => Promise<ApiSuccessResponse<T>>>().mockResolvedValue({
    success: true,
    data: {} as T,
  });
}

/**
 * Creates a properly typed API error response mock
 * Eliminates 'any' types from error testing
 */
export function createApiErrorMock(
  error: string,
  code = "UNKNOWN_ERROR",
): () => Promise<ApiErrorResponse> {
  return jest.fn<() => Promise<ApiErrorResponse>>().mockResolvedValue({
    success: false,
    error: { code, message: error },
  });
}

/**
 * Creates mock component props with standard test properties
 * Provides consistent test prop patterns
 */
export function createComponentPropsMock<T extends Record<string, unknown>>(
  overrides: Partial<T> = {},
): T {
  return {
    className: "mock-class",
    "data-testid": "mock-component",
    ...overrides,
  } as unknown as T;
}

/**
 * Creates typed change event mocks for form testing
 * Eliminates 'any' from event testing
 */
export function createChangeEventMock(value: string, name = "mock-input") {
  return {
    target: { value, name },
  } as React.ChangeEvent<HTMLInputElement>;
}

/**
 * Creates typed click event mocks for interaction testing
 * Eliminates 'any' from click event testing
 */
export function createClickEventMock() {
  return {
    preventDefault: jest.fn(),
    stopPropagation: jest.fn(),
    currentTarget: document.createElement("button"),
  } as unknown as React.MouseEvent<HTMLButtonElement>;
}
