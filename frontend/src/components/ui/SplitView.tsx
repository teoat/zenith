import React, { useState, useRef, useEffect, type ReactNode } from "react";
import { GripVertical } from "lucide-react";

interface SplitViewProps {
  /** Left panel content */
  left: ReactNode;
  /** Right panel content */
  right: ReactNode;
  /** Initial split position (0-100, percentage) */
  initialSplit?: number;
  /** Minimum width for left panel (px) */
  minLeftWidth?: number;
  /** Minimum width for right panel (px) */
  minRightWidth?: number;
  /** Orientation */
  orientation?: "horizontal" | "vertical";
  /** Custom class name */
  className?: string;
  /** Show resize handle */
  showHandle?: boolean;
  /** Callback when split position changes */
  onSplitChange?: (position: number) => void;
}

/**
 * SplitView Component
 *
 * A reusable split-pane component with draggable divider.
 * Supports both horizontal and vertical layouts.
 *
 * @example
 * <SplitView
 *   left={<CaseList />}
 *   right={<CaseDetail />}
 *   initialSplit={33}
 *   minLeftWidth={300}
 * />
 */
export const SplitView: React.FC<SplitViewProps> = ({
  left,
  right,
  initialSplit = 50,
  minLeftWidth = 200,
  minRightWidth = 200,
  orientation = "horizontal",
  className = "",
  showHandle = true,
  onSplitChange,
}) => {
  const [splitPosition, setSplitPosition] = useState(initialSplit);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;

      const container = containerRef.current;
      const rect = container.getBoundingClientRect();

      let newPosition: number;
      if (orientation === "horizontal") {
        const mouseX = e.clientX - rect.left;
        const containerWidth = rect.width;

        // Calculate percentage
        newPosition = (mouseX / containerWidth) * 100;

        // Enforce minimum widths
        const minLeftPercent = (minLeftWidth / containerWidth) * 100;
        const minRightPercent = (minRightWidth / containerWidth) * 100;

        newPosition = Math.max(
          minLeftPercent,
          Math.min(100 - minRightPercent, newPosition),
        );
      } else {
        const mouseY = e.clientY - rect.top;
        const containerHeight = rect.height;

        newPosition = (mouseY / containerHeight) * 100;

        const minTopPercent = (minLeftWidth / containerHeight) * 100;
        const minBottomPercent = (minRightWidth / containerHeight) * 100;

        newPosition = Math.max(
          minTopPercent,
          Math.min(100 - minBottomPercent, newPosition),
        );
      }

      setSplitPosition(newPosition);
      onSplitChange?.(newPosition);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, orientation, minLeftWidth, minRightWidth, onSplitChange]);

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const isHorizontal = orientation === "horizontal";

  return (
    <div
      ref={containerRef}
      className={`flex ${isHorizontal ? "flex-row" : "flex-col"} h-full w-full ${className}`}
      style={{ userSelect: isDragging ? "none" : "auto" }}
    >
      {/* Left/Top Panel */}
      <div
        className="overflow-auto"
        style={{
          [isHorizontal ? "width" : "height"]: `${splitPosition}%`,
          flexShrink: 0,
        }}
      >
        {left}
      </div>

      {/* Resize Handle */}
      {showHandle && (
        <button
          className={`
              flex items-center justify-center flex-shrink-0 bg-slate-200 dark:bg-slate-800
              hover:bg-blue-500 dark:hover:bg-blue-600 transition-colors
              ${isHorizontal ? "w-1 cursor-col-resize" : "h-1 cursor-row-resize"}
              ${isDragging ? "bg-blue-500 dark:bg-blue-600" : ""}
            `}
          onMouseDown={handleMouseDown}
          aria-orientation={orientation}
          aria-valuenow={splitPosition}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Resize panel"
          onKeyDown={(e) => {
            const step = 5;
            if (
              (isHorizontal && e.key === "ArrowLeft") ||
              (!isHorizontal && e.key === "ArrowUp")
            ) {
              e.preventDefault();
              const newPos = Math.max(0, splitPosition - step);
              setSplitPosition(newPos);
              onSplitChange?.(newPos);
            } else if (
              (isHorizontal && e.key === "ArrowRight") ||
              (!isHorizontal && e.key === "ArrowDown")
            ) {
              e.preventDefault();
              const newPos = Math.min(100, splitPosition + step);
              setSplitPosition(newPos);
              onSplitChange?.(newPos);
            }
          }}
        >
          {isHorizontal && (
            <GripVertical
              size={16}
              className="text-slate-400 pointer-events-none"
            />
          )}
        </button>
      )}

      {/* Right/Bottom Panel */}
      <div className="flex-1 overflow-auto">{right}</div>
    </div>
  );
};

export default SplitView;
