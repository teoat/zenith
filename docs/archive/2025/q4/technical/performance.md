# Strategy: Performance & Scale

> **Goal:** Ensure the application remains responsive with 1M+ records, 10k+ node graphs, and concurrent users.

## 1. Core Principles

- **Lazy by Default:** Never load data until it's needed.
- **Virtualize Everything:** DOM nodes are expensive; only render what's visible.
- **Paginate Aggressively:** No unbounded queries.
- **Cache Smart:** Use React Query's stale-while-revalidate pattern.

---

## 2. Frontend Performance

### 2.1 List Virtualization

| Use Case | Library | Notes |
| :--- | :--- | :--- |
| Tables (1000+ rows) | `@tanstack/react-virtual` | Windowed rendering |
| Infinite scroll | `react-window` | Audit Log, Activity Feed |
| Kanban boards | Virtual columns | Only render visible lanes |

### 2.2 Graph Rendering

- **Library:** `react-force-graph` (WebGL / Three.js).
- **Technique:** Level-of-Detail (LOD). At zoom < 50%, switch to clusters.
- **Worker Offload:** Force simulation runs in Web Worker to prevent UI freeze.

### 2.3 Bundle Size

- Code splitting per route via `React.lazy()`.
- Tree-shaking heavy libraries (e.g., `lodash-es` not `lodash`).
- Target: Initial bundle < 250KB gzipped.

---

## 3. Backend Performance

### 3.1 Database Optimization

- **Indexes:** Composite indexes on `(tenant_id, created_at)`.
- **Pagination:** Cursor-based (keyset) pagination, not OFFSET.
- **Connection Pooling:** SQLAlchemy pool size = 10.

### 3.2 Query Patterns

```sql
-- Good: Cursor-based pagination
SELECT * FROM cases 
WHERE tenant_id = ? AND created_at < ?
ORDER BY created_at DESC
LIMIT 50;

-- Bad: Offset pagination (slow on large tables)
SELECT * FROM cases OFFSET 10000 LIMIT 50;
```

### 3.3 Caching

| Layer | Tool | TTL |
| :--- | :--- | :--- |
| API Response | React Query | 30s (stale), 5min (cache) |
| Search Index | MeiliSearch | Real-time sync |
| Static Assets | CDN / Electron | Immutable |

---

## 4. Monitoring & Profiling

| Metric | Target | Tool |
| :--- | :--- | :--- |
| LCP (Largest Contentful Paint) | < 2.5s | Lighthouse |
| FID (First Input Delay) | < 100ms | Web Vitals |
| API P95 Latency | < 500ms | Prometheus |
| Memory Usage | < 500MB | Electron DevTools |

---

## 5. Load Testing

- **Tool:** k6 or Locust.
- **Scenarios:**
  1. 100 concurrent users querying Cases page.
  2. 10 users uploading 100MB evidence files simultaneously.
  3. 1 user rendering a 50k-node graph.
