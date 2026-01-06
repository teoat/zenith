# Deployment Guide

## Frontend → Vercel

### Prerequisites

- Vercel account connected to GitHub
- Build passing locally: `cd frontend && npm run build`

### Steps

1. **Install Vercel CLI** (optional):

   ```bash
   npm i -g vercel
   ```

2. **Deploy via CLI**:

   ```bash
   vercel --prod
   ```

   OR **Deploy via GitHub**:
   - Connect repository to Vercel
   - Auto-deploys on push to `main`

3. **Environment Variables** (set in Vercel dashboard):

   ```
   VITE_API_URL=https://your-backend.railway.app
   ```

4. **Verify**:
   - Check build logs for errors
   - Test deployment URL

---

## Backend → Railway

### Prerequisites

- Railway account
- `gunicorn` installed: `cd backend && pip install gunicorn`

### Steps

1. **Install Railway CLI**:

   ```bash
   npm i -g @railway/cli
   ```

2. **Initialize Project**:

   ```bash
   railway login
   railway init
   ```

3. **Deploy**:

   ```bash
   railway up
   ```

4. **Environment Variables** (set in Railway dashboard):

   ```
   DATABASE_URL=<your-db-url>
   SECRET_KEY=<your-secret>
   ALLOWED_ORIGINS=https://your-frontend.vercel.app
   ```

5. **Verify Healthcheck**:

   ```bash
   curl https://your-backend.railway.app/health
   ```

---

## Integration Testing

1. **Update Frontend ENV**:
   - Set `VITE_API_URL` to Railway backend URL in Vercel

2. **Update Backend CORS**:
   - Add Vercel frontend URL to `ALLOWED_ORIGINS`

3. **Test**:
   - Navigate to Vercel URL
   - Check browser console for API connection
   - Test login/features

---

## Deployment URLs

- **Frontend**: <https://378x492.vercel.app> (to be created)
- **Backend**: <https://378x492.railway.app> (to be created)

---

## CI/CD Next Steps

See `.github/workflows/ci.yml` (Phase 3)
