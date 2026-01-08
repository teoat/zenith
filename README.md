---
title: Zenith Fraud Detection Platform
emoji: 🛡️
colorFrom: purple
colorTo: indigo
sdk: docker
pinned: false
app_port: 8000
---

# Zenith Fraud Detection Platform

Zenith is a high-performance fraud detection and financial intelligence platform.

## Architecture

- **Frontend:** Cloudflare Pages (React/Vite)
- **Edge Gateway:** Cloudflare Workers
- **Backend:** FastAPI (Docker) -> **Running Here on Hugging Face Spaces**
- **Database:** Neon (PostgreSQL)
- **Cache:** Upstash (Redis)

## Setup for Hugging Face Spaces

This repository is configured to deploy the Backend to Hugging Face Spaces using the root `Dockerfile`.

### Required Secrets

Add these to your Space's **Settings > Repository Secrets**:

- `DATABASE_URL`
- `REDIS_URL`
- `UPSTASH_REDIS_REST_URL`
- `UPSTASH_REDIS_REST_TOKEN`
- `SECRET_KEY`
- `JWT_SECRET_KEY`
- `ENCRYPTION_KEY`
- `CORS_ALLOWED_ORIGINS` (Set to `*` or your Frontend URL)
