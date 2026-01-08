import React, { useState, useEffect } from "react";
import { secureLogger } from "@/utils/secureLogger";
import { api } from "@/lib/api";
import type { User } from "@/types/schema";
import type { LoginCredentials } from "@/context/AuthContext";
import { AuthContext } from "@/context/AuthContext";
import { errorReporting } from "@/services/errorReporting";

import { isDev, env } from "@/utils/env";

const isDevelopment = isDev;
const BYPASS_AUTH = env.VITE_BYPASS_AUTH === "true" && isDevelopment;

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSetupRequired, setIsSetupRequired] = useState(false);

  useEffect(() => {
    const initAuth = async () => {
      if (BYPASS_AUTH) {
        secureLogger.warn("AUTH", "Auth bypassed - Debug Mode Active");
        setUser({
          id: "dev-user",
          email: "dev@local",
          role: "ADMIN",
          name: "Developer",
          preferences: {},
        });
        setIsSetupRequired(false);
        setIsLoading(false);
        return;
      }

      try {
        secureLogger.debug("AUTH", "Running in web mode, checking session");

        try {
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
            error: e instanceof Error ? e.message : "Unknown error",
          });
        }
      } catch (caughtError) {
        const errorMessage = caughtError instanceof Error 
          ? caughtError.message 
          : "Unknown error";

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
  }, []);

  const login = async (credentials: LoginCredentials) => {
    try {
      if (!credentials.password) {
        throw new Error("Password is required");
      }

      const result = await api.login({
        email: credentials.email,
        password: credentials.password,
        mfa_code: credentials.mfa_code,
      });

      const loggedInUser: User = {
        id: result.id || "1",
        email: result.email || credentials.email,
        role: (result.role as User["role"]) || "ANALYST",
        name: result.full_name || credentials.email.split("@")[0],
      };

      setUser(loggedInUser);
      secureLogger.info("AUTH", "User logged in successfully", {
        email: credentials.email,
      });
    } catch (error) {
      secureLogger.error("AUTH", "Login failed", {
        email: credentials.email,
        error: error instanceof Error ? error.message : "Unknown error",
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
