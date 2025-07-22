export interface Message {
  id: string;
  content: string;
  timestamp: Date;
  isUser: boolean;
  isTyping?: boolean;
  status?: 'sending' | 'sent' | 'delivered' | 'read' | 'error';
}

export interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  lastActivity: Date;
  isActive: boolean;
}