interface CacheEntry<T> {
  value: T;
  expires: number;
}

interface CacheConfig {
  defaultTTL: number;
  memoryMaxSize: number;
  warmEndpoints: string[];
}

interface EndpointTTLConfig {
  [key: string]: number;
}

const DEFAULT_CONFIG: CacheConfig = {
  defaultTTL: 300,
  memoryMaxSize: 1000,
  warmEndpoints: ["/api/health", "/api/user", "/api/settings"],
};

const KV_URL = process.env.KV_URL || "";
const KV_REST_API_TOKEN = process.env.KV_REST_API_TOKEN || "";
const USE_KV = Boolean(KV_URL && KV_REST_API_TOKEN);

const memoryCache = new Map<string, CacheEntry<unknown>>();
let cacheHits = 0;
let cacheMisses = 0;

const ENDPOINT_TTLS: EndpointTTLConfig = {
  "/api/health": 60,
  "/api/alerts": 15,
  "/api/dashboard": 120,
  "/api/settings": 300,
  "/api/user": 600,
  "/api/cases": 180,
  "/api/transactions": 90,
};

function getTTLForEndpoint(endpoint: string): number {
  return ENDPOINT_TTLS[endpoint] || DEFAULT_CONFIG.defaultTTL;
}

function cleanupExpiredEntries(): void {
  const now = Date.now();
  for (const [key, entry] of memoryCache.entries()) {
    if (entry.expires < now) {
      memoryCache.delete(key);
    }
  }
}

function evictOldestEntries(count: number): void {
  const entriesToDelete = Array.from(memoryCache.entries())
    .sort((a, b) => a[1].expires - b[1].expires)
    .slice(0, count);

  for (const [key] of entriesToDelete) {
    memoryCache.delete(key);
  }
}

async function kvGet(key: string): Promise<string | null> {
  if (!USE_KV || !KV_URL) {
    const cached = memoryCache.get(key);
    if (cached && cached.expires > Date.now()) {
      cacheHits++;
      return cached.value as string;
    }
    cacheMisses++;
    memoryCache.delete(key);
    return null;
  }

  try {
    const response = await fetch(`${KV_URL}/get/${encodeURIComponent(key)}`, {
      headers: {
        Authorization: `Bearer ${KV_REST_API_TOKEN}`,
      },
    });

    if (!response.ok) {
      cacheMisses++;
      return null;
    }

    const data = await response.json();
    cacheHits++;
    return data.value || null;
  } catch {
    cacheMisses++;
    return null;
  }
}

async function kvSet(key: string, value: string, ttlSeconds: number): Promise<void> {
  if (!USE_KV || !KV_URL) {
    if (memoryCache.size >= DEFAULT_CONFIG.memoryMaxSize) {
      evictOldestEntries(100);
    }
    memoryCache.set(key, {
      value,
      expires: Date.now() + ttlSeconds * 1000,
    });
    return;
  }

  try {
    await fetch(`${KV_URL}/set`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${KV_REST_API_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        key,
        value,
        ex: ttlSeconds,
      }),
    });
  } catch {
    if (memoryCache.size >= DEFAULT_CONFIG.memoryMaxSize) {
      evictOldestEntries(100);
    }
    memoryCache.set(key, {
      value,
      expires: Date.now() + ttlSeconds * 1000,
    });
  }
}

async function kvDelete(key: string): Promise<void> {
  if (!USE_KV || !KV_URL) {
    memoryCache.delete(key);
    return;
  }

  try {
    await fetch(`${KV_URL}/del/${encodeURIComponent(key)}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${KV_REST_API_TOKEN}`,
      },
    });
  } catch {
    memoryCache.delete(key);
  }
}

async function kvIncr(key: string): Promise<number> {
  if (!USE_KV || !KV_URL) {
    const cached = memoryCache.get(key);
    let count = cached ? parseInt(cached.value as string, 10) + 1 : 1;
    memoryCache.set(key, {
      value: String(count),
      expires: Date.now() + 60000,
    });
    return count;
  }

  try {
    const response = await fetch(`${KV_URL}/incr/${encodeURIComponent(key)}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${KV_REST_API_TOKEN}`,
      },
    });

    if (!response.ok) {
      return 0;
    }

    const data = await response.json();
    return data.value || 0;
  } catch {
    return 0;
  }
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetTime: number;
}

export async function rateLimit(
  key: string,
  maxRequests: number,
  windowSeconds: number
): Promise<RateLimitResult> {
  const now = Date.now();
  const windowMs = windowSeconds * 1000;
  const countKey = `ratelimit:${key}`;
  const resetKey = `ratelimit:reset:${key}`;

  const [currentCount, resetTimeStr] = await Promise.all([
    kvGet(countKey),
    kvGet(resetKey),
  ]);

  let resetTime = resetTimeStr ? parseInt(resetTimeStr, 10) : now + windowMs;

  if (!resetTimeStr) {
    await kvSet(resetKey, String(resetTime), windowSeconds);
  }

  if (now > resetTime) {
    await kvDelete(countKey);
    await kvDelete(resetKey);
    resetTime = now + windowMs;
    await kvSet(resetKey, String(resetTime), windowSeconds);
  }

  const current = currentCount ? parseInt(currentCount, 10) : 0;

  if (current >= maxRequests) {
    return {
      allowed: false,
      remaining: 0,
      resetTime,
    };
  }

  const newCount = await kvIncr(countKey);
  const remaining = Math.max(0, maxRequests - newCount);

  return {
    allowed: true,
    remaining,
    resetTime,
  };
}

export async function getCached<T>(key: string, endpoint?: string): Promise<T | null> {
  const value = await kvGet(key);
  if (!value) {
    return null;
  }

  try {
    return JSON.parse(value) as T;
  } catch {
    await kvDelete(key);
    return null;
  }
}

export async function setCached<T>(
  key: string,
  value: T,
  ttlSeconds?: number
): Promise<void> {
  const effectiveTTL = ttlSeconds || getTTLForEndpoint(key);
  await kvSet(key, JSON.stringify(value), effectiveTTL);
}

export async function invalidate(key: string): Promise<void> {
  await kvDelete(key);
}

export async function invalidatePattern(pattern: string): Promise<void> {
  const patternKey = `zenith:cache:*${pattern}*`;
  const keys = await getCacheKeys(patternKey);

  for (const key of keys) {
    await invalidate(key);
  }
}

export async function invalidateAll(): Promise<void> {
  if (!USE_KV || !KV_URL) {
    memoryCache.clear();
    return;
  }

  try {
    const response = await fetch(`${KV_URL}/flushdb`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${KV_REST_API_TOKEN}`,
      },
    });
    if (!response.ok) {
      memoryCache.clear();
    }
  } catch {
    memoryCache.clear();
  }
}

async function getCacheKeys(pattern: string): Promise<string[]> {
  if (!USE_KV || !KV_URL) {
    const allKeys = Array.from(memoryCache.keys());
    const searchPattern = pattern.replace("*", "");
    return allKeys.filter((k) => k.includes(searchPattern));
  }

  try {
    const response = await fetch(`${KV_URL}/keys/${encodeURIComponent(pattern)}`, {
      headers: {
        Authorization: `Bearer ${KV_REST_API_TOKEN}`,
      },
    });

    if (!response.ok) {
      return [];
    }

    return await response.json();
  } catch {
    return [];
  }
}

export async function warmCache(endpoints?: string[]): Promise<void> {
  const targets = endpoints || DEFAULT_CONFIG.warmEndpoints;

  for (const endpoint of targets) {
    try {
      const response = await fetch(endpoint);
      if (response.ok) {
        const data = await response.json();
        await setCached(`warm:${endpoint}`, data, getTTLForEndpoint(endpoint));
      }
    } catch {
    }
  }
}

export function getCacheStats(): { hits: number; misses: number; size: number; hitRate: string } {
  const total = cacheHits + cacheMisses;
  const hitRate = total > 0 ? ((cacheHits / total) * 100).toFixed(2) : "0.00";
  return {
    hits: cacheHits,
    misses: cacheMisses,
    size: memoryCache.size,
    hitRate: `${hitRate}%`,
  };
}

export function configureCache(config: Partial<CacheConfig>): void {
  if (config.defaultTTL) {
    DEFAULT_CONFIG.defaultTTL = config.defaultTTL;
  }
  if (config.memoryMaxSize) {
    DEFAULT_CONFIG.memoryMaxSize = config.memoryMaxSize;
  }
  if (config.warmEndpoints) {
    DEFAULT_CONFIG.warmEndpoints = config.warmEndpoints;
  }
}

export function setEndpointTTL(endpoint: string, ttl: number): void {
  ENDPOINT_TTLS[endpoint] = ttl;
}

export const cache = {
  get: getCached,
  set: setCached,
  invalidate,
  invalidatePattern,
  invalidateAll,
  rateLimit,
  warmCache,
  getStats: getCacheStats,
  configure: configureCache,
  setEndpointTTL,
};
