import { NextRequest, NextResponse } from '@vercel/edge';

const RAILWAY_API_URL = process.env.RAILWAY_API_URL || 'https://api.railway.app';
const KV_URL = process.env.KV_URL;

// Rate limiting cache (in production, use Vercel KV)
const rateLimitCache = new Map();

interface RateLimitData {
  count: number;
  resetTime: number;
}

function checkRateLimit(clientId: string): boolean {
  const now = Date.now();
  const windowMs = 60 * 1000; // 1 minute
  const maxRequests = 100; // 100 requests per minute

  const data = rateLimitCache.get(clientId) as RateLimitData | undefined;

  if (!data || now > data.resetTime) {
    rateLimitCache.set(clientId, { count: 1, resetTime: now + windowMs });
    return true;
  }

  if (data.count >= maxRequests) {
    return false;
  }

  data.count++;
  return true;
}

function getClientId(request: NextRequest): string {
  // Use IP address for rate limiting (in production, use proper client identification)
  const ip = request.headers.get('x-forwarded-for') ||
             request.headers.get('x-real-ip') ||
             'unknown';
  return ip;
}

async function getCachedResponse(cacheKey: string): Promise<Response | null> {
  if (!KV_URL) return null;

  try {
    // In production, use Vercel KV for caching
    // const cached = await kv.get(cacheKey);
    // if (cached) return new Response(cached);

    return null;
  } catch (error) {
    console.error('Cache error:', error);
    return null;
  }
}

async function setCachedResponse(cacheKey: string, response: Response, ttl = 300): Promise<void> {
  if (!KV_URL) return;

  try {
    // In production, use Vercel KV for caching
    // await kv.set(cacheKey, await response.clone().text(), { ex: ttl });
  } catch (error) {
    console.error('Cache set error:', error);
  }
}

export async function GET(request: NextRequest) {
  const clientId = getClientId(request);

  // Rate limiting
  if (!checkRateLimit(clientId)) {
    return NextResponse.json(
      { error: 'Rate limit exceeded' },
      { status: 429 }
    );
  }

  const url = new URL(request.url);
  const path = url.pathname.replace('/api', '');
  const targetUrl = `${RAILWAY_API_URL}${path}${url.search}`;

  // Check cache for GET requests
  if (request.method === 'GET') {
    const cacheKey = `api:${targetUrl}`;
    const cached = await getCachedResponse(cacheKey);
    if (cached) {
      return cached;
    }
  }

  try {
    // Forward request to Railway backend
    const response = await fetch(targetUrl, {
      method: request.method,
      headers: {
        ...Object.fromEntries(request.headers),
        'X-Forwarded-For': clientId,
        'X-API-Gateway': 'vercel-edge',
      },
      body: request.method !== 'GET' ? await request.text() : undefined,
    });

    const responseClone = response.clone();

    // Cache successful GET responses
    if (request.method === 'GET' && response.ok) {
      await setCachedResponse(`api:${targetUrl}`, responseClone);
    }

    return response;
  } catch (error) {
    console.error('Edge function error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  return GET(request);
}

export async function PUT(request: NextRequest) {
  return GET(request);
}

export async function DELETE(request: NextRequest) {
  return GET(request);
}

export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-API-Key',
    },
  });
}