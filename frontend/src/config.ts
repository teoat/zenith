// config.ts - Centralize environment configuration with validation

interface EnvValidation {
  required: string[];
  optional: string[];
  defaults: Record<string, string>;
}

const ENV_VALIDATION: EnvValidation = {
  required: ['VITE_API_URL'], // These must be set
  optional: ['VITE_WS_URL', 'VITE_ENVIRONMENT'], // These have defaults
  defaults: {
    'VITE_API_URL': 'http://localhost:8001/api/v1',
    'VITE_WS_URL': 'ws://localhost:8001',
    'VITE_ENVIRONMENT': 'development'
  }
};

export const getEnvVariable = (name: string, defaultValue?: string): string => {
  // Check Vite environment first
  try {
    const getMeta = new Function('try { return import.meta; } catch { return undefined; }');
    const meta = getMeta();
    if (meta && meta.env && meta.env[name]) {
      return meta.env[name];
    }
  } catch (e) {
    // Ignore meta errors
  }

  // Check Node.js process environment
  try {
    if (typeof process !== 'undefined' && process.env && process.env[name]) {
      return process.env[name];
    }
  } catch (e) {
    // Ignore process errors
  }

  // Return provided default or configured default
  return defaultValue || ENV_VALIDATION.defaults[name] || '';
};

/**
 * Validate environment configuration
 * Throws error if required variables are missing
 */
export const validateEnvironment = (): void => {
  const missingRequired: string[] = [];

  for (const envVar of ENV_VALIDATION.required) {
    const value = getEnvVariable(envVar);
    if (!value || value === ENV_VALIDATION.defaults[envVar]) {
      // In production, required variables must be explicitly set
      const isProduction = getEnvVariable('VITE_ENVIRONMENT') === 'production';
      if (isProduction || !ENV_VALIDATION.defaults[envVar]) {
        missingRequired.push(envVar);
      }
    }
  }

  if (missingRequired.length > 0) {
    const errorMessage = `Missing required environment variables: ${missingRequired.join(', ')}\n` +
      'Please set these variables in your environment or .env file.';
    throw new Error(errorMessage);
  }
};

// Validate environment on module load
validateEnvironment();

export const API_BASE = getEnvVariable('VITE_API_URL');
export const WS_URL = getEnvVariable('VITE_WS_URL');
export const ENVIRONMENT = getEnvVariable('VITE_ENVIRONMENT');
