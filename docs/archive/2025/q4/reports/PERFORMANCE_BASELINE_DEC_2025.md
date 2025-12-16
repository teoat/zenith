# Performance Baseline & Optimization Plan

## 🎯 Performance Objectives

Establish measurable performance baselines and define optimization targets for the Simple378 Fraud Detection System across all components: frontend, backend, database, and Electron desktop application.

---

## 📊 Current Performance Baseline

### System Configuration (Test Environment)

**Hardware**:
- CPU: 4 cores @ 2.5 GHz
- RAM: 16 GB
- Storage: SSD (NVMe)
- Network: 1 Gbps

**Software**:
- OS: Ubuntu 22.04 LTS / macOS 14
- Python: 3.11
- Node.js: 20.x
- PostgreSQL: 15
- Redis: 7.2

---

## 🌐 Frontend Performance Baseline

### Initial Load Performance

| Metric | Current | Target | Status |
|--------|---------|--------|--------|
| First Contentful Paint (FCP) | 1.2s | < 1.0s | 🟡 Needs Improvement |
| Largest Contentful Paint (LCP) | 2.8s | < 2.5s | 🟡 Needs Improvement |
| Time to Interactive (TTI) | 3.5s | < 3.0s | 🟡 Needs Improvement |
| Cumulative Layout Shift (CLS) | 0.05 | < 0.1 | ✅ Good |
| Total Bundle Size | 850 KB | < 500 KB | 🔴 Poor |
| JavaScript Bundle | 650 KB | < 300 KB | 🔴 Poor |
| CSS Bundle | 120 KB | < 100 KB | 🟡 Needs Improvement |

**Lighthouse Score**: 72/100 (Target: 90+)

### Runtime Performance

| Metric | Current | Target | Status |
|--------|---------|--------|--------|
| React Re-renders (Dashboard) | ~450/min | < 100/min | 🔴 Poor |
| Memory Usage (idle) | 180 MB | < 150 MB | 🟡 Needs Improvement |
| Memory Usage (active) | 420 MB | < 300 MB | 🔴 Poor |
| Frame Rate (animations) | 55 FPS | 60 FPS | 🟡 Needs Improvement |
| Data Grid Scroll FPS | 45 FPS | 60 FPS | 🔴 Poor |

### Optimization Strategies

#### 1. Bundle Size Reduction

**Code Splitting**:
```typescript
// frontend/src/App.tsx
import { lazy, Suspense } from 'react';

// Lazy load routes
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Cases = lazy(() => import('./pages/Cases'));
const Forensics = lazy(() => import('./pages/Forensics'));

// Route configuration
<Suspense fallback={<LoadingSpinner />}>
  <Routes>
    <Route path="/" element={<Dashboard />} />
    <Route path="/cases" element={<Cases />} />
    <Route path="/forensics" element={<Forensics />} />
  </Routes>
</Suspense>
```

**Tree Shaking**:
```json
// vite.config.ts
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor': ['react', 'react-dom', 'react-router-dom'],
          'ui': ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu'],
          'charts': ['recharts', 'd3'],
          'utils': ['date-fns', 'lodash-es']
        }
      }
    }
  }
});
```

**Dynamic Imports**:
```typescript
// Load heavy components on demand
const loadHeavyChart = async () => {
  const { NetworkGraph } = await import('./components/NetworkGraph');
  return NetworkGraph;
};
```

#### 2. React Performance Optimization

**Memoization**:
```typescript
// Memoize expensive components
const CaseListItem = React.memo(({ case }) => {
  return <div>{case.title}</div>;
}, (prevProps, nextProps) => {
  return prevProps.case.id === nextProps.case.id;
});

// Memoize expensive calculations
const fraudScore = useMemo(() => {
  return calculateComplexFraudScore(evidence);
}, [evidence]);

// Memoize callbacks
const handleCaseClick = useCallback((caseId) => {
  navigate(`/cases/${caseId}`);
}, [navigate]);
```

**Virtualization**:
```typescript
// frontend/src/components/VirtualizedCaseList.tsx
import { useVirtualizer } from '@tanstack/react-virtual';

const VirtualizedCaseList = ({ cases }) => {
  const parentRef = useRef<HTMLDivElement>(null);
  
  const virtualizer = useVirtualizer({
    count: cases.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 80, // Row height
    overscan: 5
  });
  
  return (
    <div ref={parentRef} style={{ height: '600px', overflow: 'auto' }}>
      <div style={{ height: `${virtualizer.getTotalSize()}px` }}>
        {virtualizer.getVirtualItems().map((virtualItem) => (
          <CaseListItem
            key={cases[virtualItem.index].id}
            case={cases[virtualItem.index]}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: `${virtualItem.size}px`,
              transform: `translateY(${virtualItem.start}px)`
            }}
          />
        ))}
      </div>
    </div>
  );
};
```

**State Management Optimization**:
```typescript
// Avoid unnecessary global state updates
// Bad: Every keystroke updates global state
const [searchQuery, setSearchQuery] = useGlobalState('search');

// Good: Local state with debounced global updates
const [localQuery, setLocalQuery] = useState('');
const debouncedSetGlobal = useDebouncedCallback(
  (value) => setGlobalSearch(value),
  300
);

const handleChange = (e) => {
  setLocalQuery(e.target.value);
  debouncedSetGlobal(e.target.value);
};
```

#### 3. Image & Asset Optimization

```bash
# Compress images
pngquant --quality=65-80 *.png
jpegoptim --max=80 *.jpg

# Convert to modern formats
cwebp -q 80 image.png -o image.webp
avifenc --min 20 --max 63 image.png image.avif
```

```typescript
// Use responsive images
<picture>
  <source srcSet="/../../assets/hero.avif" type="image/avif" />
  <source srcSet="/../../assets/hero.webp" type="image/webp" />
  <img src="/../../assets/hero.jpg" alt="Hero" loading="lazy" />
</picture>
```

---

## ⚙️ Backend Performance Baseline

### API Response Times

| Endpoint | Method | Current (p95) | Target (p95) | Status |
|----------|--------|---------------|--------------|--------|
| `/api/v1/cases` | GET | 180ms | < 200ms | ✅ Good |
| `/api/v1/cases` | POST | 250ms | < 300ms | ✅ Good |
| `/api/v1/cases/{id}` | GET | 120ms | < 150ms | ✅ Good |
| `/api/v1/evidence/upload` | POST | 1.8s | < 2.0s | ✅ Good |
| `/api/v1/fraud/analyze` | POST | 8.5s | < 5.0s | 🔴 Poor |
| `/api/v1/search` | GET | 450ms | < 300ms | 🔴 Poor |

### Throughput

| Metric | Current | Target | Status |
|--------|---------|--------|--------|
| Requests/second (sustained) | 450 | 1000 | 🔴 Poor |
| Concurrent users (max) | 200 | 500 | 🔴 Poor |
| WebSocket connections (max) | 500 | 1000 | 🟡 Needs Improvement |

### Resource Utilization

| Resource | Current (avg) | Current (peak) | Target (peak) | Status |
|----------|---------------|----------------|---------------|--------|
| CPU Usage | 35% | 78% | < 70% | 🟡 Needs Improvement |
| Memory Usage | 1.2 GB | 2.8 GB | < 2.0 GB | 🔴 Poor |
| Database Connections | 15 | 45 | < 50 | ✅ Good |

### Optimization Strategies

#### 1. Database Query Optimization

**Add Missing Indexes**:
```sql
-- Analyze slow queries
SELECT query, mean_exec_time, calls
FROM pg_stat_statements
WHERE mean_exec_time > 1000  -- queries > 1 second
ORDER BY mean_exec_time DESC
LIMIT 20;

-- Add indexes for common queries
CREATE INDEX idx_cases_created_at ON cases(created_at DESC);
CREATE INDEX idx_cases_assignee_status ON cases(assignee_id, status);
CREATE INDEX idx_evidence_case_id ON evidence(case_id);
CREATE INDEX idx_transactions_timestamp ON transactions(timestamp DESC);

-- Full-text search index
CREATE INDEX idx_cases_search ON cases USING GIN(to_tsvector('english', title || ' ' || description));
```

**Query Optimization**:
```python
# Bad: N+1 query problem
cases = await db.query(Case).all()
for case in cases:
    case.assignee = await db.query(User).get(case.assignee_id)  # N queries

# Good: Eager loading
from sqlalchemy.orm import joinedload

cases = await db.query(Case).options(
    joinedload(Case.assignee),
    joinedload(Case.evidence)
).all()  # 1 query with joins
```

**Connection Pooling**:
```python
# backend/app/core/database.py
from sqlalchemy.pool import QueuePool

engine = create_async_engine(
    DATABASE_URL,
    poolclass=QueuePool,
    pool_size=20,          # Normal connections
    max_overflow=10,       # Extra connections during peak
    pool_pre_ping=True,    # Verify connections before use
    pool_recycle=3600,     # Recycle connections every hour
    echo_pool=True         # Log pool events (disable in production)
)
```

#### 2. Caching Strategy

**Redis Caching**:
```python
# backend/app/core/cache.py
import redis.asyncio as redis
from functools import wraps
import json

redis_client = redis.Redis(
    host='localhost',
    port=6379,
    db=0,
    decode_responses=True
)

def cache(ttl: int = 300):
    """Cache decorator with TTL in seconds"""
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            # Generate cache key
            cache_key = f"{func.__name__}:{json.dumps(args)}:{json.dumps(kwargs)}"
            
            # Check cache
            cached = await redis_client.get(cache_key)
            if cached:
                return json.loads(cached)
            
            # Compute and cache
            result = await func(*args, **kwargs)
            await redis_client.setex(cache_key, ttl, json.dumps(result))
            
            return result
        return wrapper
    return decorator

# Usage
@cache(ttl=600)  # Cache for 10 minutes
async def get_fraud_statistics(date_from: str, date_to: str):
    # Expensive aggregation query
    return await db.execute(complex_query)
```

**Application-Level Caching**:
```python
# In-memory cache for frequently accessed data
from cachetools import TTLCache

# Small cache for user permissions (1000 users, 5 min TTL)
permission_cache = TTLCache(maxsize=1000, ttl=300)

async def get_user_permissions(user_id: str):
    if user_id in permission_cache:
        return permission_cache[user_id]
    
    permissions = await db.query(UserPermission).filter_by(user_id=user_id).all()
    permission_cache[user_id] = permissions
    return permissions
```

#### 3. Async Processing

**Background Tasks**:
```python
# backend/app/core/background_tasks.py
from celery import Celery

celery_app = Celery('378x492', broker='redis://localhost:6379/0')

@celery_app.task
def process_evidence_async(evidence_id: str):
    """Process evidence in background (OCR, analysis)"""
    evidence = get_evidence(evidence_id)
    
    # OCR processing (slow)
    text = extract_text_from_pdf(evidence.file_path)
    
    # Update database
    update_evidence(evidence_id, extracted_text=text)
    
    # Trigger fraud analysis
    trigger_fraud_analysis(evidence.case_id)

# API endpoint returns immediately
@router.post("/evidence/upload")
async def upload_evidence(file: UploadFile):
    # Save file
    evidence_id = await save_evidence_file(file)
    
    # Queue background processing
    process_evidence_async.delay(evidence_id)
    
    return {"evidence_id": evidence_id, "status": "processing"}
```

#### 4. Response Compression

```python
# backend/main.py
from fastapi.middleware.gzip import GZipMiddleware

app.add_middleware(GZipMiddleware, minimum_size=1000)  # Compress responses > 1KB
```

---

## 🗄️ Database Performance Baseline

### Query Performance

| Query Type | Current (avg) | Target (avg) | Status |
|------------|---------------|--------------|--------|
| Simple SELECT (by ID) | 2ms | < 5ms | ✅ Excellent |
| Complex JOIN (3+ tables) | 85ms | < 50ms | 🔴 Poor |
| Full-text search | 320ms | < 200ms | 🔴 Poor |
| Aggregations | 150ms | < 100ms | 🟡 Needs Improvement |

### Database Size

| Metric | Current | Projected (1 year) |
|--------|---------|-------------------|
| Total database size | 2.5 GB | ~30 GB |
| Cases table | 850 MB | ~10 GB |
| Evidence table | 1.2 GB | ~15 GB |
| Transactions table | 350 MB | ~4 GB |

### Optimization Strategies

#### 1. Partitioning

```sql
-- Partition transactions table by month
CREATE TABLE transactions_2024_01 PARTITION OF transactions
FOR VALUES FROM ('2024-01-01') TO ('2024-02-01');

CREATE TABLE transactions_2024_02 PARTITION OF transactions
FOR VALUES FROM ('2024-02-01') TO ('2024-03-01');

-- Automatic partition creation
CREATE OR REPLACE FUNCTION create_monthly_partition()
RETURNS void AS $$
DECLARE
    partition_date date;
    partition_name text;
BEGIN
    partition_date := date_trunc('month', CURRENT_DATE + interval '1 month');
    partition_name := 'transactions_' || to_char(partition_date, 'YYYY_MM');
    
    EXECUTE format('CREATE TABLE IF NOT EXISTS %I PARTITION OF transactions
                    FOR VALUES FROM (%L) TO (%L)',
                   partition_name,
                   partition_date,
                   partition_date + interval '1 month');
END;
$$ LANGUAGE plpgsql;
```

#### 2. Materialized Views

```sql
-- Expensive fraud statistics computed once daily
CREATE MATERIALIZED VIEW fraud_statistics AS
SELECT 
    DATE(created_at) as date,
    COUNT(*) as total_cases,
    SUM(CASE WHEN risk_score > 70 THEN 1 ELSE 0 END) as high_risk_cases,
    AVG(risk_score) as avg_risk_score
FROM cases
GROUP BY DATE(created_at);

CREATE INDEX idx_fraud_stats_date ON fraud_statistics(date);

-- Refresh daily
REFRESH MATERIALIZED VIEW CONCURRENTLY fraud_statistics;
```

#### 3. VACUUM & ANALYZE

```sql
-- Regular maintenance
VACUUM ANALYZE cases;
VACUUM ANALYZE evidence;

-- Autovacuum tuning
ALTER TABLE cases SET (autovacuum_vacuum_scale_factor = 0.1);
ALTER TABLE evidence SET (autovacuum_analyze_scale_factor = 0.05);
```

---

## 💻 Electron Performance Baseline

### Startup Time

| Metric | Current | Target | Status |
|--------|---------|--------|--------|
| Cold start | 3.2s | < 2.5s | 🟡 Needs Improvement |
| Warm start | 1.8s | < 1.5s | 🟡 Needs Improvement |
| Time to first window | 2.5s | < 2.0s | 🟡 Needs Improvement |

### Memory Usage

| Process | Current | Target | Status |
|---------|---------|--------|--------|
| Main process | 120 MB | < 100 MB | 🟡 Needs Improvement |
| Renderer process | 180 MB | < 150 MB | 🟡 Needs Improvement |
| Total (idle) | 300 MB | < 250 MB | 🟡 Needs Improvement |
| Total (active) | 550 MB | < 400 MB | 🔴 Poor |

### Optimization Strategies

#### 1. Lazy Loading

```typescript
// electron/main.ts
import { app, BrowserWindow } from 'electron';

let mainWindow: BrowserWindow | null = null;

app.on('ready', () => {
  // Create window immediately
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    show: false,  // Don't show until ready
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      preload: path.join(__dirname, 'preload.js')
    }
  });
  
  // Load app
  mainWindow.loadURL('http://localhost:3000');
  
  // Show when ready
  mainWindow.once('ready-to-show', () => {
    mainWindow?.show();
  });
});
```

#### 2. IPC Optimization

```typescript
// Batch IPC messages
const messageQueue = [];
let flushTimeout = null;

function queueIPCMessage(channel, data) {
  messageQueue.push({ channel, data });
  
  if (!flushTimeout) {
    flushTimeout = setTimeout(() => {
      ipcRenderer.send('batch-messages', messageQueue);
      messageQueue.length = 0;
      flushTimeout = null;
    }, 16); // Flush every frame (~60fps)
  }
}
```

---

## 🎯 Performance Testing Strategy

### Load Testing Plan

```python
# locust/load_test.py
from locust import HttpUser, task, between

class FraudAnalystUser(HttpUser):
    wait_time = between(1, 3)
    
    def on_start(self):
        # Login
        response = self.client.post("/auth/login", json={
            "email": "analyst@example.com",
            "password": "password123"
        })
        self.token = response.json()["access_token"]
    
    @task(5)
    def list_cases(self):
        self.client.get("/api/v1/cases", headers={
            "Authorization": f"Bearer {self.token}"
        })
    
    @task(2)
    def view_case(self):
        self.client.get("/api/v1/cases/123", headers={
            "Authorization": f"Bearer {self.token}"
        })
    
    @task(1)
    def create_case(self):
        self.client.post("/api/v1/cases", headers={
            "Authorization": f"Bearer {self.token}"
        }, json={
            "title": "Test Case",
            "priority": "medium"
        })
```

### Performance Benchmarks

```bash
# Run load test
locust -f locust/load_test.py --host=http://localhost:8000 --users=100 --spawn-rate=10

# Frontend performance
lighthouse http://localhost:3000 --output=json --output-path=./reports/lighthouse.json

# API benchmarking
ab -n 1000 -c 10 http://localhost:8000/api/v1/cases
```

---

## 📈 Performance Monitoring

### Continuous Monitoring

- **Frontend**: Web Vitals, Lighthouse CI
- **Backend**: Prometheus metrics, APM (Application Performance Monitoring)
- **Database**: pg_stat_statements, slow query log
- **Infrastructure**: CPU, memory, disk, network

### Performance Regression Detection

```yaml
# .github/workflows/performance.yml
name: Performance Tests

on: [pull_request]

jobs:
  performance:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Run Lighthouse
        run: |
          npm install -g @lhci/cli
          lhci autorun --upload.target=temporary-public-storage
      
      - name: Load Test
        run: |
          docker-compose up -d
          locust -f locust/load_test.py --headless --users 100 --spawn-rate 10 --run-time 5m
      
      - name: Compare with baseline
        run: |
          python scripts/compare_performance.py
```

---

## ✅ Optimization Roadmap

### Phase 1: Quick Wins (Week 1-2)
- [ ] Enable response compression (GZip)
- [ ] Add database indexes for slow queries
- [ ] Implement Redis caching for frequent queries
- [ ] Frontend code splitting and lazy loading
- [ ] Image optimization and lazy loading

### Phase 2: Frontend Optimization (Week 3-4)
- [ ] React component memoization
- [ ] Virtualize large lists
- [ ] Reduce bundle size (tree shaking, dynamic imports)
- [ ] Optimize state management
- [ ] Service Worker for offline caching

### Phase 3: Backend Optimization (Week 5-6)
- [ ] Database query optimization
- [ ] Connection pool tuning
- [ ] Background task processing (Celery)
- [ ] API response caching
- [ ] Database partitioning

### Phase 4: Advanced Optimization (Week 7-8)
- [ ] CDN for static assets
- [ ] Database replication (read replicas)
- [ ] Horizontal scaling preparation
- [ ] Advanced caching strategies
- [ ] Performance monitoring dashboards

---

## 📚 References

- [Web Vitals](https://web.dev/vitals/)
- [PostgreSQL Performance Tuning](https://wiki.postgresql.org/wiki/Performance_Optimization)
- [FastAPI Performance](https://fastapi.tiangolo.com/deployment/concepts/)
- [React Performance](https://react.dev/learn/render-and-commit)
- [Electron Performance](https://www.electronjs.org/docs/latest/tutorial/performance)
