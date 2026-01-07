import React, { useState, useEffect } from 'react';
import { CheckCircle, Circle, Award } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
// Import service with fallback in case of module resolution issues during refactor - assuming services exist based on diagnosis
import { submitRookieChecklist, fetchRookieChecklist } from '@/services/onboarding';
import { secureLogger } from '@/utils/secureLogger';

import './RookieChecklist.css';

interface ChecklistItem {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  action?: () => void;
}

interface RookieChecklistProps {
  onComplete?: () => void;
}

import { electronStore } from '@/utils/electronStore';

// Get initial items (defaults only, Async load handles persistence)
const getInitialItems = (): ChecklistItem[] => {
  return [
    {
      id: 'create-case',
      title: 'Create Your First Case',
      description: 'Start investigating by creating a new case file',
      completed: false,
    },
    {
      id: 'upload-evidence',
      title: 'Upload Evidence',
      description: 'Add documents, images, or files to your case',
      completed: false,
    },
    {
      id: 'explore-graph',
      title: 'Explore the Network Graph',
      description: 'Visualize connections between entities and transactions',
      completed: false,
    },
    {
      id: 'run-analysis',
      title: 'Run Your First Analysis',
      description: 'Use forensic tools to analyze evidence',
      completed: false,
    },
  ];
};



const RookieChecklist: React.FC<RookieChecklistProps> = ({ onComplete }) => {
  const { user } = useAuth();
  const [items, setItems] = useState<ChecklistItem[]>(getInitialItems);
  const [showBadge, setShowBadge] = useState(false);
  const [synced, setSynced] = useState(false);
  const [loaded, setLoaded] = useState(false);

  // Load from store on mount
  useEffect(() => {
    async function init() {
        try {
            const savedProgress = await electronStore.get<Record<string, boolean>>('rookieChecklist');
            if (savedProgress) {
                setItems(prev => prev.map(item => ({
                    ...item,
                    completed: savedProgress[item.id] || false
                })));
                
                // Check badge state after load
                const initialItems = getInitialItems().map(item => ({
                    ...item, 
                    completed: savedProgress[item.id] || false
                }));
                if(initialItems.every(i => i.completed)) setShowBadge(true);
            }
        } catch (e) {
            secureLogger.warn("Failed to load checklist from store", e);
        } finally {
            setLoaded(true);
        }
    }
    init();
  }, []);

  // Sync with backend on mount (after local load)
  useEffect(() => {
    async function loadFromBackend() {
      if (user?.id && loaded) {
        try {
          const data = await fetchRookieChecklist(user.id);
          if (data && data.items && Array.isArray(data.items)) {
            setItems(prev => prev.map(item => ({
              ...item,
              completed: data.items.includes(item.id) || item.completed
            })));
            setSynced(true);
          }
        } catch (err) {
          secureLogger.warn('Failed to sync checklist from backend, using local storage', err);
        }
      }
    }
    if (!synced && loaded) {
      loadFromBackend();
    }
  }, [user?.id, synced, loaded]);

  useEffect(() => {
    if (!loaded) return;

    // Save progress to electronStore
    const progress = items.reduce((acc, item) => {
      acc[item.id] = item.completed;
      return acc;
    }, {} as Record<string, boolean>);
    
    electronStore.set('rookieChecklist', progress).catch(err => {
        secureLogger.error("Failed to save checklist to electronStore", err);
    });

    // Sync to backend if logged in
    const syncToBackend = async () => {
       if (user?.id) {
         try {
           const completedIds = items.filter(i => i.completed).map(i => i.id);
           await submitRookieChecklist({ user_id: user.id, items: completedIds });
         } catch (err) {
           secureLogger.error("Failed to sync checklist to backend", err);
         }
       }
    };

    if (synced) { 
        syncToBackend();
    }

  }, [items, user?.id, synced, loaded]);

  // Check completion and show badge
  useEffect(() => {
    const allCompleted = items.every(item => item.completed);
    let timeoutId: NodeJS.Timeout;
    
    if (allCompleted && !showBadge) {
      const rafId = requestAnimationFrame(() => {
        setShowBadge(true);
        timeoutId = setTimeout(() => {
          onComplete?.();
        }, 2000);
      });
      
      return () => {
         cancelAnimationFrame(rafId);
         if (timeoutId) clearTimeout(timeoutId);
      };
    }
  }, [items, showBadge, onComplete]);

  const toggleItem = (id: string) => {
    setItems(prev => prev.map(item =>
      item.id === id ? { ...item, completed: !item.completed } : item
    ));
    setSynced(true);
  };

  const handleKeyDown = (e: React.KeyboardEvent, id: string) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      toggleItem(id);
    }
  };

  const completedCount = items.filter(item => item.completed).length;
  const progress = (completedCount / items.length) * 100;

  if (showBadge) {
    return (
      <div className="badge-overlay">
        <div className="badge-card">
          <div className="badge-icon-container">
            <Award className="w-16 h-16 text-yellow-500 mx-auto" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Congratulations!</h2>
          <p className="text-gray-600 mb-4">You've earned the</p>
          <div className="badge-reward">
            🏆 Level 1 Investigator
          </div>
          <p className="text-sm text-gray-500">You're ready to tackle real fraud cases!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Rookie Investigator</h3>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">{completedCount}/{items.length}</span>
          <div className="w-20 h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="rookie-progress-bar"
              style={{ '--progress': `${progress}%` } as React.CSSProperties}
              aria-valuenow={progress}
              aria-valuemin={0}
              aria-valuemax={100}
            />
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {items.map((item) => (
          <div
            key={item.id}
            role="button"
            tabIndex={0}
            className={`flex items-start gap-3 p-3 rounded-lg border transition-all cursor-pointer ${
              item.completed
                ? 'bg-green-50 border-green-200'
                : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
            }`}
            onClick={() => toggleItem(item.id)}
            onKeyDown={(e) => handleKeyDown(e, item.id)}
            aria-pressed={item.completed}
          >
            <div className="mt-0.5">
              {item.completed ? (
                <CheckCircle className="w-5 h-5 text-green-600" />
              ) : (
                <Circle className="w-5 h-5 text-gray-400" />
              )}
            </div>
            <div className="flex-1">
              <h4 className={`font-medium ${item.completed ? 'text-green-800' : 'text-gray-900'}`}>
                {item.title}
              </h4>
              <p className={`text-sm ${item.completed ? 'text-green-600' : 'text-gray-600'}`}>
                {item.description}
              </p>
            </div>
          </div>
        ))}
      </div>

      {completedCount === items.length && (
        <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-sm text-yellow-800 text-center">
            🎉 All tasks completed! Claim your badge.
          </p>
        </div>
      )}
    </div>
  );
};

export default RookieChecklist;