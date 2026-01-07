import React from "react";
import { User, Bot, ThumbsUp, ThumbsDown } from "lucide-react";
import { SanitizedHTML } from "@/hooks/useSanitizedHTML";
import { Message, SuggestionAction } from "./types";
import { SuggestionList } from "./SuggestionList";

interface ChatMessageProps {
  message: Message;
  onActionClick: (action: SuggestionAction) => void;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({
  message,
  onActionClick,
}) => {
  const isUser = message.role === "user";

  return (
    <div className={`flex gap-3 ${isUser ? "flex-row-reverse" : ""}`}>
      <div
        className={`
        w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-1
        ${isUser ? "bg-slate-200 dark:bg-slate-700" : "bg-blue-100 dark:bg-blue-900"}
      `}
      >
        {isUser ? <User size={14} /> : <Bot size={14} />}
      </div>

      <div
        className={`
        max-w-[80%] rounded-2xl px-4 py-3 text-sm
        ${
          isUser
            ? "bg-blue-600 text-white rounded-tr-none"
            : "bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-tl-none shadow-sm"
        }
      `}
      >
        {!isUser ? (
          <SanitizedHTML
            html={message.content}
            className="whitespace-pre-wrap prose prose-sm dark:prose-invert max-w-none"
          />
        ) : (
          <p className="whitespace-pre-wrap">{message.content}</p>
        )}

        {message.suggestions && (
          <SuggestionList
            suggestions={message.suggestions}
            onActionClick={onActionClick}
          />
        )}

        {!isUser && (
          <div className="flex gap-2 mt-2 pt-2 border-t border-slate-100 dark:border-slate-700/50">
            <button
              className="text-slate-400 hover:text-green-500"
              aria-label="Good response"
            >
              <ThumbsUp size={12} />
            </button>
            <button
              className="text-slate-400 hover:text-red-500"
              aria-label="Bad response"
            >
              <ThumbsDown size={12} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
