import React, { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { User } from '../types/schema';
import { getElectronAPI, isElectron } from '../utils/electron';
import { AuthContext, LoginCredentials } from '../context/AuthContext';
import { errorReporting } from '../services/errorReporting';

// Set to true to bypass authentication for debugging purposes
const isDebugging = false;

export const AuthenticationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [isLoading, setIsLoading] = useState(true);
  const [isSetupRequired, setIsSetupRequired] = useState(false);

  useEffect(() => {
    let unsubscribeAuth: (() => void) | undefined;

    const initAuth = async () => {
      console.log('!!! AUTH PROVIDER INIT START !!!');
      console.log('isDebugging flag:', isDebugging);

      // TEMPORARY: Bypass auth for debugging
      if (isDebugging) {
        console.log('[DEV] Auth bypassed - Debug Mode Active');
        setUser({
          id: 'dev-user',
          email: 'dev@local',
          role: 'ADMIN',
          name: 'Developer',
          preferences: {}
        });
        setToken('debug-token');
        localStorage.setItem('token', 'debug-token');
        setIsSetupRequired(false);
        setIsLoading(false);
        return;
      }

      try {
        const hasElectron = isElectron();
        console.log('Environment check:', { hasElectron, hasAPI: !!window.electronAPI });

        if (hasElectron && window.electronAPI) {
            // Electron Path
            try {
                const isSet = await window.electronAPI.isMasterPasswordSet();
                if (!isSet) {
                    setIsSetupRequired(true);
                } else {
                    // Start session listener
                    const response = await window.electronAPI.startSessionListener();
                    if (response.success) {
                        unsubscribeAuth = window.electronAPI.onSessionStatusChanged((status: any) => {
                             console.log('Session status changed:', status);
                             if (!status.isValid) {
                                 setToken(null);
                                 setUser(null);
                             }
                        });
                    }
                }
            } catch (electronErr) {
                console.error('Electron API Error:', electronErr);
                // Fallback to browser mode if Electron API fails
            }
        } else {
             console.log('[DEBUG] Browser Mode (No Electron API detected)');
             // Browser Path: Check local storage
        }
         
        // Common Token Validation
        const storedToken = localStorage.getItem('token');
        if (storedToken) {
            setToken(storedToken);
            // Verify token with backend if needed
            // await api.verifyToken(storedToken);
        }

      } catch (caughtError) {
        console.error('CRITICAL AUTH INIT ERROR:', caughtError);
        errorReporting.reportError({
          message: 'Auth initialization failed',
          component: 'AuthenticationProvider',
          severity: 'medium',
          context: { error: caughtError instanceof Error ? caughtError.message : String(caughtError) }
        });
        // Even on error, stop loading to prevent infinite spinner
      } finally {
         setIsLoading(false);
      }
    };

    initAuth();
    
    return () => {
      if (unsubscribeAuth) unsubscribeAuth();
    };
  }, []);

  const login = async (credentials: LoginCredentials) => {
    try {
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
