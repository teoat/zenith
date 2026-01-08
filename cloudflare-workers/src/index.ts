/**
 * Zenith Platform - Cloudflare Workers Edge Gateway
 * Multi-Provider Backend Support (Koyeb + Fly.io)
 * 
 * Features:
 * - Rate limiting (100 req/min per IP)
 * - Request routing to multiple backends
 * - Response caching (KV)
 * - CORS and security headers
 * - Health checks and metrics
 */

export interface Env {
  // KV Namespaces
  CACHE: KVNamespace;
  RATE_LIMIT: KVNamespace;
  
  // Backend URLs (different providers)
  API_GATEWAY_URL: string;      // Koyeb
  AI_ML_URL: string;            // Fly.io
  FRAUD_URL: string;            // Fly.io
  WORKFLOW_URL: string;         // Fly.io
  
  // Settings
  RATE_LIMIT_MAX: string;
  CACHE_TTL: string;
  ENVIRONMENT: string;
}

// Service routing configuration - multi-provider
function getServiceConfig(env: Env): Record<string, { baseUrl: string; prefix: string }> {
  return {
    'auth': { baseUrl: env.API_GATEWAY_URL || 'https://zenith-api-gateway.koyeb.app', prefix: '/api/v1/auth' },
    'cases': { baseUrl: env.API_GATEWAY_URL || 'https://zenith-api-gateway.koyeb.app', prefix: '/api/v1/cases' },
    'search': { baseUrl: env.API_GATEWAY_URL || 'https://zenith-api-gateway.koyeb.app', prefix: '/api/v1/search' },
    'ai': { baseUrl: env.AI_ML_URL || 'https://zenith-ai-ml.fly.dev', prefix: '/api/v1/ai' },
    'fraud': { baseUrl: env.FRAUD_URL || 'https://zenith-fraud.fly.dev', prefix: '/api/v1/fraud' },
    'workflow': { baseUrl: env.WORKFLOW_URL || 'https://zenith-workflow.fly.dev', prefix: '/api/v1/workflow' },
    'regulatory': { baseUrl: env.WORKFLOW_URL || 'https://zenith-workflow.fly.dev', prefix: '/api/v1/regulatory' },
  };
}

// Security headers
const SECURITY_HEADERS: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
  'Access-Control-Allow-Headers': 'Authorization, Content-Type, X-Request-ID',
  'Access-Control-Max-Age': '86400',
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
};

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;
    const method = request.method;
    
    // Generate request ID for tracing
    const requestId = crypto.randomUUID();
    
    // Handle CORS preflight
    if (method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: SECURITY_HEADERS,
      });
    }
    
    // Health check endpoint
    if (path === '/health' || path === '/api/health') {
      return handleHealth(env, requestId);
    }
    
    // Metrics endpoint
    if (path === '/metrics') {
      return handleMetrics(env);
    }
    
    // Rate limiting
    const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
    const rateLimitResult = await checkRateLimit(env, ip);
    
    if (!rateLimitResult.allowed) {
      return new Response(JSON.stringify({
        error: 'Rate limit exceeded',
        retryAfter: rateLimitResult.resetTime,
      }), {
        status: 429,
        headers: {
          ...SECURITY_HEADERS,
          'Content-Type': 'application/json',
          'Retry-After': String(rateLimitResult.resetTime),
          'X-RateLimit-Limit': env.RATE_LIMIT_MAX,
          'X-RateLimit-Remaining': '0',
        },
      });
    }
    
    // Route API requests
    if (path.startsWith('/api/')) {
      return handleApiRequest(request, env, ctx, requestId, rateLimitResult);
    }
    
    // Default: Not found
    return new Response(JSON.stringify({ error: 'Not found' }), {
      status: 404,
      headers: { ...SECURITY_HEADERS, 'Content-Type': 'application/json' },
    });
  },
};

async function handleHealth(env: Env, requestId: string): Promise<Response> {
  const health = {
    status: 'healthy',
    service: 'zenith-edge-gateway',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    requestId,
    environment: env.ENVIRONMENT,
    backends: {
      apiGateway: env.API_GATEWAY_URL || 'not configured',
      aiMl: env.AI_ML_URL || 'not configured',
      fraud: env.FRAUD_URL || 'not configured',
      workflow: env.WORKFLOW_URL || 'not configured',
    },
  };
  
  return new Response(JSON.stringify(health, null, 2), {
    status: 200,
    headers: { ...SECURITY_HEADERS, 'Content-Type': 'application/json' },
  });
}

async function handleMetrics(env: Env): Promise<Response> {
  // Basic Prometheus-style metrics
  const metrics = `
# HELP zenith_gateway_requests_total Total requests
# TYPE zenith_gateway_requests_total counter
zenith_gateway_requests_total{status="200"} 0

# HELP zenith_gateway_up Gateway health status
# TYPE zenith_gateway_up gauge
zenith_gateway_up 1
`.trim();
  
  return new Response(metrics, {
    status: 200,
    headers: { 'Content-Type': 'text/plain' },
  });
}

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetTime: number;
}

async function checkRateLimit(env: Env, ip: string): Promise<RateLimitResult> {
  const key = `rate:${ip}`;
  const limit = parseInt(env.RATE_LIMIT_MAX || '100', 10);
  const windowMs = 60000; // 1 minute
  
  try {
    const data = await env.RATE_LIMIT.get(key);
    const now = Date.now();
    
    if (!data) {
      // First request in window
      await env.RATE_LIMIT.put(key, JSON.stringify({ count: 1, resetTime: now + windowMs }), {
        expirationTtl: 60,
      });
      return { allowed: true, remaining: limit - 1, resetTime: Math.ceil((now + windowMs) / 1000) };
    }
    
    const parsed = JSON.parse(data);
    
    if (now > parsed.resetTime) {
      // Window expired, reset
      await env.RATE_LIMIT.put(key, JSON.stringify({ count: 1, resetTime: now + windowMs }), {
        expirationTtl: 60,
      });
      return { allowed: true, remaining: limit - 1, resetTime: Math.ceil((now + windowMs) / 1000) };
    }
    
    if (parsed.count >= limit) {
      return { allowed: false, remaining: 0, resetTime: Math.ceil(parsed.resetTime / 1000) };
    }
    
    // Increment count
    parsed.count++;
    await env.RATE_LIMIT.put(key, JSON.stringify(parsed), {
      expirationTtl: Math.ceil((parsed.resetTime - now) / 1000),
    });
    
    return { allowed: true, remaining: limit - parsed.count, resetTime: Math.ceil(parsed.resetTime / 1000) };
  } catch (e) {
    // On error, allow request (fail open)
    return { allowed: true, remaining: limit, resetTime: Math.ceil((Date.now() + 60000) / 1000) };
  }
}

async function handleApiRequest(
  request: Request,
  env: Env,
  ctx: ExecutionContext,
  requestId: string,
  rateLimit: RateLimitResult
): Promise<Response> {
  const url = new URL(request.url);
  const path = url.pathname;
  const method = request.method;
  
  // Parse the service from the path
  // Handle both /api/service and /api/v1/service
  let cleanPath = path.replace('/api/', '');
  if (cleanPath.startsWith('v1/')) {
    cleanPath = cleanPath.replace('v1/', '');
  }
  
  const pathParts = cleanPath.split('/');
  const service = pathParts[0];
  const remainingPath = pathParts.slice(1).join('/');
  
  // Special case for health check via API path
  if (service === 'health') {
    return handleHealth(env, requestId);
  }
  
  // Get service config for multi-provider routing
  const serviceConfig = getServiceConfig(env);
  const route = serviceConfig[service];
  
  if (!route) {
    return new Response(JSON.stringify({ error: `Unknown service: ${service}` }), {
      status: 404,
      headers: { ...SECURITY_HEADERS, 'Content-Type': 'application/json' },
    });
  }
  
  // Check cache for GET requests
  if (method === 'GET') {
    const cacheKey = `cache:${path}`;
    const cached = await env.CACHE.get(cacheKey);
    
    if (cached) {
      return new Response(cached, {
        status: 200,
        headers: {
          ...SECURITY_HEADERS,
          'Content-Type': 'application/json',
          'X-Cache': 'HIT',
          'X-Request-ID': requestId,
          'X-RateLimit-Remaining': String(rateLimit.remaining),
        },
      });
    }
  }
  
  // Build backend URL for the specific provider
  const backendUrl = `${route.baseUrl}${route.prefix}/${remainingPath}${url.search}`;
  
  try {
    // Forward request to backend
    const backendResponse = await fetch(backendUrl, {
      method,
      headers: {
        'Content-Type': request.headers.get('Content-Type') || 'application/json',
        'Authorization': request.headers.get('Authorization') || '',
        'X-Request-ID': requestId,
        'X-Forwarded-For': request.headers.get('CF-Connecting-IP') || '',
      },
      body: method !== 'GET' && method !== 'HEAD' ? request.body : undefined,
    });
    
    const responseBody = await backendResponse.text();
    
    // Cache successful GET responses
    if (method === 'GET' && backendResponse.ok) {
      const cacheKey = `cache:${path}`;
      const ttl = parseInt(env.CACHE_TTL || '300', 10);
      ctx.waitUntil(env.CACHE.put(cacheKey, responseBody, { expirationTtl: ttl }));
    }
    
    return new Response(responseBody, {
      status: backendResponse.status,
      headers: {
        ...SECURITY_HEADERS,
        'Content-Type': backendResponse.headers.get('Content-Type') || 'application/json',
        'X-Cache': 'MISS',
        'X-Request-ID': requestId,
        'X-RateLimit-Remaining': String(rateLimit.remaining),
        'X-Backend-Status': String(backendResponse.status),
      },
    });
  } catch (error) {
    // Backend error
    console.error(`Backend error: ${error}`);
    
    return new Response(JSON.stringify({
      error: 'Backend service unavailable',
      service,
      requestId,
    }), {
      status: 503,
      headers: {
        ...SECURITY_HEADERS,
        'Content-Type': 'application/json',
        'X-Request-ID': requestId,
      },
    });
  }
}
