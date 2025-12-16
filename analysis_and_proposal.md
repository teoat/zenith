# Comprehensive Diagnosis and Improvement Proposal

## 1. Visual Hierarchy & Information Architecture
**Status:** Inconsistent
The current application suffers from a mix of raw HTML elements (like standard `<button>`) and accessible styled components (like `<Button>`). The layout strategies vary between grid systems and hardcoded layouts.

### Issues:
- **Button Inconsistency**: `RelationshipGraph.jsx` uses `Button` from `ui/button` but also implements ad-hoc styles in canvas.
- **Typography**: Styles are split between Tailwind utility classes and `variables.css`. Some headers use `page-header` classes while others just use large text.
- **Iconography**: `lucide-react` is used, which is good, but inconsistent sizing/color application.

### Proposal:
- **Standardize Components**: Migrate all raw HTML interactions to use `components/ui` components (`Button`, `Card`, `Badge`).
- **Unified Layout**: Ensure all pages follow the `AppLayout` structure (which seems implemented) but consistent internal page padding and header structure.
- **Design Tokens**: Enforce usage of CSS variables from `variables.css` inside Tailwind config or directly in CSS to ensure theme consistency (especially for Dark Mode).

## 2. Data Visualization
**Status:** Basic, Limited Interactivity
- `RelationshipGraph.jsx`: Uses HTML5 Canvas API. While performant, it lacks:
  - Accessibility (Screen readers see nothing).
  - Advanced interactions (Tooltips are bespoke/missing, zooming is manual).
  - Responsiveness (Canvas size is hardcoded `800x600`).
- Dashboard: Uses `MetricSparkline` (which I assume is SVG based) but `RelationshipGraph` is the weak link.

### Proposal:
- **Enhance `RelationshipGraph`**:
  - Make canvas responsive using a wrapper `div` and `ResizeObserver`.
  - Add a "Screen Reader Only" list of nodes/edges that updates with the graph data for accessibility.
  - Implement a tooltip overlay using HTML/CSS positioned over the canvas coordinates for better accessibility and styling.
  - Switch to a library `react-force-graph-2d` (present in package.json) if the custom canvas implementation becomes too burdensome to maintain, OR refactor the custom canvas to be more robust. **Decision: Refactor custom canvas for now to fix immediate accessibility issues, as rewriting to a library might be a larger task.**

## 3. User Experience (UX)
**Status:** Complex workflows
- **Loading States**: `LoadingState` component exists (`App.tsx`), but partial loading in `RelationshipGraph` is manual.
- **Feedback**: `ToastProvider` is present, but `RelationshipGraph` logs errors to console.

### Proposal:
- **Unified Feedback**: Connect `RelationshipGraph` errors to `ToastProvider`.
- **Empty States**: Add nice empty states for graphs or lists when no data is available.

## 4. Accessibility (a11y)
**Status:** Missing WCAG 2.1 AA features
- **Canvas**: As mentioned, completely inaccessible.
- **Contrast**: `variables.css` colors seem standard, but need verification against background.
- **Keyboard Nav**: Canvas is not keyboard accessible.

### Proposal:
- **Canvas A11y**: Add `tabIndex={0}` to canvas. Implement keyboard event listeners (Arrow keys to pan/select nodes). Add `aria-label` and `role="img"`.
- **Focus Indicators**: Ensure `*:focus-visible` styles are prominent (Tailwind's `ring` utilities).

## 5. Performance
**Status:** Optimizations needed
- **Lazy Loading**: `App.tsx` already uses `React.lazy` for routes. Good!
- **Bundle**: `vite.config.ts` has manual chunks.
- **Rendering**: `RelationshipGraph` re-draws often. `metrics` in Dashboard could cause re-renders.

### Proposal:
- **Optimization**: Convert `RelationshipGraph.jsx` to `.tsx` for type safety and better refactoring support.
- **Memoization**: Ensure graph drawing logic is efficient (don't re-create objects in render loop).

## 6. Interaction Design
- **Micro-interactions**: Hover states are basic.

### Proposal:
- Add `framer-motion` (installed) for smooth transitions on entry/exit of nodes or panels.

---

# Action Plan

1.  **Refactor `RelationshipGraph.jsx` to `RelationshipGraph.tsx`**:
    - Add types.
    - Implement Responsive Canvas.
    - Add Keyboard listeners (Arrows to move pan).
    - Add `aria-label` and `role="application"`.
    - Improve Zoom/Pan controls.
    - Use `Toast` for errors instead of console.
    
2.  **Verify `Dashboard.tsx` Accessibility**:
    - Ensure sparklines don't break accessibility (add text alt).
    
3.  **Global Styles**:
    - Check `index.css` for focus ring resets.

I will proceed with **Refactoring `RelationshipGraph.jsx` to `RelationshipGraph.tsx`** as it covers Visual Hierarchy, Data Viz, UX, A11y, and Performance all in one high-impact component.
