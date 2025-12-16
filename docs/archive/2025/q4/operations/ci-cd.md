# CI/CD Pipeline Guide

This comprehensive guide covers continuous integration and deployment pipelines for Simple378 Fraud Detection, including automated testing, building, and deployment processes.

## 📋 Table of Contents

- [CI/CD Overview](#-cicd-overview)
- [Pipeline Architecture](#-pipeline-architecture)
- [Automated Testing](#-automated-testing)
- [Build Process](#-build-process)
- [Deployment Strategies](#-deployment-strategies)
- [Infrastructure as Code](#-infrastructure-as-code)
- [Security Integration](#-security-integration)
- [Monitoring & Rollback](#-monitoring--rollback)

## 🔄 CI/CD Overview

### Pipeline Benefits

#### Development Efficiency
- **Automated Testing**: Catch bugs before production
- **Consistent Builds**: Reproducible build process
- **Fast Feedback**: Quick validation of changes
- **Parallel Development**: Multiple feature branches

#### Quality Assurance
- **Code Quality**: Automated linting and formatting
- **Security Scanning**: Vulnerability detection
- **Performance Testing**: Load and performance validation
- **Compliance Checks**: Regulatory requirement validation

#### Deployment Reliability
- **Automated Deployment**: Consistent release process
- **Environment Parity**: Identical staging and production
- **Rollback Capability**: Quick recovery from issues
- **Audit Trail**: Complete deployment history

### Pipeline Stages

#### Continuous Integration (CI)
1. **Code Commit**: Developer pushes code changes
2. **Automated Tests**: Unit, integration, and end-to-end tests
3. **Code Quality**: Linting, formatting, and security scans
4. **Build Artifacts**: Create deployable packages
5. **Artifact Storage**: Store build artifacts for deployment

#### Continuous Deployment (CD)
1. **Environment Promotion**: Move through dev → staging → production
2. **Automated Deployment**: Deploy to target environment
3. **Health Checks**: Verify deployment success
4. **Monitoring Integration**: Enable production monitoring
5. **Notification**: Alert team of successful deployment

## 🏗️ Pipeline Architecture

### GitHub Actions Workflow

#### Main Pipeline Configuration
```yaml
# .github/workflows/ci-cd.yml
name: CI/CD Pipeline

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

env:
  NODE_VERSION: '20'
  PYTHON_VERSION: '3.12'

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'

      - name: Setup Python
        uses: actions/setup-python@v4
        with:
          python-version: ${{ env.PYTHON_VERSION }}
          cache: 'pip'

      - name: Install dependencies
        run: |
          npm ci
          pip install -r backend/requirements.txt

      - name: Run tests
        run: npm run test:ci

      - name: Upload coverage
        uses: codecov/codecov-action@v3

  build:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Build application
        run: npm run build

      - name: Build Electron app
        run: npm run build:electron

      - name: Upload artifacts
        uses: actions/upload-artifact@v3
        with:
          name: 378x492-build
          path: dist/

  security:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Run security scan
        uses: securecodewarrior/github-actions-gosec@master
        with:
          args: './...'

      - name: Dependency check
        uses: dependency-check/Dependency-Check_Action@main
        with:
          project: 'Simple378'
          path: '.'
          format: 'ALL'

  deploy-staging:
    needs: [build, security]
    if: github.ref == 'refs/heads/develop'
    runs-on: ubuntu-latest
    environment: staging
    steps:
      - name: Deploy to staging
        run: |
          echo "Deploying to staging environment"
          # Deployment commands here

  deploy-production:
    needs: [build, security]
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    environment: production
    steps:
      - name: Deploy to production
        run: |
          echo "Deploying to production environment"
          # Deployment commands here
```

### Multi-Environment Pipeline

#### Environment Strategy
```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│ Development │───▶│   Staging   │───▶│ Production │
│             │    │             │    │             │
│ • Feature   │    │ • Integration│    │ • Live      │
│ • Branches  │    │ • Testing    │    │ • Users     │
│ • Fast      │    │ • UAT        │    │ • Monitored │
└─────────────┘    └─────────────┘    └─────────────┘
```

#### Environment Configuration
```yaml
# Environment-specific variables
environments:
  development:
    database_url: "postgresql://dev:dev@localhost/378x492_dev"
    redis_url: "redis://localhost:6379/0"
    log_level: "debug"

  staging:
    database_url: "postgresql://staging:staging@staging-db/378x492_staging"
    redis_url: "redis://staging-redis:6379/0"
    log_level: "info"

  production:
    database_url: "${{ secrets.PROD_DATABASE_URL }}"
    redis_url: "${{ secrets.PROD_REDIS_URL }}"
    log_level: "warn"
```

## 🧪 Automated Testing

### Test Strategy

#### Test Pyramid
```
End-to-End Tests (10%)
    ▲
Integration Tests (20%)
    ▲
Unit Tests (70%)
```

#### Test Categories

##### Unit Tests
```javascript
// Example unit test
const { fraudDetection } = require('../lib/AIFraudDetection');

describe('Fraud Detection', () => {
  test('should detect high-risk transaction', () => {
    const transaction = {
      amount: 5000,
      merchant: 'Unknown Vendor',
      location: 'High-Risk Country'
    };

    const result = fraudDetection.analyze(transaction);
    expect(result.riskScore).toBeGreaterThan(80);
    expect(result.level).toBe('high');
  });

  test('should pass low-risk transaction', () => {
    const transaction = {
      amount: 25,
      merchant: 'Regular Grocery Store',
      location: 'Home Country'
    };

    const result = fraudDetection.analyze(transaction);
    expect(result.riskScore).toBeLessThan(20);
    expect(result.level).toBe('low');
  });
});
```

##### Integration Tests
```javascript
// API integration test
const request = require('supertest');
const app = require('../app');

describe('Case API', () => {
  test('should create new case', async () => {
    const response = await request(app)
      .post('/api/v1/cases')
      .send({
        title: 'Test Case',
        description: 'Integration test case',
        case_type: 'financial_fraud'
      })
      .expect(201);

    expect(response.body).toHaveProperty('id');
    expect(response.body.title).toBe('Test Case');
  });

  test('should retrieve case details', async () => {
    const caseId = 'case-123';
    const response = await request(app)
      .get(`/api/v1/cases/${caseId}`)
      .expect(200);

    expect(response.body.id).toBe(caseId);
  });
});
```

##### End-to-End Tests
```javascript
// E2E test with Playwright
const { test, expect } = require('@playwright/test');

test('complete case workflow', async ({ page }) => {
  // Login
  await page.goto('http://localhost:3000');
  await page.fill('[data-testid="username"]', 'investigator');
  await page.fill('[data-testid="password"]', 'password');
  await page.click('[data-testid="login-button"]');

  // Create case
  await page.click('[data-testid="new-case-button"]');
  await page.fill('[data-testid="case-title"]', 'E2E Test Case');
  await page.fill('[data-testid="case-description"]', 'Automated test case');
  await page.click('[data-testid="create-case-button"]');

  // Verify case creation
  await expect(page.locator('[data-testid="case-title"]')).toContainText('E2E Test Case');

  // Upload evidence
  await page.setInputFiles('[data-testid="file-upload"]', 'test-files/document.pdf');
  await expect(page.locator('[data-testid="upload-success"]')).toBeVisible();

  // Check AI analysis
  await expect(page.locator('[data-testid="risk-score"]')).toBeVisible();
});
```

### Test Automation

#### Test Execution
```yaml
# Test job in GitHub Actions
test:
  runs-on: ubuntu-latest
  services:
    postgres:
      image: postgres:14
      env:
        POSTGRES_PASSWORD: postgres
      options: >-
        --health-cmd pg_isready
        --health-interval 10s
        --health-timeout 5s
        --health-retries 5

    redis:
      image: redis:7
      options: >-
        --health-cmd "redis-cli ping"
        --health-interval 10s
        --health-timeout 5s
        --health-retries 5

  steps:
    - uses: actions/checkout@v4

    - name: Setup test database
      run: |
        createdb 378x492_test
        psql -d 378x492_test -f schema.sql

    - name: Run unit tests
      run: npm run test:unit

    - name: Run integration tests
      run: npm run test:integration

    - name: Run E2E tests
      run: npm run test:e2e
```

#### Test Reporting
```javascript
// Test results reporting
const { junit, html } = require('playwright/lib/utils');

test.afterAll(async () => {
  // Generate JUnit XML for CI
  await junit.generate();

  // Generate HTML report
  await html.generate();

  // Upload to test management tool
  if (process.env.CI) {
    // Upload results to test management platform
    await uploadTestResults();
  }
});
```

## 🏗️ Build Process

### Multi-Platform Build

#### Electron Build Configuration
```javascript
// electron-builder.json
{
  "appId": "com.378x492.fraud-detection",
  "productName": "Simple378 Fraud Detection",
  "directories": {
    "output": "dist/electron"
  },
  "files": [
    "dist/**/*",
    "node_modules/**/*",
    "backend/**/*"
  ],
  "mac": {
    "target": [
      {
        "target": "dmg",
        "arch": ["x64", "arm64"]
      }
    ],
    "hardenedRuntime": true,
    "gatekeeperAssess": false
  },
  "win": {
    "target": "nsis",
    "verifyUpdateCodeSignature": false
  },
  "linux": {
    "target": "AppImage",
    "category": "Office"
  },
  "publish": {
    "provider": "github",
    "owner": "your-org",
    "repo": "378x492"
  }
}
```

#### Build Scripts
```json
// package.json build scripts
{
  "scripts": {
    "build": "webpack --mode production",
    "build:electron": "electron-builder --publish=never",
    "build:electron:win": "electron-builder --win --publish=never",
    "build:electron:mac": "electron-builder --mac --publish=never",
    "build:electron:linux": "electron-builder --linux --publish=never",
    "build:docker": "docker build -t 378x492 ."
  }
}
```

### Artifact Management

#### Build Artifacts
```yaml
# Upload build artifacts
- name: Upload build artifacts
  uses: actions/upload-artifact@v3
  with:
    name: 378x492-${{ github.sha }}
    path: |
      dist/
      build/
    retention-days: 30

# Upload to artifact repository
- name: Upload to Artifactory
  run: |
    curl -u${{ secrets.ARTIFACTORY_USER }}:${{ secrets.ARTIFACTORY_TOKEN }} \
      -T dist/378x492-1.0.0.dmg \
      "https://artifactory.company.com/378x492/1.0.0/378x492-1.0.0.dmg"
```

#### Version Management
```javascript
// Version management
const { execSync } = require('child_process');

function getVersion() {
  try {
    // Get version from git tags
    const tag = execSync('git describe --tags --abbrev=0').toString().trim();
    return tag;
  } catch (error) {
    // Fallback to package.json
    const pkg = require('./package.json');
    return pkg.version;
  }
}

function getBuildNumber() {
  // GitHub Actions build number
  return process.env.GITHUB_RUN_NUMBER || '0';
}

function getCommitHash() {
  return execSync('git rev-parse HEAD').toString().trim().substring(0, 7);
}

// Generate version string
const version = `${getVersion()}.${getBuildNumber()}-${getCommitHash()}`;
console.log(`Building version: ${version}`);
```

## 🚀 Deployment Strategies

### Blue-Green Deployment

#### Blue-Green Architecture
```
┌─────────────┐    ┌─────────────┐
│   Load      │────▶  Blue       │
│ Balancer    │    │ Environment │
└─────────────┘    └─────────────┘
       │                   │
       └───────────────────┘
               │
               ▼
       ┌─────────────┐
       │   Green     │
       │ Environment │
       └─────────────┘
```

#### Blue-Green Deployment Script
```bash
#!/bin/bash
# Blue-green deployment script

BLUE_PORT=8000
GREEN_PORT=8001
HEALTH_CHECK_URL="http://localhost"

# Deploy to green environment
echo "Deploying to green environment (port $GREEN_PORT)"
docker run -d -p $GREEN_PORT:8000 --name 378x492-green 378x492:new-version

# Wait for green environment to be healthy
echo "Waiting for green environment to be healthy..."
for i in {1..30}; do
  if curl -f $HEALTH_CHECK_URL:$GREEN_PORT/health > /dev/null; then
    echo "Green environment is healthy"
    break
  fi
  sleep 10
done

# Switch load balancer to green
echo "Switching load balancer to green environment"
# Update nginx configuration
sudo sed -i "s/$BLUE_PORT/$GREEN_PORT/" /etc/nginx/sites-available/378x492
sudo systemctl reload nginx

# Verify deployment
echo "Verifying deployment..."
if curl -f $HEALTH_CHECK_URL/health > /dev/null; then
  echo "Deployment successful!"

  # Stop blue environment
  docker stop 378x492-blue
  docker rm 378x492-blue

  # Rename green to blue for next deployment
  docker rename 378x492-green 378x492-blue
else
  echo "Deployment failed! Rolling back..."
  # Rollback logic here
fi
```

### Rolling Deployment

#### Rolling Update Strategy
```yaml
# Kubernetes rolling deployment
apiVersion: apps/v1
kind: Deployment
metadata:
  name: 378x492
spec:
  replicas: 3
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxUnavailable: 1
      maxSurge: 1
  template:
    spec:
      containers:
      - name: 378x492
        image: 378x492:{{ .Values.image.tag }}
        ports:
        - containerPort: 8000
        readinessProbe:
          httpGet:
            path: /health
            port: 8000
          initialDelaySeconds: 30
          periodSeconds: 10
        livenessProbe:
          httpGet:
            path: /health
            port: 8000
          initialDelaySeconds: 60
          periodSeconds: 30
```

### Feature Flags

#### Feature Flag Implementation
```javascript
// Feature flag system
const features = {
  ai_fraud_detection: process.env.FF_AI_FRAUD_DETECTION === 'true',
  advanced_analytics: process.env.FF_ADVANCED_ANALYTICS === 'true',
  collaboration_tools: process.env.FF_COLLABORATION_TOOLS === 'true'
};

// Usage in code
if (features.ai_fraud_detection) {
  // Enable AI fraud detection
  const result = await aiFraudDetection.analyze(transaction);
}

// Feature flag API
app.get('/api/features', (req, res) => {
  res.json(features);
});
```

## 🏗️ Infrastructure as Code

### Docker Configuration

#### Dockerfile
```dockerfile
# Multi-stage Docker build
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm ci --only=production

# Copy source code
COPY . .

# Build application
RUN npm run build

# Production stage
FROM node:20-alpine AS production

# Install Python for backend
RUN apk add --no-cache python3 py3-pip

# Create app user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S 378x492 -u 1001

WORKDIR /app

# Copy built application
COPY --from=builder --chown=378x492:nodejs /app/dist ./dist
COPY --from=builder --chown=378x492:nodejs /app/backend ./backend
COPY --from=builder --chown=378x492:nodejs /app/package*.json ./

# Install production dependencies
RUN npm ci --only=production && npm cache clean --force

# Install Python dependencies
RUN pip install -r backend/requirements.txt

# Create necessary directories
RUN mkdir -p /app/data /app/logs /app/uploads
RUN chown -R 378x492:nodejs /app

USER 378x492

EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:8000/health || exit 1

CMD ["npm", "start"]
```

#### Docker Compose
```yaml
version: '3.8'
services:
  378x492:
    build: .
    ports:
      - "8000:8000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://378x492:password@postgres/378x492
      - REDIS_URL=redis://redis:6379
    depends_on:
      - postgres
      - redis
    volumes:
      - ./data:/app/data
      - ./logs:/app/logs
    restart: unless-stopped

  postgres:
    image: postgres:14
    environment:
      - POSTGRES_DB=378x492
      - POSTGRES_USER=378x492
      - POSTGRES_PASSWORD=password
    volumes:
      - postgres_data:/var/lib/postgresql/data
    restart: unless-stopped

  redis:
    image: redis:7-alpine
    volumes:
      - redis_data:/data
    restart: unless-stopped

volumes:
  postgres_data:
  redis_data:
```

### Kubernetes Manifests

#### Deployment Manifest
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: 378x492
  labels:
    app: 378x492
spec:
  replicas: 3
  selector:
    matchLabels:
      app: 378x492
  template:
    metadata:
      labels:
        app: 378x492
    spec:
      containers:
      - name: 378x492
        image: 378x492:latest
        ports:
        - containerPort: 8000
        env:
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: 378x492-secrets
              key: database-url
        - name: REDIS_URL
          valueFrom:
            secretKeyRef:
              name: 378x492-secrets
              key: redis-url
        resources:
          requests:
            memory: "512Mi"
            cpu: "250m"
          limits:
            memory: "1Gi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /health
            port: 8000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /health
            port: 8000
          initialDelaySeconds: 5
          periodSeconds: 5
```

#### Service Manifest
```yaml
apiVersion: v1
kind: Service
metadata:
  name: 378x492
spec:
  selector:
    app: 378x492
  ports:
    - port: 80
      targetPort: 8000
  type: ClusterIP

---
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: 378x492-ingress
  annotations:
    nginx.ingress.kubernetes.io/ssl-redirect: "true"
    cert-manager.io/cluster-issuer: "letsencrypt-prod"
spec:
  tls:
  - hosts:
    - 378x492.company.com
    secretName: 378x492-tls
  rules:
  - host: 378x492.company.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: 378x492
            port:
              number: 80
```

## 🔒 Security Integration

### Security Scanning

#### SAST (Static Application Security Testing)
```yaml
# CodeQL security scanning
- name: Initialize CodeQL
  uses: github/codeql-action/init@v2
  with:
    languages: javascript, python

- name: Autobuild
  uses: github/codeql-action/autobuild@v2

- name: Perform CodeQL Analysis
  uses: github/codeql-action/analyze@v2
```

#### Container Security
```yaml
# Trivy container scanning
- name: Run Trivy vulnerability scanner
  uses: aquasecurity/trivy-action@master
  with:
    scan-type: 'image'
    scan-ref: '378x492:latest'
    format: 'sarif'
    output: 'trivy-results.sarif'

- name: Upload Trivy scan results
  uses: github/codeql-action/upload-sarif@v2
  with:
    sarif_file: 'trivy-results.sarif'
```

#### Dependency Scanning
```yaml
# Dependency vulnerability scanning
- name: Run npm audit
  run: npm audit --audit-level high

- name: Run safety (Python dependencies)
  run: safety check --full-report

- name: Dependency check
  uses: dependency-check/Dependency-Check_Action@main
  with:
    project: 'Simple378'
    path: '.'
    format: 'ALL'
```

### Secrets Management

#### GitHub Secrets
```yaml
# Store secrets in GitHub
env:
  DATABASE_URL: ${{ secrets.DATABASE_URL }}
  REDIS_URL: ${{ secrets.REDIS_URL }}
  ENCRYPTION_KEY: ${{ secrets.ENCRYPTION_KEY }}
  API_KEYS: ${{ secrets.API_KEYS }}
```

#### Kubernetes Secrets
```yaml
apiVersion: v1
kind: Secret
metadata:
  name: 378x492-secrets
type: Opaque
data:
  database-url: <base64-encoded-database-url>
  redis-url: <base64-encoded-redis-url>
  encryption-key: <base64-encoded-encryption-key>
```

## 📊 Monitoring & Rollback

### Deployment Monitoring

#### Health Checks
```yaml
# Post-deployment health verification
- name: Health check
  run: |
    for i in {1..30}; do
      if curl -f https://378x492.company.com/health > /dev/null; then
        echo "Application is healthy"
        exit 0
      fi
      echo "Waiting for application to be healthy..."
      sleep 10
    done
    echo "Application failed to become healthy"
    exit 1
```

#### Performance Monitoring
```yaml
# Performance baseline check
- name: Performance test
  run: |
    # Run performance tests
    npm run test:performance

    # Check response times
    if [ $(curl -w "%{time_total}" -o /dev/null -s https://378x492.company.com/api/health) > 2.0 ]; then
      echo "Response time too slow"
      exit 1
    fi
```

### Rollback Procedures

#### Automated Rollback
```yaml
# Rollback job
rollback:
  runs-on: ubuntu-latest
  if: failure()
  steps:
    - name: Rollback deployment
      run: |
        # Get previous successful deployment
        PREVIOUS_VERSION=$(curl -s https://api.github.com/repos/your-org/378x492/releases/latest | jq -r .tag_name)

        # Deploy previous version
        kubectl set image deployment/378x492 378x492=378x492:$PREVIOUS_VERSION

        # Wait for rollout
        kubectl rollout status deployment/378x492

        # Verify rollback
        curl -f https://378x492.company.com/health
```

#### Manual Rollback
```bash
#!/bin/bash
# Manual rollback script

echo "Starting manual rollback..."

# Get current version
CURRENT_VERSION=$(kubectl get deployment 378x492 -o jsonpath='{.spec.template.spec.containers[0].image}' | cut -d: -f2)

echo "Current version: $CURRENT_VERSION"

# Find previous version
PREVIOUS_VERSION=$(curl -s https://api.github.com/repos/your-org/378x492/releases | jq -r '.[1].tag_name')

echo "Rolling back to: $PREVIOUS_VERSION"

# Perform rollback
kubectl set image deployment/378x492 378x492=378x492:$PREVIOUS_VERSION

# Wait for completion
kubectl rollout status deployment/378x492

# Verify
if curl -f https://378x492.company.com/health > /dev/null; then
  echo "Rollback successful"
else
  echo "Rollback failed"
  exit 1
fi
```

### Deployment Notifications

#### Success Notifications
```yaml
# Slack notification on success
- name: Notify success
  if: success()
  uses: 8398a7/action-slack@v3
  with:
    status: success
    text: 'Simple378 deployment to ${{ github.event.inputs.environment }} successful'
  env:
    SLACK_WEBHOOK_URL: ${{ secrets.SLACK_WEBHOOK_URL }}
```

#### Failure Notifications
```yaml
# Slack notification on failure
- name: Notify failure
  if: failure()
  uses: 8398a7/action-slack@v3
  with:
    status: failure
    text: 'Simple378 deployment to ${{ github.event.inputs.environment }} failed'
  env:
    SLACK_WEBHOOK_URL: ${{ secrets.SLACK_WEBHOOK_URL }}
```

---

**CI/CD pipeline configured!** Continue with [Performance Baseline](../performance_baseline.md) for optimization guidance.