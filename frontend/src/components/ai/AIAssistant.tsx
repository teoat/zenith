import React, { useState, useEffect, useRef } from 'react';
import { useAIContext, AIPersona } from '../../context/AIContext';
import { aiService } from '../../services/ai';
<<<<<<< Updated upstream
import { MessageCircle, X, Send, ThumbsUp, ThumbsDown, User, Bot, Scale, Search, FileText } from 'lucide-react';

=======
import { AIPersona } from '../../context/AIContext';
import { SanitizedHTML } from '../../hooks/useSanitizedHTML';
import { approvalService } from '../../services/approvalService';
import { AgentStatusStream } from '../ui/AgentStatusStream';
>>>>>>> Stashed changes

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  persona?: AIPersona;
  feedback?: 'positive' | 'negative';
  suggestions?: Record<string, any>[];
}

const PersonaToggle = () => {
    const { activePersona, setPersona } = useAIContext();
    
    const personas: { id: AIPersona; icon: React.ElementType; label: string }[] = [
      { id: 'frenly', icon: Bot, label: 'Frenly' },
      { id: 'investigator', icon: Search, label: 'Detective' },
      { id: 'legal', icon: Scale, label: 'Legal' },
      { id: 'forensic', icon: FileText, label: 'Forensic' }
    ];
  
    return (
      <div className="flex gap-2 p-2 bg-slate-100 dark:bg-slate-800 rounded-lg overflow-x-auto">
         {personas.map(p => (
            <button 
               key={p.id}
               onClick={() => setPersona(p.id)}
               className={`
                 flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap
                 ${activePersona === p.id 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'}
               `}
            >
               <p.icon size={12} /> {p.label}
            </button>
         ))}
      </div>
    );
};

export const AIAssistant: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    {
        id: 'welcome',
        role: 'assistant',
        content: "Hello! I'm Frenly, your advanced fraud detection assistant. How can I help you investigate today?",
        timestamp: Date.now(),
        persona: 'frenly'
    }
  ]);
  const [loading, setLoading] = useState(false);
  const { context, activePersona } = useAIContext();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen]);

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || loading) return;

    const userMsg: Message = {
        id: Date.now().toString(),
        role: 'user',
        content: input,
        timestamp: Date.now()
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
        // Integrate with real API
        const response = await aiService.chat(input, context || {}, activePersona);
        
        const aiMsg: Message = {
            id: (Date.now() + 1).toString(),
            role: 'assistant',
            content: response.response,
            timestamp: Date.now(),
            persona: response.persona as AIPersona,
            suggestions: response.suggestions
        };
        
        setMessages(prev => [...prev, aiMsg]);

<<<<<<< Updated upstream
    } catch (err) {
        console.error(err);
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
=======
        // Simulate Chain of Thought steps
        const thinkingSteps = [
          `Analyzing query context${currentProject ? ` for ${currentProject.name}` : ''}...`,
          `Switching to ${activePersona} persona...`,
          'Retrieving relevant case data...',
          'Generating response...'
        ];

        // Show thinking steps
        for (let i = 0; i < thinkingSteps.length; i++) {
            setCurrentAgentStep(thinkingSteps[i]);
            setAgentLogs(prev => [...prev, {
                id: `step-${i}`,
                message: thinkingSteps[i],
                timestamp: Date.now(),
                type: 'info'
            }]);
            await new Promise(resolve => setTimeout(resolve, 500));
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

            setAgentLogs(prev => [...prev, {
              id: 'complete',
              message: 'Response generated successfully.',
              timestamp: Date.now(),
              type: 'success'
            }]);
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
                            await approvalService.createPendingAction({
                                action: suggestion.action || suggestion.type || 'ai_suggestion',
                                entityType: suggestion.entityType || 'case',
                                entityId: suggestion.entityId || mergedContext.caseId || '',
                                description: suggestion.description || suggestion.label || 'AI suggested action',
                                aiContext: {
                                    reasoning: suggestion.reasoning || response.response,
                                    confidence: suggestion.confidence || response.confidence || 0.8,
                                    persona: response.persona,
                                    timestamp: Date.now()
                                },
                                impact: suggestion.impact || 'medium'
                            });

                            setAgentLogs(prev => [...prev, {
                                id: `approval-${suggestion.id || Date.now()}`,
                                message: `Added "${suggestion.label || suggestion.action}" to approval queue`,
                                timestamp: Date.now(),
                                type: 'success'
                            }]);
                        } catch (error) {
                            console.error('Failed to create approval action:', error);
                        }
                    }
                }
            }

        } catch (err) {
            console.error(err);
            setAgentLogs(prev => [...prev, {
              id: 'error',
              message: 'Failed to connect to intelligence engine.',
              timestamp: Date.now(),
              type: 'error'
            }]);
            setMessages(prev => [...prev, {
                id: Date.now().toString(),
                role: 'assistant',
                content: "I'm having trouble connecting to the intelligence engine right now. Please try again.",
                timestamp: Date.now(),
                persona: activePersona
            }]);
        } finally {
            setLoading(false);
            // Clear logs after a delay
            setTimeout(() => setAgentLogs([]), 3000);
        }
    };
>>>>>>> Stashed changes

  return (
    <>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`
            fixed bottom-6 right-6 z-50 p-4 rounded-full shadow-2xl transition-all duration-300
            ${isOpen ? 'bg-red-500 rotate-90' : 'bg-blue-600 hover:scale-110'}
            text-white
        `}
        aria-label={isOpen ? "Close AI Assistant" : "Open AI Assistant"}
      >
        {isOpen ? <X size={24} /> : <MessageCircle size={24} />}
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 w-[400px] h-[600px] max-w-[calc(100vw-48px)] bg-white dark:bg-slate-900 rounded-2xl shadow-2xl z-50 flex flex-col border border-slate-200 dark:border-slate-800 animate-in slide-in-from-bottom-10 fade-in duration-300 overflow-hidden">
            
            {/* Header */}
            <div className="p-4 bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-3 mb-3">
                    <div className="relative">
                        <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center text-blue-600 dark:text-blue-300">
                            <Bot size={20} />
                        </div>
                        <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white dark:border-slate-900 rounded-full"></span>
                    </div>
                    <div>
                        <h3 className="font-bold text-slate-900 dark:text-white">Frenly AI</h3>
                        <p className="text-xs text-slate-500">Advanced Intelligence Copilot</p>
                    </div>
                </div>
                <PersonaToggle />
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
                                : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-tl-noneShadow-sm'}
                        `}>
<<<<<<< Updated upstream
                            <p>{msg.content}</p>
=======
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

>>>>>>> Stashed changes
                            {msg.role === 'assistant' && (
                                <div className="flex gap-2 mt-2 pt-2 border-t border-slate-100 dark:border-slate-700/50">
                                    <button className="text-slate-400 hover:text-green-500"><ThumbsUp size={12} /></button>
                                    <button className="text-slate-400 hover:text-red-500"><ThumbsDown size={12} /></button>
                                </div>
                            )}
                        </div>
                    </div>
                ))}
                {loading && (
                    <div className="flex gap-3">
                         <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center"><Bot size={14} /></div>
                         <div className="bg-white dark:bg-slate-800 rounded-2xl rounded-tl-none px-4 py-3 border border-slate-200 dark:border-slate-700">
                            <div className="flex gap-1">
                                <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></span>
                                <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-100"></span>
                                <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-200"></span>
                            </div>
                         </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <form onSubmit={handleSend} className="p-4 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800">
                <div className="relative">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder={`Ask ${activePersona}...`}
                        className="w-full pl-4 pr-12 py-3 bg-slate-100 dark:bg-slate-800 border-none rounded-xl focus:ring-2 focus:ring-blue-500 text-sm"
                    />
                    <button 
                        type="submit"
                        disabled={!input.trim() || loading}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-blue-600 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-700 transition-colors"
                    >
                        <Send size={16} />
                    </button>
                </div>
            </form>

        </div>
      )}
    </>
  );
};
