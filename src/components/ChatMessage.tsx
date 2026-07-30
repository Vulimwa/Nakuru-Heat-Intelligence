import React, { useState } from 'react';
import { Message } from '../types';
import { Bot, User, Copy, Check, AlertTriangle } from 'lucide-react';

interface ChatMessageProps {
  message: Message;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
  const [copied, setCopied] = useState(false);
  const isUser = message.sender === 'user';

  const handleCopy = () => {
    // Strip markdown formatting and emojis for clipboard copy
    const cleanText = message.text
      .replace(/\*\*/g, '')
      .replace(/[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu, '');
    navigator.clipboard.writeText(cleanText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatText = (rawText: string) => {
    // Strip emojis from output text
    const textWithoutEmojis = rawText.replace(
      /[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu,
      ''
    );

    // Split by double or single paragraph breaks
    const paragraphs = textWithoutEmojis.split(/\n\n+/);
    return paragraphs.map((paragraph, pIdx) => {
      const lines = paragraph.split('\n');
      return (
        <div key={pIdx} className="mb-2 last:mb-0">
          {lines.map((line, lIdx) => {
            const trimmed = line.trim();
            const isBullet = trimmed.startsWith('- ') || trimmed.startsWith('* ');
            const isNumber = /^\d+\.\s/.test(trimmed);

            // Clean line without bullet prefix if bullet
            const lineContent = isBullet ? trimmed.substring(2) : line;

            // Render bold sections without raw ** stars
            const parts = lineContent.split(/(\*\*[^*]+\*\*)/g);
            const renderedParts = parts.map((part, idx) => {
              if (part.startsWith('**') && part.endsWith('**')) {
                return (
                  <strong key={idx} className="font-semibold text-slate-900">
                    {part.slice(2, -2)}
                  </strong>
                );
              }
              // Replace any remaining standalone asterisks
              return part.replace(/\*/g, '');
            });

            if (isBullet) {
              return (
                <div key={lIdx} className="ml-3 my-1 flex items-start gap-2">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-slate-500" />
                  <span className="leading-relaxed">{renderedParts}</span>
                </div>
              );
            }

            if (isNumber) {
              return (
                <div key={lIdx} className="ml-1 my-1 font-medium text-slate-800 leading-relaxed">
                  {renderedParts}
                </div>
              );
            }

            return (
              <p key={lIdx} className="my-0.5 leading-relaxed">
                {renderedParts}
              </p>
            );
          })}
        </div>
      );
    });
  };

  const formatHighPrecisionTimestamp = (ts: Date | string) => {
    const d = new Date(ts);
    if (isNaN(d.getTime())) return '';
    const timeStr = d.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    });
    const ms = String(d.getMilliseconds()).padStart(3, '0');
    return `${timeStr}.${ms}`;
  };

  const formattedTime = formatHighPrecisionTimestamp(message.timestamp);

  return (
    <div
      className={`flex w-full gap-3 py-3.5 px-4 rounded-2xl transition-all ${
        isUser
          ? 'bg-slate-900 text-white justify-end ml-auto max-w-[85%] shadow-sm'
          : 'bg-white border border-slate-200 text-slate-800 shadow-xs max-w-[90%]'
      }`}
    >
      {!isUser && (
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl overflow-hidden bg-slate-900 text-white shadow-xs mt-0.5 border border-slate-200">
          <img
            src="https://i.ibb.co/xqKpcbxs/14049-NPBFQY.jpg"
            alt="Nakuru Heat Intelligence Logo"
            className="h-full w-full object-cover"
            referrerPolicy="no-referrer"
          />
        </div>
      )}

      <div className={`flex-1 min-w-0 ${isUser ? 'text-right' : 'text-left'}`}>
        <div className="flex items-center justify-between gap-2 mb-1.5">
          <span className={`text-xs font-bold ${isUser ? 'text-slate-200' : 'text-slate-500'}`}>
            {isUser ? 'Researcher' : 'Nakuru Heat Intelligence'}
          </span>

          <span className={`text-[10px] ${isUser ? 'text-slate-400' : 'text-slate-400'}`}>
            {formattedTime}
          </span>
        </div>

        {message.isError && (
          <div className="mb-2 flex items-center gap-1.5 text-xs font-medium text-red-600 bg-red-50 border border-red-200 p-2.5 rounded-xl">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <span>{message.text}</span>
          </div>
        )}

        {!message.isError && (
          <div
            className={`text-xs sm:text-sm space-y-1 overflow-x-auto ${
              isUser ? 'text-slate-100 font-medium' : 'text-slate-800'
            }`}
          >
            {formatText(message.text)}
          </div>
        )}

        {!isUser && !message.isError && (
          <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between">
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-tight">
              Nakuru Observatory Knowledge Base
            </span>
            <button
              onClick={handleCopy}
              className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-medium text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-colors"
              title="Copy text to clipboard"
            >
              {copied ? (
                <>
                  <Check className="h-3 w-3 text-emerald-600" />
                  <span className="text-emerald-600 font-semibold">Copied</span>
                </>
              ) : (
                <>
                  <Copy className="h-3 w-3" />
                  <span>Copy</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {isUser && (
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-slate-700 text-white mt-0.5">
          <User className="h-4.5 w-4.5" />
        </div>
      )}
    </div>
  );
};

