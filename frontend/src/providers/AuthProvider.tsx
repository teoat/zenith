import React, { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { User } from '../types/schema';
import { getElectronAPI, isElectron } from '../utils/electron';
import { AuthContext, LoginCredentials } from '../context/AuthContext';
import { errorReporting } from '../services/errorReporting';

// Set to true to bypass authentication for debugging purposes
const isDebugging = false;

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [isLoading, setIsLoading] = useState(true);
  const [isSetupRequired, setIsSetupRequired] = useState(false);

  useEffect(() => {
    let unsubscribeAuth: (() => void) | undefined;

    const initAuth = async () => {
      // TEMPORARY: Bypass auth for debugging
      if (isDebugging) {
        console.log('[DEV] Auth bypassed');
        setUser({
          id: 'dev-user',
          email: 'dev@local',
          role: 'ADMIN',
          name: 'Developer',
          preferences: {}
        });
        setIsSetupRequired(false); // Ensure no setup redirect
        setIsLoading(false);
      }

      try {
        if (!isDebugging && isElectron()) {
          const electronAPI = getElectronAPI();
          
          if (electronAPI) {
            const authAPI = electronAPI.auth;
            
            // Check initial status - auth is verified defined below
            if (authAPI !== undefined) {
              // Use non-null assertion since we've verified authAPI is not undefined
              const authService = authAPI!;
              
              if (authService.getAuthStatus) {
                const statusFn = await authService.getAuthStatus();
                if (statusFn.success && statusFn.data?.isAuthenticated) {
                   if (!user) {
                      const storedRole = localStorage.getItem('firstUserRole') as User['role'] || 'ADMIN';
                      setUser({
                        id: 'electron-user',
                        email: 'admin@local',
                        role: storedRole,
                        name: 'Local Admin',
                        preferences: {}
                      });
                      setToken('electron-token');
                   }
                }
              }

              // Check if setup is required  
              if (authService.isMasterPasswordSet) {
                const result = await authService.isMasterPasswordSet();
                const isMasterPasswordSet = result?.data?.isSet ?? false;
                
                if (!isMasterPasswordSet) {
                  setIsSetupRequired(true);
                  setIsLoading(false);
                  return;
                }
              }
            }

            // Listen for auth changes from Main process
            if (electronAPI.on) {
              unsubscribeAuth = electronAPI.on('auth:changed', (...args: unknown[]) => {
                const data = args[0] as { isAuthenticated: boolean } | undefined;
                console.log('Auth state changed from Electron:', data);
                if (data?.isAuthenticated) {
                   const storedRole = localStorage.getItem('firstUserRole') as User['role'] || 'ADMIN';
                   setUser({
                      id: 'electron-user',
                      email: 'admin@local',
                      role: storedRole,
                      name: 'Local Admin',
                      preferences: {}
                   });
                   setToken('electron-token');
                } else {
                   logout();
                }
              });
            }
          }

        } else if (!isDebugging) {
          console.log('[DEV] Running in browser mode, skipping Electron auth checks');
        }

        if (token) {
          // Rehydrate user from token or API if needed
        }
      } catch (caughtError) {
        // Extract error message safely with explicit type assertion
        let errorMessage: string;
        if (caughtError instanceof Error) {
          errorMessage = (caughtError as Error).message;
        } else if (typeof caughtError === 'string') {
          errorMessage = caughtError as string;
        } else {
          errorMessage = 'Unknown error';
        }
        
        errorReporting.reportError({
          message: 'Auth initialization failed',
          component: 'AuthProvider',
          severity: 'medium',
          context: { error: errorMessage }
        });
      } finally {
        if (!isDebugging) {
          setIsLoading(false);
        }
      }
    };

    initAuth();
    
    return () => {
      if (unsubscribeAuth) unsubscribeAuth();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const login = async (credentials: LoginCredentials) => {
    try {
      /* 
      const isDev = import.meta.env.DEV || import.meta.env.MODE === 'development';
      if (isDev) {
        // ... dev mock logic disabled for MFA testing ...
        // uncomment or use VITE_USE_MOCK_AUTH if needed
      }
      */

      if (!credentials.password) {
        throw new Error('Password is required');
      }

      // api.login expects { email, password, mfa_code? }
      const result = await api.login({ 
        email: credentials.email, 
        password: credentials.password,
        mfa_code: credentials.mfa_code
      });
      const accessToken = result.access_token;
      
      localStorage.setItem('token', accessToken);
      setToken(accessToken);
      
      const loggedInUser: User = { 
        id: '1', 
        email: credentials.email, 
        role: 'ANALYST', // Default role
        name: credentials.email.split('@')[0] // Derive name from email
      };
      setUser(loggedInUser); 
    } catch (_error) {
      console.error('Login failed:', error);
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, isLoading, isSetupRequired }}>
      {children}
    </AuthContext.Provider>
  );
};
