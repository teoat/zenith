# Frontend Architecture & Best Practices Guide
**Tech Stack:** React 19, TypeScript, Vite, Tailwind CSS v4, Zustand, React Query

## 1. Architecture & File Structure
We follow a **Layered Architecture** with feature-grouped components.

### Recommended Directory Structure
```
src/
├── components/          # Shared UI components
│   ├── ui/             # Atomic design elements (Buttons, Inputs - keep dumb)
│   ├── layout/         # Layout wrappers (Header, Sidebar)
│   ├── features/       # Feature-specific components (e.g., auth/, dashboard/)
│   └── shared/         # Reusable business components implies logic
├── hooks/              # Custom React hooks (useAuth, useTheme)
├── lib/                # Static libraries & configs (axios instance, utils)
├── pages/              # Page views (Lazy Loaded)
├── services/           # API service layer (pure TS, no React)
├── store/              # Global state (Zustand stores)
├── types/              # Global TypeScript definitions
└── utils/              # Pure helper functions (formatting, validation)
```

## 2. React & Component Standards (React 19)
- **Max Component Size**: 500 lines. If a file exceeds this, it MUST be split into sub-components.
- **Functional Components Only**: No Class components.
- **Strict Typing**: All props must be typed via `interface` or `type`.
- **React 19 Patterns**:
    - **No Manual Memoization**: Trust the React Compiler. Avoid premature `useCallback` or `useMemo` unless profiling shows a specific bottleneck.
    - **`use()` Hook**: Prefer `use(Context)` over `useContext` for conditional consumption.
    - **Actions**: Use React Actions for form submissions where possible to leverage automatic pending states.
- **Named Exports**: Use named exports (`export const Component = ...`) over defaults.

## 3. State Management Rules
We distinguish strictly between **Client State** and **Server State**.

| State Type | Tool | Best Practices |
| :--- | :--- | :--- |
| **Server State** | **TanStack Query** | Fetching, caching, syncing API data. **Do not put API data in Zustand.** Use specific selectors (`select: data => data.id`) to minimize re-renders. |
| **Global UI State** | **Zustand** | Sidebar toggles, User preferences, Auth tokens. Keep stores small and atomic. |
| **Local Edits** | **Zustand** | For complex "draft" states (e.g. editing a Profile) before saving to server, sync initial data from Query to Zustand, edit, then mutate back. |
| **Form State** | **React Hook Form** | specific form validation. |
| **URL State** | **React Router** | Search params for filters, pagination, active tabs. This is the "Source of Truth" for deep-linkable states. |

## 4. Styling Standards (Tailwind CSS 4.x)
- **CSS-First Configuration**: Define design tokens (colors, variables) in your CSS `@theme` block, not JS config.
- **Utility First**: Use utility classes directly.
- **Dynamic Classes**: **MUST** use `cn()` (clsx + tailwind-merge) for conditional styling.
  ```tsx
  // ✅ Good
  <div className={cn("p-4 bg-white", isActive && "bg-blue-500")} />
  ```
- **Abstractions**: If a collection of classes is used >3 times, extract it to a React Component, NOT an `@apply` class. Keep CSS bundles small.

## 5. Security & Data Validation
- **Branded Types**: For critical domain primitives (IDs, Emails), use "Branded Types" to prevent mixing them up.
  ```ts
  type UserId = string & { readonly __brand: unique symbol };
  const userId = "123" as UserId;
  ```
- **Zod Schemas**: Validate ALL inputs and API responses at the boundary. Trusted backend data is a myth.
- **XSS Prevention**: Never use `dangerouslySetInnerHTML`. If you must render HTML, use `dompurify` to sanitize it first.
- **CSP**: Ensure Content Security Policy headers (via server) block `unsafe-inline` scripts. Use nonces if absolutely necessary.

## 6. Performance Optimization (Vite & React)
- **Route Splitting**: Use `React.lazy` + `Suspense` for all top-level routes.
- **Chunking**: Configure `build.rollupOptions.output.manualChunks` in `vite.config.ts` to separate large vendor libs (like `three.js`, `recharts`) from main bundle.
- **Image Optimization**: Use explicit width/height to prevent CLS.
- **Virtualization**: For lists > 50 items, use `@tanstack/react-virtual` (already installed).

## 7. Testing Strategy
- **Unit Tests (Jest)**: Test `utils/` and complex `hooks/`.
- **Component Tests (Testing Library)**: Test user interactions (Clicks, Form fills). **Do not test implementation details.**
- **E2E (Playwright)**: Test critical "Happy Paths" (Login -> Dashboard -> Logout). **Do not mock the backend unless testing edge cases.** Test against a real running dev server.

## 8. TypeScript Rules
- **No `any`**: Use `unknown` if type is ambiguous.
- **Strict Mode**: Enabled.
- **Generics**: Use generics for reusable components/hooks but don't over-engineer. Readable > "Smart".

## 9. Plugin Architecture Guidelines (New 2026)
*Adopted from industry best practices.*
1.  **Registry Pattern**: Use a central registry for plugin management.
2.  **Slot/Fill System**: UI regions define "Slots"; Plugins provide "Fills".
3.  **Isolation**: Wrap all plugins in Error Boundaries.
4.  **Versioning**: Maintain a stable Plugin SDK contract.
*(See `docs/research/PLUGIN_ARCHITECTURE.md` for full research).*

## 10. Appendix: Diagnostic Report (Jan 2026)
*(Architecture & File Structure checks exempted per user request)*

### 🟢 Large Files (> 500 lines) - RESOLVED
*Status: All monolithic components have been split into sub-components in the `features/` directory.*
- `components/ai/AdvancedComplianceDashboard.tsx` (Refactored)
- `components/ai/PredictiveMaintenanceDashboard.tsx` (Refactored)
- `components/ai/CodeReviewDashboard.tsx` (Refactored)
- `components/RelationshipGraph.tsx` (Refactored)
- `src/components/intelligence/CourtDocumentGenerator.tsx` (Refactored)
- `src/components/collaboration/EvidenceBoard.tsx` (Refactored)

### ⚠️ Type Safety (`any`)
*Action: Replace `any` with specific types or `unknown`.*
- `RelationshipGraph.tsx`: Heavy usage (nodes, links data).
- `FraudRuleBuilder.tsx`: Rule parameters.
- `NetworkAnalysis.tsx`: API response mapping.
- `Ingestion.tsx`: Slider default values.

### ⚠️ Styling (Template Literals)
*Action: Migrate to `cn()` utility.*
- `PerformanceDashboard.tsx`: Extensive usage for trend colors.
- `Dashboard.tsx`: Status badges.
- `Cases.tsx`: View mode toggles.

### ⚠️ Security
- `components/UpdateManager.tsx`: Uses `dangerouslySetInnerHTML`. **Status: SAM-Compliant** (Validated usage of `DOMPurify`).
