# 🚀 Zenith Edge Gateway

**Vercel Edge-Powered API Gateway for the Zenith Fraud Detection Platform**

This Edge Gateway provides global, low-latency access to the Railway-hosted microservices via Vercel's Edge Network.

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    Vercel Edge Network                           │
│         (Global CDN: US East, US West, London, Tokyo, Singapore)│
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                    Edge Middleware                       │   │
│  │  • Rate Limiting (100 req/min per IP)                   │   │
│  │  • CORS & Security Headers                               │   │
│  │  • Request Tracing (X-Request-ID)                       │   │
│  └─────────────────────────────────────────────────────────┘   │
│                           │                                     │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                    Edge API Routes                       │   │
│  │  /api/auth      → Authentication & Authorization         │   │
│  │  /api/cases     → Case Management CRUD                   │   │
│  │  /api/ai        → ML Inference & Embeddings             │   │
│  │  /api/fraud     → Fraud Detection & Alerts              │   │
│  │  /api/workflow  → Workflow Management                    │   │
│  │  /api/regulatory→ Compliance & Reporting                 │   │
│  │  /api/search    → Unified Search                         │   │
│  │  /api/diagnostics→ System Health & Metrics              │   │
│  │  /api/health    → Gateway Health & Stats                 │   │
│  └─────────────────────────────────────────────────────────┘   │
│                           │                                     │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                    Edge Libraries                        │   │
│  │  • HTTP Client (Retry, Timeout, Circuit Breaker)        │   │
│  │  • Memory Cache (L1 with TTL)                            │   │
│  │  • Service Discovery                                     │   │
│  │  • Monitoring & Alerting                                 │   │
│  │  • Analytics                                             │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
                    Railway API Gateway (8000)
                              │
            ┌─────────────────┼─────────────────┐
            ▼                 ▼                 ▼
      AI/ML Service    Fraud+Intel       Workflow+Reg
        (8003)           (8004)            (8005)
```

## 📁 Project Structure

```
vercel-edge/
├── app/
│   ├── api/                    # Edge API Routes
│   │   ├── ai/route.ts         # AI/ML endpoints
│   │   ├── auth/route.ts       # Authentication
│   │   ├── cases/route.ts      # Case management
│   │   ├── diagnostics/route.ts# System diagnostics
│   │   ├── fraud/route.ts      # Fraud detection
│   │   ├── health/route.ts     # Health & metrics
│   │   ├── proxy/route.ts      # Generic proxy
│   │   ├── regulatory/route.ts # Compliance
│   │   ├── search/route.ts     # Unified search
│   │   └── workflow/route.ts   # Workflow management
│   ├── lib/                    # Shared libraries
│   │   ├── alerting.ts         # Alert management
│   │   ├── analytics.ts        # Performance tracking
│   │   ├── cache.ts            # Memory caching
│   │   ├── circuit-breaker.ts  # Fault tolerance
│   │   ├── config.ts           # Environment config
│   │   ├── http-client.ts      # HTTP client with retry
│   │   ├── monitoring.ts       # Metrics collection
│   │   └── service-discovery.ts# Service routing
│   └── types/                  # TypeScript types
├── middleware.ts               # Edge middleware
├── vercel.json                 # Vercel configuration
├── next.config.js              # Next.js configuration
├── package.json                # Dependencies
└── tsconfig.json               # TypeScript config
```

## 🔧 Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `RAILWAY_API_GATEWAY_URL` | Railway API Gateway URL | `http://localhost:8000` |
| `KV_REST_API_URL` | Vercel KV REST API URL | - |
| `KV_REST_API_TOKEN` | Vercel KV auth token | - |
| `RATE_LIMIT_MAX` | Max requests per minute | `100` |
| `CACHE_TTL` | Default cache TTL (seconds) | `300` |

## 🚀 Development

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Deploy to Vercel
vercel deploy
```

## 🌐 API Endpoints

### Health & Monitoring

- `GET /api/health` - Basic health check
- `GET /api/health?action=stats` - Detailed statistics
- `GET /api/health?action=metrics` - Prometheus metrics
- `GET /api/health?action=alerts` - Active alerts
- `GET /api/health?action=ready` - Readiness check

### Authentication

- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `POST /api/auth/refresh` - Token refresh
- `GET /api/auth/me` - Current user info

### Cases

- `GET /api/cases` - List cases
- `POST /api/cases` - Create case
- `GET /api/cases/:id` - Get case details
- `PUT /api/cases/:id` - Update case
- `DELETE /api/cases/:id` - Delete case

### AI/ML

- `POST /api/ai/analyze` - Fraud analysis
- `POST /api/ai/embeddings` - Generate embeddings
- `GET /api/ai/models` - Available models

### Fraud Detection

- `POST /api/fraud/scan` - Scan transaction
- `GET /api/fraud/alerts` - List alerts
- `GET /api/fraud/rules` - Detection rules

### Search

- `GET /api/search?q=query&type=all` - Unified search
- `POST /api/search/advanced` - Advanced search

## 🔒 Security Features

- **Rate Limiting**: 100 requests per minute per IP
- **CORS**: Configurable allowed origins
- **Security Headers**: HSTS, XSS Protection, Frame Denial
- **Request Tracing**: X-Request-ID for distributed tracing
- **Circuit Breakers**: Per-service fault isolation

## 📊 Monitoring

The Edge Gateway provides built-in monitoring:

- **Request Metrics**: Duration, status codes, cache hits
- **Circuit Breaker States**: Per-service health
- **Error Rates**: Aggregated error tracking
- **Prometheus Export**: `/api/health?action=metrics`

## 🌍 Global Regions

Deployed to 5 Vercel Edge regions:

- `iad1` - US East (Washington DC)
- `sfo1` - US West (San Francisco)
- `lhr1` - Europe (London)
- `hnd1` - Asia Pacific (Tokyo)
- `sin1` - Southeast Asia (Singapore)

## 📦 Dependencies

- **Next.js 14**: React framework with Edge Runtime
- **TypeScript**: Type-safe development
- **Vercel Edge Runtime**: Global edge deployment

---

**Version**: 1.0.0  
**Last Updated**: 2026-01-08
