# End-to-End Testing Documentation

## Overview

This document describes the comprehensive End-to-End (E2E) testing setup for the 378x492 Fraud Detection application. The E2E tests cover critical user workflows, cross-browser compatibility, and integration between frontend, backend, and Electron components.

## Test Architecture

### Directory Structure
```
e2e/
├── global-setup.ts          # Global test setup
├── global-teardown.ts       # Global test cleanup
├── fixtures/
│   └── test-data.ts         # Test data fixtures
├── utils/
│   ├── database-setup.ts    # Database setup utilities
│   └── user-setup.ts        # User setup utilities
├── web/                     # Web browser tests
│   ├── auth.spec.ts         # Authentication tests
│   └── navigation.spec.ts   # Navigation tests
└── electron/                # Electron-specific tests (future)
    └── main.spec.ts         # Electron main process tests
```

### Technology Stack
- **Playwright**: Modern E2E testing framework
- **TypeScript**: Type-safe test scripts
- **Multiple Browsers**: Chromium, Firefox, WebKit
- **Mobile Testing**: iOS Safari, Android Chrome
- **CI/CD Integration**: GitHub Actions support

## Configuration

### Playwright Configuration (`playwright.config.ts`)

```typescript
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,

  reporter: [
    ['html'],
    ['json', { outputFile: 'test-results/results.json' }],
    ['junit', { outputFile: 'test-results/results.xml' }]
  ],

  use: {
    baseURL: process.env.BASE_URL || 'http://localhost:5173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    actionTimeout: 10000,
    navigationTimeout: 30000,
  },

  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
    { name: 'Mobile Chrome', use: { ...devices['Pixel 5'] } },
    { name: 'Mobile Safari', use: { ...devices['iPhone 12'] } },
  ],

  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },

  globalSetup: require.resolve('./e2e/global-setup.ts'),
  globalTeardown: require.resolve('./e2e/global-teardown.ts'),

  expect: { timeout: 5000 },
});
```

## Test Categories

### 1. Authentication Tests (`auth.spec.ts`)

#### Test Scenarios
- **Login Form Display**: Verify login form elements are present
- **Validation Errors**: Test empty field validation
- **Invalid Credentials**: Test error handling for wrong credentials
- **Successful Login**: Test complete login flow and redirection
- **Session Persistence**: Test session maintenance after refresh
- **Logout Flow**: Test complete logout process
- **Protected Routes**: Test redirection for unauthenticated access
- **Session Timeout**: Test automatic logout on timeout

#### Example Test
```typescript
test('should redirect to dashboard after successful login', async ({ page }) => {
  await page.goto('/login');
  await page.fill('[data-testid="username-input"]', TEST_USERS.analyst.username);
  await page.fill('[data-testid="password-input"]', TEST_USERS.analyst.password);
  await page.click('[data-testid="login-button"]');

  await expect(page).toHaveURL('/dashboard');
  await expect(page.locator('[data-testid="user-menu"]')).toContainText(TEST_USERS.analyst.fullName);
});
```

### 2. Navigation Tests (`navigation.spec.ts`)

#### Test Scenarios
- **Dashboard Navigation**: Test dashboard loading and metrics display
- **Page Navigation**: Test navigation between main application pages
- **Breadcrumb Navigation**: Test hierarchical navigation
- **Browser History**: Test back/forward browser navigation
- **Direct URL Access**: Test direct navigation to routes

#### Example Test
```typescript
test('should navigate to cases page', async ({ page }) => {
  await page.click('[data-testid="nav-cases"]');
  await expect(page).toHaveURL('/cases');
  await expect(page.locator('[data-testid="cases-list"]')).toBeVisible();
});
```

### 3. Case Management Tests (Planned)

#### Test Scenarios
- **Case Creation**: Test creating new fraud cases
- **Case Listing**: Test case list display and pagination
- **Case Details**: Test viewing detailed case information
- **Case Updates**: Test modifying case properties
- **Case Filtering**: Test filtering by status, priority, date
- **Case Search**: Test searching cases by various criteria

### 4. Evidence Management Tests (Planned)

#### Test Scenarios
- **File Upload**: Test uploading evidence files
- **File Processing**: Test automatic evidence processing
- **Evidence Display**: Test viewing processed evidence
- **Evidence Search**: Test searching through evidence
- **File Validation**: Test file type and size validation

### 5. Investigation Workflow Tests (Planned)

#### Test Scenarios
- **Graph Canvas**: Test investigation graph display
- **Entity Management**: Test adding/removing entities
- **Relationship Creation**: Test linking entities
- **Graph Persistence**: Test saving investigation state
- **Report Generation**: Test investigation report creation

## Test Data Management

### Test Fixtures (`fixtures/test-data.ts`)

```typescript
export const TEST_USERS = {
  analyst: {
    username: 'test_analyst',
    email: 'analyst@test.com',
    password: 'TestPass123!',
    fullName: 'Test Analyst',
    role: 'analyst'
  },
  admin: {
    username: 'test_admin',
    email: 'admin@test.com',
    password: 'AdminPass123!',
    fullName: 'Test Admin',
    role: 'admin'
  }
};

export const TEST_CASES = {
  fraudCase: {
    title: 'Test Fraud Case - E2E',
    description: 'This is a test case created during E2E testing',
    priority: 'high',
    caseType: 'fraud_suspected',
    customerName: 'John Doe',
    fraudAmount: 5000.00
  }
};
```

### Global Setup (`global-setup.ts`)

```typescript
async function globalSetup(config: FullConfig) {
  console.log('🚀 Setting up E2E test environment...');

  // Setup test database and seed data
  await setupTestDatabase();
  await setupTestUsers();

  console.log('✅ E2E test environment setup complete');
}
```

### Global Teardown (`global-teardown.ts`)

```typescript
async function globalTeardown() {
  console.log('🧹 Cleaning up E2E test environment...');

  await cleanupTestDatabase();

  console.log('✅ E2E test environment cleanup complete');
}
```

## Running Tests

### Local Development

```bash
# Run all E2E tests
npm run test:e2e:playwright

# Run tests in UI mode (interactive)
npm run test:e2e:playwright:ui

# Run tests in debug mode
npm run test:e2e:playwright:debug

# Run tests in headed mode (visible browser)
npm run test:e2e:playwright:headed

# Run specific browser tests
npm run test:e2e:playwright:chromium
npm run test:e2e:playwright:firefox
npm run test:e2e:playwright:webkit
```

### CI/CD Execution

```bash
# Install Playwright browsers
npx playwright install --with-deps

# Run tests with CI configuration
npm run test:e2e:playwright
```

### Test Results

Test results are generated in multiple formats:
- **HTML Report**: `playwright-report/index.html`
- **JSON Results**: `test-results/results.json`
- **JUnit XML**: `test-results/results.xml`

## Best Practices

### Test Organization
1. **Descriptive Test Names**: Use clear, descriptive test names
2. **Data Test IDs**: Use `data-testid` attributes for reliable element selection
3. **Page Object Pattern**: Consider using page objects for complex interactions
4. **Test Isolation**: Each test should be independent and not rely on others

### Test Data Management
1. **Test Fixtures**: Use consistent test data across tests
2. **Data Cleanup**: Ensure test data is cleaned up after tests
3. **Database Seeding**: Pre-populate database with required test data
4. **Mock External Services**: Mock external APIs and services

### Performance Considerations
1. **Parallel Execution**: Tests run in parallel by default
2. **Timeouts**: Appropriate timeouts for different operations
3. **Resource Cleanup**: Proper cleanup of test resources
4. **Screenshot/Video on Failure**: Automatic capture for debugging

## Debugging Tests

### Visual Debugging
```bash
# Run tests with browser visible
npm run test:e2e:playwright:headed

# Run tests with Playwright UI
npm run test:e2e:playwright:ui

# Run specific test in debug mode
npx playwright test --debug auth.spec.ts
```

### Trace Analysis
```bash
# View trace files for failed tests
npx playwright show-trace test-results/trace.zip
```

### Screenshot Analysis
```bash
# View screenshots from failed tests
open test-results/screenshots/
```

## CI/CD Integration

### GitHub Actions Example
```yaml
name: E2E Tests
on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  e2e-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Install Playwright
        run: npx playwright install --with-deps

      - name: Run E2E tests
        run: npm run test:e2e:playwright

      - name: Upload test results
        uses: actions/upload-artifact@v3
        if: always()
        with:
          name: playwright-report
          path: playwright-report/
          retention-days: 30
```

## Test Coverage Goals

### Current Status
- **Authentication**: ✅ Implemented (8 tests)
- **Navigation**: ✅ Implemented (6 tests)
- **Case Management**: 🚧 Planned (15+ tests)
- **Evidence Management**: 🚧 Planned (12+ tests)
- **Investigation**: 🚧 Planned (20+ tests)
- **Reporting**: 🚧 Planned (10+ tests)

### Target Coverage
- **Total Tests**: 80+ E2E tests
- **Critical Paths**: 100% coverage
- **User Journeys**: Complete workflow testing
- **Cross-Browser**: All supported browsers
- **Mobile**: Responsive design validation

## Troubleshooting

### Common Issues

#### 1. Test Timeouts
```typescript
// Increase timeout for slow operations
await page.waitForSelector('[data-testid="slow-element"]', { timeout: 10000 });
```

#### 2. Flaky Tests
```typescript
// Add retry logic for unstable operations
await expect(page.locator('[data-testid="async-element"]')).toBeVisible({
  timeout: 10000
});
```

#### 3. Element Not Found
```typescript
// Use more specific selectors
await page.locator('[data-testid="specific-element"]').click();

// Or wait for element to be ready
await page.waitForSelector('[data-testid="dynamic-element"]');
```

#### 4. Network Issues
```typescript
// Mock network requests if needed
await page.route('**/api/external-service', route => route.fulfill({
  status: 200,
  contentType: 'application/json',
  body: JSON.stringify({ success: true })
}));
```

## Future Enhancements

### Planned Features
1. **Visual Regression Testing**: Screenshot comparison for UI changes
2. **Performance Testing**: Lighthouse integration for performance metrics
3. **Accessibility Testing**: Automated accessibility audits
4. **API Testing**: Direct API endpoint testing within E2E suite
5. **Load Testing**: Concurrent user simulation
6. **Cross-Device Testing**: More device configurations

### Electron Testing
1. **Main Process Testing**: Electron main process functionality
2. **IPC Testing**: Inter-process communication validation
3. **File System Testing**: Native file operations
4. **System Integration**: OS-specific feature testing

This E2E testing framework provides comprehensive coverage of the fraud detection application's critical user workflows, ensuring reliable and maintainable software delivery.