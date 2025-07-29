export interface Message {
  id: string;
  content: string;
  timestamp: Date;
  isUser: boolean;
  isTyping?: boolean;
  status?: 'sending' | 'sent' | 'delivered' | 'read' | 'error' | 'reading';
  isSummary?: boolean;
  summaryMetadata?: SummaryMetadata;
}

export interface SummaryMetadata {
  originalMessageIds: string[];
  summaryVersion: number;
  createdAt: Date;
  messageCount: number;
  tokenEstimate?: number;
}

export interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  lastActivity: Date;
  isActive: boolean;
  summaryState?: SessionSummaryState;
}

export interface SessionSummaryState {
  lastSummarizedMessageId: string | null;
  totalSummarizedMessages: number;
  summaryVersion: number;
  lastOptimizationAt: Date | null;
  cachedSummary?: Message; // Store summary for API use only, not for display
}