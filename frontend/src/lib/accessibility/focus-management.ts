// Focus management utilities for accessibility
export class FocusManager {
  private focusTraps: Map<string, FocusTrap> = new Map();

  trapFocus(container: HTMLElement, event?: KeyboardEvent) {
    if (event) {
      event.preventDefault();
    }

    const focusableElements = this.getFocusableElements(container);
    if (focusableElements.length === 0) return;

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    // Focus first element if not already focused
    if (!container.contains(document.activeElement)) {
      firstElement.focus();
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Tab') {
        if (e.shiftKey) {
          // Shift+Tab: Move to previous element
          if (document.activeElement === firstElement) {
            e.preventDefault();
            lastElement.focus();
          }
        } else {
          // Tab: Move to next element
          if (document.activeElement === lastElement) {
            e.preventDefault();
            firstElement.focus();
          }
        }
      }

      // Escape key handling
      if (e.key === 'Escape') {
        // Allow escape to bubble up for modal close handlers
        return;
      }
    };

    container.addEventListener('keydown', handleKeyDown);

    // Return cleanup function
    return () => {
      container.removeEventListener('keydown', handleKeyDown);
    };
  }

  createFocusTrap(id: string, container: HTMLElement) {
    const trap = new FocusTrap(container);
    this.focusTraps.set(id, trap);
    return trap;
  }

  removeFocusTrap(id: string) {
    const trap = this.focusTraps.get(id);
    if (trap) {
      trap.destroy();
      this.focusTraps.delete(id);
    }
  }

  private getFocusableElements(container: HTMLElement): HTMLElement[] {
    const focusableSelectors = [
      'a[href]',
      'area[href]',
      'input:not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      'button:not([disabled])',
      '[tabindex]:not([tabindex="-1"])',
      '[contenteditable="true"]'
    ];

    const elements = container.querySelectorAll(focusableSelectors.join(', '));
    return Array.from(elements) as HTMLElement[];
  }

  manageTabIndex(container: HTMLElement, enable: boolean) {
    const focusableElements = this.getFocusableElements(container);

    focusableElements.forEach(element => {
      if (enable) {
        // Store original tabindex if it exists
        const originalTabIndex = element.getAttribute('data-original-tabindex');
        if (originalTabIndex !== null) {
          element.setAttribute('tabindex', originalTabIndex);
          element.removeAttribute('data-original-tabindex');
        } else if (!element.hasAttribute('tabindex')) {
          element.setAttribute('tabindex', '0');
        }
      } else {
        // Store original tabindex and disable
        const currentTabIndex = element.getAttribute('tabindex');
        if (currentTabIndex !== null && currentTabIndex !== '-1') {
          element.setAttribute('data-original-tabindex', currentTabIndex);
        }
        element.setAttribute('tabindex', '-1');
      }
    });
  }
}

// Focus trap implementation
class FocusTrap {
  private container: HTMLElement;
  private focusableElements: HTMLElement[] = [];
  private handleKeyDown: (event: KeyboardEvent) => void;

  constructor(container: HTMLElement) {
    this.container = container;
    this.handleKeyDown = this._handleKeyDown.bind(this);
    this.updateFocusableElements();
    this.bindEvents();
  }

  updateFocusableElements() {
    const focusableSelectors = [
      'a[href]',
      'area[href]',
      'input:not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      'button:not([disabled])',
      '[tabindex]:not([tabindex="-1"])',
      '[contenteditable="true"]'
    ];

    const elements = this.container.querySelectorAll(focusableSelectors.join(', '));
    this.focusableElements = Array.from(elements) as HTMLElement[];
  }

  bindEvents() {
    this.container.addEventListener('keydown', this.handleKeyDown);
  }

  private _handleKeyDown(event: KeyboardEvent) {
    if (event.key !== 'Tab') return;

    const { focusableElements } = this;
    if (focusableElements.length === 0) return;

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    if (event.shiftKey) {
      // Shift+Tab
      if (document.activeElement === firstElement) {
        event.preventDefault();
        lastElement.focus();
      }
    } else {
      // Tab
      if (document.activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus();
      }
    }
  }

  destroy() {
    this.container.removeEventListener('keydown', this.handleKeyDown);
  }
}

export const focusManager = new FocusManager();