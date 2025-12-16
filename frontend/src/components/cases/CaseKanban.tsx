import { useState, useEffect, ReactNode, memo, useCallback } from 'react';
import { DndContext, DragOverlay, closestCorners, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent, DragStartEvent } from '@dnd-kit/core';
import { arrayMove, sortableKeyboardCoordinates, SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { AlertCircle, Clock, CheckCircle2 } from 'lucide-react';
import { useFormatters } from '../../providers/LocaleProvider';

// Interfaces
interface Case {
  id: string;
  title: string;
  priority: 'High' | 'Medium' | 'Low';
  riskScore: number;
  assignee?: { name: string; avatar?: string };
  dueDate?: string;
  tags?: string[];
}

interface ColumnProps {
  id: string;
  items: Case[];
  title: string;
  icon: ReactNode;
}

interface KanbanState {
  incoming: Case[];
  review: Case[];
  closed: Case[];
}

// API response case structure
interface ApiCase {
  id: string;
  title: string;
  priority?: string;
  riskScore?: number;
  assigneeId?: string;
  dueDate?: string;
  tags?: string[];
  status?: string;
}

// Mock data removed - now loading from API

const getRiskBarColor = (score: number) => {
  if (score >= 80) return 'bg-red-500';
  if (score >= 50) return 'bg-amber-500';
  return 'bg-green-500';
};

const SortableItem = memo(({ id, data }: { id: string, data: Case }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  const { formatDate } = useFormatters();

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const isOverdue = data.dueDate && new Date(data.dueDate) < new Date();

  return (
    <div 
      ref={setNodeRef} 
      style={style} 
      {...attributes} 
      {...listeners}
      className={`bg-white dark:bg-slate-800 p-3 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm mb-3 cursor-grab active:cursor-grabbing hover:border-blue-500/50 transition-colors ${data.priority === 'High' ? 'border-l-4 border-l-red-500' : ''}`}
    >
      {/* Header */}
      <div className="flex justify-between items-start mb-2">
        <span className="text-xs font-bold text-slate-500">#{id}</span>
        <span className={`text-[10px] px-1.5 py-0.5 rounded uppercase font-bold ${
          data.priority === 'High' ? 'bg-red-100 text-red-700' : 
          data.priority === 'Medium' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'
        }`}>
          {data.priority}
        </span>
      </div>
      
      {/* Title */}
      <h4 className="font-semibold text-sm mb-2 line-clamp-2">{data.title}</h4>
      
      {/* Tags */}
      {data.tags && data.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2">
          {data.tags.map(tag => (
            <span key={tag} className="text-[10px] bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded">
              {tag}
            </span>
          ))}
        </div>
      )}
      
      {/* Risk Progress Bar */}
      <div className="mb-2">
        <div className="flex justify-between text-[10px] text-slate-500 mb-1">
          <span>Risk Score</span>
          <span className="font-mono font-bold">{data.riskScore}</span>
        </div>
        <div className="h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
          <div 
            className={`h-full ${getRiskBarColor(data.riskScore)} transition-all`}
            style={{ width: `${data.riskScore}%` }}
          />
        </div>
      </div>
      
      {/* Footer: Assignee + Due Date */}
      <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-100 dark:border-slate-700">
        {data.assignee && (
          <div className="flex items-center gap-1.5">
            <div className="w-5 h-5 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-[9px] font-bold">
              {data.assignee.avatar || data.assignee.name[0]}
            </div>
            <span className="text-slate-500">{data.assignee.name}</span>
          </div>
        )}
        {data.dueDate && (
          <span className={`flex items-center gap-1 ${isOverdue ? 'text-red-600 font-bold' : 'text-slate-400'}`}>
            <Clock size={12} />
            {formatDate(data.dueDate)}
          </span>
        )}
      </div>
    </div>
  );
});

const Column = memo(({ id, items, title, icon }: ColumnProps) => {
  return (
    <div className="flex-1 min-w-[300px] bg-slate-50 dark:bg-slate-900/50 rounded-xl p-4 border border-slate-200 dark:border-slate-800 flex flex-col h-full">
      <div className="flex items-center gap-2 mb-4">
        {icon}
        <h3 className="font-bold text-slate-700 dark:text-slate-300">{title}</h3>
        <span className="ml-auto bg-slate-200 dark:bg-slate-800 text-xs px-2 py-0.5 rounded-full text-slate-600 dark:text-slate-400">
          {items.length}
        </span>
      </div>
      <SortableContext id={id} items={items} strategy={verticalListSortingStrategy}>
        <div className="flex-1 overflow-y-auto min-h-[100px]">
          {items.map((item: Case) => (
            <SortableItem key={item.id} id={item.id} data={item} />
          ))}
        </div>
      </SortableContext>
    </div>
  );
});

const CaseKanban = () => {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [focusedCard, setFocusedCard] = useState<{ column: keyof KanbanState; index: number } | null>(null);

  // Load cases from API
  useEffect(() => {
    const loadCases = async () => {
      try {
        setError(null);
        const { api } = await import('../../lib/api');
        const result = await api.getCases();
        const cases: ApiCase[] = result?.cases || [];
        
        // Transform API cases to kanban format and categorize by status
        const transformCase = (c: ApiCase): Case => ({
          id: c.id,
          title: c.title,
          priority: c.priority === 'critical' || c.priority === 'high' ? 'High' : 
                   c.priority === 'medium' ? 'Medium' : 'Low',
          riskScore: c.riskScore || 50,
          assignee: c.assigneeId ? { name: c.assigneeId.substring(0, 8), avatar: 'U' } : undefined,
          dueDate: c.dueDate,
          tags: c.tags || [],
        });

        const incoming = cases.filter((c: ApiCase) => 
          c.status === 'open' || c.status === 'OPEN'
        ).map(transformCase);
        
        const review = cases.filter((c: ApiCase) => 
          c.status === 'investigating' || c.status === 'pending_review' || c.status === 'escalated'
        ).map(transformCase);
        
        const closed = cases.filter((c: ApiCase) => 
          c.status?.startsWith('closed') || c.status === 'resolved'
        ).map(transformCase);

        setItems({ incoming, review, closed });
      } catch (err) {
        console.error('Failed to load cases:', err);
        setError(err instanceof Error ? err.message : 'Failed to load cases');
      } finally {
        setLoading(false);
      }
    };
    loadCases();
  }, []);

  // Enhanced keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in input
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) return;

      const columns: (keyof KanbanState)[] = ['incoming', 'review', 'closed'];
      
      if (!focusedCard) {
        // First Tab press - focus first card
        if (e.key === 'Tab' && !e.shiftKey && items.incoming.length > 0) {
          e.preventDefault();
          setFocusedCard({ column: 'incoming', index: 0 });
        }
        return;
      }

      const { column, index } = focusedCard;
      const currentColumn = items[column];

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          if (index < currentColumn.length - 1) {
            setFocusedCard({ ...focusedCard, index: index + 1 });
          }
          break;
        
        case 'ArrowUp':
          e.preventDefault();
          if (index > 0) {
            setFocusedCard({ ...focusedCard, index: index - 1 });
          }
          break;
        
        case 'ArrowRight':
        case 'Tab':
          e.preventDefault();
          const nextColIndex = columns.indexOf(column) + 1;
          if (nextColIndex < columns.length) {
            const nextColumn = columns[nextColIndex];
            const nextItems = items[nextColumn];
            if (nextItems.length > 0) {
              setFocusedCard({ column: nextColumn, index: 0 });
            }
          }
          break;
        
        case 'ArrowLeft':
          e.preventDefault();
          const prevColIndex = columns.indexOf(column) - 1;
          if (prevColIndex >= 0) {
            const prevColumn = columns[prevColIndex];
            const prevItems = items[prevColumn];
            if (prevItems.length > 0) {
              setFocusedCard({ column: prevColumn, index: 0 });
            }
          }
          break;
        
        case 'Enter':
          // Open card details - could navigate to full case view
          const card = currentColumn[index];
          if (card) {
            console.log('Opening card:', card.id);
            // Navigate or open modal
          }
          break;
        
        case 'Escape':
          setFocusedCard(null);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [focusedCard, items]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const findContainer = useCallback((id: string): string | undefined => {
    if (id in items) return id;
    return Object.keys(items).find(key => 
      items[key as keyof KanbanState].find((item: Case) => item.id === id)
    );
  }, [items]);

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  }, []);

  const handleDragEnd = useCallback(async (event: DragEndEvent) => {
    const { active, over } = event;
    const activeContainer = findContainer(active.id as string);
    const overContainer = over ? findContainer(over.id as string) : null;

    if (!activeContainer || !overContainer || activeContainer !== overContainer) {
      if (activeContainer && overContainer) {
         // Map column to backend status
         const columnToStatus: Record<string, 'OPEN' | 'INVESTIGATING' | 'CLOSED'> = {
           'incoming': 'OPEN',
           'review': 'INVESTIGATING',
           'closed': 'CLOSED'
         };
         
         // Persist status change to backend
         const newStatus = columnToStatus[overContainer];
         if (newStatus) {
           try {
             const { api } = await import('../../lib/api');
             await api.updateCase(active.id as string, { status: newStatus });
           } catch (err) {
             console.error('Failed to update case status:', err);
             // Could show error toast here
           }
         }
         
         // Move between columns logic (simplified)
         setItems((prev: KanbanState) => {
             const activeKey = activeContainer as keyof KanbanState;
             const overKey = overContainer as keyof KanbanState;
             const activeItems = prev[activeKey];
             const overItems = prev[overKey];
             const activeIndex = activeItems.findIndex((i: Case) => i.id === active.id);
             const overIndex = overItems.findIndex((i: Case) => i.id === over?.id);

             let newIndex: number;
             if (over?.id && over.id in prev) {
                 newIndex = overItems.length + 1;
             } else {
                 const isBelowOverItem = over &&
                   active.rect.current.translated &&
                   active.rect.current.translated.top > over.rect.top + over.rect.height;
                 const modifier = isBelowOverItem ? 1 : 0;
                 newIndex = overIndex >= 0 ? overIndex + modifier : overItems.length + 1;
             }

             return {
                 ...prev,
                 [activeContainer]: [
                     ...prev[activeKey].filter((item: Case) => item.id !== active.id)
                 ],
                 [overContainer]: [
                     ...prev[overKey].slice(0, newIndex),
                     activeItems[activeIndex],
                     ...prev[overKey].slice(newIndex, prev[overKey].length)
                 ]
             };
         });
      }
      return;
    }

    const activeKey = activeContainer as keyof KanbanState;
    const activeIndex = items[activeKey].findIndex((item: Case) => item.id === active.id);
    const overIndex = items[activeKey].findIndex((item: Case) => item.id === over?.id);

    if (activeIndex !== overIndex) {
      setItems((prevItems: KanbanState) => ({
        ...prevItems,
        [activeContainer]: arrayMove(prevItems[activeKey], activeIndex, overIndex),
      }));
    }
    
    setActiveId(null);
  }, [findContainer, items]);

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

  return (
    <DndContext 
      sensors={sensors} 
      collisionDetection={closestCorners} 
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-4 h-full overflow-x-auto pb-4">
        <Column id="incoming" title="Incoming Triage" items={items.incoming} icon={<AlertCircle size={18} className="text-blue-500" />} />
        <Column id="review" title="In Review" items={items.review} icon={<Clock size={18} className="text-amber-500" />} />
        <Column id="closed" title="Closed / Resolved" items={items.closed} icon={<CheckCircle2 size={18} className="text-green-500" />} />
      </div>
      <DragOverlay>
          {activeId ? <div className="p-4 bg-white shadow-xl rounded border border-blue-500">Dragging {activeId}</div> : null}
      </DragOverlay>
    </DndContext>
  );
};

export default CaseKanban;
