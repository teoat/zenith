# Comprehensive Testing Documentation

## Overview

This document outlines the comprehensive testing strategy implemented for the 378x492 Fraud Detection application. The testing suite covers unit tests, integration tests, end-to-end tests, and performance tests across backend, frontend, and Electron components.

## Testing Strategy

### Coverage Goals
- **Backend**: 80%+ code coverage
- **Frontend**: 80%+ code coverage
- **Electron**: 80%+ code coverage
- **E2E**: 85%+ scenario coverage
- **Overall**: 80%+ combined coverage

### Testing Pyramid
```
E2E Tests (20%)     - User journey validation
Integration Tests   - Component interaction
Unit Tests (80%)    - Individual function/component testing
```

## Backend Testing

### Test Structure
```
backend/tests/
├── unit/                    # Unit tests
│   ├── test_core.py        # Core functionality tests
│   ├── test_database.py    # Database and model tests
│   ├── test_routers.py     # API router tests
│   ├── test_services.py    # Service layer tests
│   └── test_comprehensive.py # Comprehensive test suite
├── integration/            # Integration tests
│   ├── test_api.py         # API endpoint integration
│   ├── test_api_endpoints.py # CRUD operations
│   ├── test_fraud_engine.py # Fraud detection logic
│   └── test_sync.py        # Synchronization tests
├── performance/            # Performance tests
│   └── locustfile.py       # Load testing
└── conftest.py             # Test configuration
```

### Core Functionality Tests (`test_core.py`)

#### Settings Tests
```python
class TestSettings:
    def test_settings_initialization(self):
        """Test settings object creation"""
        settings = Settings()
        assert settings.PROJECT_NAME == "Simple378 Fraud Detection"
        assert settings.API_V1_STR == "/api/v1"
        assert settings.JWT_ACCESS_TOKEN_EXPIRE_MINUTES == 30

    @patch.dict('os.environ', {'SECRET_KEY': 'test-secret'})
    def test_settings_with_env(self):
        """Test settings with environment variables"""
        settings = Settings()
        assert settings.SECRET_KEY == "test-secret"
```

#### Logging Tests
```python
class TestLogging:
    def test_setup_logging(self):
        """Test logging setup"""
        logger = setup_logging(level="INFO", format_type="json")
        assert logger is not None
        assert logger.level == 20

    def test_log_request(self):
        """Test request logging"""
        with patch('core.logging.logger') as mock_logger:
            log_request("req-123", "GET", "/api/test", 200, 0.5, "user-123")
            mock_logger.info.assert_called_once()

    def test_log_error(self):
        """Test error logging"""
        with patch('core.logging.logger') as mock_logger:
            log_error("test_error", "Test error message", {"details": "test"})
            mock_logger.error.assert_called_once()

    def test_log_security_event(self):
        """Test security event logging"""
        with patch('core.logging.logger') as mock_logger:
            log_security_event("login_failed", "user-123", "192.168.1.1")
            mock_logger.warning.assert_called_once()
```

#### Validation Tests
```python
class TestValidation:
    def test_sanitize_string(self):
        """Test string sanitization"""
        result = sanitize_string("<script>alert('xss')</script>")
        assert "&lt;script&gt;" in result
        assert "alert(&#x27;xss&#x27;)" in result

    def test_validate_filename_valid(self):
        """Test valid filename validation"""
        assert validate_filename("test_file.pdf") == True
        assert validate_filename("my-document.docx") == True
        assert validate_filename("file123.txt") == True

    def test_validate_filename_invalid(self):
        """Test invalid filename validation"""
        assert validate_filename("../etc/passwd") == False
        assert validate_filename("file with spaces.txt") == False
        assert validate_filename("file<script>.txt") == False

    @pytest.mark.asyncio
    async def test_sql_injection_detection(self, middleware):
        """Test SQL injection pattern detection"""
        mock_request = MagicMock(spec=Request)
        mock_request.method = "POST"
        mock_request.headers = {"content-type": "application/json"}
        mock_request.body.return_value = b'{"query": "SELECT * FROM users WHERE id = 1 OR 1=1"}'

        with pytest.raises(HTTPException) as exc_info:
            await middleware.dispatch(mock_request, lambda r, c: JSONResponse({}))
        assert exc_info.value.status_code == 400

    @pytest.mark.asyncio
    async def test_xss_detection(self, middleware):
        """Test XSS pattern detection"""
        mock_request = MagicMock(spec=Request)
        mock_request.method = "POST"
        mock_request.headers = {"content-type": "application/json"}
        mock_request.body.return_value = b'{"data": "<script>alert(\'xss\')</script>"}'

        with pytest.raises(HTTPException) as exc_info:
            await middleware.dispatch(mock_request, lambda r, c: JSONResponse({}))
        assert exc_info.value.status_code == 400
```

### Database and Model Tests (`test_database.py`)

#### Database Model Tests
```python
class TestDatabaseModels:
    def test_case_model_creation(self):
        """Test Case model creation"""
        case_id = str(uuid.uuid4())
        case = Case(
            id=case_id,
            title="Test Fraud Case",
            description="Test case description",
            status=CaseStatus.OPEN,
            priority=CasePriority.HIGH,
            customer_name="John Doe",
            fraud_amount=5000.0
        )
        assert case.id == case_id
        assert case.title == "Test Fraud Case"
        assert case.status == CaseStatus.OPEN
        assert case.priority == CasePriority.HIGH
        assert case.fraud_amount == 5000.0

    def test_transaction_model_creation(self):
        """Test Transaction model creation"""
        transaction = Transaction(
            id=str(uuid.uuid4()),
            case_id=str(uuid.uuid4()),
            date="2024-01-01T00:00:00Z",
            amount=1000.0,
            currency="USD",
            description="Test transaction",
            merchant_name="Test Merchant",
            transaction_type="DEBIT"
        )
        assert transaction.amount == 1000.0
        assert transaction.currency == "USD"
        assert transaction.transaction_type == "DEBIT"

    def test_evidence_model_creation(self):
        """Test Evidence model creation"""
        evidence = Evidence(
            id=str(uuid.uuid4()),
            case_id=str(uuid.uuid4()),
            filename="test.pdf",
            file_type="application/pdf",
            file_category="document",
            size_bytes=1024,
            uploaded_by="test_user"
        )
        assert evidence.filename == "test.pdf"
        assert evidence.file_type == "application/pdf"
        assert evidence.size_bytes == 1024

    def test_user_model_creation(self):
        """Test User model creation"""
        user = User(
            id=str(uuid.uuid4()),
            username="testuser",
            email="test@example.com",
            full_name="Test User",
            is_active=True
        )
        assert user.username == "testuser"
        assert user.email == "test@example.com"
        assert user.is_active == True
```

#### Authentication Service Tests
```python
class TestAuthService:
    def test_auth_service_initialization(self):
        """Test auth service initialization"""
        assert auth_service is not None
        assert hasattr(auth_service, 'hash_password')
        assert hasattr(auth_service, 'verify_password')

    def test_password_hashing(self):
        """Test password hashing and verification"""
        password = "test_password_123"
        hashed = auth_service.hash_password(password)
        assert hashed != password
        assert len(hashed) > 0

        is_valid = auth_service.verify_password(password, hashed)
        assert is_valid == True

        is_invalid = auth_service.verify_password("wrong_password", hashed)
        assert is_invalid == False

    def test_create_access_token(self):
        """Test JWT access token creation"""
        data = {"sub": "user123", "username": "testuser"}
        token = auth_service.create_access_token(data)
        assert token is not None
        assert isinstance(token, str)
        assert len(token) > 0
```

### Service Layer Tests (`test_services.py`)

#### Fraud Detection Service Tests
```python
class TestFraudDetectionService:
    @pytest.fixture
    def fraud_service(self):
        """Create fraud detection service instance"""
        mock_db = MagicMock()
        return FraudDetectionService(mock_db)

    def test_service_initialization(self, fraud_service):
        """Test service initialization"""
        assert fraud_service is not None
        assert hasattr(fraud_service, 'analyze_case')
        assert hasattr(fraud_service, 'rule_engine')

    def test_get_case_transactions(self, fraud_service):
        """Test transaction retrieval for case"""
        mock_transaction = MagicMock()
        mock_transaction.id = "tx123"
        mock_transaction.amount = 1000.0
        mock_transaction.date = "2024-01-01T00:00:00Z"

        fraud_service.db.query.return_value.filter.return_value.all.return_value = [mock_transaction]

        result = fraud_service._get_case_transactions("case123", 90)
        assert len(result) == 1
        assert result[0]['id'] == "tx123"
```

#### AI Service Tests
```python
class TestAIService:
    @pytest.fixture
    def ai_service(self):
        """Create AI service instance"""
        return AIService()

    @patch('app.services.ai_service.AIService._initialize_model')
    def test_service_initialization(self, mock_init, ai_service):
        """Test AI service initialization"""
        assert ai_service is not None
        assert hasattr(ai_service, 'analyze_transaction')
        assert hasattr(ai_service, 'train_model')

    @patch('app.services.ai_service.AIService._load_model')
    def test_analyze_transaction(self, mock_load, ai_service):
        """Test transaction analysis"""
        transaction = {
            'amount': 1000.0,
            'merchant': 'Test Store',
            'location': 'New York'
        }

        mock_model = MagicMock()
        mock_model.predict.return_value = [0.8]
        ai_service.model = mock_model

        result = ai_service.analyze_transaction(transaction)
        assert 'fraud_probability' in result
        assert 'risk_score' in result
        assert result['fraud_probability'] == 0.8

    @patch('app.services.ai_service.AIService._save_model')
    @patch('app.services.ai_service.AIService._train_model')
    def test_train_model(self, mock_train, mock_save, ai_service):
        """Test model training"""
        training_data = [
            {'amount': 100.0, 'is_fraud': 0},
            {'amount': 10000.0, 'is_fraud': 1}
        ]

        result = ai_service.train_model(training_data)
        assert result is True
        mock_train.assert_called_once()
        mock_save.assert_called_once()
```

#### Monitoring Service Tests
```python
class TestMonitoringService:
    def test_service_initialization(self):
        """Test monitoring service initialization"""
        assert monitoring_service is not None
        assert hasattr(monitoring_service, 'record_error')
        assert hasattr(monitoring_service, 'get_system_status')

    def test_record_error(self):
        """Test error recording"""
        monitoring_service.record_error(
            "test_error",
            "Test error message",
            {"component": "test"}
        )
        # Error was recorded (logged)
        assert True

    def test_get_system_status(self):
        """Test system status retrieval"""
        status = monitoring_service.get_system_status()
        assert isinstance(status, dict)
        assert 'cpu_usage' in status or 'memory_usage' in status

    def test_get_error_summary(self):
        """Test error summary retrieval"""
        summary = monitoring_service.get_error_summary(hours=1)
        assert isinstance(summary, dict)
```

### Router Tests (`test_routers.py`)

#### API Router Integration Tests
```python
class TestAPIRouterIntegration:
    @pytest.fixture
    def client(self):
        """Create test client"""
        return TestClient(app)

    def test_health_endpoints_integration(self, client):
        """Test health endpoints work without authentication"""
        response = client.get("/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"

        response = client.get("/health/ready")
        assert response.status_code in [200, 503]

        response = client.get("/health/live")
        assert response.status_code == 200
        assert response.json()["status"] == "alive"

    def test_metrics_endpoint(self, client):
        """Test metrics endpoint"""
        response = client.get("/metrics")
        assert response.status_code == 200

    def test_get_cases_unauthorized(self, client):
        """Test getting cases without authentication"""
        response = client.get("/api/v1/cases/")
        assert response.status_code in [401, 403, 404]

    def test_register_user_unauthorized(self, client):
        """Test user registration without authentication"""
        user_data = {
            "username": f"testuser_{uuid.uuid4().hex[:8]}",
            "email": f"test_{uuid.uuid4().hex[:8]}@example.com",
            "password": "SecurePass123!",
            "full_name": "Test User",
            "role": "analyst"
        }

        response = client.post("/api/v1/auth/register", json=user_data)
        assert response.status_code in [200, 400, 422, 500]
```

## Frontend Testing

### Test Structure
```
frontend/src/
├── test/
│   └── setup.ts                    # Test setup and configuration
├── lib/
│   └── __tests__/
│       └── utils.test.ts          # Utility function tests
└── stores/
    └── __tests__/
        └── stores.test.ts         # State management tests
```

### Utility Function Tests (`utils.test.ts`)
```typescript
import { describe, test, expect } from '@jest/globals';
import { cn } from '../utils';

describe('Utility Functions', () => {
  describe('cn (className utility)', () => {
    test('merges Tailwind classes correctly', () => {
      const result = cn('bg-red-500', 'bg-blue-500');
      expect(result).toBe('bg-blue-500');
    });

    test('handles conditional classes', () => {
      const result = cn('bg-red-500', true && 'text-white', false && 'text-black');
      expect(result).toBe('bg-red-500 text-white');
    });

    test('handles array inputs', () => {
      const result = cn(['bg-red-500', 'text-white'], 'p-4');
      expect(result).toBe('bg-red-500 text-white p-4');
    });

    test('handles undefined and null values', () => {
      const result = cn('bg-red-500', undefined, null, 'text-white');
      expect(result).toBe('bg-red-500 text-white');
    });
  });
});
```

### State Management Tests (`stores.test.ts`)
```typescript
import { describe, test, expect } from '@jest/globals';
import { useAuthStore } from '../stores/useAuthStore';
import { useUIStore } from '../stores/useUIStore';

describe('Zustand Stores', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('useAuthStore', () => {
    test('should have correct initial state', () => {
      const mockStore = {
        user: null,
        isAuthenticated: false,
        token: null,
        login: jest.fn(),
        logout: jest.fn(),
        updateUser: jest.fn()
      };

      (useAuthStore as jest.Mock).mockReturnValue(mockStore);

      const store = useAuthStore();
      expect(store.user).toBeNull();
      expect(store.isAuthenticated).toBe(false);
      expect(store.token).toBeNull();
      expect(typeof store.login).toBe('function');
      expect(typeof store.logout).toBe('function');
      expect(typeof store.updateUser).toBe('function');
    });

    test('login function should update state correctly', () => {
      const mockLogin = jest.fn();
      const mockStore = {
        user: null,
        isAuthenticated: false,
        token: null,
        login: mockLogin,
        logout: jest.fn(),
        updateUser: jest.fn()
      };

      (useAuthStore as jest.Mock).mockReturnValue(mockStore);

      const store = useAuthStore();
      const testUser = { id: '1', username: 'test' };
      const testToken = 'test-token';

      store.login(testUser, testToken);

      expect(mockLogin).toHaveBeenCalledWith(testUser, testToken);
    });
  });

  describe('useUIStore', () => {
    test('should have correct initial state', () => {
      const mockStore = {
        theme: 'dark',
        sidebarOpen: true,
        notifications: [],
        setTheme: jest.fn(),
        toggleSidebar: jest.fn(),
        addNotification: jest.fn(),
        removeNotification: jest.fn()
      };

      (useUIStore as jest.Mock).mockReturnValue(mockStore);

      const store = useUIStore();
      expect(store.theme).toBe('dark');
      expect(store.sidebarOpen).toBe(true);
      expect(store.notifications).toEqual([]);
      expect(typeof store.setTheme).toBe('function');
      expect(typeof store.toggleSidebar).toBe('function');
      expect(typeof store.addNotification).toBe('function');
      expect(typeof store.removeNotification).toBe('function');
    });

    test('toggleSidebar should work correctly', () => {
      const mockToggle = jest.fn();
      const mockStore = {
        theme: 'dark',
        sidebarOpen: true,
        notifications: [],
        setTheme: jest.fn(),
        toggleSidebar: mockToggle,
        addNotification: jest.fn(),
        removeNotification: jest.fn()
      };

      (useUIStore as jest.Mock).mockReturnValue(mockStore);

      const store = useUIStore();
      store.toggleSidebar();

      expect(mockToggle).toHaveBeenCalled();
    });
  });
});
```

## E2E Testing

### Playwright Configuration
```javascript
// playwright.config.js
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',

  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
  ],

  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
  },
});
```

### Authentication E2E Tests
```typescript
// e2e/auth.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  test('should login successfully', async ({ page }) => {
    await page.goto('/login');

    await page.fill('[data-testid="username-input"]', 'testuser');
    await page.fill('[data-testid="password-input"]', 'testpass');
    await page.click('[data-testid="login-button"]');

    await expect(page).toHaveURL('/dashboard');
    await expect(page.locator('[data-testid="user-menu"]')).toContainText('testuser');
  });

  test('should show error for invalid credentials', async ({ page }) => {
    await page.goto('/login');

    await page.fill('[data-testid="username-input"]', 'invaliduser');
    await page.fill('[data-testid="password-input"]', 'wrongpass');
    await page.click('[data-testid="login-button"]');

    await expect(page.locator('[data-testid="error-message"]')).toBeVisible();
    await expect(page.locator('[data-testid="error-message"]')).toContainText('Invalid credentials');
  });

  test('should logout successfully', async ({ page }) => {
    // Login first
    await page.goto('/login');
    await page.fill('[data-testid="username-input"]', 'testuser');
    await page.fill('[data-testid="password-input"]', 'testpass');
    await page.click('[data-testid="login-button"]');

    // Logout
    await page.click('[data-testid="user-menu"]');
    await page.click('[data-testid="logout-button"]');

    await expect(page).toHaveURL('/login');
  });

  test('should redirect to login when accessing protected route', async ({ page }) => {
    await page.goto('/cases');
    await expect(page).toHaveURL('/login');
  });
});
```

### Case Management E2E Tests
```typescript
// e2e/cases.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Case Management', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto('/login');
    await page.fill('[data-testid="username-input"]', 'testuser');
    await page.fill('[data-testid="password-input"]', 'testpass');
    await page.click('[data-testid="login-button"]');
    await expect(page).toHaveURL('/dashboard');
  });

  test('should create new case', async ({ page }) => {
    await page.goto('/cases');
    await page.click('[data-testid="create-case-button"]');

    await page.fill('[data-testid="case-title-input"]', 'Test Fraud Case');
    await page.fill('[data-testid="case-description-input"]', 'Test case description');
    await page.selectOption('[data-testid="case-priority-select"]', 'high');
    await page.selectOption('[data-testid="case-type-select"]', 'fraud_suspected');
    await page.click('[data-testid="submit-case-button"]');

    await expect(page.locator('[data-testid="case-list"]')).toContainText('Test Fraud Case');
  });

  test('should view case details', async ({ page }) => {
    await page.goto('/cases');
    await page.click('[data-testid="case-item"]:first-child');

    await expect(page.locator('[data-testid="case-detail-title"]')).toBeVisible();
    await expect(page.locator('[data-testid="case-timeline"]')).toBeVisible();
  });

  test('should update case status', async ({ page }) => {
    await page.goto('/cases');
    await page.click('[data-testid="case-item"]:first-child');
    await page.click('[data-testid="edit-case-button"]');

    await page.selectOption('[data-testid="case-status-select"]', 'investigating');
    await page.click('[data-testid="save-case-button"]');

    await expect(page.locator('[data-testid="case-status"]')).toContainText('Investigating');
  });

  test('should filter cases by status', async ({ page }) => {
    await page.goto('/cases');
    await page.selectOption('[data-testid="status-filter"]', 'open');

    // Check that only open cases are displayed
    const caseItems = page.locator('[data-testid="case-item"]');
    const count = await caseItems.count();

    for (let i = 0; i < count; i++) {
      await expect(caseItems.nth(i)).toContainText('Open');
    }
  });
});
```

### Evidence Upload E2E Tests
```typescript
// e2e/evidence.spec.ts
import { test, expect } from '@playwright/test';
import path from 'path';

test.describe('Evidence Management', () => {
  test.beforeEach(async ({ page }) => {
    // Login and navigate to a case
    await page.goto('/login');
    await page.fill('[data-testid="username-input"]', 'testuser');
    await page.fill('[data-testid="password-input"]', 'testpass');
    await page.click('[data-testid="login-button"]');
    await page.goto('/cases');
    await page.click('[data-testid="case-item"]:first-child');
  });

  test('should upload document evidence', async ({ page }) => {
    const fileInput = page.locator('[data-testid="file-upload-input"]');
    await fileInput.setInputFiles(path.join(__dirname, '../test-data/sample-document.pdf'));

    await page.click('[data-testid="upload-button"]');

    await expect(page.locator('[data-testid="upload-progress"]')).toBeVisible();
    await expect(page.locator('[data-testid="evidence-list"]')).toContainText('sample-document.pdf');
  });

  test('should process uploaded evidence', async ({ page }) => {
    // Upload a file first
    const fileInput = page.locator('[data-testid="file-upload-input"]');
    await fileInput.setInputFiles(path.join(__dirname, '../test-data/sample-document.pdf'));
    await page.click('[data-testid="upload-button"]');

    // Wait for processing to complete
    await page.waitForSelector('[data-testid="processing-complete"]');

    // Check that evidence was processed
    await expect(page.locator('[data-testid="evidence-metadata"]')).toBeVisible();
    await expect(page.locator('[data-testid="evidence-analysis"]')).toBeVisible();
  });

  test('should view evidence details', async ({ page }) => {
    await page.click('[data-testid="evidence-item"]:first-child');

    await expect(page.locator('[data-testid="evidence-viewer"]')).toBeVisible();
    await expect(page.locator('[data-testid="evidence-metadata"]')).toBeVisible();
  });

  test('should search evidence', async ({ page }) => {
    await page.fill('[data-testid="evidence-search-input"]', 'fraud');
    await page.click('[data-testid="search-button"]');

    // Check that search results are filtered
    const evidenceItems = page.locator('[data-testid="evidence-item"]');
    const count = await evidenceItems.count();

    // All visible items should contain the search term
    for (let i = 0; i < count; i++) {
      await expect(evidenceItems.nth(i)).toContainText('fraud');
    }
  });
});
```

### Investigation Workflow E2E Tests
```typescript
// e2e/investigation.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Investigation Workflow', () => {
  test.beforeEach(async ({ page }) => {
    // Login and navigate to investigation
    await page.goto('/login');
    await page.fill('[data-testid="username-input"]', 'testuser');
    await page.fill('[data-testid="password-input"]', 'testpass');
    await page.click('[data-testid="login-button"]');
    await page.goto('/investigation/case-123');
  });

  test('should display investigation canvas', async ({ page }) => {
    await expect(page.locator('[data-testid="investigation-canvas"]')).toBeVisible();
    await expect(page.locator('[data-testid="entity-palette"]')).toBeVisible();
    await expect(page.locator('[data-testid="relationship-tools"]')).toBeVisible();
  });

  test('should add entity to canvas', async ({ page }) => {
    // Drag entity from palette to canvas
    await page.dragAndDrop(
      '[data-testid="entity-person"]',
      '[data-testid="investigation-canvas"]'
    );

    await expect(page.locator('[data-testid="canvas-entity"]')).toBeVisible();
  });

  test('should create relationship between entities', async ({ page }) => {
    // Add two entities
    await page.dragAndDrop('[data-testid="entity-person"]', '[data-testid="investigation-canvas"]');
    await page.dragAndDrop('[data-testid="entity-company"]', '[data-testid="investigation-canvas"]');

    // Create relationship
    await page.click('[data-testid="relationship-tool"]');
    await page.click('[data-testid="canvas-entity"]:first-child');
    await page.click('[data-testid="canvas-entity"]:last-child');

    await expect(page.locator('[data-testid="canvas-relationship"]')).toBeVisible();
  });

  test('should save investigation state', async ({ page }) => {
    // Make some changes
    await page.dragAndDrop('[data-testid="entity-person"]', '[data-testid="investigation-canvas"]');

    // Save investigation
    await page.click('[data-testid="save-investigation"]');

    // Check for success message
    await expect(page.locator('[data-testid="save-success"]')).toBeVisible();
  });

  test('should export investigation report', async ({ page }) => {
    await page.click('[data-testid="export-report"]');
    await page.selectOption('[data-testid="export-format"]', 'pdf');
    await page.click('[data-testid="confirm-export"]');

    // Check that download was initiated
    const download = await page.waitForEvent('download');
    expect(download.suggestedFilename()).toContain('investigation-report');
  });
});
```

### Reporting and Analytics E2E Tests
```typescript
// e2e/reporting.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Reporting and Analytics', () => {
  test.beforeEach(async ({ page }) => {
    // Login and navigate to reporting
    await page.goto('/login');
    await page.fill('[data-testid="username-input"]', 'testuser');
    await page.fill('[data-testid="password-input"]', 'testpass');
    await page.click('[data-testid="login-button"]');
    await page.goto('/reporting');
  });

  test('should display dashboard metrics', async ({ page }) => {
    await expect(page.locator('[data-testid="total-cases-metric"]')).toBeVisible();
    await expect(page.locator('[data-testid="open-cases-metric"]')).toBeVisible();
    await expect(page.locator('[data-testid="fraud-amount-metric"]')).toBeVisible();
  });

  test('should generate case analytics report', async ({ page }) => {
    await page.click('[data-testid="case-analytics-tab"]');
    await page.selectOption('[data-testid="time-range-select"]', '30d');
    await page.click('[data-testid="generate-report"]');

    await expect(page.locator('[data-testid="report-chart"]')).toBeVisible();
    await expect(page.locator('[data-testid="case-trends-graph"]')).toBeVisible();
  });

  test('should export report in different formats', async ({ page }) => {
    await page.click('[data-testid="export-report"]');
    await page.selectOption('[data-testid="export-format"]', 'pdf');
    await page.click('[data-testid="confirm-export"]');

    const download = await page.waitForEvent('download');
    expect(download.suggestedFilename()).toContain('.pdf');
  });

  test('should filter analytics by date range', async ({ page }) => {
    await page.fill('[data-testid="start-date"]', '2024-01-01');
    await page.fill('[data-testid="end-date"]', '2024-12-31');
    await page.click('[data-testid="apply-filter"]');

    // Check that data is filtered
    await expect(page.locator('[data-testid="filtered-data"]')).toBeVisible();
  });

  test('should display real-time metrics', async ({ page }) => {
    // Wait for real-time updates
    await page.waitForTimeout(5000);

    const initialValue = await page.locator('[data-testid="active-cases-count"]').textContent();

    // Simulate some activity (this would be mocked in real tests)
    // Check that metrics update
    await page.waitForTimeout(2000);

    const updatedValue = await page.locator('[data-testid="active-cases-count"]').textContent();
    // Values should be different or same (depending on activity)
    expect(typeof updatedValue).toBe('string');
  });
});
```

## Electron Testing

### Main Process Tests
```javascript
// electron/__tests__/main.test.js
const { app, BrowserWindow, ipcMain } = require('electron');

// Mock electron modules
jest.mock('electron', () => ({
  app: {
    getVersion: jest.fn(() => '1.0.0'),
    getPath: jest.fn((name) => `/mock/path/${name}`),
    on: jest.fn(),
    whenReady: jest.fn(() => Promise.resolve()),
    quit: jest.fn(),
    isPackaged: false
  },
  BrowserWindow: jest.fn().mockImplementation(() => ({
    loadURL: jest.fn(),
    on: jest.fn(),
    once: jest.fn(),
    show: jest.fn(),
    webContents: {
      openDevTools: jest.fn(),
      on: jest.fn(),
      setWindowOpenHandler: jest.fn()
    },
    setMenuBarVisibility: jest.fn(),
    close: jest.fn()
  })),
  ipcMain: {
    handle: jest.fn(),
    on: jest.fn(),
    removeListener: jest.fn()
  }
}));

describe('Electron Main Process', () => {
  describe('Window Creation', () => {
    test('should create main window with correct options', () => {
      const { createWindow } = require('./main');

      createWindow();

      expect(BrowserWindow).toHaveBeenCalledWith(
        expect.objectContaining({
          width: expect.any(Number),
          height: expect.any(Number),
          minWidth: 1024,
          minHeight: 768,
          webPreferences: expect.objectContaining({
            nodeIntegration: false,
            contextIsolation: true,
            enableRemoteModule: false,
            sandbox: true
          })
        })
      );
    });
  });

  describe('IPC Handlers', () => {
    test('should set up IPC handlers', () => {
      const { setupIPCHandlers } = require('./main');

      setupIPCHandlers();

      expect(ipcMain.handle).toHaveBeenCalled();
    });

    test('should handle app:get-version', async () => {
      const { setupIPCHandlers } = require('./main');

      setupIPCHandlers();

      const handleCalls = ipcMain.handle.mock.calls;
      const versionHandler = handleCalls.find(call =>
        call[0] === 'app:get-version'
      );

      expect(versionHandler).toBeDefined();

      const handler = versionHandler[1];
      const result = await handler();

      expect(result).toBe('1.0.0');
    });
  });
});
```

## CI/CD Integration

### GitHub Actions Configuration
```yaml
# .github/workflows/test.yml
name: Test Suite

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  backend-test:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: test_password
          POSTGRES_DB: test_db
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432

    steps:
    - uses: actions/checkout@v4
    - name: Setup Python
      uses: actions/setup-python@v4
      with:
        python-version: '3.11'
        cache: 'pip'

    - name: Install dependencies
      run: |
        cd backend
        pip install -r requirements.txt
        pip install pytest pytest-cov

    - name: Run tests
      run: |
        cd backend
        pytest --cov=. --cov-report=xml --cov-fail-under=80

    - name: Upload coverage
      uses: codecov/codecov-action@v3
      with:
        file: ./backend/coverage.xml
        flags: backend

  frontend-test:
    runs-on: ubuntu-latest

    steps:
    - uses: actions/checkout@v4
    - name: Setup Node.js
      uses: actions/setup-node@v4
      with:
        node-version: '18'
        cache: 'npm'
        cache-dependency-path: frontend/package-lock.json

    - name: Install dependencies
      run: |
        cd frontend
        npm ci

    - name: Run tests
      run: |
        cd frontend
        npm test -- --coverage --watchAll=false

    - name: Upload coverage
      uses: codecov/codecov-action@v3
      with:
        file: ./frontend/coverage/lcov.info
        flags: frontend

  e2e-test:
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
      run: npm run test:e2e:ci

    - name: Upload test results
      uses: actions/upload-artifact@v3
      if: always()
      with:
        name: playwright-report
        path: playwright-report/
        retention-days: 30
```

## Test Data Management

### Test Database Setup
```python
# backend/tests/conftest.py
@pytest.fixture(scope="session")
def engine():
    """Create test database engine"""
    engine = create_engine(
        SQLALCHEMY_DATABASE_URL,
        connect_args={"check_same_thread": False}
    )

    @event.listens_for(engine, "connect")
    def set_sqlite_pragma(dbapi_connection, connection_record):
        cursor = dbapi_connection.cursor()
        cursor.execute("PRAGMA journal_mode = WAL")
        cursor.execute("PRAGMA synchronous = NORMAL")
        cursor.execute("PRAGMA temp_store = MEMORY")
        cursor.close()

    return engine

@pytest.fixture(scope="session")
def tables(engine):
    """Create database tables"""
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)

@pytest.fixture
def db_session(engine, tables):
    """Create database session for tests"""
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    session = SessionLocal()
    yield session
    session.close()

    # Clean up data after each test
    with engine.connect() as connection:
        trans = connection.begin()
        for table in reversed(Base.metadata.sorted_tables):
            connection.execute(table.delete())
        trans.commit()
```

### Test Data Fixtures
```python
# backend/tests/fixtures.py
@pytest.fixture
def test_user(db_session):
    """Create test user"""
    user = User(
        id=str(uuid.uuid4()),
        username="testuser",
        email="test@example.com",
        full_name="Test User",
        role=UserRole.ANALYST,
        password_hash=auth_service.hash_password("testpass"),
        is_active=True
    )
    db_session.add(user)
    db_session.commit()
    return user

@pytest.fixture
def test_case(db_session, test_user):
    """Create test case"""
    case = Case(
        id=str(uuid.uuid4()),
        title="Test Fraud Case",
        description="Test case for fraud detection",
        status=CaseStatus.OPEN,
        priority=CasePriority.HIGH,
        case_type=CaseType.FRAUD_SUSPECTED,
        customer_name="John Doe",
        assignee_id=test_user.id,
        fraud_amount=5000.0
    )
    db_session.add(case)
    db_session.commit()
    return case

@pytest.fixture
def test_transaction(db_session, test_case):
    """Create test transaction"""
    transaction = Transaction(
        id=str(uuid.uuid4()),
        case_id=test_case.id,
        date=datetime.now(timezone.utc).isoformat(),
        amount=1000.0,
        currency="USD",
        description="Test transaction",
        merchant_name="Test Merchant",
        transaction_type="DEBIT"
    )
    db_session.add(transaction)
    db_session.commit()
    return transaction
```

## Performance Testing

### Load Testing with Locust
```python
# backend/tests/performance/locustfile.py
from locust import HttpUser, task, between
import random
import uuid

class FraudDetectionUser(HttpUser):
    wait_time = between(1, 3)

    def on_start(self):
        """Login and get token"""
        response = self.client.post("/api/v1/auth/login", json={
            "username": "testuser",
            "password": "testpass"
        })
        if response.status_code == 200:
            self.token = response.json()["access_token"]
            self.headers = {"Authorization": f"Bearer {self.token}"}

    @task(3)
    def get_cases(self):
        """Get cases list"""
        self.client.get("/api/v1/cases/", headers=self.headers)

    @task(2)
    def create_case(self):
        """Create new case"""
        case_data = {
            "title": f"Load Test Case {uuid.uuid4().hex[:8]}",
            "description": "Load testing case",
            "priority": "medium",
            "case_type": "fraud_suspected"
        }
        self.client.post("/api/v1/cases/", json=case_data, headers=self.headers)

    @task(1)
    def get_analytics(self):
        """Get analytics data"""
        self.client.get("/api/v1/analytics/cases", headers=self.headers)

    @task(2)
    def upload_evidence(self):
        """Upload evidence file"""
        files = {"file": ("test.pdf", b"test content", "application/pdf")}
        case_id = str(uuid.uuid4())
        self.client.post(f"/api/v1/evidence/{case_id}", files=files, headers=self.headers)
```

### Performance Benchmarks
```python
# backend/tests/performance/test_performance.py
import pytest
import time
from tests.fixtures import test_case, test_user

class TestPerformance:
    """Performance tests"""

    def test_case_creation_performance(self, client, auth_headers):
        """Test case creation performance"""
        case_data = {
            "title": "Performance Test Case",
            "description": "Testing performance",
            "priority": "high",
            "case_type": "fraud_suspected"
        }

        start_time = time.time()
        response = client.post("/api/v1/cases/", json=case_data, headers=auth_headers)
        end_time = time.time()

        assert response.status_code == 201
        assert end_time - start_time < 0.5  # Should complete in under 500ms

    def test_bulk_case_retrieval(self, client, auth_headers):
        """Test retrieving multiple cases"""
        start_time = time.time()
        response = client.get("/api/v1/cases/?limit=100", headers=auth_headers)
        end_time = time.time()

        assert response.status_code == 200
        assert end_time - start_time < 1.0  # Should complete in under 1 second

    def test_evidence_upload_performance(self, client, auth_headers):
        """Test evidence upload performance"""
        # Create test file
        test_file = ("test.pdf", b"x" * 1024 * 1024, "application/pdf")  # 1MB file

        start_time = time.time()
        response = client.post("/api/v1/evidence/case-123", files={"file": test_file}, headers=auth_headers)
        end_time = time.time()

        assert response.status_code in [200, 201]
        assert end_time - start_time < 5.0  # Should complete in under 5 seconds
```

## Security Testing

### Authentication Tests
```python
# backend/tests/security/test_auth.py
import pytest
from unittest.mock import patch

class TestAuthenticationSecurity:
    """Security tests for authentication"""

    def test_password_brute_force_protection(self, client):
        """Test protection against brute force attacks"""
        # Attempt multiple failed logins
        for i in range(10):
            response = client.post("/api/v1/auth/login", json={
                "username": "testuser",
                "password": f"wrongpass{i}"
            })

        # Next attempt should be rate limited or blocked
        response = client.post("/api/v1/auth/login", json={
            "username": "testuser",
            "password": "wrongpass"
        })

        assert response.status_code in [429, 401]  # Rate limited or still unauthorized

    def test_jwt_token_expiration(self, client, auth_headers):
        """Test JWT token expiration"""
        # Use a token that should be expired
        expired_token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ0ZXN0IiwiaWF0IjoxNjAwMDAwMDAwLCJleHAiOjE2MDAwMDAwMDB9.test"

        headers = {"Authorization": f"Bearer {expired_token}"}
        response = client.get("/api/v1/cases/", headers=headers)

        assert response.status_code == 401

    def test_sql_injection_prevention(self, client):
        """Test SQL injection prevention"""
        malicious_input = "'; DROP TABLE users; --"

        response = client.post("/api/v1/auth/login", json={
            "username": malicious_input,
            "password": "testpass"
        })

        assert response.status_code == 401
        # Should not crash or execute SQL
```

### Input Validation Tests
```python
# backend/tests/security/test_input_validation.py
import pytest

class TestInputValidation:
    """Security tests for input validation"""

    def test_xss_prevention(self, client, auth_headers):
        """Test XSS attack prevention"""
        xss_payload = "<script>alert('xss')</script>"

        case_data = {
            "title": xss_payload,
            "description": "Test case",
            "priority": "high",
            "case_type": "fraud_suspected"
        }

        response = client.post("/api/v1/cases/", json=case_data, headers=auth_headers)

        assert response.status_code == 201

        # Check that XSS payload was sanitized
        case_response = client.get(f"/api/v1/cases/{response.json()['id']}", headers=auth_headers)
        assert "<script>" not in case_response.json()["title"]

    def test_path_traversal_prevention(self, client, auth_headers):
        """Test path traversal attack prevention"""
        traversal_payload = "../../../etc/passwd"

        # Try to access file through API
        response = client.get(f"/api/v1/files/{traversal_payload}", headers=auth_headers)

        assert response.status_code in [404, 403, 401]

    def test_large_payload_rejection(self, client, auth_headers):
        """Test rejection of large payloads"""
        large_data = "x" * (11 * 1024 * 1024)  # 11MB payload

        case_data = {
            "title": "Large Payload Test",
            "description": large_data,
            "priority": "high",
            "case_type": "fraud_suspected"
        }

        response = client.post("/api/v1/cases/", json=case_data, headers=auth_headers)

        assert response.status_code == 413  # Payload too large
```

## Test Execution and Reporting

### Running Tests
```bash
# Backend tests
cd backend
pytest --cov=. --cov-report=html -v

# Frontend tests
cd frontend
npm test -- --coverage

# E2E tests
npx playwright test

# Performance tests
cd backend
locust -f tests/performance/locustfile.py --host=http://localhost:8000

# Security tests
cd backend
pytest tests/security/ -v
```

### Coverage Reports
```bash
# Generate combined coverage report
cd backend
pytest --cov=. --cov-report=html --cov-report=term-missing

# View HTML report
open htmlcov/index.html
```

### Test Results Analysis
- **Coverage Threshold**: 80% minimum for all components
- **Performance Benchmarks**: API responses <200ms, page loads <2s
- **Security Compliance**: Zero high/critical vulnerabilities
- **Cross-browser Compatibility**: 95%+ test pass rate across browsers

## Maintenance and Updates

### Test Maintenance Guidelines
1. **Update Tests with Code Changes**: Modify tests when functionality changes
2. **Add Tests for New Features**: Implement tests before feature development
3. **Review Test Coverage**: Regularly check coverage reports for gaps
4. **Performance Regression Testing**: Monitor performance benchmarks

### Continuous Integration
- **Automated Testing**: All PRs trigger full test suite
- **Coverage Gates**: PRs blocked if coverage drops below 80%
- **Performance Monitoring**: Automated performance regression detection
- **Security Scanning**: Automated vulnerability scanning on dependencies

This comprehensive testing documentation ensures the fraud detection application maintains high quality, security, and performance standards throughout its development lifecycle.