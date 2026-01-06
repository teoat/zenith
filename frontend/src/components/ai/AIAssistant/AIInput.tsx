import React, { useState } from 'react';
import { Send } from 'lucide-react';

interface AIInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

export const AIInput: React.FC<AIInputProps> = ({ onSend, disabled, placeholder }) => {
  const [input, setInput] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || disabled) return;
    
    onSend(input.trim());
    setInput('');
  };

  return (
    <form onSubmit={handleSubmit} className="p-4 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800">
      <div className="relative">
        <input
          type="text"
          data-testid="ai-assistant-input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={placeholder || "Ask Frenly..."}
          className="w-full pl-4 pr-12 py-3 bg-slate-100 dark:bg-slate-800 border-none rounded-xl focus:ring-2 focus:ring-blue-500 text-sm"
          disabled={disabled}
        />
        <button
          type="submit"
          data-testid="ai-assistant-send"
          title="Send Message"
          aria-label="Send Message"
          disabled={!input.trim() || disabled}
          className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-blue-600 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-700 transition-colors"
        >
          <Send size={16} />
        </button>
      </div>
    </form>
  );
};
