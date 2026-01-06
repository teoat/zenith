import React from 'react';
import { useTranslation } from 'react-i18next';
import { User, Search, Eye, File } from 'lucide-react';
import { SuggestionAction } from './types';

interface SuggestionListProps {
  suggestions: SuggestionAction[];
  onActionClick: (action: SuggestionAction) => void;
}

export const SuggestionList: React.FC<SuggestionListProps> = ({ suggestions, onActionClick }) => {
  const { t } = useTranslation();

  if (!suggestions || suggestions.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2 mt-3 pt-2 border-t border-slate-100 dark:border-slate-700/50">
      {suggestions.map((s, idx) => (
        <button 
          key={idx}
          className={`
            px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors
            ${s.style === 'danger' 
              ? 'bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400' 
              : 'bg-slate-50 text-slate-700 border border-slate-200 hover:bg-slate-100 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300'}
          `}
          onClick={() => onActionClick(s)}
        >
          {s.icon === 'alert' && <div className="w-1.5 h-1.5 rounded-full bg-current" />}
          {s.icon === 'user' && <User size={12} />}
          {s.icon === 'search' && <Search size={12} />}
          {s.icon === 'eye' && <Eye size={12} />}
          {s.icon === 'file' && <File size={12} />}
          {t(s.label)}
        </button>
      ))}
    </div>
  );
};
