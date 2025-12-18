## 2024-05-23 - Reusable Component Interaction Pattern
**Learning:** Reusable components that manage internal focus or ID-based interactions (like `FileDropZone`) must use `useRef` instead of `document.getElementById` to ensure they don't break when multiple instances exist on the same page.
**Action:** Always check `getElementById` usage in shared UI components during code review.

## 2024-05-23 - Drag and Drop Feedback
**Learning:** Users need immediate visual feedback when dragging files over a drop zone, but standard `onDragOver` can cause flickering when hovering over child elements.
**Action:** Use `e.relatedTarget` checks in `onDragLeave` or `pointer-events-none` on children to prevent flicker.

## 2024-05-22 - The Invisible Button Problem
**Learning:** Icon-only buttons are invisible to screen readers without `aria-label`. "X" icons are particularly problematic because visually they mean "Close" or "Dismiss", but semantically they might just be announced as "button" or ignored if they are SVG without title/desc.
**Action:** Always add `aria-label` to buttons that don't have text content. Even better, use a shared `AccessibleButton` component that enforces this prop when `size="icon"`.
