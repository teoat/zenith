import { useEffect, useCallback, useRef } from "react";

export interface KeyboardNavigationOptions {
  onEscape?: () => void;
  onEnter?: () => void;
  onSpace?: () => void;
  onArrowUp?: () => void;
  onArrowDown?: () => void;
  onArrowLeft?: () => void;
  onArrowRight?: () => void;
  onTab?: () => void;
  onShiftTab?: () => void;
  preventDefault?: boolean;
  stopPropagation?: boolean;
  enabled?: boolean;
}

export const useKeyboardNavigation = (options: KeyboardNavigationOptions) => {
  const {
    onEscape,
    onEnter,
    onSpace,
    onArrowUp,
    onArrowDown,
    onArrowLeft,
    onArrowRight,
    onTab,
    onShiftTab,
    preventDefault = true,
    stopPropagation = false,
    enabled = true,
  } = options;

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!enabled) return;

      const { key, shiftKey } = event;
      let handled = false;

      switch (key) {
        case "Escape":
          if (onEscape) {
            onEscape();
            handled = true;
          }
          break;
        case "Enter":
          if (onEnter) {
            onEnter();
            handled = true;
          }
          break;
        case " ":
          if (onSpace) {
            onSpace();
            handled = true;
          }
          break;
        case "ArrowUp":
          if (onArrowUp) {
            onArrowUp();
            handled = true;
          }
          break;
        case "ArrowDown":
          if (onArrowDown) {
            onArrowDown();
            handled = true;
          }
          break;
        case "ArrowLeft":
          if (onArrowLeft) {
            onArrowLeft();
            handled = true;
          }
          break;
        case "ArrowRight":
          if (onArrowRight) {
            onArrowRight();
            handled = true;
          }
          break;
        case "Tab":
          if (shiftKey && onShiftTab) {
            onShiftTab();
            handled = true;
          } else if (!shiftKey && onTab) {
            onTab();
            handled = true;
          }
          break;
      }

      if (handled) {
        if (preventDefault) {
          event.preventDefault();
        }
        if (stopPropagation) {
          event.stopPropagation();
        }
      }
    },
    [
      onEscape,
      onEnter,
      onSpace,
      onArrowUp,
      onArrowDown,
      onArrowLeft,
      onArrowRight,
      onTab,
      onShiftTab,
      preventDefault,
      stopPropagation,
      enabled,
    ],
  );

  useEffect(() => {
    if (!enabled) return;

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [handleKeyDown, enabled]);

  return { handleKeyDown };
};

// Focus management utilities
export const useFocusManagement = () => {
  const focusableElements = useRef<HTMLElement[]>([]);

  const updateFocusableElements = useCallback((container: HTMLElement) => {
    focusableElements.current = Array.from(
      container.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
      ),
    ).filter((el) => {
      const element = el as HTMLElement;
      return (
        !element.hasAttribute("disabled") &&
        !element.getAttribute("aria-hidden") &&
        element.offsetWidth > 0 &&
        element.offsetHeight > 0
      );
    }) as HTMLElement[];
  }, []);

  const focusFirst = useCallback(() => {
    if (focusableElements.current.length > 0) {
      focusableElements.current[0].focus();
    }
  }, []);

  const focusLast = useCallback(() => {
    if (focusableElements.current.length > 0) {
      focusableElements.current[focusableElements.current.length - 1].focus();
    }
  }, []);

  const focusNext = useCallback((currentElement: HTMLElement) => {
    const currentIndex = focusableElements.current.indexOf(currentElement);
    if (
      currentIndex >= 0 &&
      currentIndex < focusableElements.current.length - 1
    ) {
      focusableElements.current[currentIndex + 1].focus();
    }
  }, []);

  const focusPrevious = useCallback((currentElement: HTMLElement) => {
    const currentIndex = focusableElements.current.indexOf(currentElement);
    if (currentIndex > 0) {
      focusableElements.current[currentIndex - 1].focus();
    }
  }, []);

  const trapFocus = useCallback(
    (container: HTMLElement) => {
      updateFocusableElements(container);

      const handleKeyDown = (event: KeyboardEvent) => {
        if (event.key === "Tab") {
          const firstElement = focusableElements.current[0];
          const lastElement =
            focusableElements.current[focusableElements.current.length - 1];

          if (event.shiftKey) {
            if (document.activeElement === firstElement) {
              event.preventDefault();
              lastElement.focus();
            }
          } else {
            if (document.activeElement === lastElement) {
              event.preventDefault();
              firstElement.focus();
            }
          }
        }
      };

      container.addEventListener("keydown", handleKeyDown);
      return () => {
        container.removeEventListener("keydown", handleKeyDown);
      };
    },
    [updateFocusableElements],
  );

  return {
    updateFocusableElements,
    focusFirst,
    focusLast,
    focusNext,
    focusPrevious,
    trapFocus,
  };
};

// Screen reader announcements
export const useScreenReader = () => {
  const announce = useCallback(
    (message: string, priority: "polite" | "assertive" = "polite") => {
      const announcement = document.createElement("div");
      announcement.setAttribute("aria-live", priority);
      announcement.setAttribute("aria-atomic", "true");
      announcement.style.position = "absolute";
      announcement.style.left = "-10000px";
      announcement.style.width = "1px";
      announcement.style.height = "1px";
      announcement.style.overflow = "hidden";

      document.body.appendChild(announcement);
      announcement.textContent = message;

      // Remove after announcement
      setTimeout(() => {
        if (announcement.parentNode) {
          announcement.parentNode.removeChild(announcement);
        }
      }, 1000);
    },
    [],
  );

  return { announce };
};
