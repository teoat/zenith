import { useState, useEffect } from 'react';
import { useDraggable } from '@dnd-kit/core';
import { User, Building, CreditCard, Globe, GripVertical, Search, Loader2 } from 'lucide-react';
import { api } from '../../lib/api';
import { usePersistedState } from '../../hooks/usePersistedState';
import { secureLogger } from '../../utils/secureLogger';

// Draggable Item Component
interface Entity {
  id: string;
  type: string;
  label: string;
}

const DraggableEntity = ({ id, type, label }: Entity) => {
  const {attributes, listeners, setNodeRef, transform} = useDraggable({
    id: id,
    data: { type, label }
  });
  
  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
  } : undefined;

  const getIcon = () => {
    switch (type) {
      case 'person': return <User size={16} className="text-blue-500" />;
      case 'company': return <Building size={16} className="text-amber-500" />;
      case 'account': return <CreditCard size={16} className="text-emerald-500" />;
      case 'ip': return <Globe size={16} className="text-indigo-500" />;
      default: return <User size={16} />;
    }
  };

  return (
    <div 
      ref={setNodeRef} 
      style={style} 
      {...listeners} 
      {...attributes}
      className="flex items-center gap-3 p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-sm cursor-grab hover:border-blue-500 hover:shadow-md transition-all mb-2 touch-none z-50"
    >
      <GripVertical size={14} className="text-slate-400" />
      <div className="p-1.5 bg-slate-50 dark:bg-slate-900 rounded border border-slate-200 dark:border-slate-700">
        {getIcon()}
      </div>
      <div>
        <h4 className="text-sm font-medium text-slate-700 dark:text-slate-200">{label}</h4>
        <span className="text-[10px] uppercase font-bold text-slate-400">{type}</span>
      </div>
    </div>
  );
};

const EntityRegistry = () => {
  const [showCreate, setShowCreate] = usePersistedState<boolean>('entity_registry_show_create', true);
  const [searchQuery, setSearchQuery] = useState('');
  const [entities, setEntities] = useState<Entity[]>([]); 
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchEntities = async () => {
      setLoading(true);
      try {
        const query = searchQuery.trim() || 'network'; // Default search to show some data
        const res = await api.searchGraph(query);
        if (res.success) {
          setEntities(res.results);
        }
      } catch (err) {
        secureLogger.error("Failed to fetch entities", err);
      } finally {
        setLoading(false);
      }
    };

    const debounce = setTimeout(fetchEntities, 500);
    return () => clearTimeout(debounce);
  }, [searchQuery]);

  return (
    <div className="w-72 bg-slate-50 dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col h-full">
      <div className="p-4 border-b border-slate-200 dark:border-slate-800">
        <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-3">
          <User size={18} className="text-blue-600" />
          Entity Registry
        </h3>
        
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 text-slate-400" size={14} />
          <input 
            type="text" 
            placeholder="Search entities..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-8 text-slate-400">
            <Loader2 size={24} className="animate-spin mb-2" />
            <span className="text-xs">Searching database...</span>
          </div>
        ) : entities.length === 0 ? (
          <div className="text-center py-8 text-slate-400">
            <p className="text-sm">No entities found.</p>
            <p className="text-xs mt-1">Try a different search term.</p>
          </div>
        ) : (
          entities.map(e => (
            <DraggableEntity key={e.id} id={e.id} type={e.type || 'unknown'} label={e.label} />
          ))
        )}

        {showCreate && (
        <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-100 dark:border-blue-900/50 text-center">
           <div className="flex justify-between items-start mb-2">
             <p className="text-xs text-blue-800 dark:text-blue-300">
                Need to add a new entity?
             </p>
             <button onClick={() => setShowCreate(false)} className="text-blue-400 hover:text-blue-600">
               <span className="sr-only">Close</span>
               ×
             </button>
           </div>
           <button className="text-xs bg-blue-600 hover:bg-blue-700 text-white font-bold py-1.5 px-3 rounded transition-colors w-full">
              create manually
           </button>
        </div>
        )}
        {!showCreate && (
          <button 
            onClick={() => setShowCreate(true)}
            className="mt-6 w-full py-2 text-xs text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/10 border border-dashed border-blue-200 rounded-lg transition-colors"
          >
            Show Create Options
          </button>
        )}
      </div>
    </div>
  );
};

export default EntityRegistry;
