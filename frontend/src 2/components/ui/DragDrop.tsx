// frontend/src/components/ui/DragDrop.tsx
import React, { useState, useRef, useCallback, useEffect } from 'react';
import { accessibilityManager } from '../../lib/accessibility';
import './DragDrop.css';

export interface DragItem<T = any> {
  id: string;
  type: string;
  data: T;
}

interface DropZoneProps {
  id: string;
  accepts: string[];
  onDrop: (item: DragItem, zoneId: string) => void;
  children: React.ReactNode;
  className?: string;
}

interface DraggableProps<T = any> {
  item: DragItem<T>;
  children: React.ReactNode;
  onDragStart?: (item: DragItem<T>) => void;
  onDragEnd?: (item: DragItem<T>) => void;
  className?: string;
  disabled?: boolean;
}

interface DragDropContextProps {
  children: React.ReactNode;
  onDragStart?: (item: DragItem) => void;
  onDragEnd?: (item: DragItem) => void;
}

// Global drag state
let currentDragItem: DragItem | null = null;
let dragOffset = { x: 0, y: 0 };

export function DragDropContext({ children }: DragDropContextProps) {
  const [isDragging] = useState(false);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      currentDragItem = null;
    };
  }, []);

  return (
    <div className="drag-drop-context" data-dragging={isDragging}>
      {children}
    </div>
  );
}

export function Draggable<T = any>({
  item,
  children,
  onDragStart,
  onDragEnd,
  className = '',
  disabled = false
}: DraggableProps<T>) {
  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (disabled) return;

    const rect = dragRef.current?.getBoundingClientRect();
    if (rect) {
      dragOffset = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      };
    }
  }, [disabled]);

  const handleDragStart = useCallback((e: React.DragEvent) => {
    if (disabled) return;

    setIsDragging(true);
    currentDragItem = item;

    // Set drag image
    if (dragRef.current) {
      e.dataTransfer.setDragImage(dragRef.current, dragOffset.x, dragOffset.y);
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('application/json', JSON.stringify(item));
    }

    onDragStart?.(item);
    accessibilityManager.announce(`Dragging ${item.type}`, 'polite');
  }, [item, onDragStart, disabled]);

  const handleDragEnd = useCallback(() => {
    setIsDragging(false);
    currentDragItem = null;

    onDragEnd?.(item);
    accessibilityManager.announce(`Dropped ${item.type}`, 'polite');
  }, [item, onDragEnd]);

  return (
    <div
      ref={dragRef}
      draggable={!disabled}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onMouseDown={handleMouseDown}
      className={`draggable ${isDragging ? 'dragging' : ''} ${className}`}
      role="button"
      tabIndex={disabled ? -1 : 0}
      aria-describedby={`draggable-${item.id}-help`}
    >
      {children}
      <div id={`draggable-${item.id}-help`} className="sr-only">
        Press space or enter to start dragging this {item.type}
      </div>
    </div>
  );
}

export function DropZone({
  id,
  accepts,
  onDrop,
  children,
  className = ''
}: DropZoneProps) {
  const [isOver, setIsOver] = useState(false);
  const [isValidDrop, setIsValidDrop] = useState(false);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  }, []);

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();

    if (currentDragItem && accepts.includes(currentDragItem.type)) {
      setIsOver(true);
      setIsValidDrop(true);
      e.dataTransfer.dropEffect = 'move';
    } else {
      setIsValidDrop(false);
    }
  }, [accepts]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    // Only set isOver to false if we're actually leaving the drop zone
    // (not just moving over a child element)
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX;
    const y = e.clientY;

    if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
      setIsOver(false);
      setIsValidDrop(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsOver(false);
    setIsValidDrop(false);

    if (currentDragItem && accepts.includes(currentDragItem.type)) {
      onDrop(currentDragItem, id);
      accessibilityManager.announce(`Dropped ${currentDragItem.type} into ${id}`, 'polite');
    } else {
      accessibilityManager.announce('Invalid drop target', 'assertive');
    }
  }, [id, accepts, onDrop]);

  return (
    <div
      className={`drop-zone ${isOver ? 'drag-over' : ''} ${isValidDrop ? 'valid-drop' : ''} ${className}`}
      onDragOver={handleDragOver}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      role="region"
      aria-label={`Drop zone for ${accepts.join(', ')}`}
      aria-dropeffect="move"
    >
      {children}
    </div>
  );
}

// Sortable List Component
interface SortableItem {
  id: string;
  content: React.ReactNode;
}

interface SortableListProps {
  items: SortableItem[];
  onReorder: (newItems: SortableItem[]) => void;
  className?: string;
  orientation?: 'vertical' | 'horizontal';
}

export function SortableList({
  items,
  onReorder,
  className = '',
  orientation = 'vertical'
}: SortableListProps) {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  const handleDragStart = useCallback((index: number) => {
    setDraggedIndex(index);
  }, []);

  const handleDragEnd = useCallback(() => {
    setDraggedIndex(null);
  }, []);

  const handleDrop = useCallback((_dragItem: DragItem, dropZoneId: string) => {
    const fromIndex = draggedIndex;
    const toIndex = parseInt(dropZoneId.split('-')[1]);

    if (fromIndex !== null && fromIndex !== toIndex) {
      const newItems = [...items];
      const [removed] = newItems.splice(fromIndex, 1);
      newItems.splice(toIndex, 0, removed);
      onReorder(newItems);
    }
  }, [items, onReorder, draggedIndex]);

  return (
    <div className={`sortable-list ${orientation} ${className}`}>
      {items.map((item, index) => (
        <DropZone
          key={item.id}
          id={`sortable-${index}`}
          accepts={['sortable-item']}
          onDrop={handleDrop}
          className="sortable-item-zone"
        >
          <Draggable
            item={{ id: item.id, type: 'sortable-item', data: { index } }}
            onDragStart={() => handleDragStart(index)}
            onDragEnd={handleDragEnd}
            className={`sortable-item ${draggedIndex === index ? 'dragging' : ''}`}
          >
            <div className="sortable-handle" aria-label="Drag handle">
              ⋮⋮
            </div>
            {item.content}
          </Draggable>
        </DropZone>
      ))}
    </div>
  );
}

