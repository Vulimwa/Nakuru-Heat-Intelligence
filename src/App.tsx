import { useState, useEffect, useCallback } from "react";
import { Message, StatusState, ChatResponse } from "./types";
import { Header } from "./components/Header";
import { StatusIndicator } from "./components/StatusIndicator";
import { ChatWindow } from "./components/ChatWindow";
import { ChatInput } from "./components/ChatInput";
import {
  BookOpen,
  HelpCircle,
  Info,
  Sparkles,
  ShieldCheck,
} from "lucide-react";

const STARTER_QUESTIONS = [
  "What was the mean SIUHI in 2026?",
  "How did Very High heat area change from 2021 to 2026?",
  "How many people were exposed to Very High heat in 2026?",
  "Which land-cover type was hottest in 2026?",
  "What does the Lake Nakuru cooling analysis show?",
  "What urban cooling interventions are recommended?",
  "What guides exist for urban heat management?",
];

export default function App() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome_msg",
      sender: "assistant",
      text: "Welcome to Nakuru Heat Intelligence, the research assistant for the Nakuru Urban Heat Observatory (2021–2026).\n\nI can answer questions regarding:\n- SIUHI statistics (2021–2026)\n- Heat class area changes & population heat exposure\n- Urban heat hotspots (Persistent, New, and No Longer Very High)\n- Land cover thermal relationships & Lake Nakuru spatial cooling\n- Urban cooling interventions & sustainable heat management guides\n\nHow can I assist your research today?",
      timestamp: new Date(),
    },
  ]);

  const [status, setStatus] = useState<StatusState>({
    knowledgeConnected: true,
    llmEnabled: false,
    mode: "local",
    loading: false,
  });

  const [isLoading, setIsLoading] = useState(false);

  const checkStatus = useCallback(async () => {
    setStatus((prev) => ({ ...prev, loading: true }));
    try {
      const res = await fetch("/api/status");
      if (res.ok) {
        const data = await res.json();
        setStatus({
          knowledgeConnected: Boolean(data.knowledgeConnected),
          llmEnabled: Boolean(data.llmEnabled),
          mode: data.mode || "local",
          loading: false,
        });
      } else {
        setStatus((prev) => ({ ...prev, loading: false }));
      }
    } catch {
      setStatus((prev) => ({ ...prev, loading: false }));
    }
  }, []);

  useEffect(() => {
    checkStatus();
  }, [checkStatus]);

  const handleSendMessage = async (userText: string) => {
    if (!userText.trim() || isLoading) return;

    const userMessage: Message = {
      id: `user_${Date.now()}`,
      sender: "user",
      text: userText,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message: userText }),
      });

      const data: ChatResponse = await res.json();

      if (res.ok && data.answer) {
        const assistantMessage: Message = {
          id: `assistant_${Date.now()}`,
          sender: "assistant",
          text: data.answer,
          timestamp: data.timestamp || new Date().toISOString(),
        };
        setMessages((prev) => [...prev, assistantMessage]);
      } else {
        const errorMessage: Message = {
          id: `error_${Date.now()}`,
          sender: "assistant",
          text:
            data.error ||
            "An unexpected error occurred while communicating with the knowledge assistant.",
          isError: true,
          timestamp: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, errorMessage]);
      }
    } catch {
      const errorMessage: Message = {
        id: `error_${Date.now()}`,
        sender: "assistant",
        text: "Network error: Unable to reach the Nakuru Heat Intelligence server. Please check your connection.",
        isError: true,
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 text-slate-900 font-sans antialiased">
      <Header />

      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Bento Grid Container */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Sidebar Bento Column */}
          <div className="lg:col-span-4 flex flex-col gap-5">
            {/* Bento Card 1: Knowledge Status Indicator */}
            <StatusIndicator status={status} onRefresh={checkStatus} />

            {/* Bento Card 2: Research Context */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
              <div className="flex items-center gap-2 mb-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-900 text-white shadow-xs">
                  <BookOpen className="h-4 w-4" />
                </div>
                <div>
                  <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Research Context
                  </h2>
                  <p className="text-sm font-semibold text-slate-800">
                    Nakuru Urban Heat Observatory
                  </p>
                </div>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed">
                An AI knowledge assistant analyzing Surface Urban Heat Island
                (SIUHI) intensity, population heat exposure, land cover
                dynamics, and urban cooling interventions in Nakuru City.
              </p>

              <div className="mt-4 pt-3 border-t border-slate-100 grid grid-cols-2 gap-2 text-[11px]">
                <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
                  <span className="block text-slate-400 text-[10px]">
                    Study Period
                  </span>
                  <span className="font-semibold text-slate-800">
                    2021 – 2026
                  </span>
                </div>
                <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
                  <span className="block text-slate-400 text-[10px]">
                    2026 High Heat Exp.
                  </span>
                  <span className="font-semibold text-slate-800">
                    375,647 residents
                  </span>
                </div>
              </div>
            </div>

            {/* Bento Card 3: Recommended Inquiries */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
              <div className="flex items-center gap-2 mb-3">
                <HelpCircle className="h-4 w-4 text-slate-500" />
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Recommended Inquiries
                </h2>
              </div>

              <div className="flex flex-col gap-2">
                {STARTER_QUESTIONS.map((q, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSendMessage(q)}
                    disabled={isLoading}
                    className="w-full text-left rounded-xl border border-slate-200/80 bg-slate-50/50 px-3 py-2 text-xs font-medium text-slate-700 hover:border-slate-400 hover:bg-slate-100/80 hover:text-slate-900 transition-colors disabled:opacity-50 group flex items-center justify-between"
                  >
                    <span className="line-clamp-2">{q}</span>
                    <Sparkles className="h-3 w-3 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 ml-1" />
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Right Main Bento Chat Container */}
          <div className="lg:col-span-8 flex flex-col rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden min-h-[620px] h-[calc(100vh-140px)]">
            {/* Chat Top Banner */}
            <div className="px-5 py-3.5 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                </span>
                <span className="text-xs font-semibold text-slate-800">
                  Interactive Knowledge Stream
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-medium bg-white px-2.5 py-1 rounded-lg border border-slate-200/60 shadow-2xs">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                <span>Authoritative Observatory Data</span>
              </div>
            </div>

            {/* Chat Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-50/30">
              <ChatWindow messages={messages} isLoading={isLoading} />
            </div>

            {/* Chat Input Bar */}
            <div className="p-4 bg-white border-t border-slate-100">
              <ChatInput
                onSendMessage={handleSendMessage}
                isLoading={isLoading}
              />
            </div>
          </div>
        </div>

        {/* Global Footer */}
        <footer className="mt-8 pb-6 text-center text-xs text-slate-500 border-t border-slate-200/60 pt-4">
          <div className="flex items-center justify-center gap-1.5">
            <Info className="h-3.5 w-3.5 text-slate-400" />
            <span>
              Nakuru Urban Heat Observatory (2021–2026) · SIUHI describes
              surface thermal conditions, not air temperature.
            </span>
          </div>
        </footer>
      </main>
    </div>
  );
}
