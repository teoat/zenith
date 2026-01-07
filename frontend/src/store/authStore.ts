import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { authService } from '@/services/auth';

interface User {
  id: string;
  email: string;
  fullName?: string;
  role: string;
  avatar?: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  // Actions
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<void>;
  setUser: (user: User) => void;
  clearError: () => void;
  checkSession: () => Promise<void>;
}

/**
 * Auth Store - Cookie-Based Authentication
 * 
 * NOTE: This store does NOT persist tokens. Authentication is managed
 * via HttpOnly cookies set by the backend. The store only tracks
 * the current user state for UI purposes.
 */
export const useAuthStore = create<AuthState>()(
  devtools(
    (set, _get) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      login: async (email: string, password: string) => {
        set({ isLoading: true, error: null });

        try {
          // Call real API - backend sets HttpOnly cookies
          const response = await authService.login({ email, password });
          
          // Response contains user profile (cookies are set automatically)
          const user: User = {
            id: response.id,
            email: response.email,
            fullName: response.full_name,
            role: response.role || 'ANALYST',
            avatar: undefined
          };

          set({
            user,
            isAuthenticated: true,
            isLoading: false
          });

        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Login failed',
            isLoading: false
          });
          throw error;
        }
      },

      logout: async () => {
        try {
          // Call backend to clear cookies
          await authService.logout();
        } catch {
          // Proceed with local logout even if API fails
        }
        
        set({
          user: null,
          isAuthenticated: false,
          error: null
        });
      },

      refreshToken: async () => {
        try {
          // Backend handles cookie refresh
          await authService.refreshToken();
        } catch (error) {
          set({ error: error instanceof Error ? error.message : 'Token refresh failed' });
          throw error;
        }
      },

      setUser: (user: User) => {
        set({ user, isAuthenticated: true });
      },

      clearError: () => {
        set({ error: null });
      },

      checkSession: async () => {
        set({ isLoading: true });
        try {
          const user = await authService.getCurrentUser();
          if (user) {
            set({
              user: {
                id: user.id,
                email: user.email,
                role: user.role,
                fullName: undefined,
                avatar: undefined
              },
              isAuthenticated: true,
              isLoading: false
            });
          } else {
            set({ isLoading: false });
          }
        } catch {
          set({ isLoading: false });
        }
      }
    }),
    {
      name: 'auth-store',
    }
  )
);