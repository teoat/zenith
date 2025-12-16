# Frontend Components Reference

## Overview

This document catalogs all custom UI components in the 378x492 Fraud Detection System frontend. These components follow accessibility best practices (WCAG 2.1 AA) and modern React patterns.

---

## Core UI Components (`/frontend/src/components/ui`)

### Button

**File**: `frontend/src/components/ui/Button.tsx`

**Purpose**: Standard button with multiple variants and sizes

**Variants**:
- `default` - Primary blue button
- `destructive` - Red for delete/dangerous actions
- `outline` - Border-only style
- `secondary` - Gray background
- `ghost` - Transparent with hover effect
- `link` - Text-only, no background

**Sizes**:
- `default` - Standard size
- `sm` - Small
- `lg` - Large
- `icon` - Square for icon-only buttons

**Usage**:
```tsx
import { Button } from '@/components/ui/Button';

<Button variant="default" size="lg">
  Save Changes
</Button>

<Button variant="destructive" onClick={handleDelete}>
  Delete Case
</Button>
```

---

### AccessibleButton

**File**: `frontend/src/components/ui/AccessibleButton.tsx`

**Purpose**: Enhanced button with full WCAG compliance and advanced ARIA support

**Features**:
- Focus-visible styles
- Loading state with spinner
- Disabled state handling
- ARIA attributes (aria-disabled, aria-expanded, aria-haspopup)
- Keyboard navigation

**Props**:
- `loading`: boolean - Shows spinner, disables interaction
- `disabled`: boolean - Disables button
- `ariaLabel`: string - Accessible label
- `ariaExpanded`: boolean - For dropdowns
- `ariaHasPopup`: boolean - For menus

**Usage**:
```tsx
import { AccessibleButton } from '@/components/ui/AccessibleButton';

<AccessibleButton
  loading={isSubmitting}
  ariaLabel="Submit fraud report"
  onClick={handleSubmit}
>
  Submit Report
</AccessibleButton>
```

---

### Card

**File**: `frontend/src/components/ui/Card.tsx`

**Purpose**: Container component with consistent styling

**Sub-components**:
- `Card` - Main container
- `CardHeader` - Header section
- `CardTitle` - Title text
- `CardDescription` - Subtitle/description
- `CardContent` - Main content area
- `CardFooter` - Footer section

**Usage**:
```tsx
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';

<Card>
  <CardHeader>
    <CardTitle>Case #12345</CardTitle>
  </CardHeader>
  <CardContent>
    <p>Case details...</p>
  </CardContent>
</Card>
```

---

### DataGrid

**File**: `frontend/src/components/ui/DataGrid.tsx`

**Purpose**: High-performance virtualized data table for large datasets

**Features**:
- Virtualization (handles 10,000+ rows smoothly)
- Sortable columns
- Custom cell renderers
- Fixed header
- Responsive column widths
- Keyboard navigation (arrow keys, Enter)
- Accessibility (ARIA roles, labels)

**Props**:
```typescript
interface DataGridProps<T> {
  data: T[];                          // Array of row data
  columns: Column<T>[];               // Column definitions
  onRowClick?: (row: T) => void;      // Row click handler
  height?: string;                    // Table height (default: "600px")
  rowHeight?: number;                 // Row height in pixels (default: 50)
}

interface Column<T> {
  header: string;                      // Column header text
  accessor: keyof T | ((row: T) => any); // Data accessor
  render?: (value: any, row: T) => React.ReactNode; // Custom renderer
  sortable?: boolean;                  // Enable sorting
  width?: string;                      // Column width (e.g., "200px", "20%")
}
```

**Usage**:
```tsx
import { DataGrid } from '@/components/ui/DataGrid';

const columns = [
  { header: 'ID', accessor: 'id', sortable: true, width: '100px' },
  { header: 'Title', accessor: 'title', sortable: true },
  { 
    header: 'Status', 
    accessor: 'status',
    render: (status) => <StatusBadge status={status} />
  },
  {
    header: 'Actions',
    accessor: (row) => row.id,
    render: (id) => <ActionsMenu caseId={id} />
  }
];

<DataGrid
  data={cases}
  columns={columns}
  onRowClick={(case) => navigate(`/cases/${case.id}`)}
  height="700px"
/>
```

---

### Pagination

**File**: `frontend/src/components/ui/Pagination.tsx`

**Purpose**: Page navigation controls for large datasets

**Features**:
- Previous/Next buttons
- Page number display
- Rows per page selector
- Jump to page input
- Keyboard navigation

**Props**:
```typescript
interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  rowsPerPage?: number;
  onRowsPerPageChange?: (rows: number) => void;
  totalRows?: number;
}
```

**Usage**:
```tsx
import { Pagination } from '@/components/ui/Pagination';

const [page, setPage] = useState(1);
const [rowsPerPage, setRowsPerPage] = useState(20);

<Pagination
  currentPage={page}
  totalPages={Math.ceil(totalCases / rowsPerPage)}
  onPageChange={setPage}
  rowsPerPage={rowsPerPage}
  onRowsPerPageChange={setRowsPerPage}
  totalRows={totalCases}
/>
```

---

### Input

**File**: `frontend/src/components/ui/Input.tsx`

**Purpose**: Styled text input with label support

**Features**:
- Consistent styling
- Focus states
- Error states
- Disabled states
- Full-width option

**Usage**:
```tsx
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';

<div>
  <Label htmlFor="email">Email</Label>
  <Input
    id="email"
    type="email"
    placeholder="Enter your email"
    value={email}
    onChange={(e) => setEmail(e.target.value)}
  />
</div>
```

---

### Label

**File**: `frontend/src/components/ui/Label.tsx`

**Purpose**: Accessible form label

**Usage**:
```tsx
<Label htmlFor="password">Password</Label>
<Input id="password" type="password" />
```

---

## Layout Components (`/frontend/src/components/layout`)

### AppLayout

**File**: `frontend/src/components/layout/AppLayout.tsx`

**Purpose**: Main application shell with sidebar and header

**Features**:
- Responsive sidebar (collapsible on mobile)
- Fixed header with breadcrumbs
- Skip to main content link (accessibility)
- Scrollable main content area

**Structure**:
```tsx
<AppLayout>
  {/* Page content goes here */}
  <YourPage />
</AppLayout>
```

### ResizablePanel

**File**: `frontend/src/components/ui/ResizablePanel.tsx`

**Purpose**: A draggable layout panel for creating adjustable split-views.

**Features**:
- Horizontal and vertical resizing
- Keyboard accessible resizing (Arrow keys)
- Min/Max constraints
- Custom resizer styling

**Usage**:
```tsx
import { ResizablePanel, ResizableLayout } from '@/components/ui/ResizablePanel';

<ResizableLayout direction="horizontal">
  <ResizablePanel defaultSize={200} minSize={100}>
     <Sidebar />
  </ResizablePanel>
  <div className="flex-1">
     <MainContent />
  </div>
</ResizableLayout>
```

---

## Complex Feature Components

### InvestigationCanvas

**File**: `frontend/src/components/investigation/InvestigationCanvas.tsx`

**Purpose**: Interactive graph visualization for entities and relationships.

**Features**:
- Force-directed graph visualization
- Drag-and-drop entity management
- Interactive relationship creation
- Zoom/Pan controls
- Accessibility support for graph navigation


---

## Utility Components

### ErrorBoundary

**File**: `frontend/src/components/ErrorBoundary.tsx`

**Purpose**: React Error Boundary for graceful error handling

**Features**:
- Catches JavaScript errors anywhere in child component tree
- Displays user-friendly error message
- Logs errors to console (and Sentry in production)
- "Try Again" button to reset

**Usage**:
```tsx
import ErrorBoundary from '@/components/ErrorBoundary';

// Wrap entire app (already done in App.tsx)
<ErrorBoundary>
  <App />
</ErrorBoundary>

// Or wrap individual features
<ErrorBoundary>
  <ComplexFeature />
</ErrorBoundary>
```

**Error Display**:
- Shows error icon
- User-friendly message: "Something went wrong"
- Technical details (development mode only)
- Reload button

---

### LoadingState

**File**: `frontend/src/components/LoadingState.tsx`

**Purpose**: Consistent loading indicator with skeleton screens

**Variants**:
- `spinner` - Spinning loader
- `skeleton` - Content placeholder (for lists, cards)
- `bar` - Progress bar

**Props**:
```typescript
interface LoadingStateProps {
  variant?: 'spinner' | 'skeleton' | 'bar';
  text?: string;              // Optional loading text
  fullScreen?: boolean;       // Centers in viewport
}
```

**Usage**:
```tsx
import { LoadingState } from '@/components/LoadingState';

// Spinner
{isLoading && <LoadingState variant="spinner" text="Loading cases..." />}

// Skeleton for list
{isLoading ? (
  <LoadingState variant="skeleton" />
) : (
  <CaseList data={cases} />
)}

// Full screen
{isLoading && <LoadingState variant="spinner" fullScreen text="Please wait..." />}
```

---

### OfflineIndicator

**File**: `frontend/src/components/OfflineIndicator.tsx`

**Purpose**: Shows network status to user

**Features**:
- Appears when internet connection lost
- Auto-hides when connection restored
- Shows queued actions count
- Accessible announcement for screen readers

**Display**:
- Red banner at top of screen
- "You're offline" message
- Shows pending sync count if > 0

---

## Custom Hooks

### useApiWithRetry

**File**: `frontend/src/hooks/useApiWithRetry.ts`

**Purpose**: API wrapper with automatic retry logic and error handling

**Features**:
- Automatic retry on failure (3 attempts by default)
- Exponential backoff (1s, 2s, 4s)
- Cancels pending requests on unmount
- Type-safe with TypeScript generics

**Usage**:
```tsx
import { useApiWithRetry } from '@/hooks/useApiWithRetry';

function MyCases() {
  const { data, error, isLoading, retry } = useApiWithRetry(
    async () => api.get('/cases'),
    { retries: 3, retryDelay: 1000 }
  );

  if (isLoading) return <LoadingState />;
  if (error) return <ErrorMessage error={error} onRetry={retry} />;
  
  return <CaseList data={data} />;
}
```

---

## Context Providers (`/frontend/src/providers`)

### AuthProvider

**File**: `frontend/src/providers/AuthProvider.tsx`

**Purpose**: Global authentication state management

**Provides**:
- `user`: Current user object (or null)
- `isLoading`: Authentication check inprogress
- `login(email, password)`: Login function
- `logout()`: Logout function
- `token`: JWT access token

**Usage**:
```tsx
import { useAuth } from '@/providers/AuthProvider';

function MyComponent() {
  const { user, logout } = useAuth();
  
  return (
    <div>
      <p>Welcome, {user.email}!</p>
      <button onClick={logout}>Logout</button>
    </div>
  );
}
```

---

### NetworkStatusProvider

**File**: `frontend/src/providers/NetworkStatusProvider.tsx`

**Purpose**: Monitor network connectivity

**Provides**:
- `isOnline`: boolean - Current network status

---

### OfflineQueueProvider

**File**: `frontend/src/providers/OfflineQueueContext.tsx`

**Purpose**: Queue API requests when offline for later sync

**Features**:
- Queues POST/PUT/DELETE requests when offline
- Auto-syncs when connection restored
- Persists queue to localStorage

---

## Component Design Patterns

### Compound Components
Cards use compound component pattern:
```tsx
<Card>
  <CardHeader>
    <CardTitle>Title</CardTitle>
  </CardHeader>
  <CardContent>Content</CardContent>
</Card>
```

### Render Props
DataGrid accepts custom cell renderers:
```tsx
{
  header: 'Status',
  render: (status) => <Badge>{status}</Badge>
}
```

### Controlled Components
All inputs are controlled:
```tsx
<Input value={state} onChange={(e) => setState(e.target.value)} />
```

---

## Accessibility Standards

All components follow WCAG 2.1 AA standards:

✅ **Keyboard Navigation**
- All interactive elements focusable
- Logical tab order
- Enter/Space activates buttons

✅ **Screen Reader Support**
- Semantic HTML (`<nav>`, `<main>`, `<button>`)
- ARIA labels where needed
- ARIA roles for custom components

✅ **Visual**
- Color contrast ≥ 4.5:1
- Focus indicators visible
- No color-only indicators

✅ **Motion**
- Respects `prefers-reduced-motion`
- Animations optional

---

## Performance Optimizations

### DataGrid Virtualization
Only renders visible rows + buffer:
```
Total rows: 10,000
Visible rows: 12
Rendered rows: 24 (12 visible + 12 buffer)
Memory saved: 99.76%
```

### Code Splitting
Components lazy-loaded by route:
```tsx
const Dashboard = lazy(() => import('./pages/Dashboard'));
```

### Memoization
Expensive components wrapped in `React.memo`:
```tsx
export default React.memo(DataGrid);
```

---

## Styling Approach

**Technology**: Tailwind CSS + CSS Modules

**Utility Classes** (Tailwind):
```tsx
<div className="flex items-center justify-between p-4 rounded-lg">
```

**Custom Styles** (CSS Modules):
```tsx
import styles from './Component.module.css';
<div className={styles.customCard}>
```

**Design Tokens** (CSS Variables):
```css
:root {
  --primary: #3b82f6;
  --background: #0a0a0a;
  --card-bg: rgba(255, 255, 255, 0.05);
}
```

---

## Testing

### Unit Tests
```bash
cd frontend
npm run test:unit
```

### E2E Tests
```bash
npm run test:e2e
```

### Accessibility Tests
```bash
node scripts/accessibility-audit.js
```

---

---

## Phase 6 Components

### InvestigationNotebook

**File**: `frontend/src/components/InvestigationNotebook.tsx`

**Purpose**: A rich-text note-taking tool for investigators to document their findings.

**Features**:
- Markdown support
- Auto-saving
- Case linking

### RelationshipGraph

**File**: `frontend/src/components/RelationshipGraph.tsx`

**Purpose**: Visualizes connections between entities (accounts, people, transactions).

**Features**:
- Interactive node/link graph
- Zoom and pan capabilities
- Node clustering

### DigitalDossierGenerator

**File**: `frontend/src/components/DigitalDossierGenerator.tsx`

**Purpose**: Generates comprehensive PDF reports summarizing a case or subject.

**Features**:
- Template selection
- Section customization
- Export to PDF

### CollaborativeEditor

**File**: `frontend/src/components/collaboration/CollaborativeEditor.tsx`

**Purpose**: Real-time collaborative text editing for case files.

**Features**:
- Operational Transformation / CRDT
- Live user cursors
- Presence indicators

---

## Adding New Components

1. **Create file**: `frontend/src/components/ui/NewComponent.tsx`
2. **Follow patterns**: Use existing components as templates
3. **Add types**: Define TypeScript interfaces
4. **Implement a11y**: ARIA labels, keyboard nav, focus management
5. **Document**: Add to this file
6. **Test**: Unit tests + accessibility audit

---

**Last Updated**: December 8, 2024  
**Maintained By**: Frontend Team
