# Component Reference Cards

Quick navigation: [Search](#-search-components) | [Data Display](#-data-display-components) | [Forms](#-form-components) | [Hooks](#-state-management-hooks) | [Security](#️-security-components)

## Core UI Components

### 🔍 **Search Components**

#### `SearchInput`
**Location:** `frontend/src/components/ui/SearchInput.tsx`
**Purpose:** Standardized search input with debouncing and validation
**Usage:**
```tsx
import { SearchInput } from '@/components/ui/SearchInput';

<SearchInput
  placeholder="Search cases..."
  value={searchTerm}
  onChange={setSearchTerm}
  onSearch={handleSearch}
/>
```
**Props:**
- `placeholder`: Input placeholder text
- `value`: Controlled value
- `onChange`: Change handler
- `onSearch`: Search execution handler
- `debounceMs`: Debounce delay (default: 300ms)

**Related:** Used in `CaseList`, `EvidenceSearch`, `InvestigationCanvas`

**See Also:** [FilterDropdown](#filterdropdown), [DataGrid](#datagrid)

---

#### `FilterDropdown`
**Location:** `frontend/src/components/ui/FilterDropdown.tsx`
**Purpose:** Multi-select filter dropdown with search
**Usage:**
```tsx
import { FilterDropdown } from '@/components/ui/FilterDropdown';

<FilterDropdown
  options={filterOptions}
  selected={selectedFilters}
  onChange={setSelectedFilters}
  placeholder="Select filters..."
/>
```
**Props:**
- `options`: Array of filter options
- `selected`: Array of selected values
- `onChange`: Selection change handler
- `placeholder`: Dropdown placeholder

**Related:** Used in `CaseTable`, `EvidenceFilters`, `ComplianceDashboard`

---

### 📊 **Data Display Components**

#### `DataGrid`
**Location:** `frontend/src/components/ui/DataGrid.tsx`
**Purpose:** Advanced data table with sorting, filtering, and pagination
**Usage:**
```tsx
import { DataGrid } from '@/components/ui/DataGrid';

<DataGrid
  data={cases}
  columns={caseColumns}
  onSort={handleSort}
  onFilter={handleFilter}
  pagination={true}
/>
```
**Props:**
- `data`: Array of data objects
- `columns`: Column definitions
- `onSort`: Sort handler
- `onFilter`: Filter handler
- `pagination`: Enable pagination

**Related:** Used in `CaseTable`, `EvidenceTable`, `AuditLogViewer`

---

#### `MetricCard`
**Location:** `frontend/src/components/ui/MetricCard.tsx`
**Purpose:** KPI display card with trend indicators
**Usage:**
```tsx
import { MetricCard } from '@/components/ui/MetricCard';

<MetricCard
  title="Active Cases"
  value="247"
  change={12.5}
  icon={<Assessment />}
  color="#2196f3"
/>
```
**Props:**
- `title`: Metric title
- `value`: Current value
- `change`: Percentage change
- `icon`: Display icon
- `color`: Theme color

**Related:** Used in `Dashboard`, `PerformanceDashboard`, `ComplianceDashboard`

---

### 🎯 **Form Components**

#### `ValidatedInput`
**Location:** `frontend/src/components/ui/ValidatedInput.tsx`
**Purpose:** Input with real-time validation and error display
**Usage:**
```tsx
import { ValidatedInput } from '@/components/ui/ValidatedInput';

<ValidatedInput
  name="email"
  type="email"
  label="Email Address"
  value={email}
  onChange={setEmail}
  validation={emailValidation}
  required
/>
```
**Props:**
- `name`: Field name
- `type`: Input type
- `label`: Display label
- `value`: Controlled value
- `onChange`: Change handler
- `validation`: Validation rules
- `required`: Mark as required

**Related:** Used in `CaseForm`, `LoginForm`, `SettingsForm`

---

## 📚 Additional Resources

- **[Main Documentation Index](../docs/reports/DOCUMENTATION_INDEX.md)** - Complete documentation overview
- **[API Documentation](../docs/api/)** - API integration guides
- **[Architecture Overview](../docs/architecture/)** - System design documentation
- **[Development Setup](../docs/development/)** - Getting started for developers

---

*These reference cards provide quick access to common component patterns. For detailed implementation examples, see the full documentation linked above.*

---

### 🔄 **State Management Hooks**

#### `useCases`
**Location:** `frontend/src/hooks/useCases.ts`
**Purpose:** Case management with caching and real-time updates
**Usage:**
```tsx
import { useCases } from '@/hooks/useCases';

const { cases, loading, createCase, updateCase } = useCases();
```
**Returns:**
- `cases`: Array of case objects
- `loading`: Loading state
- `createCase`: Case creation function
- `updateCase`: Case update function

**Related:** Used in `CaseList`, `CaseForm`, `InvestigationWizard`

---

#### `useWebSocket`
**Location:** `frontend/src/hooks/useWebSocket.ts`
**Purpose:** WebSocket connection management with auto-reconnect
**Usage:**
```tsx
import { useWebSocket } from '@/hooks/useWebSocket';

const { sendMessage, lastMessage, connectionState } = useWebSocket('/api/ws');
```
**Returns:**
- `sendMessage`: Send message function
- `lastMessage`: Last received message
- `connectionState`: Connection status

**Related:** Used in `Dashboard`, `CollaborationBoard`, `RealTimeNotifications`

---

### 🛡️ **Security Components**

#### `SecureLogger`
**Location:** `frontend/src/utils/secureLogger.ts`
**Purpose:** Sanitized logging with security controls
**Usage:**
```tsx
import { secureLogger } from '@/utils/secureLogger';

secureLogger.info('User action', { userId, action: 'case_created' });
```
**Methods:**
- `info()`: Info level logging
- `warn()`: Warning level logging
- `error()`: Error level logging

**Related:** Used throughout application for secure logging

---

#### `PermissionGate`
**Location:** `frontend/src/components/auth/PermissionGate.tsx`
**Purpose:** Conditional rendering based on user permissions
**Usage:**
```tsx
import { PermissionGate } from '@/components/auth/PermissionGate';

<PermissionGate permissions={['case.create']}>
  <CreateCaseButton />
</PermissionGate>
```
**Props:**
- `permissions`: Required permissions array
- `fallback`: Fallback component when unauthorized

**Related:** Used in `CaseForm`, `AdminPanel`, `SettingsPage`