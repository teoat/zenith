/**
 * Comprehensive Hook Tests
 * Tests for custom React hooks
 */

import { renderHook } from '@testing-library/react';
import React from 'react';

// Mock fetch
global.fetch = jest.fn();

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};

describe('useAuth Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  it('returns auth context values', async () => {
    const { useAuth } = await import('../hooks/useAuth');
    
    // Need to wrap in provider context
    const { AuthContext } = await import('../context/AuthContext');
    
    const wrapper = ({ children }: { children: React.ReactNode }) => {
      return (
        <AuthContext.Provider value={{
          user: null,
          token: null,
          login: jest.fn(),
          logout: jest.fn(),
          isLoading: false,
          isSetupRequired: false
        }}>
          {children}
        </AuthContext.Provider>
      );
    };
    
    const { result } = renderHook(() => useAuth(), { wrapper });
    expect(result.current).toBeDefined();
  });
});
