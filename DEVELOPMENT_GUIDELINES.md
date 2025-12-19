# Development Guidelines & Best Practices

## Overview

This document establishes coding standards, development workflows, and best practices for the 378x492 Fraud Detection Platform to ensure code quality, maintainability, and scalability.

## Code Organization Standards

### File Structure Guidelines

#### Frontend Structure
```
frontend/src/
├── components/           # Reusable UI components
│   ├── ui/              # Basic UI primitives (Button, Input, etc.)
│   ├── common/          # Shared components (ErrorBoundary, LoadingState)
│   ├── [feature]/       # Feature-specific components
│   └── types/           # TypeScript type definitions
├── pages/               # Route components
├── hooks/               # Custom React hooks
├── utils/               # Utility functions
├── services/            # API and external service integrations
├── context/             # React context providers
├── types/               # Global type definitions
└── lib/                 # Third-party library configurations
```

#### Backend Structure
```
backend/
├── app/
│   ├── routers/         # API route handlers
│   ├── services/        # Business logic
│   ├── models/          # Database models
│   └── middleware/      # Custom middleware
├── core/                # Core functionality
│   ├── database/        # Database configuration
│   ├── security/        # Security utilities
│   └── logging/         # Logging configuration
├── tests/               # Test suites
└── scripts/             # Maintenance scripts
```

### File Size Limits

#### Maximum Lines per File
- **Components**: 300 lines
- **Utilities**: 200 lines
- **Services**: 400 lines
- **Tests**: 500 lines

#### When to Split Files
```typescript
// ❌ Too many responsibilities in one file
const Dashboard = () => {
  // 800 lines of mixed logic...
}

// ✅ Split into focused components
// Dashboard.tsx (orchestration)
const Dashboard = () => <DashboardLayout />;

// DashboardLayout.tsx (layout)
const DashboardLayout = () => { /* layout logic */ };

// DashboardMetrics.tsx (data display)
const DashboardMetrics = () => { /* metrics display */ };
```

## TypeScript Standards

### Type Definitions

#### Interface Organization
```typescript
// ✅ Group related interfaces
interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

interface UserProfile extends User {
  avatar?: string;
  preferences: UserPreferences;
}

// ✅ Use type unions for enums
type UserRole = 'admin' | 'analyst' | 'viewer';

// ❌ Avoid any types
const processData = (data: any) => { /* ... */ }

// ✅ Use proper typing
const processData = (data: Record<string, unknown>) => { /* ... */ }
```

#### Generic Type Usage
```typescript
// ✅ Use generics for reusable components
interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
}

const useApi = <T>(endpoint: string): ApiResponse<T> => {
  // Implementation
};
```

### Import/Export Patterns

#### Import Organization
```typescript
// ✅ Group and order imports logically
import React, { useState, useEffect } from 'react';

// Third-party libraries (alphabetical)
import { motion } from 'framer-motion';
import { format } from 'date-fns';

// Local imports (relative)
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/hooks/useAuth';
import type { User } from '@/types/user';

// Type-only imports
import type { ApiResponse } from '@/types/api';
```

#### Export Patterns
```typescript
// ✅ Named exports preferred
export const formatDate = (date: Date) => { /* ... */ };
export const validateEmail = (email: string) => { /* ... */ };

// ✅ Default export for components
export default function UserProfile({ user }: UserProfileProps) {
  return <div>{user.name}</div>;
}
```

## Component Development

### React Best Practices

#### Component Structure
```typescript
// ✅ Functional components with hooks
const UserProfile: React.FC<UserProfileProps> = ({ user, onUpdate }) => {
  const [isEditing, setIsEditing] = useState(false);

  const handleSubmit = useCallback(async (data: UserData) => {
    await onUpdate(data);
    setIsEditing(false);
  }, [onUpdate]);

  return (
    <div className="user-profile">
      {/* Component JSX */}
    </div>
  );
};
```

#### Props Interface
```typescript
// ✅ Comprehensive prop interfaces
interface UserProfileProps {
  user: User;
  onUpdate: (user: User) => Promise<void>;
  isLoading?: boolean;
  className?: string;
}

// ✅ Use React.FC for typed components
const UserProfile: React.FC<UserProfileProps> = ({ /* props */ }) => { /* ... */ };
```

### Performance Optimization

#### Memoization Guidelines
```typescript
// ✅ Memoize expensive computations
const filteredUsers = useMemo(() => {
  return users.filter(user => user.active);
}, [users]);

// ✅ Memoize callbacks
const handleUserSelect = useCallback((userId: string) => {
  setSelectedUserId(userId);
}, []);

// ✅ Memoize components when appropriate
const UserList = React.memo<UserListProps>(({ users, onSelect }) => {
  return (
    <ul>
      {users.map(user => (
        <li key={user.id} onClick={() => onSelect(user.id)}>
          {user.name}
        </li>
      ))}
    </ul>
  );
});
```

#### Lazy Loading
```typescript
// ✅ Lazy load heavy components
const HeavyChart = React.lazy(() =>
  import(/* webpackChunkName: "charts" */ '@/components/charts/HeavyChart')
);

// ✅ Use Suspense boundaries
<Suspense fallback={<LoadingSpinner />}>
  <HeavyChart data={chartData} />
</Suspense>
```

## State Management

### Local State Guidelines

#### When to Use Local State
```typescript
// ✅ Component-specific state
const ToggleButton = () => {
  const [isOpen, setIsOpen] = useState(false);
  return <button onClick={() => setIsOpen(!isOpen)}>{isOpen ? 'Close' : 'Open'}</button>;
};

// ✅ Form state
const LoginForm = () => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  // Form logic...
};
```

#### When to Lift State Up
```typescript
// ✅ Shared state between siblings
const ParentComponent = () => {
  const [selectedItem, setSelectedItem] = useState<string | null>(null);

  return (
    <div>
      <ItemList onSelect={setSelectedItem} />
      <ItemDetails itemId={selectedItem} />
    </div>
  );
};
```

### Global State Management

#### Context Usage
```typescript
// ✅ Create focused contexts
const UserContext = createContext<UserContextType | null>(null);

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);

  return (
    <UserContext.Provider value={{ user, setUser }}>
      {children}
    </UserContext.Provider>
  );
};

// ✅ Custom hook for context usage
export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within UserProvider');
  }
  return context;
};
```

## API Integration

### Service Layer Organization

#### API Service Structure
```typescript
// ✅ Organize by domain
export class UserService {
  static async getUsers(): Promise<User[]> {
    const response = await apiClient.get('/users');
    return response.data;
  }

  static async createUser(userData: CreateUserData): Promise<User> {
    const response = await apiClient.post('/users', userData);
    return response.data;
  }
}
```

#### Error Handling
```typescript
// ✅ Consistent error handling
export const handleApiError = (error: unknown): string => {
  if (error instanceof ApiError) {
    return error.message;
  }

  if (error instanceof NetworkError) {
    return 'Network error. Please check your connection.';
  }

  console.error('Unexpected error:', error);
  return 'An unexpected error occurred.';
};
```

### Custom Hooks for API Calls

```typescript
// ✅ Encapsulate API logic in hooks
export const useUsers = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await UserService.getUsers();
      setUsers(data);
    } catch (err) {
      setError(handleApiError(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  return { users, loading, error, refetch: fetchUsers };
};
```

## Testing Standards

### Test Organization

#### Test File Structure
```
__tests__/
├── unit/                 # Unit tests
├── integration/          # Integration tests
├── e2e/                  # End-to-end tests
└── utils/                # Test utilities
```

#### Test Naming Convention
```typescript
// ✅ Descriptive test names
describe('UserProfile', () => {
  it('should display user name', () => {
    // Test implementation
  });

  it('should call onUpdate when form is submitted', () => {
    // Test implementation
  });
});
```

### Testing Best Practices

#### Component Testing
```typescript
// ✅ Test user interactions
import { render, screen, fireEvent } from '@testing-library/react';

test('UserProfile updates name', () => {
  const mockOnUpdate = jest.fn();
  render(<UserProfile user={testUser} onUpdate={mockOnUpdate} />);

  const input = screen.getByLabelText(/name/i);
  fireEvent.change(input, { target: { value: 'New Name' } });

  const submitButton = screen.getByRole('button', { name: /save/i });
  fireEvent.click(submitButton);

  expect(mockOnUpdate).toHaveBeenCalledWith(
    expect.objectContaining({ name: 'New Name' })
  );
});
```

#### Hook Testing
```typescript
// ✅ Test custom hooks
import { renderHook, act } from '@testing-library/react';
import { useCounter } from '@/hooks/useCounter';

test('useCounter increments', () => {
  const { result } = renderHook(() => useCounter());

  act(() => {
    result.current.increment();
  });

  expect(result.current.count).toBe(1);
});
```

## Security Standards

### Input Validation

#### Frontend Validation
```typescript
// ✅ Validate inputs on both client and server
const emailSchema = z.string()
  .min(1, 'Email is required')
  .email('Invalid email format');

const passwordSchema = z.string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Password must contain uppercase, lowercase, and number');
```

#### XSS Prevention
```typescript
// ✅ Sanitize user input
import DOMPurify from 'dompurify';

const sanitizeInput = (input: string): string => {
  return DOMPurify.sanitize(input, {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: []
  });
};
```

### Authentication Security

#### Secure Storage
```typescript
// ✅ Use secure storage for sensitive data
import { secureTokenStorage } from '@/utils/secureTokenStorage';

// Store tokens securely
secureTokenStorage.setAccessToken(token);
secureTokenStorage.setRefreshToken(refreshToken);

// Retrieve tokens
const token = secureTokenStorage.getAccessToken();
```

## Code Quality Tools

### ESLint Configuration

#### Rules for Code Quality
```javascript
// .eslintrc.js
module.exports = {
  extends: [
    'react-app',
    '@typescript-eslint/recommended',
    'prettier'
  ],
  rules: {
    // Custom rules for this project
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    '@typescript-eslint/no-explicit-any': 'error',
    'react-hooks/exhaustive-deps': 'error',
    'import/order': ['error', {
      groups: ['builtin', 'external', 'internal', 'parent', 'sibling', 'index']
    }]
  }
};
```

### Pre-commit Hooks

#### Husky Configuration
```javascript
// .husky/pre-commit
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

npm run lint
npm run type-check
npm run test:unit
```

### Automated Code Review

#### Pull Request Checks
```yaml
# .github/workflows/pr-checks.yml
name: PR Checks
on: [pull_request]

jobs:
  code-quality:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      - name: Install dependencies
        run: npm ci
      - name: Run linter
        run: npm run lint
      - name: Run type checker
        run: npm run type-check
      - name: Run tests
        run: npm run test:unit
```

## Performance Monitoring

### Bundle Size Tracking

#### Automated Bundle Analysis
```javascript
// webpack.config.js
const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');

module.exports = {
  plugins: [
    ...(process.env.ANALYZE === 'true' ? [
      new BundleAnalyzerPlugin({
        analyzerMode: 'static',
        reportFilename: 'bundle-report.html'
      })
    ] : [])
  ]
};
```

### Performance Budgets

#### Lighthouse CI
```json
{
  "ci": {
    "assert": {
      "assertions": {
        "categories:performance": ["error", { "minScore": 0.9 }],
        "categories:accessibility": ["error", { "minScore": 0.9 }],
        "categories:seo": ["error", { "minScore": 0.8 }]
      }
    }
  }
}
```

## Documentation Standards

### Code Documentation

#### JSDoc Comments
```typescript
/**
 * Formats a date according to the user's locale and preferences
 * @param date - The date to format
 * @param options - Formatting options
 * @returns Formatted date string
 */
export const formatDate = (
  date: Date,
  options: DateFormatOptions = {}
): string => {
  // Implementation
};
```

#### Component Documentation
```typescript
interface ButtonProps {
  /** The button's visual variant */
  variant?: 'primary' | 'secondary' | 'danger';
  /** Whether the button is disabled */
  disabled?: boolean;
  /** Click handler function */
  onClick: () => void;
  /** Button content */
  children: React.ReactNode;
}

/**
 * A reusable button component with multiple variants
 */
export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  disabled = false,
  onClick,
  children
}) => {
  // Implementation
};
```

## Conclusion

These development guidelines ensure that the 378x492 Fraud Detection Platform maintains high code quality, security, and performance standards. Following these practices will result in:

- **Maintainable Codebase**: Clear structure and consistent patterns
- **Type Safety**: Reduced runtime errors and better developer experience
- **Performance**: Optimized bundle sizes and runtime efficiency
- **Security**: Input validation and secure coding practices
- **Scalability**: Modular architecture supporting future growth

Regular review and updates to these guidelines will ensure continued alignment with industry best practices and project requirements.</content>
<parameter name="filePath">docs/02_Developer_Guide/Development_Guidelines.md