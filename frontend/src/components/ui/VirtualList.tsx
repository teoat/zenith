// frontend/src/components/ui/VirtualList.tsx
import React, { useState, useRef, useCallback, useMemo } from 'react';

interface VirtualListProps<T> {
  items: T[];
  renderItem: (item: T, index: number) => React.ReactNode;
  getItemKey: (item: T) => string;
  estimateItemHeight?: number; // Estimated height for initial calculation
  itemHeight?: number; // Fixed height if known
  containerHeight: number;
  overscan?: number;
  className?: string;
  onScroll?: (scrollTop: number, scrollHeight: number) => void;
}

export function VirtualList<T>({
  items,
  renderItem,
  getItemKey,
  estimateItemHeight = 50,
  itemHeight,
  containerHeight,
  overscan = 5,
  className = '',
  onScroll
}: VirtualListProps<T>) {
  const [scrollTop, setScrollTop] = useState(0);
  const [measuredHeights, setMeasuredHeights] = useState<Map<string, number>>(new Map());
  const containerRef = useRef<HTMLDivElement>(null);

  // Calculate visible range
  const { startIndex, endIndex, totalHeight, offsetY } = useMemo(() => {
    if (items.length === 0) {
      return { startIndex: 0, endIndex: 0, totalHeight: 0, offsetY: 0 };
    }

    const getItemHeight = (item: T) => {
      if (itemHeight) return itemHeight;
      const key = getItemKey(item);
      return measuredHeights.get(key) || estimateItemHeight;
    };

    // Calculate cumulative heights
    const heights: number[] = [];
    let cumulativeHeight = 0;

    for (let i = 0; i < items.length; i++) {
      const height = getItemHeight(items[i]);
      heights.push(height);
      cumulativeHeight += height;
    }

    const totalHeight = cumulativeHeight;

    // Find visible range
    let startIndex = 0;
    let endIndex = items.length - 1;
    let offsetY = 0;

    cumulativeHeight = 0;
    for (let i = 0; i < items.length; i++) {
      const itemTop = cumulativeHeight;
      const itemBottom = itemTop + heights[i];

      if (itemBottom > scrollTop - overscan * estimateItemHeight) {
        startIndex = Math.max(0, i - overscan);
        offsetY = itemTop;
        break;
      }
      cumulativeHeight = itemBottom;
    }

    // Find end index
    cumulativeHeight = offsetY;
    for (let i = startIndex; i < items.length; i++) {
      const itemHeight = heights[i];
      if (cumulativeHeight - scrollTop > containerHeight + overscan * estimateItemHeight) {
        endIndex = Math.min(items.length - 1, i + overscan);
        break;
      }
      cumulativeHeight += itemHeight;
    }

    return { startIndex, endIndex, totalHeight, offsetY };
  }, [items, scrollTop, containerHeight, overscan, itemHeight, measuredHeights, estimateItemHeight, getItemKey]);

  // Measure item heights when they change
  const measureItemHeight = useCallback((id: string, element: HTMLDivElement | null) => {
    if (!element || itemHeight) return; 

    const rect = element.getBoundingClientRect();
    const height = rect.height;

    setMeasuredHeights(prev => {
      if (prev.get(id) !== height) {
        const newMap = new Map(prev);
        newMap.set(id, height);
        return newMap;
      }
      return prev;
    });
  }, [itemHeight]);

  // Handle scroll
  const handleScroll = useCallback((event: React.UIEvent<HTMLDivElement>) => {
    const scrollTop = event.currentTarget.scrollTop;
    setScrollTop(scrollTop);
    onScroll?.(scrollTop, event.currentTarget.scrollHeight);
  }, [onScroll]);

  // Render visible items
  const visibleItems = items.slice(startIndex, endIndex + 1);

  return (
    <div
      ref={containerRef}
      className={`virtual-list ${className}`}
      style={{ height: containerHeight, overflow: 'auto' }}
      onScroll={handleScroll}
    >
      <div
        className="virtual-list-inner"
        style={{ height: totalHeight, position: 'relative' }}
      >
        <div
          className="virtual-list-items"
          style={{
            transform: `translateY(${offsetY - scrollTop}px)`,
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0
          }}
        >
          {visibleItems.map((item, index) => {
            const actualIndex = startIndex + index;
            const key = getItemKey(item);
            return (
              <div
                key={key}
                ref={(el) => measureItemHeight(key, el)}
                className="virtual-list-item"
                style={{
                  height: itemHeight || measuredHeights.get(key) || 'auto'
                }}
                data-index={actualIndex}
              >
                {renderItem(item, actualIndex)}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
