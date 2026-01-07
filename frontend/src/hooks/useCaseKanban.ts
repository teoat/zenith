import { useState, useEffect, useCallback } from 'react';
import { 
  KeyboardSensor, 
  PointerSensor, 
  useSensor, 
  useSensors, 
  DragEndEvent, 
  DragStartEvent 
} from '@dnd-kit/core';
import { arrayMove, sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { secureLogger } from '@/utils/secureLogger';
import { Case, KanbanState, ApiCase } from '@/types/kanban';

export const useCaseKanban = (externalCases?: ApiCase[], onCaseClick?: (caseId: string) => void) => {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [focusedCard, setFocusedCard] = useState<{ column: keyof KanbanState; index: number } | null>(null);
  const [items, setItems] = useState<KanbanState>({
    incoming: [],
    review: [],
    closed: []
  });

  const transformCase = useCallback((c: ApiCase): Case => ({
    id: c.id,
    title: c.title,
    priority: (c.priority?.toLowerCase() === 'critical' || c.priority?.toLowerCase() === 'high') ? 'High' : 
             c.priority?.toLowerCase() === 'medium' ? 'Medium' : 'Low',
    riskScore: c.riskScore || 50,
    assignee: c.assigneeId ? { name: c.assigneeId.substring(0, 8), avatar: 'U' } : undefined,
    dueDate: c.dueDate,
    tags: c.tags || [],
  }), []);

  // Update items when external cases change
  useEffect(() => {
    if (externalCases) {
      const incoming = externalCases.filter((c: ApiCase) => 
        c.status === 'open' || c.status === 'OPEN'
      ).map(transformCase);
      
      const review = externalCases.filter((c: ApiCase) => 
        c.status === 'investigating' || c.status === 'pending_review' || c.status === 'escalated'
      ).map(transformCase);
      
      const closed = externalCases.filter((c: ApiCase) => 
        c.status?.startsWith('closed') || c.status === 'resolved'
      ).map(transformCase);

      setItems({ incoming, review, closed });
      setLoading(false);
    }
  }, [externalCases, transformCase]);

  // Load cases from API if not provided
  useEffect(() => {
    if (externalCases) return;
    
    const loadCases = async () => {
      try {
        setError(null);
        const { api } = await import('@/lib/api');
        const response = await api.getCases();

        // Handle different response structures
        const rawCases: ApiCase[] = Array.isArray(response) ? response :
                         (response as any).data?.items ? (response as any).data.items :
                         (response as any).data ? (response as any).data :
                         [];

        const incoming = rawCases.filter((c: ApiCase) =>
          (c.status === 'open' || c.status === 'OPEN')
        ).map(transformCase);

        const review = rawCases.filter((c: ApiCase) =>
          (c.status === 'investigating' || c.status === 'INVESTIGATING' ||
          c.status === 'pending_review' || c.status === 'IN_PROGRESS' ||
          c.status === 'escalated' || c.status === 'ADJUDICATION')
        ).map(transformCase);

        const closed = rawCases.filter((c: ApiCase) =>
          (c.status?.includes('closed') || c.status?.includes('CLOSED') ||
          c.status === 'resolved' || c.status === 'RESOLVED')
        ).map(transformCase);
        
        setItems({ incoming, review, closed });
      } catch (err) {
        secureLogger.error('Failed to load cases:', err);
        setError(err instanceof Error ? err.message : 'Failed to load cases');
      } finally {
        setLoading(false);
      }
    };
    loadCases();
  }, [externalCases, transformCase]);

  // Enhanced keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) return;

      const columns: (keyof KanbanState)[] = ['incoming', 'review', 'closed'];
      
      if (!focusedCard) {
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
        case 'Tab': {
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
        }
        
        case 'ArrowLeft': {
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
        }
        
        case 'Enter': {
          const card = currentColumn[index];
          if (card) {
            onCaseClick?.(card.id);
          }
          break;
        }
        
        case 'Escape':
          setFocusedCard(null);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [focusedCard, items, onCaseClick]);

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
         const columnToStatus: Record<string, 'OPEN' | 'INVESTIGATING' | 'CLOSED'> = {
           'incoming': 'OPEN',
           'review': 'INVESTIGATING',
           'closed': 'CLOSED'
         };
         
         const newStatus = columnToStatus[overContainer];
         if (newStatus) {
           try {
             // Dynamic import relative path fix
             // We can use the same import as loadCases
             const { api } = await import('@/lib/api');
             await api.updateCase(active.id as string, { status: newStatus });
           } catch (err) {
             secureLogger.error('Failed to update case status:', err);
           }
         }
         
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

  return {
    activeId,
    loading,
    error,
    focusedCard,
    items,
    sensors,
    handleDragStart,
    handleDragEnd,
    setActiveId
  };
};
