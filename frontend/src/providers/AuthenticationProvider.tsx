import React, { useState, useEffect } from "react";
import { secureLogger } from "@/utils/secureLogger";
import { api } from "@/lib/api";
import type { User } from "@/types/schema";
import { isElectron } from "@/utils/electron";
import type { LoginCredentials } from "@/context/AuthContext";
import { AuthContext } from "@/context/AuthContext";
import { errorReporting } from "@/services/errorReporting";

// Set to true to bypass authentication for debugging purposes
const isDebugging = false;

export const AuthenticationProvider: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(
    localStorage.getItem("token"),
  );
  const [isLoading, setIsLoading] = useState(true);
  const [isSetupRequired, setIsSetupRequired] = useState(false);

  useEffect(() => {
    let unsubscribeAuth: (() => void) | undefined;

    const initAuth = async () => {
      secureLogger.info(
        "AUTH",
        "Authentication provider initialization started",
      );
      secureLogger.debug("AUTH", "Debug mode status", { isDebugging });

      // TEMPORARY: Bypass auth for debugging
      if (isDebugging) {
        secureLogger.warn(
          "AUTH",
          "Auth bypassed - Development Debug Mode Active",
        );
        setUser({
          id: "dev-user",
          email: "dev@local",
          role: "ADMIN",
          name: "Developer",
          preferences: {},
        });
        setToken("debug-token");
        localStorage.setItem("token", "debug-token");
        setIsSetupRequired(false);
        setIsLoading(false);
        return;
      }

      try {
        const hasElectron = isElectron();
        secureLogger.info("AUTH", "Environment check complete", {
          hasElectron,
          hasAPI: !!window.electronAPI,
        });

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
                unsubscribeAuth = window.electronAPI.onSessionStatusChanged(
                  (status: any) => {
                    secureLogger.info("AUTH", "Session status updated", {
                      isValid: status.isValid,
                    });
                    if (!status.isValid) {
                      setToken(null);
                      setUser(null);
                    }
                  },
                );
              }
            }
          } catch (electronErr) {
            secureLogger.error("AUTH", "Electron API interaction failed", {
              error:
                electronErr instanceof Error
                  ? electronErr.message
                  : String(electronErr),
            });
            // Fallback to browser mode if Electron API fails
          }
        } else {
          secureLogger.debug("AUTH", "Running in standard browser environment");
        }

        // Common Token Validation
        const storedToken = localStorage.getItem("token");
        if (storedToken) {
          setToken(storedToken);
          // Verify token with backend if needed
          // await api.verifyToken(storedToken);
        }
      } catch (caughtError) {
        secureLogger.error(
          "AUTH",
          "Critical authentication initialization error",
          {
            error:
              caughtError instanceof Error
                ? caughtError.message
                : String(caughtError),
          },
        );
        errorReporting.reportError({
          message: "Auth initialization failed",
          component: "AuthenticationProvider",
          severity: "medium",
          context: {
            error:
              caughtError instanceof Error
                ? caughtError.message
                : String(caughtError),
          },
        });
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
        throw new Error("Password is required");
      }

      // api.login expects { email, password, mfa_code? }
      const result = await api.login({
        email: credentials.email,
        password: credentials.password,
        mfa_code: credentials.mfa_code,
      });
      const accessToken = result.access_token;

      localStorage.setItem("token", accessToken);
      setToken(accessToken);

      const loggedInUser: User = {
        id: "1",
        email: credentials.email,
        role: "ANALYST", // Default role
        name: credentials.email.split("@")[0], // Derive name from email
      };
      setUser(loggedInUser);
      secureLogger.info("AUTH", "User logged in successfully", {
        email: credentials.email,
      });
    } catch (error) {
      secureLogger.error("AUTH", "Login attempt failed", {
        email: credentials.email,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{ user, token, login, logout, isLoading, isSetupRequired }}
    >
      {children}
    </AuthContext.Provider>
  );
};
