# Multi-stage Dockerfile for Zenith Fraud Detection Platform
# Production-ready container with security hardening

# ================================
# Stage 1: Backend Dependencies
# ================================
FROM python:3.12-slim as backend-deps

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    g++ \
    libssl-dev \
    libffi-dev \
    sqlite3 \
    libsqlite3-dev \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy Python requirements
COPY backend/requirements*.txt ./

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# ================================
# Stage 2: Frontend Build
# ================================
FROM node:18-alpine as frontend-build

# Set working directory
WORKDIR /app

# Copy package files
COPY frontend/package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY frontend/ .

# Build application
RUN npm run build

# ================================
# Stage 3: Production Runtime
# ================================
FROM python:3.12-slim

# Install runtime dependencies
RUN apt-get update && apt-get install -y \
    sqlite3 \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Create application user
RUN useradd --create-home --shell /bin/bash app

# Set working directory
WORKDIR /app

# Copy Python dependencies from backend-deps stage
COPY --from=backend-deps /usr/local/lib/python3.12/site-packages /usr/local/lib/python3.12/site-packages
COPY --from=backend-deps /usr/local/bin /usr/local/bin

# Copy backend application
COPY backend/ .

# Copy built frontend
COPY --from=frontend-build /app/dist ./frontend/dist

# Create data directories
RUN mkdir -p /app/data && \
    mkdir -p /app/logs && \
    mkdir -p /app/uploads && \
    chown -R app:app /app

# Switch to non-root user
USER app

# Environment variables
ENV PYTHONPATH=/app
ENV PYTHONUNBUFFERED=1
ENV DATABASE_URL=sqlite:///./fraud_detection.db

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1

# Expose port
EXPOSE 8000

# Start application
CMD ["python", "main.py"]