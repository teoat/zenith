import React, { useState, useEffect } from 'react';
import { CheckCircle, Circle, Award } from 'lucide-react';

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

// Get initial items with saved progress
const getInitialItems = (): ChecklistItem[] => {
  const defaultItems: ChecklistItem[] = [
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

  try {
    const saved = localStorage.getItem('rookieChecklist');
    if (saved) {
      const parsed = JSON.parse(saved);
      return defaultItems.map(item => ({
        ...item,
        completed: parsed[item.id] || false
      }));
    }
  } catch {
    // Ignore parse errors
  }
  return defaultItems;
};

// Check if all items are complete (for initial badge state)
const getInitialBadgeState = (): boolean => {
  const items = getInitialItems();
  return items.every(item => item.completed);
};

const RookieChecklist: React.FC<RookieChecklistProps> = ({ onComplete }) => {
  const [items, setItems] = useState<ChecklistItem[]>(getInitialItems);
  const [showBadge, setShowBadge] = useState(getInitialBadgeState);

  useEffect(() => {
    // Save progress to localStorage
    const progress = items.reduce((acc, item) => {
      acc[item.id] = item.completed;
      return acc;
    }, {} as Record<string, boolean>);
    localStorage.setItem('rookieChecklist', JSON.stringify(progress));
  }, [items]);

  // Check completion and show badge
  useEffect(() => {
    const allCompleted = items.every(item => item.completed);
    if (allCompleted && !showBadge) {
      // Use requestAnimationFrame to avoid sync setState in effect
      requestAnimationFrame(() => {
        setShowBadge(true);
        setTimeout(() => {
          onComplete?.();
        }, 2000);
      });
    }
  }, [items, showBadge, onComplete]);

  const toggleItem = (id: string) => {
    setItems(prev => prev.map(item =>
      item.id === id ? { ...item, completed: !item.completed } : item
    ));
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
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8 text-center max-w-md mx-4">
          <div className="mb-4">
            <Award className="w-16 h-16 text-yellow-500 mx-auto" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Congratulations!</h2>
          <p className="text-gray-600 mb-4">You've earned the</p>
          <div className="bg-gradient-to-r from-yellow-400 to-yellow-600 text-white px-4 py-2 rounded-full font-bold text-lg mb-4">
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
              className="h-full bg-blue-500 transition-all duration-300"
              style={{ width: `${progress}%` }}
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