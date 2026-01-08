# Kubernetes Deployment Configuration
# Phase 5 Extension: Future Enhancement - Multi-region Deployment

## Overview
This guide provides Kubernetes manifests for deploying the application to a Kubernetes cluster with multi-region support, auto-scaling, and high availability.

---

## 📦 Deployment Architecture

```
┌─────────────────────────────────────────────────────┐
│                  Load Balancer                      │
│              (Ingress Controller)                   │
└─────────────────────────────────────────────────────┘
                        │
        ┌───────────────┼───────────────┐
        │               │               │
   ┌────────┐      ┌────────┐     ┌────────┐
   │Frontend│      │Backend │     │Backend │
   │  Pod   │      │ Pod 1  │     │ Pod 2  │
   └────────┘      └────────┘     └────────┘
        │               │               │
        └───────────────┴───────────────┘
                        │
        ┌───────────────┼───────────────┐
        │               │               │
   ┌────────┐      ┌────────┐     ┌────────┐
   │Postgres│      │ Redis  │     │ Minio  │ 
   └────────┘      └────────┘     └────────┘
   (StatefulSet)   (StatefulSet)  (StatefulSet)
```

---

## 🚀 Deployment Manifests

### 1. Namespace Configuration

```yaml
# namespace.yaml
apiVersion: v1
kind: Namespace
metadata:
  name: fraud-detection
  labels:
    name: fraud-detection
    environment: production
```

### 2. ConfigMap for Application Settings

```yaml
# configmap.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: app-config
  namespace: fraud-detection
data:
  # Application settings
  NODE_ENV: "production"
  LOG_LEVEL: "info"
  API_VERSION: "v1"
  
  # Frontend settings
  REACT_APP_API_URL: "https://api.fraud-detection.com"
  
  # Feature flags
  ENABLE_MONITORING: "true"
  ENABLE_FRAUD_DETECTION: "true"
  ENABLE_EVIDENCE_PROCESSING: "true"
```

### 3. Secrets Configuration

```yaml
# secrets.yaml
apiVersion: v1
kind: Secret
metadata:
  name: app-secrets
  namespace: fraud-detection
type: Opaque
stringData:
  # Database credentials
  DB_PASSWORD: <base64-encoded>
  DB_USER: postgres
  
  # Redis password
  REDIS_PASSWORD: <base64-encoded>
  
  # JWT secret
  JWT_SECRET: <base64-encoded>
  
  # API keys
  OPENAI_API_KEY: <base64-encoded>
```

### 4. Frontend Deployment

```yaml
# frontend-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: frontend
  namespace: fraud-detection
  labels:
    app: frontend
    tier: presentation
spec:
  replicas: 3
  selector:
    matchLabels:
      app: frontend
  template:
    metadata:
      labels:
        app: frontend
    spec:
      containers:
      - name: frontend
        image: your-registry/fraud-detection-frontend:latest
        ports:
        - containerPort: 3000
          name: http
        envFrom:
        - configMapRef:
            name: app-config
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 5
          periodSeconds: 5
---
apiVersion: v1
kind: Service
metadata:
  name: frontend-service
  namespace: fraud-detection
spec:
  type: ClusterIP
  selector:
    app: frontend
  ports:
  - port: 80
    targetPort: 3000
    protocol: TCP
```

### 5. Backend Deployment

```yaml
# backend-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: backend
  namespace: fraud-detection
  labels:
    app: backend
    tier: application
spec:
  replicas: 3
  selector:
    matchLabels:
      app: backend
  template:
    metadata:
      labels:
        app: backend
    spec:
      containers:
      - name: backend
        image: your-registry/fraud-detection-backend:latest
        ports:
        - containerPort: 8000
          name: http
        envFrom:
        - configMapRef:
            name: app-config
        - secretRef:
            name: app-secrets
        env:
        - name: DATABASE_URL
          value: "postgresql://$(DB_USER):$(DB_PASSWORD)@postgres-service:5432/fraud_detection"
        - name: REDIS_URL
          value: "redis://:$(REDIS_PASSWORD)@redis-service:6379/0"
        resources:
          requests:
            memory: "512Mi"
            cpu: "500m"
          limits:
            memory: "1Gi"
            cpu: "1000m"
        livenessProbe:
          httpGet:
            path: /health
            port: 8000
          initialDelaySeconds: 60
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /health
            port: 8000
          initialDelaySeconds: 10
          periodSeconds: 5
---
apiVersion: v1
kind: Service
metadata:
  name: backend-service
  namespace: fraud-detection
spec:
  type: ClusterIP
  selector:
    app: backend
  ports:
  - port: 80
    targetPort: 8000
    protocol: TCP
```

### 6. Horizontal Pod Autoscaler

```yaml
# hpa.yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: backend-hpa
  namespace: fraud-detection
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: backend
  minReplicas: 3
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: 80
---
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: frontend-hpa
  namespace: fraud-detection
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: frontend
  minReplicas: 2
  maxReplicas: 8
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
```

### 7. Ingress Configuration

```yaml
# ingress.yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: app-ingress
  namespace: fraud-detection
  annotations:
    cert-manager.io/cluster-issuer: "letsencrypt-prod"
    nginx.ingress.kubernetes.io/ssl-redirect: "true"
    nginx.ingress.kubernetes.io/rate-limit: "100"
spec:
  ingressClassName: nginx
  tls:
  - hosts:
    - fraud-detection.com
    - api.fraud-detection.com
    secretName: fraud-detection-tls
  rules:
  - host: fraud-detection.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: frontend-service
            port:
              number: 80
  - host: api.fraud-detection.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: backend-service
            port:
              number: 80
```

### 8. PostgreSQL StatefulSet

```yaml
# postgres-statefulset.yaml
apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: postgres
  namespace: fraud-detection
spec:
  serviceName: postgres-service
  replicas: 1
  selector:
    matchLabels:
      app: postgres
  template:
    metadata:
      labels:
        app: postgres
    spec:
      containers:
      - name: postgres
        image: postgres:15-alpine
        ports:
        - containerPort: 5432
          name: postgres
        env:
        - name: POSTGRES_DB
          value: fraud_detection
        - name: POSTGRES_USER
          valueFrom:
            secretKeyRef:
              name: app-secrets
              key: DB_USER
        - name: POSTGRES_PASSWORD
          valueFrom:
            secretKeyRef:
              name: app-secrets
              key: DB_PASSWORD
        volumeMounts:
        - name: postgres-storage
          mountPath: /var/lib/postgresql/data
        resources:
          requests:
            memory: "1Gi"
            cpu: "500m"
          limits:
            memory: "2Gi"
            cpu: "1000m"
  volumeClaimTemplates:
  - metadata:
      name: postgres-storage
    spec:
      accessModes: [ "ReadWriteOnce" ]
      resources:
        requests:
          storage: 20Gi
---
apiVersion: v1
kind: Service
metadata:
  name: postgres-service
  namespace: fraud-detection
spec:
  clusterIP: None
  selector:
    app: postgres
  ports:
  - port: 5432
    targetPort: 5432
```

---

## 📋 Deployment Commands

```bash
# Create namespace
kubectl apply -f namespace.yaml

# Apply configurations
kubectl apply -f configmap.yaml
kubectl apply -f secrets.yaml

# Deploy databases
kubectl apply -f postgres-statefulset.yaml
kubectl apply -f redis-statefulset.yaml

# Deploy applications
kubectl apply -f backend-deployment.yaml
kubectl apply -f frontend-deployment.yaml

# Configure autoscaling
kubectl apply -f hpa.yaml

# Setup ingress
kubectl apply -f ingress.yaml

# Verify deployments
kubectl get all -n fraud-detection
kubectl get pods -n fraud-detection -w
```

---

## 🔧 Monitoring & Logging

### Prometheus ServiceMonitor

```yaml
# servicemonitor.yaml
apiVersion: monitoring.coreos.com/v1
kind: ServiceMonitor
metadata:
  name: backend-metrics
  namespace: fraud-detection
spec:
  selector:
    matchLabels:
      app: backend
  endpoints:
  - port: http
    path: /monitoring/metrics
    interval: 30s
```

### Grafana Dashboard

```yaml
# grafana-dashboard-configmap.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: grafana-dashboards
  namespace: monitoring
data:
  fraud-detection-dashboard.json: |
    {
      "dashboard": {
        "title": "Fraud Detection Metrics",
        "panels": [
          {
            "title": "Request Rate",
            "targets": [
              {
                "expr": "rate(http_requests_total[5m])"
              }
            ]
          }
        ]
      }
    }
```

---

## 🌍 Multi-Region Setup

### Region-Specific Values

```yaml
# values-us-east.yaml
replicaCount: 5
region: us-east-1
database:
  host: postgres-us-east.rds.amazonaws.com
redis:
  host: redis-us-east.cache.amazonaws.com

# values-eu-west.yaml
replicaCount: 3
region: eu-west-1
database:
  host: postgres-eu-west.rds.amazonaws.com
redis:
  host: redis-eu-west.cache.amazonaws.com
```

---

## 📚 Best Practices

1. **Resource Limits**: Always set requests and limits
2. **Health Checks**: Configure liveness and readiness probes
3. **Security**: Use secrets for sensitive data
4. **Scaling**: Implement HPA for automatic scaling
5. **Monitoring**: Deploy Prometheus + Grafana
6. **Logging**: Use EFK stack (Elasticsearch, Fluentd, Kibana)
7. **Backups**: Schedule regular database backups
8. **Updates**: Use rolling updates for zero downtime

---

**Status:** Ready for Kubernetes deployment  
**Last Updated:** 2025-12-16
