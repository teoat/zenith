import React, { useCallback } from 'react';
import { DndContext, DragOverlay, closestCorners } from '@dnd-kit/core';
import { AlertCircle, Clock, CheckCircle2 } from 'lucide-react';
import { CaseKanbanProps, Case, KanbanState } from '@/types/kanban';
import { useCaseKanban } from '@/hooks/useCaseKanban';
import { KanbanColumn } from '@/components/cases/kanban/KanbanColumn';
import { KanbanCard } from '@/components/cases/kanban/KanbanCard';

const CaseKanban: React.FC<CaseKanbanProps> = ({ cases: externalCases, onCaseClick }) => {
  const {
    activeId,
    loading,
    error,
    focusedCard,
    items,
    sensors,
    handleDragStart,
    handleDragEnd
  } = useCaseKanban(externalCases, onCaseClick);

  // Helper to find the active item data for the drag overlay
  const findActiveItem = useCallback((id: string | null): Case | undefined => {
    if (!id) return undefined;
    const allItems = [...items.incoming, ...items.review, ...items.closed];
    return allItems.find(item => item.id === id);
  }, [items]);

  const activeItem = findActiveItem(activeId);

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-slate-200 border-t-blue-500 rounded-full animate-spin mx-auto" />
          <p className="mt-4 text-sm text-slate-500">Loading cases...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center text-red-600">
          <AlertCircle size={48} className="mx-auto mb-4" />
          <p className="font-medium">Failed to load cases</p>
          <p className="text-sm text-slate-500 mt-1">{error}</p>
        </div>
      </div>
    );
  }

  // Empty state
  const hasNoCases = !items.incoming.length && !items.review.length && !items.closed.length;
  if (hasNoCases) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">No Cases Yet</h3>
          <p className="text-slate-500 dark:text-slate-400 mb-4">
            Start your first fraud investigation by creating a case. Cases help you organize evidence, track suspects, and collaborate with your team.
          </p>
          <div className="text-sm text-slate-400 space-y-1">
            <p>💡 <strong>Tip:</strong> Use the "New Investigation" button above to get started</p>
            <p>🎯 <strong>Next:</strong> Upload evidence files to build your case</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <DndContext 
      sensors={sensors} 
      collisionDetection={closestCorners} 
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-4 h-full overflow-x-auto pb-4">
        <ColumnWrapper
          id="incoming"
          title="Incoming Triage"
          icon={<AlertCircle size={18} className="text-blue-500" />}
          items={items.incoming}
          focusedCard={focusedCard}
          onCaseClick={onCaseClick}
        />
        <ColumnWrapper
          id="review"
          title="In Review"
          icon={<Clock size={18} className="text-amber-500" />}
          items={items.review}
          focusedCard={focusedCard}
          onCaseClick={onCaseClick}
        />
        <ColumnWrapper
          id="closed"
          title="Closed / Resolved"
          icon={<CheckCircle2 size={18} className="text-green-500" />}
          items={items.closed}
          focusedCard={focusedCard}
          onCaseClick={onCaseClick}
        />
      </div>
      <DragOverlay>
          {activeItem ? (
            <KanbanCard id={activeItem.id} data={activeItem} />
          ) : null}
      </DragOverlay>
    </DndContext>
  );
};

// Helper component to reduce repetition in main render
const ColumnWrapper = ({ 
  id, 
  title, 
  icon, 
  items, 
  focusedCard, 
  onCaseClick 
}: { 
  id: keyof KanbanState, 
  title: string, 
  icon: React.ReactNode, 
  items: Case[], 
  focusedCard: { column: keyof KanbanState; index: number } | null, 
  onCaseClick?: (id: string) => void 
}) => (
  <KanbanColumn 
    id={id} 
    title={title} 
    items={items} 
    icon={icon} 
    focusedIndex={focusedCard?.column === id ? focusedCard.index : null}
    isFocusedColumn={focusedCard?.column === id}
    onCaseClick={onCaseClick}
  />
);

export default CaseKanban;
