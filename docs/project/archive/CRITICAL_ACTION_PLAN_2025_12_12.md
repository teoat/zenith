# 🚨 CRITICAL ACTION PLAN: Immediate Fixes
## 378x492 Fraud Detection Platform

**Date:** 2025-12-12  
**Status:** Urgent Execution Required  
**Scope:** Test Failures, Bundle Optimization, React Anti-Patterns

---

## 1. 🩸 Fix Integration Test Failures (Priority: IMMEDIATE)
**Blocking Status:** 🔴 BLOCKS STAGING DEPLOYMENT

### Diagnosis
The integration tests are crashing due to missing dependencies in the test environment.
**Error:** `ModuleNotFoundError: No module named 'pytesseract'`

### Action Items
1. **Install Dependencies:**
   Run the following to install missing libraries in the backend environment:
   ```bash
   pip install pytesseract Pillow
   ```

2. **Patch `backend/tests/conftest.py`:**
   Add a mock for `multimodal_analyzer` to prevent import errors during generic API testing if OCR isn't being tested.

   ```python
   # In tests/conftest.py
   import sys
   from unittest.mock import MagicMock

   # Mock complex dependencies before importing app
   sys.modules["pytesseract"] = MagicMock()
   sys.modules["PIL"] = MagicMock()
   sys.modules["cv2"] = MagicMock()
   ```

3. **Verify Fix:**
   ```bash
   cd backend
   python3 -m pytest tests/unit/test_comprehensive.py -v
   ```

---

## 2. ⚡ Optimize Mapbox Bundle Size (Priority: HIGH)
**Current State:** `mapbox-gl` chunk is **1.6MB**, slowing down initial page load.

### Action Items
1. **Update `frontend/vite.config.ts`:**
   Configure `manualChunks` to isolate Mapbox.

   ```typescript
   // vite.config.ts
   export default defineConfig({
     build: {
       rollupOptions: {
         output: {
           manualChunks: {
             'mapbox': ['mapbox-gl', 'react-map-gl'],
             'vendor': ['react', 'react-dom', 'framer-motion']
           }
         }
       }
     }
   })
   ```

2. **Refactor `ThreatMap.tsx` Import:**
   Ensure `mapbox-gl` is imported dynamically in the component to support code splitting if it isn't already handled by the lazy components.

---

## 3. 🛡️ Fix React Anti-Patterns (Priority: HIGH)
**Risk:** Potential infinite loops and performance degradation.

### Action Items
1. **Audit `useEffect` Dependencies:**
   Run the linter to find all violations:
   ```bash
   cd frontend
   npx eslint src --ext .ts,.tsx | grep "react-hooks/exhaustive-deps"
   ```

2. **Refactor `HealthGauges.tsx` & `AuditLogViewer.tsx`:**
   Ensure `fetchMetrics` and `fetchLogs` are wrapped in `useCallback` if used in the dependency array, or defined inside the `useEffect`.

   *Current (Safe but Implicit):*
   ```typescript
   useEffect(() => {
     const fetchMetrics = async () => { ... };
     fetchMetrics();
   }, []); // Safe for mount-only
   ```
   *Recommendation (Explicit):*
   Define function inside effect (done) or use `useCallback` if passed to children.

3. **Fix `useState` Initialization:**
   Review `WelcomeMessage.tsx` and ensure `localStorage` reads happen in `useState` lazy initializer, not `useEffect`.

   ```typescript
   // Correct
   const [visible, setVisible] = useState(() => localStorage.getItem('welcome') !== 'hidden');
   ```

---

## 4. 🗓️ Execution Timeline

| Task | Estimated Time | Owner | Dependencies |
|------|----------------|-------|--------------|
| **1. Fix Tests** | 1 Hour | Backend Lead | None |
| **2. Optimize Bundles** | 2 Hours | Frontend Lead | Build System |
| **3. React Audit** | 2 Hours | Frontend Lead | Linting Config |

**Next Step:** Execute Task 1 (Fix Tests) immediately.
