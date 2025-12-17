# TypeScript Code Quality Guidelines

## 🎯 **Purpose**
Establish comprehensive TypeScript best practices to eliminate `any` types, improve type safety, and enhance code maintainability across the frontend codebase.

## 📋 **Core Principles**

### 1. **Zero Any Types Policy**
```typescript
// ❌ AVOID - Using any removes type safety
function processData(data: any) {
  return data.value;
}

// ✅ PREFERRED - Use specific types or generics
function processData<T extends { value: unknown }>(data: T) {
  return data.value;
}

// ✅ ALTERNATIVE - Use unknown for truly dynamic data
function processData(data: unknown) {
  if (typeof data === 'object' && data !== null && 'value' in data) {
    return (data as { value: unknown }).value;
  }
  return undefined;
}
```

### 2. **Global Object Extensions**
```typescript
// ❌ AVOID - any global extensions
(global as any).customProperty = 'value';

// ✅ PREFERRED - Proper type augmentation
declare global {
  interface Window {
    customProperty?: string;
  }
}

// For test environments
(global as typeof global & { customProperty?: string }).customProperty = 'value';
```

### 3. **Event Handler Types**
```typescript
// ❌ AVOID - any event types
const handleClick = (event: any) => {
  console.log(event.target.value);
};

// ✅ PREFERRED - Specific event types
const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
  console.log(event.currentTarget.textContent);
};

// ✅ ALTERNATIVE - Generic event types
const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
  console.log(event.target.value);
};
```

## 🛠️ **Automated Tools**

### **TypeScript Enhancement Script**
```bash
# Run automated type improvements
node scripts/enhance-typescript.js
```

### **ESLint Rules**
```json
{
  "@typescript-eslint/no-explicit-any": "error",
  "@typescript-eslint/no-unused-vars": ["error", { "argsIgnorePattern": "^_" }],
  "@typescript-eslint/explicit-function-return-type": "warn"
}
```

## 📝 **Common Patterns & Solutions**

### **API Response Types**
```typescript
// Define proper API response interfaces
interface ApiResponse<T = unknown> {
  success: boolean;
  data: T;
  error?: string;
}

// Usage
async function fetchUser(id: string): Promise<ApiResponse<User>> {
  const response = await api.get(`/users/${id}`);
  return response as ApiResponse<User>;
}
```

### **Component Props**
```typescript
// ❌ AVOID - any in props
interface ComponentProps {
  data: any;
  onChange: any;
}

// ✅ PREFERRED - Specific prop types
interface ComponentProps {
  data: UserData;
  onChange: (user: UserData) => void;
}
```

### **Generic Constraints**
```typescript
// Use constraints for better type safety
function processList<T extends { id: string; name: string }>(items: T[]) {
  return items.map(item => item.name);
}
```

## 🔍 **TypeScript Migration Strategy**

### **Phase 1: Critical Files (High Priority)**
- [ ] API service functions
- [ ] Component prop interfaces
- [ ] Redux store types
- [ ] Event handlers

### **Phase 2: Supporting Files (Medium Priority)**
- [ ] Utility functions
- [ ] Test files
- [ ] Configuration objects
- [ ] Error handling

### **Phase 3: Optimization (Low Priority)**
- [ ] Advanced generic constraints
- [ ] Branded types
- [ ] Conditional types
- [ ] Template literal types

## 🎯 **Quality Metrics**

### **Tracking Progress**
```bash
# Count remaining any types
npm run lint 2>&1 | grep "Unexpected any" | wc -l

# Check type coverage
npx typescript --noEmit --strict src/ | grep -c "error"
```

### **Target Goals**
- **Any Types**: 0 instances in production code
- **Type Coverage**: >95% for critical paths
- **Strict Mode**: Enabled for new code
- **Interface Documentation**: 100% of public APIs

## 🚫 **Anti-Patterns to Eliminate**

### **1. Function Parameters**
```typescript
// ❌ DON'T DO THIS
function handleSubmit(data: any) { /* ... */ }

// ✅ DO THIS INSTEAD
function handleSubmit(data: FormData) { /* ... */ }
```

### **2. Return Types**
```typescript
// ❌ DON'T DO THIS
function getUser(): any { /* ... */ }

// ✅ DO THIS INSTEAD
function getUser(): Promise<User | null> { /* ... */ }
```

### **3. Object Properties**
```typescript
// ❌ DON'T DO THIS
const config = { apiUrl: '...' } as any;

// ✅ DO THIS INSTEAD
interface Config { apiUrl: string; timeout: number; }
const config: Config = { apiUrl: '...', timeout: 5000 };
```

## 🔧 **IDE Configuration**

### **VS Code Settings**
```json
{
  "typescript.preferences.strict": true,
  "typescript.suggest.autoImports": true,
  "typescript.preferences.includePackageJsonAutoImports": "auto",
  "editor.codeActionsOnSave": {
    "source.addMissingImports": true,
    "source.removeUnusedImports": true
  }
}
```

### **TypeScript Config**
```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true
  }
}
```

## 📞 **Support & Resources**

### **Quick Fixes**
1. **Unknown instead of any**: `data: unknown`
2. **Generic constraints**: `T extends BaseType`
3. **Union types**: `string | number | null`
4. **Optional properties**: `property?: Type`

### **Advanced Patterns**
- **Discriminated unions** for complex state
- **Branded types** for nominal typing
- **Conditional types** for advanced generics
- **Template literals** for dynamic types

---

**Last Updated:** December 2025
**Version:** 1.0
**Maintained by:** Frontend TypeScript Team