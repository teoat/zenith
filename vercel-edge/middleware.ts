import { NextRequest, NextResponse } from "next/server";

/**
 * Edge Middleware for Zenith Platform
 * Handles: CORS, Rate Limiting, Security Headers, Request Logging
 */

// Rate limiting configuration
const RATE_LIMIT_WINDOW_MS = 60000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 100;
const RATE_LIMIT_BYPASS_PATHS = ["/api/health"];

// In-memory rate limit store (for edge, use Vercel KV in production)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

function getRateLimitKey(request: NextRequest): string {
  // Use IP address or fallback to a header
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown";
  return `ratelimit:${ip}`;
}

function checkRateLimit(request: NextRequest): {
  allowed: boolean;
  remaining: number;
  resetTime: number;
} {
  const key = getRateLimitKey(request);
  const now = Date.now();

  const entry = rateLimitStore.get(key);

  if (!entry || now > entry.resetTime) {
    // New window
    rateLimitStore.set(key, { count: 1, resetTime: now + RATE_LIMIT_WINDOW_MS });
    return { allowed: true, remaining: RATE_LIMIT_MAX_REQUESTS - 1, resetTime: now + RATE_LIMIT_WINDOW_MS };
  }

  if (entry.count >= RATE_LIMIT_MAX_REQUESTS) {
    return { allowed: false, remaining: 0, resetTime: entry.resetTime };
  }

  // Increment count
  entry.count++;
  return { allowed: true, remaining: RATE_LIMIT_MAX_REQUESTS - entry.count, resetTime: entry.resetTime };
}

function getSecurityHeaders(): Headers {
  const headers = new Headers();

  // CORS headers
  headers.set("Access-Control-Allow-Origin", "*");
  headers.set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, PATCH, OPTIONS");
  headers.set("Access-Control-Allow-Headers", "Authorization, Content-Type, X-Request-ID, X-Correlation-ID");
  headers.set("Access-Control-Max-Age", "86400");

  // Security headers
  headers.set("X-Content-Type-Options", "nosniff");
  headers.set("X-Frame-Options", "DENY");
  headers.set("X-XSS-Protection", "1; mode=block");
  headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  headers.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains; preload");

  return headers;
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Handle CORS preflight
  if (request.method === "OPTIONS") {
    return new NextResponse(null, {
      status: 204,
      headers: getSecurityHeaders(),
    });
  }

  // Skip rate limiting for bypass paths
  const shouldBypass = RATE_LIMIT_BYPASS_PATHS.some((p) => pathname.startsWith(p));

  if (!shouldBypass && pathname.startsWith("/api/")) {
    const rateLimit = checkRateLimit(request);

    if (!rateLimit.allowed) {
      const headers = getSecurityHeaders();
      headers.set("X-RateLimit-Limit", RATE_LIMIT_MAX_REQUESTS.toString());
      headers.set("X-RateLimit-Remaining", "0");
      headers.set("X-RateLimit-Reset", rateLimit.resetTime.toString());
      headers.set("Retry-After", Math.ceil((rateLimit.resetTime - Date.now()) / 1000).toString());

      return NextResponse.json(
        {
          error: "Rate limit exceeded",
          code: "RATE_LIMIT_EXCEEDED",
          retryAfter: Math.ceil((rateLimit.resetTime - Date.now()) / 1000),
        },
        { status: 429, headers }
      );
    }

    // Add rate limit headers to response
    const response = NextResponse.next();
    const headers = getSecurityHeaders();

    headers.set("X-RateLimit-Limit", RATE_LIMIT_MAX_REQUESTS.toString());
    headers.set("X-RateLimit-Remaining", rateLimit.remaining.toString());
    headers.set("X-RateLimit-Reset", rateLimit.resetTime.toString());

    // Add request ID for tracing
    const requestId = request.headers.get("X-Request-ID") || crypto.randomUUID();
    headers.set("X-Request-ID", requestId);

    // Add timing header
    headers.set("X-Response-Time", "0ms"); // Updated by route handler

    headers.forEach((value, key) => {
      response.headers.set(key, value);
    });

    return response;
  }

  // For non-API routes, just add security headers
  const response = NextResponse.next();
  getSecurityHeaders().forEach((value, key) => {
    response.headers.set(key, value);
  });

  return response;
}

export const config = {
  matcher: [
    "/api/:path*",
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
