// frontend/src/lib/accessibility.ts
// Accessibility utilities and helpers for WCAG 2.1 AA compliance

export class AccessibilityManager {
  private focusTraps: Map<string, any> = new Map(); // FocusTrap type is internal, using any for storage or we export FocusTrap
  private liveRegions: Map<string, HTMLElement> = new Map();


  constructor() {
    this.initializeGlobalAccessibility();
  }

  private initializeGlobalAccessibility() {
    if (typeof document === 'undefined') return; // SSR check

    // Add global keyboard navigation
    document.addEventListener('keydown', this.handleGlobalKeydown.bind(this));

    // Add skip links
    this.addSkipLinks();

    // Initialize ARIA live regions
    this.initializeLiveRegions();

    // Set up focus management
    this.setupFocusManagement();
  }

  private handleGlobalKeydown(event: KeyboardEvent) {
    // Global keyboard shortcuts
    switch (event.key) {
      case 'Escape':
        this.handleEscapeKey(event);
        break;
      case 'Tab':
        this.handleTabNavigation(event);
        break;
      case 'Enter':
      case ' ':
        this.handleActivationKeys(event);
        break;
    }
  }

  private handleEscapeKey(event: KeyboardEvent) {
    // Close modals, menus, etc.
    const activeModal = document.querySelector('[role="dialog"][aria-modal="true"]') as HTMLElement;
    if (activeModal) {
      const closeButton = activeModal.querySelector('[data-close]') as HTMLElement;
      if (closeButton) {
        closeButton.click();
        event.preventDefault();
      }
    }
  }

  private handleTabNavigation(event: KeyboardEvent) {
    // Ensure focus stays within modal/dialog when open
    const activeModal = document.querySelector('[role="dialog"][aria-modal="true"]') as HTMLElement;
    if (activeModal) {
      this.trapFocus(activeModal, event);
    }
  }

  private handleActivationKeys(event: KeyboardEvent) {
    // Handle custom element activation
    const target = event.target as HTMLElement;
    if (target.hasAttribute('data-activate-on-enter')) {
      target.click();
      event.preventDefault();
    }
  }

  private addSkipLinks() {
    const skipLinks = [
      { href: '#main-content', text: 'Skip to main content' },
      { href: '#navigation', text: 'Skip to navigation' },
      { href: '#search', text: 'Skip to search' }
    ];

    const container = document.createElement('div');
    container.className = 'skip-links';
    container.setAttribute('aria-hidden', 'true');

    skipLinks.forEach(link => {
      const anchor = document.createElement('a');
      anchor.href = link.href;
      anchor.textContent = link.text;
      anchor.className = 'skip-link';
      container.appendChild(anchor);
    });

    document.body.insertBefore(container, document.body.firstChild);

    // Show skip links on focus
    const links = container.querySelectorAll('.skip-link');
    links.forEach(link => {
      link.addEventListener('focus', () => {
        container.setAttribute('aria-hidden', 'false');
      });
      link.addEventListener('blur', () => {
        container.setAttribute('aria-hidden', 'true');
      });
    });

    // this._skipLinks = Array.from(links) as HTMLElement[];
  }

  private initializeLiveRegions() {
    // Create live regions for dynamic content announcements
    const regions: { id: string; 'aria-live': 'polite' | 'assertive'; 'aria-atomic': 'true' | 'false' }[] = [
      { id: 'status-live-region', 'aria-live': 'polite', 'aria-atomic': 'true' },
      { id: 'alert-live-region', 'aria-live': 'assertive', 'aria-atomic': 'true' },
      { id: 'progress-live-region', 'aria-live': 'polite', 'aria-atomic': 'false' }
    ];

    regions.forEach(config => {
      const region = document.createElement('div');
      region.id = config.id;
      region.setAttribute('aria-live', config['aria-live']);
      region.setAttribute('aria-atomic', config['aria-atomic']);
      region.className = 'sr-only live-region';
      region.style.position = 'absolute';
      region.style.left = '-10000px';
      region.style.width = '1px';
      region.style.height = '1px';
      region.style.overflow = 'hidden';

      document.body.appendChild(region);
      this.liveRegions.set(config.id, region);
    });
  }

  private setupFocusManagement() {
    // Manage focus for dynamic content
    document.addEventListener('focusin', (event) => {
      const target = event.target as HTMLElement;
      // Announce focus changes for screen readers if needed
      this.announceFocusChange(target);
    });
  }

  // Public API methods

  announce(message: string, priority: 'polite' | 'assertive' = 'polite') {
    const regionId = priority === 'assertive' ? 'alert-live-region' : 'status-live-region';
    const region = this.liveRegions.get(regionId);

    if (region) {
      // Clear previous content and add new message
      region.textContent = '';
      // Use setTimeout to ensure screen readers pick up the change
      setTimeout(() => {
        region.textContent = message;
      }, 100);
    }
  }

  announceProgress(message: string) {
    const region = this.liveRegions.get('progress-live-region');
    if (region) {
      region.textContent = message;
    }
  }

  trapFocus(container: HTMLElement, event?: KeyboardEvent) {
    const focusableElements = this.getFocusableElements(container);
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    if (event) {
      if (event.key === 'Tab') {
        if (event.shiftKey) {
          // Shift + Tab
          if (document.activeElement === firstElement) {
            lastElement.focus();
            event.preventDefault();
          }
        } else {
          // Tab
          if (document.activeElement === lastElement) {
            firstElement.focus();
            event.preventDefault();
          }
        }
      }
    }
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
      'button:not([disabled])',
      'input:not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      '[tabindex]:not([tabindex="-1"])',
      '[contenteditable="true"]'
    ];

    return Array.from(container.querySelectorAll(focusableSelectors.join(', ')))
      .filter(el => {
        const rect = el.getBoundingClientRect();
        return rect.width > 0 && rect.height > 0; // Visible elements only
      }) as HTMLElement[];
  }

  private announceFocusChange(element: HTMLElement) {
    // Announce focus changes for complex interactive elements
    const label = element.getAttribute('aria-label') ||
                  element.getAttribute('aria-labelledby') ||
                  element.textContent?.trim() ||
                  element.getAttribute('placeholder');

    if (label && element.tagName.toLowerCase() === 'input') {
      this.announce(`Focused on ${label} input field`, 'polite');
    }
  }

  // Utility methods for components
  generateAriaId(prefix = 'aria') {
    return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  validateColorContrast(_foreground: string, _background: string): boolean {
    // Simple contrast validation (implement proper WCAG calculation)
    // This is a placeholder - use a proper color contrast library
    return true; // Placeholder
  }

  setAriaExpanded(element: HTMLElement, expanded: boolean) {
    element.setAttribute('aria-expanded', expanded.toString());
  }

  setAriaHidden(element: HTMLElement, hidden: boolean) {
    element.setAttribute('aria-hidden', hidden.toString());
  }

  manageTabIndex(container: HTMLElement, enable: boolean) {
    const focusableElements = this.getFocusableElements(container);

    focusableElements.forEach(element => {
      if (enable) {
        const originalTabIndex = element.getAttribute('data-original-tabindex');
        if (originalTabIndex) {
          element.setAttribute('tabindex', originalTabIndex);
          element.removeAttribute('data-original-tabindex');
        }
      } else {
        const currentTabIndex = element.getAttribute('tabindex');
        if (currentTabIndex && currentTabIndex !== '-1') {
          element.setAttribute('data-original-tabindex', currentTabIndex);
        }
        element.setAttribute('tabindex', '-1');
      }
    });
  }
}

class FocusTrap {
  private container: HTMLElement;
  private focusableElements: Element[] = [];
  private firstElement: Element | null = null;
  private lastElement: Element | null = null;
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
      'button:not([disabled])',
      'input:not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      '[tabindex]:not([tabindex="-1"])'
    ];

    this.focusableElements = Array.from(
      this.container.querySelectorAll(focusableSelectors.join(', '))
    ).filter(el => {
      const rect = el.getBoundingClientRect();
      return rect.width > 0 && rect.height > 0;
    });

    this.firstElement = this.focusableElements[0];
    this.lastElement = this.focusableElements[this.focusableElements.length - 1];
  }

  bindEvents() {
    document.addEventListener('keydown', this.handleKeyDown);
  }

  private _handleKeyDown(event: KeyboardEvent) {
    if (event.key !== 'Tab') return;

    if (event.shiftKey) {
      // Shift + Tab
      if (document.activeElement === this.firstElement) {
        (this.lastElement as HTMLElement)?.focus();
        event.preventDefault();
      }
    } else {
      // Tab
      if (document.activeElement === this.lastElement) {
        (this.firstElement as HTMLElement)?.focus();
        event.preventDefault();
      }
    }
  }

  destroy() {
    document.removeEventListener('keydown', this.handleKeyDown);
  }
}

// React hooks for accessibility
export function useAccessibility() {
  const announce = (message: string, priority: 'polite' | 'assertive' = 'polite') => {
    // This would integrate with the global AccessibilityManager
    console.log(`[Accessibility] ${priority}: ${message}`);
  };

  const trapFocus = (_containerRef: React.RefObject<HTMLElement>) => {
    // Implement focus trapping logic
  };

  return {
    announce,
    trapFocus,
    generateId: () => `a11y-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  };
}

// Screen reader utilities
export const srOnly = {
  className: 'sr-only',
  style: {
    position: 'absolute',
    width: '1px',
    height: '1px',
    padding: '0',
    margin: '-1px',
    overflow: 'hidden',
    clip: 'rect(0, 0, 0, 0)',
    whiteSpace: 'nowrap',
    border: '0'
  }
};

// ARIA utilities
export const aria = {
  live: {
    polite: { 'aria-live': 'polite' },
    assertive: { 'aria-live': 'assertive' },
    off: { 'aria-live': 'off' }
  },
  atomic: {
    true: { 'aria-atomic': 'true' },
    false: { 'aria-atomic': 'false' }
  },
  expanded: (expanded: boolean) => ({ 'aria-expanded': expanded }),
  hidden: (hidden: boolean) => ({ 'aria-hidden': hidden }),
  label: (label: string) => ({ 'aria-label': label }),
  labelledBy: (id: string) => ({ 'aria-labelledby': id }),
  describedBy: (id: string) => ({ 'aria-describedby': id }),
  controls: (id: string) => ({ 'aria-controls': id }),
  current: (current: boolean | 'page' | 'step' | 'location' | 'date' | 'time') => ({
    'aria-current': current
  })
};

// Keyboard navigation utilities
export const keyboard = {
  isNavigationKey: (event: KeyboardEvent) => {
    return ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Home', 'End', 'PageUp', 'PageDown'].includes(event.key);
  },

  isActivationKey: (event: KeyboardEvent) => {
    return ['Enter', ' '].includes(event.key);
  },

  preventDefault: (event: KeyboardEvent) => {
    event.preventDefault();
    event.stopPropagation();
  }
};

// Focus management utilities
export const focus = {
  moveFocus: (element: HTMLElement) => {
    element.focus();
    element.scrollIntoView({ behavior: 'smooth', block: 'center' });
  },

  findFirstFocusable: (container: HTMLElement): HTMLElement | null => {
    const focusableSelectors = [
      'a[href]',
      'button:not([disabled])',
      'input:not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      '[tabindex]:not([tabindex="-1"])'
    ];

    return container.querySelector(focusableSelectors.join(', ')) as HTMLElement;
  },

  findLastFocusable: (container: HTMLElement): HTMLElement | null => {
    const focusableSelectors = [
      'a[href]',
      'button:not([disabled])',
      'input:not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      '[tabindex]:not([tabindex="-1"])'
    ];

    const elements = container.querySelectorAll(focusableSelectors.join(', '));
    return elements[elements.length - 1] as HTMLElement;
  }
};

// Color contrast utilities (simplified)
export const contrast = {
  isValidContrast: (_foreground: string, _background: string, _level: 'AA' | 'AAA' = 'AA'): boolean => {
    // This is a simplified implementation
    // In production, use a proper color contrast library
    // WCAG AA requires 4.5:1 for normal text, 3:1 for large text
    // WCAG AAA requires 7:1 for normal text, 4.5:1 for large text

    // Placeholder implementation - always return true
    // Replace with actual contrast calculation
    return true;
  }
};

// Color contrast validation (WCAG AA implementation)
export const contrastValidator = {
  // Calculate relative luminance
  getRelativeLuminance(color: string): number {
    // Convert hex to RGB
    const hex = color.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16) / 255;
    const g = parseInt(hex.substr(2, 2), 16) / 255;
    const b = parseInt(hex.substr(4, 2), 16) / 255;

    // Apply gamma correction
    const toLinear = (c: number) => c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);

    const rLinear = toLinear(r);
    const gLinear = toLinear(g);
    const bLinear = toLinear(b);

    // Calculate relative luminance
    return 0.2126 * rLinear + 0.7152 * gLinear + 0.0722 * bLinear;
  },

  // Calculate contrast ratio
  getContrastRatio(color1: string, color2: string): number {
    const lum1 = this.getRelativeLuminance(color1);
    const lum2 = this.getRelativeLuminance(color2);

    const lighter = Math.max(lum1, lum2);
    const darker = Math.min(lum1, lum2);

    return (lighter + 0.05) / (darker + 0.05);
  },

  // Check if contrast meets WCAG AA standards
  isValidContrast(foreground: string, background: string, level: 'AA' | 'AAA' = 'AA', size: 'normal' | 'large' = 'normal'): boolean {
    const ratio = this.getContrastRatio(foreground, background);

    if (level === 'AAA') {
      return size === 'large' ? ratio >= 4.5 : ratio >= 7;
    } else {
      return size === 'large' ? ratio >= 3 : ratio >= 4.5;
    }
  }
};

// Heading hierarchy validator
export class HeadingHierarchyValidator {
  private headings: HTMLElement[] = [];

  validate(container: HTMLElement = document.body): { valid: boolean; errors: string[] } {
    this.headings = Array.from(container.querySelectorAll('h1, h2, h3, h4, h5, h6'));
    const errors: string[] = [];

    // Check for single h1
    const h1Count = this.headings.filter(h => h.tagName === 'H1').length;
    if (h1Count === 0) {
      errors.push('Missing h1 element');
    } else if (h1Count > 1) {
      errors.push('Multiple h1 elements found - only one h1 allowed per page');
    }

    // Check heading hierarchy
    let lastLevel = 0;
    for (const heading of this.headings) {
      const level = parseInt(heading.tagName.charAt(1));

      // Skip h1 as it can appear anywhere
      if (level === 1) continue;

      // Check for skipped levels (e.g., h2 to h4 without h3)
      if (level > lastLevel + 1 && lastLevel > 0) {
        errors.push(`Skipped heading level: ${heading.tagName} after h${lastLevel}`);
      }

      lastLevel = level;
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  getHeadingOutline(container: HTMLElement = document.body): Array<{ level: number; text: string; id?: string }> {
    return Array.from(container.querySelectorAll('h1, h2, h3, h4, h5, h6')).map(heading => ({
      level: parseInt(heading.tagName.charAt(1)),
      text: heading.textContent?.trim() || '',
      id: heading.id || undefined
    }));
  }
}

// Screen reader announcement utilities
export const screenReader = {
  announce(message: string, priority: 'polite' | 'assertive' = 'polite', delay: number = 100) {
    const announcement = document.createElement('div');
    announcement.setAttribute('aria-live', priority);
    announcement.setAttribute('aria-atomic', 'true');
    announcement.style.position = 'absolute';
    announcement.style.left = '-10000px';
    announcement.style.width = '1px';
    announcement.style.height = '1px';
    announcement.style.overflow = 'hidden';

    document.body.appendChild(announcement);

    setTimeout(() => {
      announcement.textContent = message;
      setTimeout(() => {
        document.body.removeChild(announcement);
      }, 1000);
    }, delay);
  },

  announceStatus(message: string) {
    this.announce(message, 'polite');
  },

  announceAlert(message: string) {
    this.announce(message, 'assertive');
  },

  announceProgress(current: number, total: number, action: string) {
    const percentage = Math.round((current / total) * 100);
    this.announce(`${action}: ${percentage}% complete`, 'polite');
  }
};

// Global accessibility manager instance
export const accessibilityManager = new AccessibilityManager();
export const headingValidator = new HeadingHierarchyValidator();