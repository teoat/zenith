/**
 * KeyboardShortcutsModal - Modal for displaying keyboard shortcuts
 * Separated from useKeyboardNavigation hook for better code organization
 */

import React, { useEffect } from 'react';

export interface Shortcut {
  key: string;
  description: string;
  category?: string;
}

interface KeyboardShortcutsModalProps {
  shortcuts: Shortcut[];
  isOpen: boolean;
  onClose: () => void;
}

export const KeyboardShortcutsModal: React.FC<KeyboardShortcutsModalProps> = ({
  shortcuts,
  isOpen,
  onClose
}) => {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const categories = Array.from(new Set(shortcuts.map(s => s.category || 'General')));

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl max-w-2xl w-full mx-4 max-h-[80vh] overflow-hidden">
        <div className="p-6 border-b border-slate-200 dark:border-slate-800">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
            Keyboard Shortcuts
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            Press <kbd className="px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded text-xs">Esc</kbd> to close
          </p>
        </div>
        
        <div className="p-6 overflow-y-auto max-h-[calc(80vh-120px)]">
          {categories.map(category => (
            <div key={category} className="mb-6 last:mb-0">
              <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3 uppercase tracking-wide">
                {category}
              </h3>
              <div className="space-y-2">
                {shortcuts
                  .filter(s => (s.category || 'General') === category)
                  .map((shortcut, idx) => (
                    <div key={idx} className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50">
                      <span className="text-slate-600 dark:text-slate-400">{shortcut.description}</span>
                      <kbd className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white rounded font-mono text-sm border border-slate-300 dark:border-slate-700">
                        {shortcut.key}
                      </kbd>
                    </div>
                  ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default KeyboardShortcutsModal;
