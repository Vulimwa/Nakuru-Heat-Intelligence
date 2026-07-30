import React, { useEffect, useRef } from 'react';
import { Message } from '../types';
import { ChatMessage } from './ChatMessage';
import { Bot, Loader2 } from 'lucide-react';

interface ChatWindowProps {
  messages: Message[];
  isLoading: boolean;
}

export const ChatWindow: React.FC<ChatWindowProps> = ({ messages, isLoading }) => {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  return (
    <div className="flex-1 overflow-y-auto space-y-3 p-2 sm:p-4 rounded-lg bg-slate-50/50 border border-slate-200 min-h-[300px] max-h-[550px]">
      {messages.map((msg) => (
        <ChatMessage key={msg.id} message={msg} />
      ))}

      {isLoading && (
        <div className="flex w-full gap-3 py-3 px-3 rounded-lg bg-white border border-slate-200">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-900 text-white shadow-xs">
            <Bot className="h-4.5 w-4.5" />
          </div>
          <div className="flex items-center gap-2 text-xs font-medium text-slate-600">
            <Loader2 className="h-4 w-4 animate-spin text-slate-800" />
            <span>Analyzing Nakuru Urban Heat Observatory knowledge base...</span>
          </div>
        </div>
      )}

      <div ref={bottomRef} />
    </div>
  );
};
