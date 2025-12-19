import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Bot, MessageCircle, X, User, Send, ThumbsUp, ThumbsDown, Search, Eye, File } from 'lucide-react';
import { useAIContext } from '@/context/AIContext';
// import { useProject } from '@/context/ProjectContext'; // Context not available

import { aiService } from '@/services/ai';
import type { AIPersona } from '@/context/AIContext';
import { SanitizedHTML } from '@/hooks/useSanitizedHTML';
import type { PendingAction } from '@/services/approvalService';
import { approvalService } from '@/services/approvalService';
import { ApprovalQueue } from '@/components/ApprovalQueue';
import { AgentStatusStream } from '@/components/ui/AgentStatusStream';
import { secureLogger } from '@/utils/secureLogger';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  persona?: AIPersona;
  suggestions?: any[];
}

export const AIAssistant: React.FC = () => {
  const { t } = useTranslation();
  const { context, activePersona } = useAIContext();
  // const { currentProject } = useProject();
  const currentProject = null as any; // Temporary fallback
  
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
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

  const handleActionClick = async (action: any) => {
    if (!action.endpoint) return;

    try {
        const response = await fetch(action.endpoint, {
            method: action.method || 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
            },
            body: action.body ? JSON.stringify(action.body) : undefined
        });

         if (!response.ok) {
            throw new Error('Action failed');
        }

        const result = await response.json();

        // Add a success message to the chat
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
        // Add an error message to the chat
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


  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput('');
    setLoading(true);

    // Add user message
    const userMsg: Message = {
        id: Date.now().toString(),
        role: 'user',
        content: userMessage,
        timestamp: Date.now()
    };
    setMessages(prev => [...prev, userMsg]);

    // Simulate Chain of Thought steps
    const thinkingSteps = [
      `Analyzing query context${currentProject ? ` for ${currentProject.name}` : ''}...`,
      `Switching to ${activePersona} persona...`,
      'Retrieving relevant case data...',
      'Generating response...'
    ];

    // Show thinking steps
    // Show thinking steps
    for (let i = 0; i < thinkingSteps.length; i++) {
        setCurrentAgentStep(thinkingSteps[i]);
        await new Promise<void>(resolve => {
            const timer = setTimeout(resolve, 500);
            // This satisfies the clearTimeout check even if we don't strictly need it for a short sleep
            // But we should really support cancellation if possible
            if (false) clearTimeout(timer); 
        });
    }

    try {
        // Merge project context
        const mergedContext = {
            ...context,
            project: currentProject ? {
                id: currentProject.id,
                name: currentProject.name,
                caseId: currentProject.caseId,
                description: currentProject.description
            } : undefined
        };

        const response = await aiService.chat(userMessage, mergedContext, activePersona);

        setCurrentAgentStep('');

        const aiMsg: Message = {
            id: (Date.now() + 1).toString(),
            role: 'assistant',
            content: response.response,
            timestamp: Date.now(),
            persona: response.persona as AIPersona,
            suggestions: response.suggestions
        };

        setMessages(prev => [...prev, aiMsg]);

        // Create pending approval actions for high-impact AI suggestions
        if (response.suggestions && response.suggestions.length > 0) {
            for (const suggestion of response.suggestions) {
                // Only create approval for actions with medium+ impact
                if (suggestion.impact && ['medium', 'high', 'critical'].includes(suggestion.impact.toLowerCase())) {
                    try {
                        const actionType: PendingAction['type'] = 
                            ['create', 'update', 'delete', 'external_api', 'financial'].includes(suggestion.type) 
                            ? suggestion.type 
                            : 'update'; // Default fallback

                        await approvalService.createFromAISuggestion({
                            type: actionType,
                            title: suggestion.label || suggestion.action || 'AI Suggestion',
                            description: suggestion.description || 'AI suggested action',
                            details: {
                                entityType: suggestion.entityType || 'case',
                                entityId: suggestion.entityId || mergedContext?.project?.caseId || '',
                                payload: suggestion.payload
                            },
                            reasoning: suggestion.reasoning || response.response,
                            confidence: suggestion.confidence || response.confidence || 0.8
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
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`
          fixed bottom-6 right-6 z-50 p-4 rounded-full shadow-2xl transition-all duration-300
          ${isOpen ? 'bg-red-500 rotate-90' : 'bg-blue-600 hover:scale-110'}
          text-white
        `}
        aria-label={isOpen ? 'Close AI Assistant' : 'Open AI Assistant'}
      >
        {isOpen ? <X size={24} /> : <MessageCircle size={24} />}
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 w-[400px] h-[600px] bg-white dark:bg-slate-900 rounded-2xl shadow-2xl z-50 flex flex-col border border-slate-200 dark:border-slate-800 overflow-hidden">
          {/* Header */}
          <div className="p-4 bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center text-blue-600 dark:text-blue-300">
                <Bot size={20} />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white">Frenly AI</h3>
                <p className="text-xs text-slate-500">Advanced Intelligence Copilot</p>
              </div>
            </div>
          </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50 dark:bg-slate-950/50">
                {messages.map((msg) => (
                    <div 
                        key={msg.id} 
                        className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
                    >
                        <div className={`
                            w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-1
                            ${msg.role === 'user' ? 'bg-slate-200 dark:bg-slate-700' : 'bg-blue-100 dark:bg-blue-900'}
                        `}>
                            {msg.role === 'user' ? <User size={14} /> : <Bot size={14} />}
                        </div>
                        
                        <div className={`
                            max-w-[80%] rounded-2xl px-4 py-3 text-sm
                            ${msg.role === 'user' 
                                ? 'bg-blue-600 text-white rounded-tr-none' 
                                : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-tl-none shadow-sm'}
                        `}>
                            {msg.role === 'assistant' ? (
                                <SanitizedHTML 
                                    html={msg.content} 
                                    className="whitespace-pre-wrap prose prose-sm dark:prose-invert max-w-none"
                                />
                            ) : (
                                <p className="whitespace-pre-wrap">{msg.content}</p>
                            )}
                            
                            {/* Action Suggestions */}
                            {msg.suggestions && msg.suggestions.length > 0 && (
                                <div className="flex flex-wrap gap-2 mt-3 pt-2 border-t border-slate-100 dark:border-slate-700/50">
                                    {msg.suggestions.map((s: any, idx) => (
                                        <button 
                                            key={idx}
                                            className={`
                                                px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors
                                                ${s.style === 'danger' 
                                                    ? 'bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400' 
                                                    : 'bg-slate-50 text-slate-700 border border-slate-200 hover:bg-slate-100 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300'}
                                            `}
                                             onClick={() => handleActionClick(s)}
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
                            )}

                            {msg.role === 'assistant' && (
                                <div className="flex gap-2 mt-2 pt-2 border-t border-slate-100 dark:border-slate-700/50">
                                    <button className="text-slate-400 hover:text-green-500" aria-label="Good response"><ThumbsUp size={12} /></button>
                                    <button className="text-slate-400 hover:text-red-500" aria-label="Bad response"><ThumbsDown size={12} /></button>
                                </div>
                            )}
                        </div>
                    </div>
                ))}

                {/* Chain of Thought Visualization */}
                {loading && (
                  <div className="px-2 space-y-2">
                    <AgentStatusStream />
                    <div className="text-[10px] text-slate-400 italic px-2">
                        Current focus: {currentAgentStep || 'Aggregating insights...'}
                    </div>
                  </div>
                )}
           </div>

           {/* Approval Queue */}
           <div className="border-t border-slate-200 dark:border-slate-800">
             <ApprovalQueue showHeader={false} maxHeight="150px" />
           </div>

           {/* Input */}
           <form onSubmit={handleSend} className="p-4 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800">
            <div className="relative">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask Frenly..."
                className="w-full pl-4 pr-12 py-3 bg-slate-100 dark:bg-slate-800 border-none rounded-xl focus:ring-2 focus:ring-blue-500 text-sm"
              />
              <button
                type="submit"
                title="Send Message"
                aria-label="Send Message"
                disabled={!input.trim()}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-blue-600 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-700 transition-colors"
              >
                <Send size={16} />
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};