import React, { createContext, useContext, useState, useEffect } from 'react';

interface AccessibilityContextType {
  highContrast: boolean;
  setHighContrast: (enabled: boolean) => void;
  reducedMotion: boolean;
  setReducedMotion: (enabled: boolean) => void;
  fontSize: 'small' | 'medium' | 'large';
  setFontSize: (size: 'small' | 'medium' | 'large') => void;
}

const AccessibilityContext = createContext<AccessibilityContextType | undefined>(undefined);

export const useAccessibility = () => {
  const context = useContext(AccessibilityContext);
  if (!context) {
    throw new Error('useAccessibility must be used within an AccessibilityProvider');
  }
  return context;
};

interface AccessibilityProviderProps {
  children: React.ReactNode;
}

export const AccessibilityProvider: React.FC<AccessibilityProviderProps> = ({ children }) => {
  const [highContrast, setHighContrast] = useState(() => {
    return localStorage.getItem('highContrast') === 'true' ||
           window.matchMedia('(prefers-contrast: high)').matches;
  });

  const [reducedMotion, setReducedMotion] = useState(() => {
    return localStorage.getItem('reducedMotion') === 'true' ||
           window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  });

  const [fontSize, setFontSize] = useState<'small' | 'medium' | 'large'>(() => {
    return (localStorage.getItem('fontSize') as 'small' | 'medium' | 'large') || 'medium';
  });

  useEffect(() => {
    localStorage.setItem('highContrast', highContrast.toString());
    document.documentElement.classList.toggle('high-contrast', highContrast);
  }, [highContrast]);

  useEffect(() => {
    localStorage.setItem('reducedMotion', reducedMotion.toString());
    document.documentElement.classList.toggle('reduced-motion', reducedMotion);
  }, [reducedMotion]);

  useEffect(() => {
    localStorage.setItem('fontSize', fontSize);
    document.documentElement.classList.remove('font-small', 'font-medium', 'font-large');
    document.documentElement.classList.add(`font-${fontSize}`);
  }, [fontSize]);

  // Listen for system preference changes
  useEffect(() => {
    const contrastQuery = window.matchMedia('(prefers-contrast: high)');
    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

    const handleContrastChange = (e: MediaQueryListEvent) => {
      if (!localStorage.getItem('highContrast')) {
        setHighContrast(e.matches);
      }
    };

    const handleMotionChange = (e: MediaQueryListEvent) => {
      if (!localStorage.getItem('reducedMotion')) {
        setReducedMotion(e.matches);
      }
    };

    contrastQuery.addEventListener('change', handleContrastChange);
    motionQuery.addEventListener('change', handleMotionChange);

    return () => {
      contrastQuery.removeEventListener('change', handleContrastChange);
      motionQuery.removeEventListener('change', handleMotionChange);
    };
  }, []);

  return (
    <AccessibilityContext.Provider
      value={{
        highContrast,
        setHighContrast,
        reducedMotion,
        setReducedMotion,
        fontSize,
        setFontSize,
      }}
    >
      {children}
    </AccessibilityContext.Provider>
  );
};