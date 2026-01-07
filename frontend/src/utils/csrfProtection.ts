import { secureLogger } from "./secureLogger";

// CSRF protection utilities
export class CSRFProtection {
  private static token: string | null = null;
  private static tokenPromise: Promise<string> | null = null;

  // Get CSRF token from server or cache
  static async getToken(): Promise<string> {
    if (this.token) {
      return this.token;
    }

    if (this.tokenPromise) {
      return this.tokenPromise;
    }

    // Create token request
    this.tokenPromise = this.requestToken();

    try {
      this.token = await this.tokenPromise;
      return this.token;
    } finally {
      this.tokenPromise = null;
    }
  }

  // Request new CSRF token from server
  private static async requestToken(): Promise<string> {
    try {
      const response = await fetch("/api/v1/csrf-token", {
        method: "GET",
        credentials: "same-origin",
        headers: {
          Accept: "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`CSRF token request failed: ${response.status}`);
      }

      const data = await response.json();
      return data.csrf_token || data.token;
    } catch (error) {
      secureLogger.warn("CSRF_PROTECTION", "Failed to get CSRF token", {
        error: error instanceof Error ? error.message : String(error),
      });
      // Return a fallback token for development
      return "fallback-csrf-token-" + Date.now();
    }
  }

  // Clear cached token (useful after logout)
  static clearToken(): void {
    this.token = null;
    this.tokenPromise = null;
  }

  // Check if a request method requires CSRF protection
  static requiresCSRF(method: string): boolean {
    const csrfMethods = ["POST", "PUT", "PATCH", "DELETE"];
    return csrfMethods.includes(method.toUpperCase());
  }

  // Add CSRF token to headers if required
  static async addCSRFHeader(
    headers: Record<string, string>,
    method: string,
  ): Promise<Record<string, string>> {
    if (!this.requiresCSRF(method)) {
      return headers;
    }

    const token = await this.getToken();
    return {
      ...headers,
      "X-CSRF-Token": token,
    };
  }
}

// Export convenience functions
export const getCsrfToken = () => CSRFProtection.getToken();
export const clearCsrfToken = () => CSRFProtection.clearToken();
export const addCsrfHeader = (
  headers: Record<string, string>,
  method: string,
) => CSRFProtection.addCSRFHeader(headers, method);
