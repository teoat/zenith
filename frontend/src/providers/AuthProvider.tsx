import React, { useState, useEffect } from "react";
import { secureLogger } from "@/utils/secureLogger";
import { api } from "@/lib/api";
import type { User } from "@/types/schema";
import { getElectronAPI, isElectron } from "@/utils/electron";
import type { LoginCredentials } from "@/context/AuthContext";
import { AuthContext } from "@/context/AuthContext";
import { errorReporting } from "@/services/errorReporting";

import { isDev, env } from "@/utils/env";

// Use environment variable for development mode - NEVER bypass auth in production
const isDevelopment = isDev;
const BYPASS_AUTH = env.VITE_BYPASS_AUTH === "true" && isDevelopment;

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  // Token is now managed by HttpOnly cookies, not exposed to JS
  // const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSetupRequired, setIsSetupRequired] = useState(false);

  useEffect(() => {
    let unsubscribeAuth: (() => void) | undefined;

    const initAuth = async () => {
      // Development-only auth bypass (requires VITE_BYPASS_AUTH=true in .env)
      if (BYPASS_AUTH) {
        secureLogger.warn("AUTH", "Auth bypassed - Debug Mode Active");
        setUser({
          id: "dev-user",
          email: "dev@local",
          role: "ADMIN",
          name: "Developer",
          preferences: {},
        });
        setIsSetupRequired(false); // Ensure no setup redirect
        setIsLoading(false);
      }

      try {
        if (!BYPASS_AUTH && isElectron()) {
          const electronAPI = getElectronAPI();

          if (electronAPI) {
            const authAPI = electronAPI.auth;

            // Check initial status - auth is verified defined below
            if (authAPI) {
              const authService = authAPI;

              if (typeof authService.getAuthStatus === "function") {
                const statusFn = await authService.getAuthStatus();
                if (
                  statusFn &&
                  statusFn.success &&
                  statusFn.data?.isAuthenticated
                ) {
                  if (!user) {
                    const storedRole =
                      (localStorage.getItem("firstUserRole") as User["role"]) ||
                      "ADMIN";
                    setUser({
                      id: "electron-user",
                      email: "admin@local",
                      role: storedRole,
                      name: "Local Admin",
                      preferences: {},
                    });
                    // setToken('electron-token');
                  }
                }
              }

              // Check if setup is required (Electron only)
              if (typeof authService.isMasterPasswordSet === "function") {
                try {
                  const result = await authService.isMasterPasswordSet();
                  const isMasterPasswordSet = result?.data?.isSet ?? false;

                  if (!isMasterPasswordSet) {
                    setIsSetupRequired(true);
                    setIsLoading(false);
                    return;
                  }
                } catch (error) {
                  secureLogger.warn(
                    "AUTH",
                    "Failed to check master password status",
                    { error },
                  );
                  // Continue initialization even if check fails
                }
              }
            }

            // Listen for auth changes from Main process
            if (electronAPI.on) {
              unsubscribeAuth = electronAPI.on(
                "auth:changed",
                (...args: unknown[]) => {
                  const data = args[0] as
                    | { isAuthenticated: boolean }
                    | undefined;
                  secureLogger.info(
                    "AUTH",
                    "Auth state changed from Electron",
                    { isAuthenticated: data?.isAuthenticated },
                  );
                  if (data?.isAuthenticated) {
                    const storedRole =
                      (localStorage.getItem("firstUserRole") as User["role"]) ||
                      "ADMIN";
                    setUser({
                      id: "electron-user",
                      email: "admin@local",
                      role: storedRole,
                      name: "Local Admin",
                      preferences: {},
                    });
                    // setToken('electron-token');
                  } else {
                    logout();
                  }
                },
              );
            }
          }
        } else if (!BYPASS_AUTH) {
          secureLogger.debug(
            "AUTH",
            "Running in browser mode, skipping Electron auth checks",
          );
        }

        // Rehydrate user from session cookie
        try {
          // Try to fetch user from backend
          const userData = await api.getMe();
          if (userData) {
            setUser({
              id: userData.id,
              email: userData.email,
              role: userData.role || "ANALYST",
              name: userData.full_name || userData.username || "User",
            });
          }
        } catch (e) {
          secureLogger.debug("AUTH", "Session check failed (not logged in)", {
            error: e instanceof Error ? e.message : String(e),
          });
          // 401 is expected if not logged in; User remains null
        }
      } catch (caughtError) {
        // Extract error message safely with explicit type assertion
        let errorMessage: string;
        if (caughtError instanceof Error) {
          errorMessage = (caughtError as Error).message;
        } else if (typeof caughtError === "string") {
          errorMessage = caughtError as string;
        } else {
          errorMessage = "Unknown error";
        }

        errorReporting.reportError({
          message: "Auth initialization failed",
          component: "AuthProvider",
          severity: "medium",
          context: { error: errorMessage },
        });
      } finally {
        if (!BYPASS_AUTH) {
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
        throw new Error("Password is required");
      }

      // api.login expects { email, password, mfa_code? }
      const result = await api.login({
        email: credentials.email,
        password: credentials.password,
        mfa_code: credentials.mfa_code,
      });
      // Cookies are set automatically by the backend response

      // We can fetch details from response or result if it returns User
      // But let's assume result is UserProfileResponse now based on our backend change
      // Or we call getMe() again?
      // The backend login endpoint now returns UserProfileResponse directly!

      const loggedInUser: User = {
        id: result.id || "1",
        email: result.email || credentials.email,
        role: (result.role as any) || "ANALYST",
        name: result.full_name || credentials.email.split("@")[0],
      };

      setUser(loggedInUser);
      secureLogger.info("AUTH", "User logged in successfully", {
        email: credentials.email,
      });
    } catch (error) {
      secureLogger.error("AUTH", "Login failed", {
        email: credentials.email,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  };

  const logout = async () => {
    try {
      await api.logout();
    } catch (e) {
      secureLogger.warn("AUTH", "Logout API call failed", { error: e });
    }
    // localStorage.removeItem('token'); // No longer needed
    // setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{ user, token: null, login, logout, isLoading, isSetupRequired }}
    >
      {children}
    </AuthContext.Provider>
  );
};
