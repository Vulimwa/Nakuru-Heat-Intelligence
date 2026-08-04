export interface Message {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  mode?: 'openrouter' | 'local';
  timestamp: Date | string;
  isError?: boolean;
}

export interface StatusState {
  knowledgeConnected: boolean;
  llmEnabled: boolean;
  mode: 'openrouter' | 'local';
  loading: boolean;
}

export interface ChatResponse {
  answer: string;
  mode: 'openrouter' | 'local';
  timestamp?: string;
  error?: string;
}
