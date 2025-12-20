/**
 * Utility to access environment variables safely across different environments (Vite, Jest)
 */

interface EnvVars {
  DEV: boolean;
  VITE_API_URL?: string;
  VITE_WS_URL?: string;
  VITE_BYPASS_AUTH?: string;
  MODE: string;
}

const getEnvVars = (): EnvVars => {
  // Check for Vite's import.meta.env using dynamic evaluation to avoid parser errors in Jest
  try {
    // eslint-disable-next-line no-new-func
    const importMeta = new Function('return import.meta')();
    if (importMeta && importMeta.env) {
      return importMeta.env as unknown as EnvVars;
    }
  } catch {
    // Fallback if dynamic import.meta fails
  }

  // Fallback to process.env (for Jest)
  if (typeof process !== 'undefined' && process.env) {
    return {
      DEV: process.env.NODE_ENV === 'development',
      VITE_API_URL: process.env.VITE_API_URL,
      VITE_WS_URL: process.env.VITE_WS_URL,
      VITE_BYPASS_AUTH: process.env.VITE_BYPASS_AUTH,
      MODE: process.env.NODE_ENV || 'development'
    };
  }

  return {
    DEV: false,
    MODE: 'production'
  };
};

export const env = getEnvVars();
export const isDev = env.DEV;
export const isProd = env.MODE === 'production';
export const API_URL = env.VITE_API_URL;
export const WS_URL = env.VITE_WS_URL;
export const BYPASS_AUTH_VAR = env.VITE_BYPASS_AUTH;
