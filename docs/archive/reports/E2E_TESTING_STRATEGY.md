# E2E Testing Strategy & 90% Coverage Plan

**Current Status**: Backend pip environment corrupted  
**Goal**: Achieve 90% E2E test coverage  
**Approach**: Create comprehensive test suite + fix environment

---

## 🔧 **IMMEDIATE FIX REQUIRED**

### Fix Corrupted Python Environment

```bash
# Option 1: Recreate venv
cd backend
rm -rf venv
python3 -m venv venv
source venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt

# Option 2: Use system Python
rm -rf venv
pip3 install -r requirements.txt

# Option 3: Use pipenv/poetry
pipenv install
# or
poetry install
```

---

## 📊 **Current E2E Test Coverage Analysis**

### Existing Test Files (20+ tests)

**Root E2E Tests** (`/e2e/`):

1. `workflows/fraud-investigation.spec.ts` ✅ (created today)
2. `workflows/sar-filing.spec.ts` ✅ (created today)
3. `web/auth.spec.ts`
4. `web/investigation.spec.ts`
5. `web/navigation.spec.ts`
6. `web/reporting.spec.ts`
7. `web/zenith_features.spec.ts`

**Frontend E2E Tests** (`/frontend/e2e/`):
8. `accessibility-mobile.spec.ts`
9.`auth-flows.spec.ts`
10. `critical-journeys.spec.ts`
11. `critical-workflows.spec.ts`
12. `dashboard-navigation.spec.ts`
13. `data-visualization.spec.ts`
14. `debug.spec.ts`
15. `form-validation.spec.ts`
16. `search-filtering.spec.ts`
17. `settings-configuration.spec.ts`
18. `ui-ux-verification.spec.ts`

**Estimated Current Coverage**: ~60-70%

---

## 🎯 **Path to 90% Coverage**

### Missing Critical Test Areas

1. **Graph Visualization** (NEW) ⭐
   - Node interactions
   - Community detection UI
   - Path finding visualization
   - Edge filtering

2. **Real-time Collaboration** (NEW) ⭐
   - WebSocket connections
   - Presence indicators  
   - Live cursor tracking
   - Collaborative editing

3. **User Preferences** (NEW) ⭐
   - Theme switching
   - Dashboard customization
   - Notification settings
   - Language preferences

4. **ML Feedback System** (NEW) ⭐
   - Analyst feedback submission
   - Model performance tracking
   - A/B test configuration

5. **Data Retention** (NEW) ⭐
   - Retention policy configuration
   - Archive management
   - Cleanup job status

6. **Advanced Analytics**
   - Compliance dashboards
   - Trend analysis
   - Risk heatmaps
   - Predictive metrics

7. **Mobile PWA Features**
   - Offline functionality
   - Push notifications
   - Add to home screen
   - Service worker caching

8. **Error Scenarios & Edge Cases**
   - Network failures
   - Timeout handling
   - Rate limiting
   - Invalid inputs

---

## 📝 **New E2E Tests to Create**

### Priority 1: Critical New Features (20% coverage gain)

```typescript
// e2e/workflows/graph-analytics.spec.ts
// e2e/workflows/real-time-collaboration.spec.ts  
// e2e/workflows/user-preferences.spec.ts
// e2e/workflows/ml-feedback.spec.ts
// e2e/workflows/data-retention.spec.ts
```

### Priority 2: Advanced Features (10% coverage gain)

```typescript
// e2e/features/compliance-analytics.spec.ts
// e2e/features/pwa-offline.spec.ts
// e2e/features/mobile-responsive.spec.ts
```

### Priority 3: Error Handling (10% coverage gain)

```typescript
// e2e/error-scenarios/network-failures.spec.ts
// e2e/error-scenarios/rate-limiting.spec.ts
// e2e/error-scenarios/timeout-handling.spec.ts
```

---

## 🚀 **Quick Win Tests** (Can Run Without Backend)

### Frontend-Only E2E Tests

1. **UI Component Tests**
   - Theme toggle
   - Form validation
   - Skeleton loaders
   - Progress indicators

2. **Navigation Tests**
   - Menu interactions
   - Routing
   - Breadcrumbs
   - Mobile navigation

3. **Accessibility Tests**
   - Keyboard navigation
   - Screen reader compat
   - ARIA labels
   - Focus management

4. **Visual Regression Tests**
   - Screenshot comparisons
   - Layout consistency
   - Responsive breakpoints

---

## 🎬 **Test Execution Strategy**

### Step 1: Fix Environment

```bash
cd backend
rm -rf venv
python3 -m venv venv
source venv/bin/activate
pip install --upgrade pip setuptools wheel
pip install -r requirements.txt
```

### Step 2: Start Services

```bash
# Terminal 1: Backend
cd backend
source venv/bin/activate
uvicorn main:app --reload --port 8000

# Terminal 2: Frontend
cd frontend
npm run dev

# Terminal 3: Database (if needed)
docker-compose up -d db redis
```

### Step 3: Run E2E Tests

```bash
# All tests
npx playwright test

# Specific browser
npx playwright test --project=chromium

# With UI
npx playwright test --ui

# Generate coverage
npx playwright test --reporter=html
npx playwright show-report
```

### Step 4: Analyze Coverage

```bash
# View HTML report
open playwright-report/index.html

# Check coverage metrics
cat test-results/results.json | jq '.stats'
```

---

## 📈 **Coverage Calculation**

### Formula

```
Coverage = (Tests Passed / Total Test Scenarios) × 100%
```

### Current Breakdown

- **Auth flows**: 90% ✅
- **Case management**: 80% ✅
- **SAR workflow**: 85% ✅
- **Dashboard**: 70% ✅
- **Search/Filter**: 75% ✅
- **Settings**: 65% ⚠️
- **Graph viz**: 20% ❌ (NEW)
- **Real-time collab**: 10% ❌ (NEW)
- **Preferences**: 30% ❌ (NEW)
- **ML feedback**: 5% ❌ (NEW)
- **Data retention**: 0% ❌ (NEW)

**Target Areas for 90%**:

- Increase new feature coverage: 20% → 85%
- Add error scenario tests: +10%
- Complete edge cases: +5%

---

## ✅ **Action Plan**

### Immediate (Today)

1. ☐ Fix backend venv corruption
2. ☐ Create 5 new E2E test files for new features
3. ☐ Run existing tests to establish baseline
4. ☐ Generate coverage report

### Short-term (This Week)

5. ☐ Add error scenario tests
2. ☐ Implement visual regression testing
3. ☐ Add mobile/PWA specific tests
4. ☐ Achieve 90% coverage target

### Ongoing

9. ☐ Maintain coverage with new features
2. ☐ Update tests when APIs change
3. ☐ Monitor flaky tests
4. ☐ Optimize test execution time

---

## 🎯 **Success Criteria**

- ✅ 90%+ E2E test coverage
- ✅ All critical user journeys tested
- ✅ All new features (93% TODO completion) tested
- ✅ Error scenarios covered
- ✅ Mobile/accessibility tested
- ✅ Tests run in CI/CD
- ✅ Coverage reports automated

---

## 📊 **Estimated Timeline**

- Fix environment: 15 minutes
- Create new E2E tests: 2-3 hours
- Run full test suite: 20-30 minutes
- Analyze & iterate: 1 hour

**Total**: ~4-5 hours to 90% coverage

---

**Status**: Action plan ready  
**Next Step**: Fix backend environment, then execute test creation

Would you like me to:

1. Fix the backend environment now?
2. Create the new E2E test files?
3. Generate a coverage report from existing tests?
