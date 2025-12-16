// frontend/src/components/ui/ResizablePanel.tsx
import React, { useState, useRef, useCallback, useId } from 'react';

interface ResizablePanelProps {
  children: React.ReactNode;
  direction: 'horizontal' | 'vertical';
  defaultSize?: number;
  minSize?: number;
  maxSize?: number;
  className?: string;
  onResize?: (size: number) => void;
  onResizeStart?: () => void;
  onResizeEnd?: (size: number) => void;
  resizerClassName?: string;
  showResizer?: boolean;
}

export function ResizablePanel({
  children,
  direction,
  defaultSize = 200,
  minSize = 100,
  maxSize = 800,
  className = '',
  onResize,
  onResizeStart,
  onResizeEnd,
  resizerClassName = '',
  showResizer = true
}: ResizablePanelProps) {
  const [size, setSize] = useState(defaultSize);
  const [isResizing, setIsResizing] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const resizerRef = useRef<HTMLDivElement>(null);
  const panelId = useId();

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    setIsResizing(true);
    onResizeStart?.();

    const startPos = direction === 'horizontal' ? e.clientX : e.clientY;
    const startSize = size;

    const handleMouseMove = (e: MouseEvent) => {
      const currentPos = direction === 'horizontal' ? e.clientX : e.clientY;
      const delta = currentPos - startPos;
      const newSize = Math.max(minSize, Math.min(maxSize, startSize + delta));

      setSize(newSize);
      onResize?.(newSize);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      onResizeEnd?.(size);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    document.body.style.cursor = direction === 'horizontal' ? 'col-resize' : 'row-resize';
    document.body.style.userSelect = 'none';

    e.preventDefault();
  }, [direction, size, minSize, maxSize, onResize, onResizeStart, onResizeEnd]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'ArrowLeft' && direction === 'horizontal') {
      e.preventDefault();
      const newSize = Math.max(minSize, size - 10);
      setSize(newSize);
      onResize?.(newSize);
    } else if (e.key === 'ArrowRight' && direction === 'horizontal') {
      e.preventDefault();
      const newSize = Math.min(maxSize, size + 10);
      setSize(newSize);
      onResize?.(newSize);
    } else if (e.key === 'ArrowUp' && direction === 'vertical') {
      e.preventDefault();
      const newSize = Math.max(minSize, size - 10);
      setSize(newSize);
      onResize?.(newSize);
    } else if (e.key === 'ArrowDown' && direction === 'vertical') {
      e.preventDefault();
      const newSize = Math.min(maxSize, size + 10);
      setSize(newSize);
      onResize?.(newSize);
    }
  }, [direction, size, minSize, maxSize, onResize]);

  const panelStyle: React.CSSProperties = {
    [direction === 'horizontal' ? 'width' : 'height']: size,
  };

  const resizerClasses = `resizer absolute z-10 transition-colors duration-200 ${
    direction === 'horizontal' 
      ? 'right-0 top-0 cursor-col-resize h-full w-1' 
      : 'bottom-0 left-0 cursor-row-resize w-full h-1'
  } ${resizerClassName} ${isResizing ? 'bg-blue-500' : 'bg-transparent hover:bg-blue-500/50'}`;

  return (
    <div
      ref={panelRef}
      id={panelId}
      className={`resizable-panel relative shrink-0 ${direction} ${isResizing ? 'resizing' : ''} ${className}`}
      style={panelStyle}
    >
      {children}

      {showResizer && (
        // eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions
        <div
          ref={resizerRef}
          className={resizerClasses}
          onMouseDown={handleMouseDown}
          onKeyDown={handleKeyDown}
          tabIndex={0} // eslint-disable-line jsx-a11y/no-noninteractive-tabindex
          role="separator"
          aria-orientation={direction === 'horizontal' ? 'horizontal' : 'vertical'}
          aria-label={`Resize ${direction} panel`}
          aria-valuenow={Math.round(size)}
          aria-controls={panelId}
          aria-valuemin={minSize}
          aria-valuemax={maxSize}
        >
          <div className="resizer-handle flex items-center justify-center h-full opacity-0 hover:opacity-100 transition-opacity">
            {direction === 'horizontal' ? '⋮' : '⋯'}
          </div>
        </div>
      )}
    </div>
  );
}

// Resizable Layout Component
interface ResizableLayoutProps {
  children: React.ReactNode[];
  direction: 'horizontal' | 'vertical';
  defaultSizes?: number[];
  minSizes?: number[];
  maxSizes?: number[];
  className?: string;
  onLayoutChange?: (sizes: number[]) => void;
  resizerClassName?: string;
}

export function ResizableLayout({
  children,
  direction,
  defaultSizes,
  minSizes,
  maxSizes,
  className = '',
  onLayoutChange,
  resizerClassName = ''
}: ResizableLayoutProps) {
  const [sizes, setSizes] = useState(() => {
    if (defaultSizes && defaultSizes.length === children.length) {
      return defaultSizes;
    }
    // Default equal distribution
    const equalSize = 100 / children.length;
    return children.map(() => equalSize);
  });

  const handleResize = useCallback((index: number, newSize: number) => {
    setSizes(prevSizes => {
      const newSizes = [...prevSizes];
      newSizes[index] = newSize;

      // Adjust other panels to maintain total
      const totalSize = newSizes.reduce((sum, size) => sum + size, 0);
      const scale = 100 / totalSize;

      const adjustedSizes = newSizes.map(size => size * scale);
      onLayoutChange?.(adjustedSizes);
      return adjustedSizes;
    });
  }, [onLayoutChange]);

  const containerClasses = `resizable-layout flex w-full h-full overflow-hidden ${
    direction === 'horizontal' ? 'flex-row' : 'flex-col'
  } ${className}`;

  return (
    <div className={containerClasses}>
      {children.map((child, index) => (
        <ResizablePanel
          key={index}
          direction={direction}
          defaultSize={sizes[index]}
          minSize={minSizes?.[index] || 50}
          maxSize={maxSizes?.[index] || 800}
          onResize={(size) => handleResize(index, size)}
          resizerClassName={resizerClassName}
          showResizer={index < children.length - 1} // Don't show resizer on last panel
        >
          {child}
        </ResizablePanel>
      ))}
    </div>
  );
}

// Advanced Interactions: Infinite Scroll Hook
export function useInfiniteScroll(
  callback: () => void,
  hasMore: boolean,
  loading: boolean,
  threshold = 100
) {
  const [isFetching, setIsFetching] = useState(false);

  const handleScroll = useCallback((event: React.UIEvent<HTMLElement>) => {
    if (loading || !hasMore || isFetching) return;

    const { scrollTop, scrollHeight, clientHeight } = event.currentTarget;
    const distanceFromBottom = scrollHeight - scrollTop - clientHeight;

    if (distanceFromBottom < threshold) {
      setIsFetching(true);
      callback();
    }
  }, [callback, hasMore, loading, isFetching, threshold]);

  const resetFetching = useCallback(() => {
    setIsFetching(false);
  }, []);

  return { handleScroll, isFetching, resetFetching };
}

// Advanced Interactions: Auto-complete Search
interface AutoCompleteProps<T> {
  value: string;
  onChange: (value: string) => void;
  onSelect: (item: T) => void;
  suggestions: T[];
  placeholder?: string;
  className?: string;
  renderSuggestion?: (item: T) => React.ReactNode;
  getSuggestionValue?: (item: T) => string;
  filterSuggestions?: (input: string, suggestions: T[]) => T[];
}

export function AutoComplete<T>({
  value,
  onChange,
  onSelect,
  suggestions,
  placeholder = '',
  className = '',
  renderSuggestion,
  getSuggestionValue = (item) => String(item),
  filterSuggestions
}: AutoCompleteProps<T>) {
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const filteredSuggestions = filterSuggestions
    ? filterSuggestions(value, suggestions)
    : suggestions.filter(item =>
        getSuggestionValue(item).toLowerCase().includes(value.toLowerCase())
      );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    onChange(newValue);
    setIsOpen(true);
    setHighlightedIndex(-1);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) {
      if (e.key === 'ArrowDown') {
        setIsOpen(true);
        setHighlightedIndex(0);
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex(prev =>
          prev < filteredSuggestions.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex(prev => prev > 0 ? prev - 1 : -1);
        break;
      case 'Enter':
        e.preventDefault();
        if (highlightedIndex >= 0 && filteredSuggestions[highlightedIndex]) {
          handleSelect(filteredSuggestions[highlightedIndex]);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        setHighlightedIndex(-1);
        break;
    }
  };

  const handleSelect = (item: T) => {
    onChange(getSuggestionValue(item));
    onSelect(item);
    setIsOpen(false);
    setHighlightedIndex(-1);
    inputRef.current?.focus();
  };

  const handleBlur = () => {
    // Delay closing to allow for clicks on suggestions
    setTimeout(() => setIsOpen(false), 150);
  };

  return (
    <div className={`autocomplete ${className}`}>
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        onBlur={handleBlur}
        onFocus={() => value && setIsOpen(true)}
        placeholder={placeholder}
        className="autocomplete-input"
        role="combobox"
        aria-expanded={isOpen ? "true" : "false"}
        aria-haspopup="listbox"
        aria-autocomplete="list"
        aria-controls="autocomplete-listbox"
        aria-activedescendant={highlightedIndex >= 0 ? `autocomplete-option-${highlightedIndex}` : undefined}
      />

      {isOpen && filteredSuggestions.length > 0 && (
        <ul
          id="autocomplete-listbox"
          ref={listRef}
          className="autocomplete-list"
          role="listbox"
          aria-label="Suggestions"
        >
          {filteredSuggestions.map((item, index) => (
            <li
              key={index}
              id={`autocomplete-option-${index}`}
              className={`autocomplete-item ${index === highlightedIndex ? 'bg-blue-100 dark:bg-blue-900 cursor-pointer p-2' : 'cursor-pointer p-2'} ${index === highlightedIndex ? 'highlighted' : ''}`}
              onClick={() => handleSelect(item)}
              role="option"
              aria-selected={index === highlightedIndex ? "true" : "false"}
            >
              {renderSuggestion ? renderSuggestion(item) : getSuggestionValue(item)}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}