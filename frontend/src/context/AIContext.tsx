import type { ReactNode } from 'react';
import { createContext, useContext, useState } from 'react';

export type AIPersona = 'frenly' | 'investigator' | 'legal' | 'forensic' | 'redteam';

export interface AIContextState {
  currentPage: string;
  activeData: any;
  timestamp: number;
}

interface AIContextType {
  context: AIContextState;
  setContext: (context: AIContextState) => void;
  activePersona: AIPersona;
  setPersona: (persona: AIPersona) => void;
}

const defaultContext: AIContextState = {
  currentPage: 'dashboard',
  activeData: null,
  timestamp: Date.now()
};

const AIContext = createContext<AIContextType | undefined>(undefined);

export const AIProvider = ({ children }: { children: ReactNode }) => {
  const [context, setContext] = useState<AIContextState>(defaultContext);
  const [activePersona, setPersona] = useState<AIPersona>('frenly');

  return (
    <AIContext.Provider value={{ context, setContext, activePersona, setPersona }}>
      {children}
    </AIContext.Provider>
  );
};

export const useAIContext = () => {
  const context = useContext(AIContext);
  if (!context) {
    throw new Error('useAIContext must be used within an AIProvider');
  }
  return context;
};
