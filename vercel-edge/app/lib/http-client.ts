/**
 * HTTP Client for Railway Backend Communication
 * Provides retry, circuit breaker, and caching capabilities
 */

import { config } from "./config";
import { getServiceUrl, getServiceName } from "./service-discovery";
import { monitoring } from "./monitoring";
import { circuitBreaker } from "./circuit-breaker";

interface RequestOptions {
  method?: string;
  headers?: Record<string, string>;
  body?: BodyInit;
  cacheKey?: string;
  ttl?: number;
}

interface ProxyResponse {
  success: boolean;
  status: number;
  data: unknown;
  error?: string;
  cached?: boolean;
}

const CACHE_PREFIX = "zenith:cache:";
const RATE_LIMIT_PREFIX = "zenith:ratelimit:";

const memoryCache = new Map<string, { value: string; expires: number }>();

function generateCacheKey(path: string, method: string): string {
  return `${CACHE_PREFIX}${method.toUpperCase()}:${path}`;
}

function generateRateLimitKey(ip: string, path: string): string {
  return `${RATE_LIMIT_PREFIX}${ip}:${path}`;
}

function isCached(key: string): string | null {
  const cached = memoryCache.get(key);
  if (cached && cached.expires > Date.now()) {
    return cached.value;
  }
  memoryCache.delete(key);
  return null;
}

function setCache(key: string, value: string, ttlSeconds: number): void {
  memoryCache.set(key, {
    value,
    expires: Date.now() + ttlSeconds * 1000,
  });
}

function checkRateLimit(ip: string, path: string): { allowed: boolean; remaining: number; resetTime: number } {
  const key = generateRateLimitKey(ip, path);
  const now = Date.now();
  const windowMs = 60000;
  const limit = config.RATE_LIMIT_MAX;

  const cached = memoryCache.get(key);
  if (!cached) {
    setCache(key, JSON.stringify({ count: 1, resetTime: now + windowMs }), 60);
    return { allowed: true, remaining: limit - 1, resetTime: now + windowMs };
  }

  const data = JSON.parse(cached.value);
  if (now > data.resetTime) {
    setCache(key, JSON.stringify({ count: 1, resetTime: now + windowMs }), 60);
    return { allowed: true, remaining: limit - 1, resetTime: now + windowMs };
  }

  if (data.count >= limit) {
    return { allowed: false, remaining: 0, resetTime: data.resetTime };
  }

  const newCount = data.count + 1;
  const remainingSeconds = Math.ceil((data.resetTime - now) / 1000);
  setCache(key, JSON.stringify({ count: newCount, resetTime: data.resetTime }), remainingSeconds);
  return { allowed: true, remaining: limit - newCount, resetTime: data.resetTime };
}

async function fetchWithRetry(
  url: string,
  options: RequestOptions,
  attempt: number = 1
): Promise<ProxyResponse> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000);

  try {
    const response = await fetch(url, {
      method: options.method || "GET",
      headers: {
        "Content-Type": "application/json",
        "X-Request-ID": crypto.randomUUID(),
        ...options.headers,
      },
      body: options.body,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    const contentType = response.headers.get("content-type");
    let data: unknown;
    if (contentType?.includes("application/json")) {
      data = await response.json();
    } else {
      data = await response.text();
    }

    if (!response.ok) {
      return {
        success: false,
        status: response.status,
        data,
        error: `HTTP ${response.status}: ${response.statusText}`,
      };
    }

    return {
      success: true,
      status: response.status,
      data,
    };
  } catch (error) {
    clearTimeout(timeoutId);

    if (attempt < config.RETRY_MAX_ATTEMPTS) {
      const delay = config.RETRY_DELAY_MS * Math.pow(2, attempt - 1);
      await new Promise((resolve) => setTimeout(resolve, delay));
      return fetchWithRetry(url, options, attempt + 1);
    }

    return {
      success: false,
      status: 503,
      data: null,
      error: error instanceof Error ? error.message : "Service unavailable",
    };
  }
}

export async function proxyRequest(
  path: string,
  options: RequestOptions = {}
): Promise<ProxyResponse> {
  const requestId = crypto.randomUUID();
  const startTime = performance.now();
  const ip = "edge";
  const method = options.method || "GET";

  const rateLimit = checkRateLimit(ip, path);
  if (!rateLimit.allowed) {
    monitoring.recordRequest(path, method, 429, performance.now() - startTime, false, true);
    return {
      success: false,
      status: 429,
      data: { error: "Rate limit exceeded", retryAfter: rateLimit.resetTime },
    };
  }

  if (method === "GET" || !method) {
    const cacheKey = generateCacheKey(path, method);
    const cachedValue = isCached(cacheKey);
    if (cachedValue) {
      monitoring.recordRequest(path, method, 200, performance.now() - startTime, true, false);
      return {
        success: true,
        status: 200,
        data: JSON.parse(cachedValue),
        cached: true,
      };
    }
  }

  const serviceName = getServiceName(path);
  const circuit = circuitBreaker.getCircuitBreaker(serviceName);

  try {
    const response = await circuit.execute(async () => {
      return await fetchWithRetry(getServiceUrl(path), options);
    });

    if (response.success && (method === "GET" || !method)) {
      const cacheKey = generateCacheKey(path, method);
      const ttl = options.ttl || config.CACHE_TTL;
      setCache(cacheKey, JSON.stringify(response.data), ttl);
    }

    monitoring.recordRequest(
      path,
      method,
      response.status,
      performance.now() - startTime,
      response.cached || false,
      false
    );

    return response;
  } catch (error) {
    monitoring.recordRequest(path, method, 503, performance.now() - startTime, false, false);
    return {
      success: false,
      status: 503,
      data: null,
      error: `Failed to connect to ${serviceName}: ${error instanceof Error ? error.message : "Unknown error"}`,
    };
  }
}

export function invalidateCache(path: string, method: string = "GET"): void {
  const cacheKey = generateCacheKey(path, method);
  memoryCache.delete(cacheKey);
}

export function invalidatePattern(pattern: string): void {
  const keys = Array.from(memoryCache.keys());
  for (const key of keys) {
    if (key.includes(pattern)) {
      memoryCache.delete(key);
    }
  }
}

export function getCacheStats(): { size: number; keys: string[] } {
  return {
    size: memoryCache.size,
    keys: Array.from(memoryCache.keys()),
  };
}

export const httpClient = {
  proxyRequest,
  invalidateCache,
  invalidatePattern,
  getCacheStats,
};
