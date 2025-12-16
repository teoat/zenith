# Feature Flag System Implementation Plan

> **Purpose:** Enable gradual rollout, A/B testing, and risk-free experimentation for Phase 6 finesse enhancements  
> **Priority:** 🔴 Critical Foundation  
> **Estimated Effort:** 1-2 days  
> **Status:** Ready for implementation

---

## 🎯 Overview

### **Why Feature Flags?**

Feature flags (also called feature toggles) enable:
- **Gradual Rollout:** 10% → 25% → 50% → 100% deployment strategy
- **A/B Testing:** Test finesse enhancements against control groups
- **Instant Rollback:** Disable problematic features without code deployment
- **Targeted Releases:** Enable features for specific user segments
- **Dark Launches:** Deploy code to production but keep it hidden
- **Kill Switches:** Emergency disable for critical issues

### **Phase 6 Use Cases**

All Q1-Q3 finesse enhancements will use feature flags:
- Smart Loading States (Q1)
- Enhanced Error Messages (Q1)
- Keyboard Shortcuts (Q1)
- Real-Time Collaboration (Q2)
- Advanced Search (Q2)
- And all subsequent features

---

## 🏗️ Architecture Options

### **Option 1: Custom In-House Solution** (Recommended for Simple378)

**Pros:**
- No external dependencies or costs
- Full control and customization
- Data privacy (no third-party service)
- Simple integration with Electron/desktop app
- Offline-first capability

**Cons:**
- Need to build UI for flag management
- Manual rule evaluation logic
- No advanced targeting out-of-the-box

**Recommendation:** ✅ **Use this for Simple378** — Aligns with self-hosted, desktop-first architecture

---

### **Option 2: LaunchDarkly** (Cloud Service)

**Pros:**
- Full-featured UI for flag management
- Advanced targeting and analytics
- Real-time flag updates
- Built-in A/B testing

**Cons:**
- Cost: ~$50-200/month for team plan
- External dependency
- Requires internet connection
- Data privacy concerns (flags stored in cloud)

**Recommendation:** ⚠️ **Not recommended** — Conflicts with offline-first desktop architecture

---

### **Option 3: Unleash (Open Source)

**Pros:**
- Open source (Apache 2.0)
- Self-hosted option
- Good UI for flag management
- Active community

**Cons:**
- Need to host/maintain server
- More complex than custom solution
- Overkill for desktop app

**Recommendation:** 🟡 **Consider for future** — If scaling to multi-tenant SaaS

---

## 🛠️ Recommended Implementation (Custom Solution)

### **Tech Stack**

- **Storage:** SQLite (existing database)
- **Backend:** FastAPI endpoints (existing API)
- **Frontend:** React hooks + Zustand store
- **Admin UI:** Settings page integration

### **Database Schema**

```sql
-- Feature flags table
CREATE TABLE feature_flags (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    enabled BOOLEAN DEFAULT FALSE,
    rollout_percentage INTEGER DEFAULT 0, -- 0-100
    targeting_rules TEXT, -- JSON for advanced rules
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by TEXT
);

-- User feature assignments (for sticky rollouts)
CREATE TABLE user_feature_assignments (
    user_id TEXT NOT NULL,
    feature_id TEXT NOT NULL,
    enabled BOOLEAN NOT NULL,
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, feature_id),
    FOREIGN KEY (feature_id) REFERENCES feature_flags(id)
);

-- Feature flag audit log
CREATE TABLE feature_flag_audit (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    feature_id TEXT NOT NULL,
    action TEXT NOT NULL, -- 'created', 'enabled', 'disabled', 'updated'
    previous_state TEXT, -- JSON
    new_state TEXT, -- JSON
    changed_by TEXT,
    changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (feature_id) REFERENCES feature_flags(id)
);
```

### **API Endpoints**

```python
# Backend: backend/api/feature_flags.py

from fastapi import APIRouter, Depends, HTTPException
from typing import List, Optional
from pydantic import BaseModel

router = APIRouter(prefix="/api/feature-flags", tags=["feature-flags"])

class FeatureFlag(BaseModel):
    id: str
    name: str
    description: Optional[str]
    enabled: bool
    rollout_percentage: int
    targeting_rules: Optional[dict]

@router.get("/")
async def get_all_flags() -> List[FeatureFlag]:
    """Get all feature flags"""
    # Return all flags from database
    pass

@router.get("/{flag_id}")
async def get_flag(flag_id: str) -> FeatureFlag:
    """Get specific feature flag"""
    pass

@router.post("/")
async def create_flag(flag: FeatureFlag):
    """Create new feature flag"""
    pass

@router.put("/{flag_id}")
async def update_flag(flag_id: str, flag: FeatureFlag):
    """Update feature flag"""
    pass

@router.post("/{flag_id}/enable")
async def enable_flag(flag_id: str, percentage: int = 100):
    """Enable flag with optional rollout percentage"""
    pass

@router.post("/{flag_id}/disable")
async def disable_flag(flag_id: str):
    """Disable feature flag"""
    pass

@router.get("/evaluate/{flag_id}")
async def evaluate_flag(flag_id: str, user_id: str) -> bool:
    """Evaluate if flag is enabled for specific user"""
    # Check user assignment table first (sticky)
    # Then check rollout percentage
    # Then check targeting rules
    pass
```

### **Frontend Implementation**

```typescript
// frontend/src/hooks/useFeatureFlag.ts

import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/authStore';

interface FeatureFlag {
  id: string;
  name: string;
  enabled: boolean;
  rolloutPercentage: number;
}

export function useFeatureFlag(flagName: string): boolean {
  const { user } = useAuthStore();
  
  const { data: isEnabled } = useQuery({
    queryKey: ['feature-flag', flagName, user?.id],
    queryFn: async () => {
      const response = await fetch(
        `/api/feature-flags/evaluate/${flagName}?user_id=${user?.id}`
      );
      return response.json();
    },
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    refetchOnMount: false,
  });

  return isEnabled ?? false;
}

// Usage in components:
function Dashboard() {
  const showSmartLoading = useFeatureFlag('smart-loading-states');
  
  if (showSmartLoading) {
    return <DashboardWithSkeletons />;
  }
  return <DashboardClassic />;
}
```

### **Zustand Store (Optional - for global access)**

```typescript
// frontend/src/stores/featureFlagStore.ts

import { create } from 'zustand';

interface FeatureFlagStore {
  flags: Record<string, boolean>;
  loadFlags: () => Promise<void>;
  isEnabled: (flagName: string) => boolean;
}

export const useFeatureFlagStore = create<FeatureFlagStore>((set, get) => ({
  flags: {},
  
  loadFlags: async () => {
    const response = await fetch('/api/feature-flags');
    const flags = await response.json();
    
    const flagMap = flags.reduce((acc, flag) => {
      acc[flag.name] = flag.enabled;
      return acc;
    }, {});
    
    set({ flags: flagMap });
  },
  
  isEnabled: (flagName: string) => {
    return get().flags[flagName] ?? false;
  },
}));
```

### **Admin UI Component**

```typescript
// frontend/src/pages/Settings/FeatureFlags.tsx

import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';

export function FeatureFlagsSettings() {
  const { data: flags } = useQuery({
    queryKey: ['feature-flags'],
    queryFn: () => fetch('/api/feature-flags').then(r => r.json()),
  });

  const toggleFlag = useMutation({
    mutationFn: async ({ id, enabled, percentage }) => {
      const endpoint = enabled 
        ? `/api/feature-flags/${id}/enable?percentage=${percentage}`
        : `/api/feature-flags/${id}/disable`;
      return fetch(endpoint, { method: 'POST' });
    },
  });

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Feature Flags</h2>
      
      {flags?.map(flag => (
        <div key={flag.id} className="border rounded p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold">{flag.name}</h3>
              <p className="text-sm text-gray-600">{flag.description}</p>
            </div>
            
            <div className="flex items-center space-x-4">
              <input
                type="range"
                min="0"
                max="100"
                value={flag.rolloutPercentage}
                className="w-32"
                onChange={(e) => {
                  toggleFlag.mutate({
                    id: flag.id,
                    enabled: true,
                    percentage: parseInt(e.target.value),
                  });
                }}
              />
              <span className="text-sm">{flag.rolloutPercentage}%</span>
              
              <Switch
                checked={flag.enabled}
                onChange={(enabled) => {
                  toggleFlag.mutate({
                    id: flag.id,
                    enabled,
                    percentage: flag.rolloutPercentage,
                  });
                }}
              />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
```

---

## 📋 Initial Feature Flags

### **Phase 6 Q1 Flags**

```sql
-- Seed data for initial Phase 6 features
INSERT INTO feature_flags (id, name, description, enabled, rollout_percentage) VALUES
('smart-loading-states', 'Smart Loading States', 'Skeleton screens and progressive loading', FALSE, 0),
('enhanced-error-messages', 'Enhanced Error Messages', 'Contextual error handling with suggestions', FALSE, 0),
('keyboard-shortcuts', 'Keyboard Shortcuts', 'Comprehensive keyboard navigation', FALSE, 0),
('performance-dashboard', 'Performance Dashboard', 'Real-time metrics visualization', FALSE, 0),
('case-conclusion-wizard', 'Case Conclusion Wizard', 'Structured SAR generator', FALSE, 0),
('interactive-dossier', 'Interactive Digital Dossier', 'HTML bundle with provenance', FALSE, 0);
```

---

## 🚀 Rollout Strategy

### **Standard Gradual Rollout**

```
Day 1: Enable for 10% of users
  ↓ Monitor metrics for 24 hours
  
Day 2: If metrics good, increase to 25%
  ↓ Monitor for 24 hours
  
Day 3: If metrics good, increase to 50%
  ↓ Monitor for 24 hours
  
Day 4: If metrics good, increase to 100%
  ↓ Monitor for 1 week
  
Week 2: Remove flag (code cleanup)
```

### **Emergency Rollback**

```
Alert triggered (error rate >2%)
  ↓
1. Set rollout to 0% (instant disable)
2. Notify team via Slack
3. Create incident post-mortem
4. Fix issue in staging
5. Re-enable with 5% → 10% → 25% → 50% → 100%
```

---

## 📊 Success Metrics

### **Feature Flag System Metrics**

- **Rollback Speed:** <30 seconds from decision to disabled
- **Flag Evaluation Performance:** <5ms per flag check
- **Admin UI Usability:** <2 minutes to toggle a flag
- **Audit Trail:** 100% of flag changes logged

### **Phase 6 A/B Testing Metrics**

For each finesse enhancement:
- Control group (flag OFF): 10-20% of users
- Treatment group (flag ON): 80-90% of users
- Minimum 1 week test duration
- Statistical significance: p-value <0.05

---

## 📅 Implementation Timeline

### **Day 1: Database & Backend**
- Create database schema
- Implement API endpoints
- Write unit tests
- Deploy to staging

### **Day 2: Frontend & UI**
- Create `useFeatureFlag` hook
- Build admin UI component
- Add to Settings page
- Integration tests

### **Day 3: Documentation & Deployment**
- Write developer documentation
- Create operational runbook
- Deploy to production (flag system itself)
- Seed initial flags (all disabled)

---

## 📚 Documentation

### **Developer Guide**

```markdown
## Using Feature Flags

### Basic Usage

```tsx
import { useFeatureFlag } from '@/hooks/useFeatureFlag';

function MyComponent() {
  const showNewFeature = useFeatureFlag('my-new-feature');
  
  return showNewFeature ? <NewFeature /> : <OldFeature />;
}
```

### Creating a New Flag

1. Add flag to database via Settings UI or SQL:
```sql
INSERT INTO feature_flags (id, name, description)
VALUES ('my-feature', 'My Feature', 'Description');
```

2. Use in code:
```tsx
const enabled = useFeatureFlag('my-feature');
```

3. Enable gradually:
- Settings → Feature Flags → my-feature → Set to 10%
- Monitor for 24 hours
- Increase to 25%, 50%, 100%

### Removing Flags (Cleanup)

After feature is fully rolled out and stable:
1. Remove feature flag checks from code
2. Delete flag from database
3. Deploy updated code
```

---

## ✅ Acceptance Criteria

- [ ] Database schema created and migrated
- [ ] API endpoints implemented and tested
- [ ] Frontend hook created with type safety
- [ ] Admin UI integrated into Settings page
- [ ] Audit logging functional
- [ ] Documentation complete
- [ ] Deployed to production
- [ ] Initial flags seeded (all disabled)
- [ ] Rollback procedure tested in staging

---

## 🎯 Next Steps

1. **Approve this plan** — Get stakeholder sign-off
2. **Assign engineer** — 1-2 days implementation
3. **Create GitHub issue** — Track progress
4. **Implement** — Follow timeline above
5. **Test rollback** — Validate emergency disable works
6. **Document** — Update developer guides
7. **Enable first flag** — Smart Loading States (Q1 #1)

---

**Created:** 2025-12-10  
**Status:** Ready for implementation  
**Estimated Effort:** 1-2 days  
**Priority:** 🔴 Critical (Required for Phase 6)
