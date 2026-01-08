// Environment configuration for Vercel Edge Gateway
export interface EdgeConfig {
  RAILWAY_API_GATEWAY_URL: string;
  KV_REST_API_URL: string;
  KV_REST_API_TOKEN: string;
  KV_URL: string;
  RATE_LIMIT_MAX: number;
  CACHE_TTL: number;
  RETRY_MAX_ATTEMPTS: number;
  RETRY_DELAY_MS: number;
}

export function getConfig(): EdgeConfig {
  return {
    RAILWAY_API_GATEWAY_URL: process.env.RAILWAY_API_GATEWAY_URL || "http://localhost:8000",
    KV_REST_API_URL: process.env.KV_REST_API_URL || "",
    KV_REST_API_TOKEN: process.env.KV_REST_API_TOKEN || "",
    KV_URL: process.env.KV_URL || "",
    RATE_LIMIT_MAX: parseInt(process.env.RATE_LIMIT_MAX || "100", 10),
    CACHE_TTL: parseInt(process.env.CACHE_TTL || "300", 10),
    RETRY_MAX_ATTEMPTS: parseInt(process.env.RETRY_MAX_ATTEMPTS || "3", 10),
    RETRY_DELAY_MS: parseInt(process.env.RETRY_DELAY_MS || "500", 10),
  };
}

export const config = getConfig();
