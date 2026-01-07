# Production Master Sheet

**System Status**: 🟢 DEPLOYING
**Last Updated**: 2026-01-07

## 1. Architecture Map

```mermaid
graph LR
    User[End User] --> Vercel[Frontend (Vercel)]
    Vercel -->|API Calls| Railway[Backend (Railway)]
    Railway -->|Persist| PG[(PostgreSQL)]
    Railway -->|Cache| Redis[(Redis)]
```

## 2. Service URLs

| Service | URL | Status |
|---------|-----|--------|
| **Frontend** | TBD (Deploy via Vercel Pending) | ⏳ Pending |
| **Backend** | `https://zenith-fraud.up.railway.app` | � Re-Deploying |
| **Docs** | `/docs` or `/redoc` | ⏳ Waiting |
| **Health** | `/health` | ⏳ Waiting |

## 3. Environment Variable Checklist

### Backend (Railway)

- [x] `ENVIRONMENT`: `production`
- [x] `DATABASE_URL`: Auto-set by Railway Plugin
- [x] `REDIS_URL`: Auto-set by Railway Plugin
- [x] `SECRET_KEY`: Rotated & Secure
- [x] `CORS_ALLOWED_ORIGINS`: Points to Vercel URL

### Frontend (Vercel)

- [ ] `VITE_API_URL`: `https://zenith-fraud.up.railway.app`

## 4. Operational Commands

### Manual Deployment

```bash
# Backend
./deploy_backend.sh

# Frontend
cd frontend && vercel --prod
```

### Logs

```bash
railway logs --service zenith-fraud-detection
```
