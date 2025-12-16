# 📦 Centralized Data Models

**Scope:** Global Shared Definitions
**Status:** ✅ Approved Standard

---

## 1. Core Entities

### `Case`
The top-level container for an investigation.
```typescript
interface Case {
  id: string;              // "CASE-2025-001"
  title: string;           // "Suspicious Procurement - Project Alpha"
  status: 'OPEN' | 'IN_PROGRESS' | 'ADJUDICATION' | 'CLOSED' | 'ARCHIVED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  assigneeId: string;      // User ID
  createdAt: Date;
  updatedAt: Date;
  riskScore: number;       // 0-100 (Aggregated from Alerts)
  tags: string[];
}
```

### `Transaction`
A single financial record (ingested from Bank Statement or internal Ledger).
```typescript
interface Transaction {
  id: string;              // UUID
  sourceId: string;        // "INGEST-001" (File Origin)
  date: Date;
  amount: number;
  currency: string;        // "USD", "IDR"
  description: string;     // Raw bank text
  merchantName?: string;   // Cleaned/Enriched name
  category: string;        // "Travel", "Office Supplies"
  type: 'DEBIT' | 'CREDIT';
  metadata: Record<string, any>;
}
```

### `Evidence`
A supporting document or file linked to a Case or Alert.
```typescript
interface Evidence {
  id: string;
  caseId: string;
  filename: string;
  fileType: string;        // MIME type
  sizeBytes: number;
  uploadedAt: Date;
  hash: string;            // SHA-256 for integrity
  isAdmissible: boolean;   // Flagged for final report
}
```

---

## 2. Fraud & Analysis Entities

### `Alert` (or `Flag`)
A specific anomaly detected by the system.
```typescript
interface Alert {
  id: string;
  caseId: string;
  type: AlertType;         // e.g., "MIRROR_TRANSACTION", "STRUCTURING"
  severity: 'LOW' | 'MEDIUM' | 'HIGH';
  status: 'NEW' | 'INVESTIGATING' | 'CONFIRMED_FRAUD' | 'FALSE_POSITIVE';
  score: number;           // 0-100 Confidence
  description: string;     // AI-generated explanation
  relatedTransactionIds: string[];
}
```

### `Pattern`
A definition of a fraud typology used by the engine.
```typescript
interface Pattern {
  id: string;
  name: string;            // "Structuring < $10k"
  logic: string;           // Description of rule
  threshold: number;       // Trigger value
  category: 'VELOCITY' | 'AMOUNT' | 'RELATIONSHIP' | 'TIMING';
}
```

---

## 3. System Entities

### `User`
```typescript
interface User {
  id: string;
  email: string;
  role: 'ANALYST' | 'SENIOR_INVESTIGATOR' | 'ADMIN';
  preferences: UserPreferences;
}
```

### `ConfigurationProfile`
Dynamic settings for detection logic (per Client or Global).
```typescript
interface ConfigurationProfile {
  id: string;
  clientId: string;
  tolerancePercent: number;    // e.g., 0.01 (1%)
  geoLimitKm: number;          // e.g., 50
  structuringThresholds: {
    critical24h: number;       // e.g., 10000
    high7d: number;            // e.g., 15000
    medium30d: number;         // e.g., 50000
  };
  autoTuningEnabled: boolean;
}
```

### `AuditLogEntry`
Immutable record of system actions.
```typescript
interface AuditLogEntry {
  id: string;
  timestamp: Date;
  actorId: string;         // User ID or "SYSTEM"
  action: string;          // "APPROVE_ALERT", "DELETE_CASE"
  targetId: string;        // ID of object affected
  changes: {
    before: any;
    after: any;
  };
  ipAddress: string;
}
```
