import React, { useState, useEffect } from 'react';
import { Bot, MessageCircle, X } from 'lucide-react';
import { useAIContext, AIPersona } from '@/context/AIContext';
import { aiService } from '@/services/ai';
import { approvalService, PendingAction } from '@/services/approvalService';
import { ApprovalQueue } from '@/components/ApprovalQueue';
import { AgentStatusStream } from '@/components/ui/AgentStatusStream';
import { secureLogger } from '@/utils/secureLogger';

import { ChatMessage } from './ChatMessage';
import { AIInput } from './AIInput';
import { Message, SuggestionAction, Project } from './types';

interface AIAssistantProps {
  caseId?: string;
  showSuggestions?: boolean;
  showConfidence?: boolean;
}

export const AIAssistant: React.FC<AIAssistantProps> = ({ caseId: _caseId }) => {
  const { context, activePersona, setPersona } = useAIContext();
  const currentProject = null as Project | null; // Temporary fallback

  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: "Hello! I'm Frenly, your advanced fraud detection assistant. How can I help you investigate today?",
      timestamp: Date.now()
    }
  ]);
  const [currentAgentStep, setCurrentAgentStep] = useState('');
  const [aiStatus, setAiStatus] = useState<{ mode: string; llm_api_available: boolean } | null>(null);

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const response = await fetch('/api/v1/ai/status');
        const data = await response.json();
        if (data.success) {
          setAiStatus(data.status);
        }
      } catch (error) {
        console.error('Failed to fetch AI status:', error);
      }
    };
    fetchStatus();
  }, []);

  const handleActionClick = async (action: SuggestionAction) => {
    if (!action.endpoint) return;

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = await aiService.performAction(action.endpoint, action.method || 'POST', action.body) as any;

      const successMsg: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content: `✅ ${action.label} completed: ${result.message || 'Success'}`,
        timestamp: Date.now(),
        persona: activePersona
      };

      setMessages(prev => [...prev, successMsg]);

    } catch (error) {
      secureLogger.error('AI_INTELLIGENCE', 'Action failed', { 
        actionLabel: action.label,
        error: error instanceof Error ? error.message : String(error) 
      });
      
      const errorMsg: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content: `❌ Failed to ${action.label ? action.label.toLowerCase() : 'perform action'}. Please try again.`,
        timestamp: Date.now(),
        persona: activePersona
      };

      setMessages(prev => [...prev, errorMsg]);
    }
  };

  const handleSend = async (message: string) => {
    setLoading(true);

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: message,
      timestamp: Date.now()
    };
    setMessages(prev => [...prev, userMsg]);

    const thinkingSteps = [
      `Analyzing query context${currentProject ? ` for ${currentProject.name}` : ''}...`,
      `Switching to ${activePersona} persona...`,
      'Retrieving relevant case data...',
      'Generating response...'
    ];

    for (let i = 0; i < thinkingSteps.length; i++) {
        setCurrentAgentStep(thinkingSteps[i]);
        await new Promise<void>(resolve => setTimeout(resolve, 500));
    }

    try {
        const mergedContext = {
            ...context,
            project: currentProject ? {
                id: currentProject.id,
                name: currentProject.name,
                caseId: currentProject.caseId,
                description: currentProject.description
            } : undefined
        };

        const response = await aiService.chat(message, mergedContext, activePersona);
        setCurrentAgentStep('');

        const aiMsg: Message = {
            id: (Date.now() + 1).toString(),
            role: 'assistant',
            content: response.data?.response || '',
            timestamp: Date.now(),
            persona: response.data?.persona as AIPersona,
            suggestions: response.data?.suggestions as SuggestionAction[] | undefined
        };

        setMessages(prev => [...prev, aiMsg]);

        if (response.data?.suggestions && response.data.suggestions.length > 0) {
            for (const suggestion of response.data.suggestions) {
                if (suggestion.impact && ['medium', 'high', 'critical'].includes(suggestion.impact.toLowerCase())) {
                    try {
                        const actionType: PendingAction['type'] = 
                            ['create', 'update', 'delete', 'external_api', 'financial'].includes(suggestion.type || '') 
                            ? (suggestion.type as PendingAction['type'])
                            : 'update'; 

                        await approvalService.createFromAISuggestion({
                            type: actionType,
                            title: suggestion.label || suggestion.action || 'AI Suggestion',
                            description: suggestion.description || 'AI suggested action',
                            details: {
                                entityType: suggestion.entityType || 'case',
                                entityId: suggestion.entityId || mergedContext?.project?.caseId || '',
                                payload: suggestion.payload
                            },
                            reasoning: suggestion.reasoning || response.data?.response,
                            confidence: suggestion.confidence || response.data?.confidence || 0.8
                        });
                    } catch (error) {
                        secureLogger.error('AI_INTELLIGENCE', 'Failed to create approval action', { 
                            suggestionLabel: suggestion.label,
                            error: error instanceof Error ? error.message : String(error) 
                        });
                    }
                }
            }
        }

    } catch (error) {
        secureLogger.error('AI_INTELLIGENCE', 'Intelligence engine connection error', { 
            error: error instanceof Error ? error.message : String(error) 
        });
        setMessages(prev => [...prev, {
            id: Date.now().toString(),
            role: 'assistant',
            content: "I'm having trouble connecting to the intelligence engine right now. Please try again.",
            timestamp: Date.now(),
            persona: activePersona
        }]);
    } finally {
        setLoading(false);
    }
  };

  return (
    <div>
      <button
        onClick={() => setIsOpen(!isOpen)}
        data-testid="ai-assistant-trigger"
        className={`
          fixed bottom-6 right-6 z-50 p-4 rounded-full shadow-2xl transition-all duration-300
          ${isOpen ? 'bg-red-500 rotate-90' : 'bg-blue-600 hover:scale-110'}
          text-white
        `}
        aria-label={isOpen ? 'Close AI Assistant' : 'Open AI Assistant'}
      >
        {isOpen ? <X size={24} /> : <MessageCircle size={24} />}
      </button>

      {isOpen && (
        <div data-testid="ai-assistant-window" className="fixed bottom-24 right-6 w-[400px] h-[600px] bg-white dark:bg-slate-900 rounded-2xl shadow-2xl z-50 flex flex-col border border-slate-200 dark:border-slate-800 overflow-hidden">
          <div className="p-4 bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center text-blue-600 dark:text-blue-300">
                  <Bot size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white">Frenly AI</h3>
                  <p className="text-xs text-slate-500">Advanced Intelligence Copilot</p>
                </div>
              </div>
              
               <select
                 value={activePersona}
                 onChange={(e) => setPersona(e.target.value as AIPersona)}
                className="text-xs px-2 py-1 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-blue-500 outline-none"
                aria-label="Select AI Persona"
              >
                <option value="frenly">Frenly</option>
                <option value="investigator">Investigator</option>
                <option value="legal">Legal</option>
                <option value="forensic">Forensic</option>
                <option value="redteam">Red Team 🔴</option>
              </select>
              {aiStatus && (
                <div className={`text-xs px-2 py-1 rounded-full ${
                  aiStatus.llm_api_available
                    ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                    : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                }`}>
                  {aiStatus.mode === 'live' ? 'Live AI' : 'Simulation Mode'}
                </div>
              )}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50 dark:bg-slate-950/50">
            {messages.map((msg) => (
              <ChatMessage 
                key={msg.id} 
                message={msg} 
                onActionClick={handleActionClick} 
              />
            ))}

            {loading && (
              <div className="px-2 space-y-2">
                <AgentStatusStream />
                <div className="text-[10px] text-slate-400 italic px-2">
                    Current focus: {currentAgentStep || 'Aggregating insights...'}
                </div>
              </div>
            )}
          </div>

          <div className="border-t border-slate-200 dark:border-slate-800">
            <ApprovalQueue showHeader={false} maxHeight="150px" />
          </div>

          <AIInput onSend={handleSend} disabled={loading} />
        </div>
      )}
    </div>
  );
};
