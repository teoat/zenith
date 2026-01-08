## 2024-05-24 - Auto-Resizing Inputs
**Learning:** Users typing long content (like AI instructions) often get frustrated by small, fixed-height textareas. Auto-resizing textareas provide a much smoother experience but require careful implementation (resetting height to 'auto' before measuring scrollHeight) to handle shrinking correctly.
**Action:** Use `autoResize` prop on `Textarea` for long-form content inputs.

## 2024-05-24 - Accessible Breadcrumbs
**Learning:** Breadcrumbs often lack semantic indication of the current page. Adding `aria-current="page"` to the last item provides critical context for screen reader users, distinguishing it from clickable parent links.
**Action:** Ensure all breadcrumb components identify the current page programmatically, not just visually.
