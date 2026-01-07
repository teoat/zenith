/**
 * useKeyboardNavigation - Hook for complex widget keyboard navigation
 *
 * Provides keyboard shortcuts for graphs, kanbans, and other complex widgets.
 * Standard: Tab enters widget, Arrow keys navigate, Esc exits.
 */

import { useEffect, useCallback, useRef } from "react";

export interface KeyboardNavigationConfig {
  onArrowUp?: () => void;
  onArrowDown?: () => void;
  onArrowLeft?: () => void;
  onArrowRight?: () => void;
  onEnter?: () => void;
  onEscape?: () => void;
  onSpace?: () => void;
  onTab?: (shift: boolean) => void;
  enabled?: boolean;
  captureTab?: boolean;
}

export function useKeyboardNavigation(config: KeyboardNavigationConfig) {
  const { enabled = true, captureTab = false } = config;
  const containerRef = useRef<HTMLDivElement>(null);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!enabled) return;

      switch (e.key) {
        case "ArrowUp":
          e.preventDefault();
          config.onArrowUp?.();
          break;
        case "ArrowDown":
          e.preventDefault();
          config.onArrowDown?.();
          break;
        case "ArrowLeft":
          e.preventDefault();
          config.onArrowLeft?.();
          break;
        case "ArrowRight":
          e.preventDefault();
          config.onArrowRight?.();
          break;
        case "Enter":
          e.preventDefault();
          config.onEnter?.();
          break;
        case "Escape":
          e.preventDefault();
          config.onEscape?.();
          break;
        case " ":
          e.preventDefault();
          config.onSpace?.();
          break;
        case "Tab":
          if (captureTab) {
            e.preventDefault();
            config.onTab?.(e.shiftKey);
          }
          break;
      }
    },
    [config, enabled, captureTab],
  );

  useEffect(() => {
    const container = containerRef.current;
    if (!container || !enabled) return;

    const handleKeyDownTyped = handleKeyDown as (e: Event) => void;
    container.addEventListener("keydown", handleKeyDownTyped);
    return () => {
      container.removeEventListener("keydown", handleKeyDownTyped);
    };
  }, [handleKeyDown, enabled]);

  return containerRef;
}

export default useKeyboardNavigation;
