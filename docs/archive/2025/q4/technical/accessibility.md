# Strategy: Accessibility (A11y)

> **Goal:** Ensure the application is usable by people with disabilities and complies with WCAG 2.1 AA standards.

## 1. Core Principles

- **Perceivable:** All information and UI components must be presentable in ways users can perceive.
- **Operable:** All UI components and navigation must be operable via keyboard alone.
- **Understandable:** Information and operation of UI must be understandable.
- **Robust:** Content must be robust enough to be interpreted by assistive technologies.

---

## 2. Implementation Checklist

### 2.1 Keyboard Navigation

- All interactive elements reachable via `Tab` key.
- Logical focus order (top-to-bottom, left-to-right).
- Visible focus indicators (`:focus-visible` ring).
- Skip links for main content (`Skip to Main Content`).
- Modal traps (focus stays inside dialogs until closed).

### 2.2 Screen Reader Support

- Semantic HTML (`<main>`, `<nav>`, `<aside>`, `<section>`).
- ARIA labels for icons-only buttons: `aria-label="Close"`.
- ARIA live regions for dynamic content (toasts, loading states).
- Proper `role` attributes for custom components.

### 2.3 Color & Contrast

- Text contrast ratio ≥ 4.5:1 (normal text) and ≥ 3:1 (large text).
- Never use color alone to convey information (add icons/text).
- Dark mode support with equivalent contrast.

### 2.4 Forms & Inputs

- All inputs have associated `<label>` elements.
- Error messages linked via `aria-describedby`.
- Required fields marked with `aria-required="true"`.

---

## 3. Testing Strategy

| Tool | Purpose |
| :--- | :--- |
| **axe DevTools** | Automated WCAG violation detection |
| **NVDA / VoiceOver** | Manual screen reader testing |
| **Keyboard-only** | Tab through entire app without mouse |
| **Lighthouse** | Accessibility score tracking |

---

## 4. Component Library Standards

All Radix UI primitives are used as they are built with accessibility in mind. Custom components must:

1. Inherit focus management from Radix.
2. Use `@radix-ui/react-visually-hidden` for off-screen labels.
3. Implement `aria-expanded`, `aria-controls` for disclosures.
