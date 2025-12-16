import React from 'react';

// Touch-friendly button component
interface TouchButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  touchFeedback?: boolean;
}

export const TouchButton: React.FC<TouchButtonProps> = ({
  children,
  touchFeedback = true,
  className = '',
  ...props
}) => {
  return (
    <button
      className={`touch-manipulation select-none ${
        touchFeedback ? 'active:scale-95 transition-transform' : ''
      } ${className}`}
      style={{ touchAction: 'manipulation' }}
      {...props}
    >
      {children}
    </button>
  );
};

// Touch-friendly scroll container
interface TouchScrollContainerProps {
  children: React.ReactNode;
  className?: string;
  enableMomentum?: boolean;
}

export const TouchScrollContainer: React.FC<TouchScrollContainerProps> = ({
  children,
  className = '',
  enableMomentum = true
}) => {
  return (
    <div
      className={`overflow-auto ${enableMomentum ? 'scroll-smooth' : ''} ${className}`}
      style={{
        WebkitOverflowScrolling: enableMomentum ? 'touch' : 'auto',
        touchAction: 'pan-y'
      }}
    >
      {children}
    </div>
  );
};