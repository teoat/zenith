import { renderHook, act } from '@testing-library/react';
import { useAuthStore } from '@/useAuthStore';

describe('useAuthStore', () => {
  it('initializes with default state', () => {
    const { result } = renderHook(() => useAuthStore());

    expect(result.current.user).toBeNull();
    expect(result.current.token).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
  });

  it('logs in user correctly', () => {
    const { result } = renderHook(() => useAuthStore());

    const mockUser = { id: '1', email: 'test@example.com', name: 'Test User', role: 'ANALYST' as const };
    const mockToken = 'test-token';

    act(() => {
      result.current.login(mockUser, mockToken);
    });

    expect(result.current.user).toEqual(mockUser);
    expect(result.current.token).toEqual(mockToken);
    expect(result.current.isAuthenticated).toBe(true);
  });

  it('logs out user correctly', () => {
    const { result } = renderHook(() => useAuthStore());

    // First login
    const mockUser = { id: '1', email: 'test@example.com', name: 'Test User', role: 'ANALYST' as const };
    act(() => {
      result.current.login(mockUser, 'test-token');
    });

    // Then logout
    act(() => {
      result.current.logout();
    });

    expect(result.current.user).toBeNull();
    expect(result.current.token).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
  });

  it('updates user correctly', () => {
    const { result } = renderHook(() => useAuthStore());

    const mockUser = { id: '1', email: 'test@example.com', name: 'Test User', role: 'ANALYST' as const };
    act(() => {
      result.current.login(mockUser, 'test-token');
    });

    // Update user
    act(() => {
      result.current.updateUser({ email: 'updated@example.com' });
    });

    expect(result.current.user?.email).toBe('updated@example.com');
    expect(result.current.user?.id).toBe('1');
    expect(result.current.user?.name).toBe('Test User');
    expect(result.current.user?.role).toBe('ANALYST');
  });
});
