import React, { useState, KeyboardEvent, useRef, useEffect } from 'react';
import { Send, Loader2 } from 'lucide-react';

interface ChatInputProps {
  onSendMessage: (text: string) => void;
  isLoading: boolean;
}

export const ChatInput: React.FC<ChatInputProps> = ({ onSendMessage, isLoading }) => {
  const [input, setInput] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!isLoading && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [isLoading]);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!input.trim() || isLoading) return;
    onSendMessage(input.trim());
    setInput('');
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="relative mt-2">
      <div className="flex items-center rounded-lg border border-slate-300 bg-white p-1.5 shadow-xs focus-within:border-slate-800 focus-within:ring-1 focus-within:ring-slate-800 transition-all">
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask about the observatory..."
          disabled={isLoading}
          rows={1}
          className="flex-1 resize-none bg-transparent px-2 py-1.5 text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-hidden disabled:opacity-50 min-h-[38px] max-h-24"
        />
        <button
          type="submit"
          disabled={!input.trim() || isLoading}
          aria-label="Send question"
          className="inline-flex h-9 min-w-9 items-center justify-center rounded-md bg-slate-900 px-3 text-xs font-medium text-white shadow-xs hover:bg-slate-800 focus:outline-hidden focus:ring-2 focus:ring-slate-800 disabled:opacity-40 transition-colors shrink-0"
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <div className="flex items-center gap-1.5">
              <span>Send</span>
              <Send className="h-3.5 w-3.5" />
            </div>
          )}
        </button>
      </div>
      <p className="mt-1 text-[11px] text-slate-500 text-right">
        Press Enter to send, Shift+Enter for new line
      </p>
    </form>
  );
};
