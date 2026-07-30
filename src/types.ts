export interface Message {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  mode?: 'gemini' | 'local';
  timestamp: Date | string;
  isError?: boolean;
}

export interface StatusState {
  knowledgeConnected: boolean;
  geminiEnabled: boolean;
  mode: 'gemini' | 'local';
  loading: boolean;
}

export interface ChatResponse {
  answer: string;
  mode: 'gemini' | 'local';
  timestamp?: string;
  error?: string;
}
