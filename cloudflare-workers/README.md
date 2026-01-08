# Zenith Platform - Cloudflare Workers Edge Gateway

> **100% Free Forever** edge gateway using Cloudflare Workers

## 🚀 Quick Start

### Prerequisites

- [Node.js](https://nodejs.org/) 18+
- [Cloudflare account](https://dash.cloudflare.com/sign-up) (free)

### 1. Install Dependencies

```bash
cd cloudflare-workers
npm install
```

### 2. Login to Cloudflare

```bash
npx wrangler login
```

This will open a browser window for authentication.

### 3. Create KV Namespaces

```bash
# Create KV for caching
npx wrangler kv:namespace create "CACHE"
# Note the ID, add to wrangler.toml

# Create KV for rate limiting
npx wrangler kv:namespace create "RATE_LIMIT"
# Note the ID, add to wrangler.toml
```

Update `wrangler.toml` with the IDs:

```toml
kv_namespaces = [
  { binding = "CACHE", id = "YOUR_CACHE_ID" },
  { binding = "RATE_LIMIT", id = "YOUR_RATE_LIMIT_ID" }
]
```

### 4. Configure Backend URL

Update `wrangler.toml`:

```toml
[vars]
ORACLE_BACKEND_URL = "http://YOUR_ORACLE_IP"
```

### 5. Deploy

```bash
# Development (local)
npm run dev

# Production
npm run deploy
```

### 6. Your Free Domain! 🎉

After deployment, you'll get:

```
https://zenith-gateway.YOUR_SUBDOMAIN.workers.dev
```

---

## 🌐 Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/health` | GET | Gateway health check |
| `/metrics` | GET | Prometheus metrics |
| `/api/auth/*` | ALL | Authentication service |
| `/api/cases/*` | ALL | Case management |
| `/api/ai/*` | ALL | AI/ML service |
| `/api/fraud/*` | ALL | Fraud detection |
| `/api/workflow/*` | ALL | Workflow service |
| `/api/regulatory/*` | ALL | Regulatory service |
| `/api/search/*` | ALL | Search service |

---

## 🔒 Security Features

- **Rate Limiting**: 100 requests/minute per IP
- **CORS**: Configured for all origins (customize in code)
- **Security Headers**: HSTS, XSS Protection, Frame Denial
- **Request Tracing**: X-Request-ID on all requests

---

## 📊 Free Tier Limits

| Resource | Limit | Notes |
|----------|-------|-------|
| Requests | 100,000/day | ~70 req/min average |
| KV Reads | 100,000/day | Caching operations |
| KV Writes | 1,000/day | Rate limit updates |
| CPU Time | 10ms/request | Sufficient for routing |

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────┐
│           Cloudflare Edge (200+ Locations)      │
│                                                 │
│  zenith-gateway.YOUR_SUBDOMAIN.workers.dev      │
│                                                 │
│  ┌─────────────────────────────────────────┐   │
│  │           Workers Runtime               │   │
│  │  • Rate Limiting (KV)                   │   │
│  │  • Response Caching (KV)                │   │
│  │  • Request Routing                      │   │
│  │  • Security Headers                     │   │
│  └─────────────────────────────────────────┘   │
│                      │                          │
└──────────────────────┼──────────────────────────┘
                       │
                       ▼
           ┌───────────────────┐
           │   Oracle Cloud    │
           │   (24GB ARM VM)   │
           │                   │
           │ :8000 API Gateway │
           │ :8003 AI/ML       │
           │ :8004 Fraud       │
           │ :8005 Workflow    │
           └───────────────────┘
```

---

## 🛠️ Development

```bash
# Start local development server
npm run dev

# View real-time logs
npm run tail

# Run tests
npm test
```

---

## 📝 Customization

### Add Custom Domain (Free with is-a.dev)

1. Register at [is-a.dev](https://is-a.dev)
2. Add to `wrangler.toml`:

```toml
routes = [
  { pattern = "api.zenith.is-a.dev/*", zone_name = "is-a.dev" }
]
```

### Adjust Rate Limits

```toml
[vars]
RATE_LIMIT_MAX = "200"  # requests per minute
```

### Add More Services

Edit `src/index.ts`:

```typescript
const SERVICE_ROUTES = {
  // Add your new service
  'newservice': { port: 8006, prefix: '/api/v1/newservice' },
};
```

---

## 💰 Cost: $0/month Forever

| Component | Cost |
|-----------|------|
| Cloudflare Workers | $0 |
| Cloudflare KV | $0 |
| Custom Subdomain | $0 |
| SSL Certificate | $0 |
| CDN/DDoS Protection | $0 |
| **Total** | **$0** |

---

## 🔗 Related

- [Oracle Cloud Setup](../docs/deployment/ORACLE_CLOUD_SETUP.md)
- [Supabase Setup](../docs/deployment/SUPABASE_SETUP.md)
- [Full Architecture](../docs/development/IMPLEMENTATION_PLAN.md)
