import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

interface User {
  id: string;
  email: string;
  fullName?: string;
  role: string;
  avatar?: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  // Actions
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  refreshToken: () => Promise<void>;
  setUser: (user: User) => void;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>()(
  devtools(
    persist(
      (set, get) => ({
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,

        login: async (email: string, password: string) => {
          set({ isLoading: true, error: null });

          try {
            // Mock login implementation
            await new Promise(resolve => setTimeout(resolve, 1000));

            // Mock successful login
            const mockUser: User = {
              id: '1',
              email,
              fullName: 'John Doe',
              role: 'investigator',
              avatar: undefined
            };

            const mockToken = 'mock-jwt-token';

            set({
              user: mockUser,
              token: mockToken,
              isAuthenticated: true,
              isLoading: false
            });

            // Store in localStorage
            localStorage.setItem('token', mockToken);
            localStorage.setItem('user', JSON.stringify(mockUser));

          } catch (error) {
            set({
              error: error instanceof Error ? error.message : 'Login failed',
              isLoading: false
            });
          }
        },

        logout: () => {
          set({
            user: null,
            token: null,
            isAuthenticated: false,
            error: null
          });

          // Clear localStorage
          localStorage.removeItem('token');
          localStorage.removeItem('user');
        },

        refreshToken: async () => {
          const currentToken = get().token;
          if (!currentToken) {
            throw new Error('No token to refresh');
          }

          try {
            // Mock token refresh
            await new Promise(resolve => setTimeout(resolve, 500));

            const newToken = 'refreshed-mock-jwt-token';
            set({ token: newToken });
            localStorage.setItem('token', newToken);

          } catch (error) {
            set({ error: error instanceof Error ? error.message : 'Token refresh failed' });
            throw error;
          }
        },

        setUser: (user: User) => {
          set({ user, isAuthenticated: true });
          localStorage.setItem('user', JSON.stringify(user));
        },

        clearError: () => {
          set({ error: null });
        },
      }),
      {
        name: 'auth-store',
        partialize: (state) => ({
          user: state.user,
          token: state.token,
          isAuthenticated: state.isAuthenticated
        }),
      }
    ),
    {
      name: 'auth-store',
    }
  )
);