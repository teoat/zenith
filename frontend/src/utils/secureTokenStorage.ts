import { secureLogger } from './secureLogger';

// Secure token storage utilities
export class SecureTokenStorage {
  private static readonly TOKEN_KEY = 'auth_token';
  private static readonly REFRESH_TOKEN_KEY = 'refresh_token';

  // Store authentication token securely
  static setToken(token: string): void {
    try {
      // In production, tokens should be stored in httpOnly cookies
      // For now, use localStorage with additional security measures
      if (this.isSecureContext()) {
        // Use sessionStorage for better security than localStorage
        sessionStorage.setItem(this.TOKEN_KEY, token);
        // Also set a non-httpOnly cookie as fallback for some scenarios
        this.setSecureCookie(this.TOKEN_KEY, token);
      } else {
        // Fallback for insecure contexts
        localStorage.setItem(this.TOKEN_KEY, token);
      }
    } catch (error) {
      secureLogger.error('SECURE_STORAGE', 'Failed to store auth token', {
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }

  // Get authentication token
  static getToken(): string | null {
    try {
      // Try sessionStorage first (more secure)
      let token = sessionStorage.getItem(this.TOKEN_KEY);

      // Fallback to cookie
      if (!token) {
        token = this.getCookie(this.TOKEN_KEY);
      }

      // Final fallback to localStorage
      if (!token) {
        token = localStorage.getItem(this.TOKEN_KEY);
      }

      return token;
    } catch (error) {
      secureLogger.error('SECURE_STORAGE', 'Failed to retrieve auth token', {
        error: error instanceof Error ? error.message : String(error)
      });
      return null;
    }
  }

  // Store refresh token (more sensitive, prefer httpOnly cookie)
  static setRefreshToken(token: string): void {
    try {
      // Always try to set httpOnly cookie first
      this.setHttpOnlyCookie(this.REFRESH_TOKEN_KEY, token);

      // Fallback storage for non-httpOnly environments
      if (this.isSecureContext()) {
        sessionStorage.setItem(this.REFRESH_TOKEN_KEY, token);
      }
    } catch (error) {
      secureLogger.error('SECURE_STORAGE', 'Failed to store refresh token', {
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }

  // Get refresh token
  static getRefreshToken(): string | null {
    try {
      // Try cookie first (httpOnly)
      let token = this.getCookie(this.REFRESH_TOKEN_KEY);

      // Fallback to sessionStorage
      if (!token && this.isSecureContext()) {
        token = sessionStorage.getItem(this.REFRESH_TOKEN_KEY);
      }

      return token;
    } catch (error) {
      secureLogger.error('SECURE_STORAGE', 'Failed to retrieve refresh token', {
        error: error instanceof Error ? error.message : String(error)
      });
      return null;
    }
  }

  // Clear all stored tokens
  static clearTokens(): void {
    try {
      // Clear all storage locations
      localStorage.removeItem(this.TOKEN_KEY);
      localStorage.removeItem(this.REFRESH_TOKEN_KEY);
      sessionStorage.removeItem(this.TOKEN_KEY);
      sessionStorage.removeItem(this.REFRESH_TOKEN_KEY);

      // Clear cookies
      this.deleteCookie(this.TOKEN_KEY);
      this.deleteCookie(this.REFRESH_TOKEN_KEY);

      secureLogger.info('SECURE_STORAGE', 'All tokens cleared');
    } catch (error) {
      secureLogger.error('SECURE_STORAGE', 'Failed to clear tokens', {
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }

  // Check if we're in a secure context
  private static isSecureContext(): boolean {
    return typeof window !== 'undefined' &&
           (window.location.protocol === 'https:' ||
            window.location.hostname === 'localhost' ||
            window.location.hostname === '127.0.0.1');
  }

  // Set a secure cookie (not httpOnly)
  private static setSecureCookie(name: string, value: string): void {
    try {
      const secure = this.isSecureContext() ? '; Secure' : '';
      const sameSite = '; SameSite=Strict';
      const maxAge = '; Max-Age=86400'; // 24 hours

      document.cookie = `${name}=${encodeURIComponent(value)}${secure}${sameSite}${maxAge}; Path=/`;
    } catch {
      // Silently fail for cookie issues
    }
  }

  // Set an httpOnly cookie (server-side only, requires backend cooperation)
  private static setHttpOnlyCookie(name: string, value: string): void {
    // Note: httpOnly cookies must be set by the server
    // This is a placeholder for when the backend implements httpOnly cookie setting
    try {
      // For now, we'll set a regular secure cookie
      // In production, the backend should set httpOnly cookies via Set-Cookie header
      this.setSecureCookie(name, value);
    } catch {
      // Silently fail
    }
  }

  // Get a cookie value
  private static getCookie(name: string): string | null {
    try {
      const cookies = document.cookie.split(';');
      for (const cookie of cookies) {
        const [cookieName, cookieValue] = cookie.trim().split('=');
        if (cookieName === name) {
          return decodeURIComponent(cookieValue);
        }
      }
      return null;
    } catch {
      return null;
    }
  }

  // Delete a cookie
  private static deleteCookie(name: string): void {
    try {
      document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; Path=/`;
    } catch {
      // Silently fail
    }
  }

  // Validate token format (basic check)
  static isValidToken(token: string | null): boolean {
    if (!token || typeof token !== 'string') return false;

    // Basic JWT format check
    const parts = token.split('.');
    return parts.length === 3 && parts.every(part => part.length > 0);
  }
}