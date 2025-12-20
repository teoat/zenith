# Test Infrastructure - Quick Start Guide

Welcome to the new type-safe test infrastructure! This guide will get you up to speed in 5 minutes.

## 🎯 Problem Solved

**Before**: Manual mocks with type errors
```typescript
// ❌ Problems:
const mockCase = { id: '1', title: 'Test' };  // Missing required fields
await caseService.updateCase('1', updates);    // String not assignable to CaseId
(api.login as jest.Mock).mockResolvedValue(); // Type narrowed to 'never'
```

**After**: Type-safe factories and helpers
```typescript
// ✅ Solutions:
const mockCase = createMockCase({ title: 'Test' });  // All fields auto-completed
await caseService.updateCase(mockCaseId('1'), updates);  // Proper branded type
mockServiceMethod(api.login).mockResolvedValue();  // Fully typed!
```

---

## 📚 Quick Reference

### Creating Mock Data

```typescript
import { 
  createMockCase,     // Single case with defaults
  createMockCases,    // Multiple cases
  createFullMockCase, // Case with all optional fields
  mockCaseId,         // Brand a string as CaseId
  mockUserId,         // Brand a string as UserId
  mockProjectId       // Brand a string as ProjectId
} from './__tests__/factories';

// Simple mock
const case1 = createMockCase({ title: 'My Case' });

// Multiple mocks
const cases = createMockCases(5, { priority: 'HIGH' });

// Full mock with all fields
const fullCase = createFullMockCase({ 
  title: 'Complete Case',
  tags: ['fraud', 'urgent']
});

// Branded IDs
const caseId = mockCaseId('case-123');
const userId = mockUserId('user-456');
```

### Mocking Services

```typescript
import {
  mockServiceMethod,  // Type-safe service mock
  mockApiMethod,      // API method with helpers
  createMockFetch,    // Fetch API mock
  createMockWebSocket // WebSocket mock
} from './__tests__/mock-helpers';

// Service method mock
const mockedGetCase = mockServiceMethod(caseService.getCase);
mockedGetCase.mockResolvedValue({ data: mockCase, success: true });

// API method with helpers
const mockGet = mockApiMethod<User>();
mockGet.mockSuccess({ id: '1', name: 'Test' });
mockGet.mockError('User not found', 'NOT_FOUND');

// Fetch mock
const mockFetch = createMockFetch();
mockFetch.mockJsonResponse({ data: 'test' }, 200);
global.fetch = mockFetch as any;

// WebSocket mock
const mockWs = createMockWebSocket();
mockWs.triggerEvent('message', { data: 'test' });
```

### Mocking Browser APIs

```typescript
import { createMockLocalStorage } from './__tests__/mock-helpers';

// localStorage mock
global.localStorage = createMockLocalStorage();
localStorage.setItem('token', 'test-token');
console.log(localStorage.__store); // Access internal store for assertions
```

---

## 🔥 Common Patterns

### Pattern 1: Basic Test Setup
```typescript
import { createMockCase, mockCaseId } from './__tests__/factories';
import { mockServiceMethod } from './__tests__/mock-helpers';

describe('MyCaseComponent', () => {
  const mockCase = createMockCase({ title: 'Test Case' });
  const mockGetCase = mockServiceMethod(caseService.getCase);

  beforeEach(() => {
    mockGetCase.mockResolvedValue({ data: mockCase, success: true });
  });

  it('should display case title', async () => {
    render(<MyCaseComponent caseId={mockCaseId('1')} />);
    expect(await screen.findByText('Test Case')).toBeInTheDocument();
  });
});
```

### Pattern 2: API Response Testing
```typescript
import { mockApiResponse, mockCollectionResponse } from './__tests__/factories';

// Single item response
const response = mockApiResponse(mockCase, true);

// Collection response with pagination
const collection = mockCollectionResponse(
  [mockCase1, mockCase2],
  { page: 1, pageSize: 10, total: 2 }
);
```

### Pattern 3: Multiple Cases
```typescript
import { createMockCases } from './__tests__/factories';

// Create 10 cases with HIGH priority
const highPriorityCases = createMockCases(10, { priority: 'HIGH' });

// Create cases with different statuses
const openCases = createMockCases(5, { status: 'OPEN' });
const closedCases = createMockCases(3, { status: 'CLOSED' });
```

### Pattern 4: Service Mock with Type Safety
```typescript
import { mockServiceMethod } from './__tests__/mock-helpers';

// Before: Type error
(caseService.getCase as jest.Mock).mockResolvedValue(data);  // ❌ 'never' type

// After: Fully typed
const mock = mockServiceMethod(caseService.getCase);
mock.mockResolvedValue({ data: mockCase, success: true });  // ✅ Typed!
```

---

## 📋 Migration Checklist

Migrating an existing test file? Follow these steps:

- [ ] Add imports:
  ```typescript
  import { createMockCase, mockCaseId, mockUserId } from './__tests__/factories';
  import { mockServiceMethod } from './__tests__/mock-helpers';
  ```

- [ ] Replace ID strings:
  ```typescript
  - const caseId = 'case-1';
  + const caseId = mockCaseId('case-1');
  ```

- [ ] Replace manual mocks:
  ```typescript
  - const mock = { id: '1', title: 'Test', status: 'OPEN', ... };
  + const mock = createMockCase({ title: 'Test' });
  ```

- [ ] Type service mocks:
  ```typescript
  - (service.method as jest.Mock).mockResolvedValue(...);
  + mockServiceMethod(service.method).mockResolvedValue(...);
  ```

- [ ] Run type check:
  ```bash
  npm run type-check
  ```

---

## 🎨 Factory Customization

All factories accept `overrides` to customize the generated data:

```typescript
// Minimal override
const case1 = createMockCase({ title: 'Custom Title' });

// Multiple overrides
const case2 = createMockCase({
  title: 'High Priority Case',
  priority: 'HIGH',
  status: 'INVESTIGATING',
  riskScore: 0.95,
  tags: ['fraud', 'urgent']
});

// Everything else uses sensible defaults
console.log(case2.createdAt);  // Auto-generated ISO timestamp
console.log(case2.id);          // 'mock-case-1' as CaseId
```

---

## ⚡ Performance Tips

### 1. Reuse Mocks
```typescript
// Good: Reuse mocks between tests
const mockCase = createMockCase();

beforeEach(() => {
  mockGetCase.mockResolvedValue({ data: mockCase, success: true });
});
```

### 2. Use Factories for Large Datasets
```typescript
// Good: Generate large datasets efficiently
const cases = createMockCases(1000, { priority: 'HIGH' });
```

### 3. Reset Mocks Properly
```typescript
import { resetAllMocks } from './__tests__/mock-helpers';

const mocks = {
  getCase: mockServiceMethod(caseService.getCase),
  updateCase: mockServiceMethod(caseService.updateCase)
};

afterEach(() => {
  resetAllMocks(mocks);  // Resets all mocks at once
});
```

---

## 🐛 Troubleshooting

### Issue: "Property '__brand' is missing"
**Cause**: Using plain strings where branded types are expected  
**Fix**: Wrap with `mockCaseId()` or `mockUserId()`
```typescript
- await caseService.getCase('case-1');
+ await caseService.getCase(mockCaseId('case-1'));
```

### Issue: "Type narrowed to 'never'"
**Cause**: Untyped Jest mock  
**Fix**: Use `mockServiceMethod()`
```typescript
- (service.method as jest.Mock).mockResolvedValue(...);
+ mockServiceMethod(service.method).mockResolvedValue(...);
```

### Issue: "Missing required properties"
**Cause**: Manual mock object incomplete  
**Fix**: Use `createMockCase()`
```typescript
- const mock = { id: '1', title: 'Test' };
+ const mock = createMockCase({ title: 'Test' });
```

---

## 📖 API Reference

### Factories (`factories.ts`)

| Function | Parameters | Returns | Description |
|----------|-----------|---------|-------------|
| `createMockCase` | `overrides?: Partial<Case>` | `Case` | Create a single Case mock |
| `createMockCases` | `count: number, baseOverrides?` | `Case[]` | Create multiple Cases |
| `createFullMockCase` | `overrides?: Partial<Case>` | `Case` | Case with all optional fields |
| `mockCaseId` | `id?: string` | `CaseId` | Brand string as CaseId |
| `mockUserId` | `id?: string` | `UserId` | Brand string as UserId |
| `mockProjectId` | `id?: string` | `ProjectId` | Brand string as ProjectId |
| `mockApiResponse` | `data: T, success?: boolean` | `ApiResponse<T>` | Wrap data in API response |
| `mockCollectionResponse` | `items: T[], pagination?` | `CollectionResponse<T>` | Paginated response |

### Mock Helpers (`mock-helpers.ts`)

| Function | Parameters | Returns | Description |
|----------|-----------|---------|-------------|
| `mockServiceMethod` | `method: T` | `MockedFunction<T>` | Type-safe service mock |
| `createMockPromise` | `<T>()` | `Mock<Promise<T>>` | Promise-returning mock |
| `createMockFunction` | `<TReturn, TArgs>()` | `Mock<TReturn, TArgs>` | Typed function mock |
| `mockApiMethod` | `<TData>()` | `MockedApiMethod<TData>` | API mock with helpers |
| `createMockFetch` | none | `MockedFetch` | Fetch API mock |
| `createMockWebSocket` | none | `MockWebSocket` | WebSocket mock |
| `createMockLocalStorage` | none | `MockLocalStorage` | localStorage mock |
| `isMockedFunction` | `value: any` | `boolean` | Type guard for mocks |
| `resetAllMocks` | `mocks: Record<string, any>` | `void` | Reset all mocks |

---

## 💡 Best Practices

1. **Always use factories for domain objects** (Cases, Users, Evidence, etc.)
2. **Always use mock helpers for service methods** (prevents type narrowing)
3. **Always use branded type helpers** (`mockCaseId`, `mockUserId`)
4. **Never create inline mock objects** (use factories instead)
5. **Centralize mock setup** in `beforeEach` blocks
6. **Reset mocks** in `afterEach` to prevent test pollution

---

## 🚀 Next Steps

1. Read `factories.ts` and `mock-helpers.ts` for full API
2. See `services.test.ts` and `CaseTable.test.tsx` for real examples
3. Migrate one test file to practice
4. Check out `FRONTEND_TYPE_DIAGNOSTIC_REPORT.md` for deep dive

---

**Questions?** Check the test files or the comprehensive diagnostic report!
