import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, delay, of } from 'rxjs';
import { Message, ChatSession } from '../models/message.model';
import { IndexedDBService } from './indexeddb.service';
import { LLMApiKey } from '../components/settings-modal/settings-modal.component';

@Injectable({
  providedIn: 'root'
})
export class ChatService {
  private messagesSubject = new BehaviorSubject<Message[]>([]);
  private typingSubject = new BehaviorSubject<boolean>(false);
  private sessionsSubject = new BehaviorSubject<ChatSession[]>([]);

  messages$ = this.messagesSubject.asObservable();
  isTyping$ = this.typingSubject.asObservable();
  sessions$ = this.sessionsSubject.asObservable();

  private currentSessionId = 'default';
  private messageIdCounter = 1;
  private selectedLLM: LLMApiKey | null = null;

  constructor(private indexedDBService: IndexedDBService) {
    this.initializeApp();
  }

  private async initializeApp(): Promise<void> {
    try {
      // Load existing sessions from IndexedDB
      const savedSessions = await this.indexedDBService.loadSessions();
      
      if (savedSessions.length > 0) {
        // Restore sessions from storage
        this.sessionsSubject.next(savedSessions);
        
        // Find the active session or use the first one
        const activeSession = savedSessions.find(s => s.isActive) || savedSessions[0];
        this.currentSessionId = activeSession.id;
        this.messagesSubject.next(activeSession.messages);
        
        // Update message ID counter to avoid conflicts
        const allMessages = savedSessions.flatMap(s => s.messages);
        const maxId = Math.max(...allMessages.map(m => parseInt(m.id) || 0), 0);
        this.messageIdCounter = maxId;
      } else {
        // No saved sessions, create default
        this.initializeDefaultSession();
      }
    } catch (error) {
      console.error('Error loading sessions from IndexedDB:', error);
      // Fallback to default session
      this.initializeDefaultSession();
    }
  }

  private initializeDefaultSession(): void {
    const defaultSession: ChatSession = {
      id: 'default',
      title: 'New Chat',
      messages: [
        {
          id: '1',
          content: 'Hello! I\'m your AI assistant. How can I help you today?',
          timestamp: new Date(),
          isUser: false,
          status: 'read'
        }
      ],
      lastActivity: new Date(),
      isActive: true
    };

    this.sessionsSubject.next([defaultSession]);
    this.messagesSubject.next(defaultSession.messages);
    
    // Save to IndexedDB
    this.saveSessionsToStorage();
  }

  sendMessage(content: string): void {
    const userMessage: Message = {
      id: (++this.messageIdCounter).toString(),
      content: content.trim(),
      timestamp: new Date(),
      isUser: true,
      status: 'sending'
    };

    // Add user message
    const currentMessages = this.messagesSubject.value;
    this.messagesSubject.next([...currentMessages, userMessage]);

    // Update message status to sent
    setTimeout(() => {
      this.updateMessageStatus(userMessage.id, 'sent');
    }, 500);

    // Simulate AI typing
    this.typingSubject.next(true);

    // Generate AI response using selected LLM
    this.generateAIResponse(content).subscribe({
      next: (response) => {
        this.typingSubject.next(false);
        
        const aiMessage: Message = {
          id: (++this.messageIdCounter).toString(),
          content: response,
          timestamp: new Date(),
          isUser: false,
          status: 'read'
        };

        const updatedMessages = this.messagesSubject.value;
        this.messagesSubject.next([...updatedMessages, aiMessage]);
        
        // Update session
        this.updateCurrentSession();
      },
      error: (error) => {
        this.typingSubject.next(false);
        
        const errorMessage: Message = {
          id: (++this.messageIdCounter).toString(),
          content: `Sorry, I encountered an error: ${error.message || 'Unable to generate response'}. Please check your API key configuration.`,
          timestamp: new Date(),
          isUser: false,
          status: 'read'
        };

        const updatedMessages = this.messagesSubject.value;
        this.messagesSubject.next([...updatedMessages, errorMessage]);
        
        // Update session
        this.updateCurrentSession();
      }
    });
  }

  deleteMessage(messageId: string): void {
    const currentMessages = this.messagesSubject.value;
    const updatedMessages = currentMessages.filter(m => m.id !== messageId);
    this.messagesSubject.next(updatedMessages);
    this.updateCurrentSession();
  }

  private generateAIResponse(userMessage: string): Observable<string> {
    if (!this.selectedLLM) {
      return of("Please select an LLM from the dropdown in the header before sending messages.").pipe(delay(500));
    }

    if (this.selectedLLM.provider === 'Google Gemini Flash 2.5' || this.selectedLLM.provider === 'Google Gemini') {
      return this.callGoogleGeminiAPI(userMessage);
    } else if (this.selectedLLM.provider === 'OpenAI') {
      return this.callOpenAIAPI(userMessage);
    } else if (this.selectedLLM.provider === 'Anthropic') {
      return this.callAnthropicAPI(userMessage);
    } else {
      // Fallback for other providers
      return this.simulateAIResponse(userMessage);
    }
  }

  private callGoogleGeminiAPI(userMessage: string): Observable<string> {
    return new Observable(observer => {
      const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${this.selectedLLM!.apiKey}`;
      
      fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: userMessage
            }]
          }],
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 1024,
          }
        })
      })
      .then(response => {
        if (!response.ok) {
          throw new Error(`API request failed: ${response.status} ${response.statusText}`);
        }
        return response.json();
      })
      .then(data => {
        if (data.candidates && data.candidates[0] && data.candidates[0].content) {
          const responseText = data.candidates[0].content.parts[0].text;
          observer.next(responseText);
        } else {
          throw new Error('Invalid response format from Google Gemini API');
        }
        observer.complete();
      })
      .catch(error => {
        console.error('Google Gemini API error:', error);
        observer.error(error);
      });
    });
  }

  private callOpenAIAPI(userMessage: string): Observable<string> {
    return new Observable(observer => {
      fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.selectedLLM!.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: [
            { role: 'user', content: userMessage }
          ],
          max_tokens: 1024,
          temperature: 0.7
        })
      })
      .then(response => {
        if (!response.ok) {
          throw new Error(`OpenAI API request failed: ${response.status} ${response.statusText}`);
        }
        return response.json();
      })
      .then(data => {
        if (data.choices && data.choices[0] && data.choices[0].message) {
          observer.next(data.choices[0].message.content);
        } else {
          throw new Error('Invalid response format from OpenAI API');
        }
        observer.complete();
      })
      .catch(error => {
        console.error('OpenAI API error:', error);
        observer.error(error);
      });
    });
  }

  private callAnthropicAPI(userMessage: string): Observable<string> {
    return new Observable(observer => {
      fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': this.selectedLLM!.apiKey,
          'Content-Type': 'application/json',
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: 'claude-3-haiku-20240307',
          max_tokens: 1024,
          messages: [{
            role: 'user',
            content: userMessage
          }]
        })
      })
      .then(response => {
        if (!response.ok) {
          throw new Error(`Anthropic API request failed: ${response.status} ${response.statusText}`);
        }
        return response.json();
      })
      .then(data => {
        if (data.content && data.content[0] && data.content[0].text) {
          observer.next(data.content[0].text);
        } else {
          throw new Error('Invalid response format from Anthropic API');
        }
        observer.complete();
      })
      .catch(error => {
        console.error('Anthropic API error:', error);
        observer.error(error);
      });
    });
  }

  private simulateAIResponse(userMessage: string): Observable<string> {
    const responses = [
      "That's an interesting question! Let me think about that for a moment.",
      "I understand what you're asking. Here's what I think...",
      "Great question! Based on what you've shared, I'd suggest...",
      "I can help you with that. Let me provide some insights...",
      "That's a thoughtful inquiry. From my perspective...",
      "I appreciate you asking. Here's my take on this...",
      "Excellent point! I'd like to elaborate on that...",
      "I see what you mean. Let me break this down for you...",
      "That's worth exploring further. Consider this...",
      "Interesting perspective! I'd add that..."
    ];

    const randomResponse = responses[Math.floor(Math.random() * responses.length)];
    const processingTime = Math.random() * 2000 + 1000; // 1-3 seconds

    return of(`[Simulated Response] ${randomResponse}`).pipe(delay(processingTime));
  }

  private updateMessageStatus(messageId: string, status: Message['status']): void {
    const messages = this.messagesSubject.value.map(msg => 
      msg.id === messageId ? { ...msg, status } : msg
    );
    this.messagesSubject.next(messages);
  }

  private updateCurrentSession(): void {
    const sessions = this.sessionsSubject.value;
    const currentMessages = this.messagesSubject.value;
    
    const updatedSessions = sessions.map(session => 
      session.id === this.currentSessionId 
        ? { 
            ...session, 
            messages: currentMessages,
            lastActivity: new Date(),
            title: this.generateSessionTitle(currentMessages)
          }
        : session
    );
    
    this.sessionsSubject.next(updatedSessions);
    this.saveSessionsToStorage();
  }

  private async saveSessionsToStorage(): Promise<void> {
    try {
      const sessions = this.sessionsSubject.value;
      await this.indexedDBService.saveSessions(sessions);
    } catch (error) {
      console.error('Error saving sessions to IndexedDB:', error);
    }
  }

  private generateSessionTitle(messages: Message[]): string {
    const userMessages = messages.filter(m => m.isUser);
    if (userMessages.length > 0) {
      const firstUserMessage = userMessages[0].content;
      return firstUserMessage.length > 30 
        ? firstUserMessage.substring(0, 30) + '...'
        : firstUserMessage;
    }
    return 'New Chat';
  }

  createNewSession(): string {
    const newSessionId = `session_${Date.now()}`;
    const newSession: ChatSession = {
      id: newSessionId,
      title: 'New Chat',
      messages: [
        {
          id: (++this.messageIdCounter).toString(),
          content: 'Hello! I\'m your AI assistant. How can I help you today?',
          timestamp: new Date(),
          isUser: false,
          status: 'read'
        }
      ],
      lastActivity: new Date(),
      isActive: true
    };

    const sessions = this.sessionsSubject.value;
    const updatedSessions = sessions.map(s => ({ ...s, isActive: false }));
    this.sessionsSubject.next([...updatedSessions, newSession]);
    
    this.currentSessionId = newSessionId;
    this.messagesSubject.next(newSession.messages);
    
    // Save to IndexedDB
    this.saveSessionsToStorage();
    
    return newSessionId;
  }

  switchToSession(sessionId: string): void {
    const sessions = this.sessionsSubject.value;
    const targetSession = sessions.find(s => s.id === sessionId);
    
    if (targetSession) {
      const updatedSessions = sessions.map(s => ({
        ...s,
        isActive: s.id === sessionId
      }));
      
      this.sessionsSubject.next(updatedSessions);
      this.currentSessionId = sessionId;
      this.messagesSubject.next(targetSession.messages);
      
      // Save to IndexedDB
      this.saveSessionsToStorage();
    }
  }

  async deleteSession(sessionId: string): Promise<void> {
    const sessions = this.sessionsSubject.value;
    const filteredSessions = sessions.filter(s => s.id !== sessionId);
    
    try {
      // Delete from IndexedDB first
      await this.indexedDBService.deleteSession(sessionId);
      
      if (filteredSessions.length === 0) {
        this.initializeDefaultSession();
      } else {
        this.sessionsSubject.next(filteredSessions);
        
        if (this.currentSessionId === sessionId) {
          const newActiveSession = filteredSessions[0];
          this.switchToSession(newActiveSession.id);
        } else {
          // Save remaining sessions
          this.saveSessionsToStorage();
        }
      }
    } catch (error) {
      console.error('Error deleting session from IndexedDB:', error);
      // Continue with in-memory deletion even if IndexedDB fails
      if (filteredSessions.length === 0) {
        this.initializeDefaultSession();
      } else {
        this.sessionsSubject.next(filteredSessions);
        
        if (this.currentSessionId === sessionId) {
          const newActiveSession = filteredSessions[0];
          this.switchToSession(newActiveSession.id);
        }
      }
    }
  }

  clearCurrentChat(): void {
    const sessions = this.sessionsSubject.value;
    const updatedSessions = sessions.map(session => 
      session.id === this.currentSessionId 
        ? { ...session, messages: [] }
        : session
    );
    
    this.sessionsSubject.next(updatedSessions);
    this.messagesSubject.next([]);
    
    // Save to IndexedDB
    this.saveSessionsToStorage();
  }

  // Utility methods for data management
  async exportChatData(): Promise<any> {
    try {
      return await this.indexedDBService.exportData();
    } catch (error) {
      console.error('Error exporting chat data:', error);
      throw error;
    }
  }

  async importChatData(data: any): Promise<void> {
    try {
      await this.indexedDBService.importData(data);
      // Reload the app state
      await this.initializeApp();
    } catch (error) {
      console.error('Error importing chat data:', error);
      throw error;
    }
  }

  async clearAllData(): Promise<void> {
    try {
      await this.indexedDBService.clearAllData();
      // Reset to default state
      this.initializeDefaultSession();
    } catch (error) {
      console.error('Error clearing all data:', error);
      throw error;
    }
  }

  // Get current storage usage info
  async getStorageInfo(): Promise<{ sessions: number, totalMessages: number }> {
    try {
      const sessions = this.sessionsSubject.value;
      const totalMessages = sessions.reduce((total, session) => total + session.messages.length, 0);
      
      return {
        sessions: sessions.length,
        totalMessages
      };
    } catch (error) {
      console.error('Error getting storage info:', error);
      return { sessions: 0, totalMessages: 0 };
    }
  }

  // LLM management methods
  setSelectedLLM(apiKey: LLMApiKey): void {
    this.selectedLLM = apiKey;
    console.log('Selected LLM:', apiKey.name, apiKey.provider);
  }

  getSelectedLLM(): LLMApiKey | null {
    return this.selectedLLM;
  }
}