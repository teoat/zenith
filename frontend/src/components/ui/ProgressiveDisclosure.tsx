import React, { useState } from 'react';
import { ChevronDown, ChevronRight, Eye, EyeOff } from 'lucide-react';
import { AccessibleButton } from './AccessibleButton';

interface ProgressiveDisclosureProps {
  children: React.ReactNode;
  title: string;
  defaultExpanded?: boolean;
  level?: 1 | 2 | 3;
  showPreview?: boolean;
  previewContent?: React.ReactNode;
  onToggle?: (expanded: boolean) => void;
}

export const ProgressiveDisclosure: React.FC<ProgressiveDisclosureProps> = ({
  children,
  title,
  defaultExpanded = false,
  level = 1,
  showPreview = false,
  previewContent,
  onToggle
}) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const [hasBeenExpanded, setHasBeenExpanded] = useState(defaultExpanded);

  const toggleExpanded = () => {
    const newExpanded = !isExpanded;
    setIsExpanded(newExpanded);
    if (newExpanded && !hasBeenExpanded) {
      setHasBeenExpanded(true);
    }
    onToggle?.(newExpanded);
  };

  // Level-based styling
  const levelStyles = {
    1: {
      container: 'border-b border-slate-200 dark:border-slate-700',
      header: 'text-lg font-semibold',
      icon: 'w-5 h-5'
    },
    2: {
      container: 'border-l-2 border-slate-200 dark:border-slate-700 pl-4 ml-4',
      header: 'text-base font-medium',
      icon: 'w-4 h-4'
    },
    3: {
      container: 'border-l-2 border-slate-300 dark:border-slate-600 pl-3 ml-6',
      header: 'text-sm font-medium',
      icon: 'w-3 h-3'
    }
  };

  const styles = levelStyles[level];

  return (
    <div className={`${styles.container} py-2`}>
      <AccessibleButton
        onClick={toggleExpanded}
        className="w-full flex items-center justify-between p-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-md transition-all duration-200 group"
        aria-expanded={isExpanded}
        aria-controls={`content-${title.replace(/\s+/g, '-').toLowerCase()}`}
      >
        <div className="flex items-center gap-3">
          {isExpanded ? (
            <ChevronDown className={`${styles.icon} text-slate-500 dark:text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-300 transition-colors`} />
          ) : (
            <ChevronRight className={`${styles.icon} text-slate-500 dark:text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-300 transition-colors`} />
          )}
          <h3 className={`${styles.header} text-slate-800 dark:text-white group-hover:text-slate-900 dark:group-hover:text-slate-100 transition-colors`}>
            {title}
          </h3>
        </div>

        {showPreview && previewContent && !isExpanded && (
          <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
            <Eye className="w-4 h-4" />
            <span className="sr-only">Preview available</span>
          </div>
        )}

        {isExpanded && (
          <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
            <EyeOff className="w-4 h-4" />
            <span className="sr-only">Expanded</span>
          </div>
        )}
      </AccessibleButton>

      {/* Preview content when collapsed */}
      {showPreview && previewContent && !isExpanded && (
        <div className="mt-2 ml-8 p-3 bg-slate-50 dark:bg-slate-800/30 rounded-md border border-slate-200 dark:border-slate-700">
          {previewContent}
        </div>
      )}

      {/* Main content */}
      <div
        id={`content-${title.replace(/\s+/g, '-').toLowerCase()}`}
        className={`overflow-hidden transition-all duration-300 ease-in-out ${
          isExpanded ? 'max-h-screen opacity-100 mt-3' : 'max-h-0 opacity-0'
        }`}
        aria-hidden={!isExpanded}
      >
        <div className={`${level > 1 ? 'ml-8' : 'ml-4'} p-4 bg-slate-50 dark:bg-slate-800/20 rounded-md border border-slate-200 dark:border-slate-700`}>
          {hasBeenExpanded ? children : null}
        </div>
      </div>
    </div>
  );
};

// Micro-interaction component for subtle feedback
interface MicroInteractionProps {
  children: React.ReactNode;
  type?: 'bounce' | 'pulse' | 'scale' | 'glow';
  trigger?: 'hover' | 'click' | 'focus';
  duration?: number;
}

export const MicroInteraction: React.FC<MicroInteractionProps> = ({
  children,
  type = 'scale',
  trigger = 'hover',
  duration = 200
}) => {
  const [isActive, setIsActive] = useState(false);

  const handleInteraction = (active: boolean) => {
    if (trigger === 'hover' || trigger === 'focus') {
      setIsActive(active);
    }
  };

  const handleClick = () => {
    if (trigger === 'click') {
      setIsActive(true);
      setTimeout(() => setIsActive(false), duration);
    }
  };

  const getClasses = () => {
    const baseClasses = 'transition-all duration-200 ease-out';

    if (!isActive) return baseClasses;

    switch (type) {
      case 'bounce':
        return `${baseClasses} animate-bounce`;
      case 'pulse':
        return `${baseClasses} animate-pulse`;
      case 'scale':
        return `${baseClasses} scale-105`;
      case 'glow':
        return `${baseClasses} shadow-lg shadow-blue-500/25`;
      default:
        return baseClasses;
    }
  };

  return (
    <div
      className={getClasses()}
      onMouseEnter={() => handleInteraction(true)}
      onMouseLeave={() => handleInteraction(false)}
      onFocus={() => handleInteraction(true)}
      onBlur={() => handleInteraction(false)}
      onClick={handleClick}
    >
      {children}
    </div>
  );
};