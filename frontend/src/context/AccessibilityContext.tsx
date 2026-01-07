import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { secureLogger } from '@/utils/secureLogger';

// Extend window interface for speech recognition
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

interface AccessibilityContextType {
  highContrast: boolean;
  setHighContrast: (enabled: boolean) => void;
  reducedMotion: boolean;
  setReducedMotion: (enabled: boolean) => void;
  fontSize: 'small' | 'medium' | 'large';
  setFontSize: (size: 'small' | 'medium' | 'large') => void;
  voiceControl: boolean;
  setVoiceControl: (enabled: boolean) => void;
  colorBlindMode: 'none' | 'protanopia' | 'deuteranopia' | 'tritanopia';
  setColorBlindMode: (mode: 'none' | 'protanopia' | 'deuteranopia' | 'tritanopia') => void;
  announce: (message: string, priority?: 'polite' | 'assertive') => void;
  keyboardShortcuts: Record<string, () => void>;
  registerShortcut: (key: string, callback: () => void) => void;
  unregisterShortcut: (key: string) => void;
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
    return localStorage.getItem('accessibility-highContrast') === 'true' ||
           window.matchMedia('(prefers-contrast: high)').matches;
  });

  const [reducedMotion, setReducedMotion] = useState(() => {
    return localStorage.getItem('accessibility-reducedMotion') === 'true' ||
           window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  });

  const [fontSize, setFontSize] = useState<'small' | 'medium' | 'large'>(() => {
    return (localStorage.getItem('accessibility-fontSize') as 'small' | 'medium' | 'large') || 'medium';
  });

  const [voiceControl, setVoiceControl] = useState(() => {
    return localStorage.getItem('accessibility-voiceControl') === 'true';
  });

  const [colorBlindMode, setColorBlindMode] = useState<'none' | 'protanopia' | 'deuteranopia' | 'tritanopia'>(() => {
    return (localStorage.getItem('accessibility-colorBlindMode') as 'none' | 'protanopia' | 'deuteranopia' | 'tritanopia') || 'none';
  });

  const [keyboardShortcuts, setKeyboardShortcuts] = useState<Record<string, () => void>>({});

  // Apply high contrast
  useEffect(() => {
    document.documentElement.classList.toggle('high-contrast', highContrast);
    localStorage.setItem('accessibility-highContrast', String(highContrast));
  }, [highContrast]);

  // Apply reduced motion
  useEffect(() => {
    document.documentElement.classList.toggle('reduced-motion', reducedMotion);
    localStorage.setItem('accessibility-reducedMotion', String(reducedMotion));
  }, [reducedMotion]);

  // Apply font size
  useEffect(() => {
    const fontSizeMap = { small: '14px', medium: '16px', large: '18px' };
    document.documentElement.style.fontSize = fontSizeMap[fontSize];
    localStorage.setItem('accessibility-fontSize', fontSize);
  }, [fontSize]);

  // Apply color blind mode
  useEffect(() => {
    document.documentElement.classList.remove('color-blind-protanopia', 'color-blind-deuteranopia', 'color-blind-tritanopia');
    if (colorBlindMode !== 'none') {
      document.documentElement.classList.add(`color-blind-${colorBlindMode}`);
    }
    localStorage.setItem('accessibility-colorBlindMode', colorBlindMode);
  }, [colorBlindMode]);

  // Announce function needs to be defined before it's used in effects
  const announce = useCallback((message: string, priority: 'polite' | 'assertive' = 'polite') => {
    const announcement = document.createElement('div');
    announcement.setAttribute('aria-live', priority);
    announcement.setAttribute('aria-atomic', 'true');
    announcement.style.position = 'absolute';
    announcement.style.left = '-10000px';
    announcement.style.width = '1px';
    announcement.style.height = '1px';
    announcement.style.overflow = 'hidden';

    document.body.appendChild(announcement);
    announcement.textContent = message;

    setTimeout(() => {
      document.body.removeChild(announcement);
    }, 1000);
  }, []);

  // Voice control functionality
  useEffect(() => {
    if (!voiceControl || typeof window === 'undefined') return;

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      secureLogger.warn('SPEECH_RECOGNITION', 'Speech recognition not supported in this browser');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onresult = (event: any) => {
      const command = event.results[event.results.length - 1][0].transcript.toLowerCase().trim();

      if (command.includes('click') || command.includes('press') || command.includes('select')) {
        const focusedElement = document.activeElement as HTMLElement;
        if (focusedElement?.click) focusedElement.click();
      } else if (command.includes('next') || command.includes('forward')) {
        const focusableElements = document.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
        const currentIndex = Array.from(focusableElements).indexOf(document.activeElement as Element);
        const nextElement = focusableElements[currentIndex + 1] as HTMLElement;
        if (nextElement) nextElement.focus();
      } else if (command.includes('previous') || command.includes('back')) {
        const focusableElements = document.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
        const currentIndex = Array.from(focusableElements).indexOf(document.activeElement as Element);
        const prevElement = focusableElements[currentIndex - 1] as HTMLElement;
        if (prevElement) prevElement.focus();
      }
    };

    recognition.onerror = (event: any) => {
      if (event.error === 'not-allowed') {
        announce('Voice control requires microphone permission', 'assertive');
        setVoiceControl(false);
      }
    };

    if (voiceControl) {
      recognition.start();
    }

    localStorage.setItem('accessibility-voiceControl', String(voiceControl));

    return () => recognition.stop();
  }, [voiceControl, announce]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
        return;
      }

      const key = `${event.ctrlKey || event.metaKey ? 'ctrl+' : ''}${event.altKey ? 'alt+' : ''}${event.key.toLowerCase()}`;
      const callback = keyboardShortcuts[key];

      if (callback) {
        event.preventDefault();
        callback();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [keyboardShortcuts]);

  const registerShortcut = useCallback((key: string, callback: () => void) => {
    setKeyboardShortcuts(prev => ({ ...prev, [key]: callback }));
  }, []);

  const unregisterShortcut = useCallback((key: string) => {
    setKeyboardShortcuts(prev => {
      const newShortcuts = { ...prev };
      delete newShortcuts[key];
      return newShortcuts;
    });
  }, []);

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
        voiceControl,
        setVoiceControl,
        colorBlindMode,
        setColorBlindMode,
        announce,
        keyboardShortcuts,
        registerShortcut,
        unregisterShortcut,
      }}
    >
      {children}
    </AccessibilityContext.Provider>
  );
};