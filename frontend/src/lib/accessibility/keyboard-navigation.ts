// Keyboard navigation utilities for accessibility
export class KeyboardNavigation {
  // Navigation key detection
  isNavigationKey(event: KeyboardEvent): boolean {
    return [
      "ArrowUp",
      "ArrowDown",
      "ArrowLeft",
      "ArrowRight",
      "Home",
      "End",
      "PageUp",
      "PageDown",
    ].includes(event.key);
  }

  // Activation key detection
  isActivationKey(event: KeyboardEvent): boolean {
    return ["Enter", " "].includes(event.key);
  }

  // Prevent default action
  preventDefault(event: KeyboardEvent): void {
    event.preventDefault();
    event.stopPropagation();
  }

  // Focus movement utilities
  moveFocus(element: HTMLElement): void {
    element.focus();
    // Announce focus change for screen readers
    if (element.getAttribute("aria-label") || element.textContent) {
      this.announceFocusChange(element);
    }
  }

  findFirstFocusable(container: HTMLElement): HTMLElement | null {
    const focusableSelectors = [
      "a[href]",
      "area[href]",
      "input:not([disabled])",
      "select:not([disabled])",
      "textarea:not([disabled])",
      "button:not([disabled])",
      '[tabindex]:not([tabindex="-1"])',
      '[contenteditable="true"]',
    ];

    const elements = container.querySelectorAll(focusableSelectors.join(", "));
    return elements.length > 0 ? (elements[0] as HTMLElement) : null;
  }

  findLastFocusable(container: HTMLElement): HTMLElement | null {
    const focusableSelectors = [
      "a[href]",
      "area[href]",
      "input:not([disabled])",
      "select:not([disabled])",
      "textarea:not([disabled])",
      "button:not([disabled])",
      '[tabindex]:not([tabindex="-1"])',
      '[contenteditable="true"]',
    ];

    const elements = container.querySelectorAll(focusableSelectors.join(", "));
    return elements.length > 0
      ? (elements[elements.length - 1] as HTMLElement)
      : null;
  }

  private announceFocusChange(element: HTMLElement): void {
    const label =
      element.getAttribute("aria-label") ||
      element.textContent?.trim() ||
      "Element";
    // Use live region announcement if available
    const liveRegion = document.querySelector("[aria-live]");
    if (liveRegion) {
      liveRegion.textContent = `Focused: ${label}`;
    }
  }
}

export const keyboardNavigation = new KeyboardNavigation();
