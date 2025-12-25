import React from 'react';

interface CanvasAreaProps {
  children: React.ReactNode;
  setNodeRef: (node: HTMLElement | null) => void;
}

export const CanvasArea: React.FC<CanvasAreaProps> = ({ children, setNodeRef }) => {
  return (
    <div
      ref={setNodeRef}
      className="relative w-full h-full bg-gray-50 dark:bg-gray-900 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden min-h-[600px]"
    >
      {children}
    </div>
  );
};