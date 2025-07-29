import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, delay, of } from 'rxjs';
import { Message, ChatSession, SummaryMetadata, SessionSummaryState } from '../models/message.model';
import { IndexedDBService } from './indexeddb.service';
import { LLMApiKey } from '../components/settings-modal/settings-modal.component';

interface SummarizationAnalysis {
  needsNewSummary: boolean;
  existingSummary: Message | null;
  messagesToSummarize: Message[];
  recentMessages: Message[];
  totalMessagesCount: number;
}

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
      isActive: true,
      summaryState: this.initializeSummaryState()
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

    if (this.selectedLLM.provider === 'Google Gemini') {
      return this.callGoogleGeminiAPI(userMessage);
    } else if (this.selectedLLM.provider === 'OpenAI') {
      return this.callOpenAIAPI(userMessage);
    } else if (this.selectedLLM.provider === 'Anthropic') {
      return this.callAnthropicAPI(userMessage);
    } else if (this.selectedLLM.provider === 'Puter.com') {
      return this.callPuterAPI(userMessage);
    } else {
      // Fallback for other providers
      return this.simulateAIResponse(userMessage);
    }
  }

  private callGoogleGeminiAPI(userMessage: string): Observable<string> {
    return new Observable(observer => {
      // Use the selected model or default to gemini-2.5-flash
      const model = this.selectedLLM!.model || 'gemini-2.5-flash';
      const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${this.selectedLLM!.apiKey}`;
      
      // Build conversation history for context
      const conversationHistory = this.buildConversationHistory(userMessage);
      
      fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: conversationHistory,
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
      // Build optimized conversation history for Claude models
      this.buildOptimizedConversationHistory(userMessage, 'anthropic').subscribe({
        next: (messages) => {
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
              messages: messages
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
        },
        error: (error) => {
          console.error('Error building conversation history:', error);
          // Fallback to simple message
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
        }
      });
    });
  }

  private callPuterAPI(userMessage: string): Observable<string> {
    return new Observable(observer => {
      const model = this.selectedLLM!.model || 'claude-sonnet-4';
      
      // Build conversation history for context (with Claude optimization if applicable)
      this.buildOptimizedConversationHistory(userMessage, 'puter').subscribe({
        next: (conversationHistory) => {
          puter.ai.chat(conversationHistory, { model: model })
            .then((response: any) => {
              const responseText = response?.message?.content?.[0]?.text || '';
              observer.next(responseText);
              observer.complete();
            })
            .catch((error: any) => {
              console.error('Puter.com API error:', error);
              observer.error(error);
            });
        },
        error: (error) => {
          console.error('Error building conversation history:', error);
          // Fallback to original method
          const conversationHistory = this.buildPuterConversationHistory(userMessage);
          puter.ai.chat(conversationHistory, { model: model })
            .then((response: any) => {
              const responseText = response?.message?.content?.[0]?.text || '';
              observer.next(responseText);
              observer.complete();
            })
            .catch((error: any) => {
              console.error('Puter.com API error:', error);
              observer.error(error);
            });
        }
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

  private buildConversationHistory(currentUserMessage: string): any[] {
    const currentMessages = this.messagesSubject.value;
    const conversationHistory: any[] = [];
    
    // Add previous messages to conversation history (excluding the current user message)
    for (const message of currentMessages) {
      // Skip typing indicators and messages with errors
      if (message.isTyping || message.status === 'error') {
        continue;
      }
      
      conversationHistory.push({
        role: message.isUser ? 'user' : 'model',
        parts: [{
          text: message.content
        }]
      });
    }
    
    // Add the current user message
    conversationHistory.push({
      role: 'user',
      parts: [{
        text: currentUserMessage
      }]
    });
    
    return conversationHistory;
  }

  private buildPuterConversationHistory(currentUserMessage: string): any[] {
    const currentMessages = this.messagesSubject.value;
    const conversationHistory: any[] = [];
    
    // Add previous messages to conversation history (excluding the current user message)
    for (const message of currentMessages) {
      // Skip typing indicators and messages with errors
      if (message.isTyping || message.status === 'error') {
        continue;
      }
      
      conversationHistory.push({
        role: message.isUser ? 'user' : 'assistant',
        content: message.content
      });
    }
    
    // Add the current user message
    conversationHistory.push({
      role: 'user',
      content: currentUserMessage
    });
    
    return conversationHistory;
  }

  private buildOptimizedConversationHistory(currentUserMessage: string, apiType: 'puter' | 'anthropic'): Observable<any[]> {
    return new Observable(observer => {
      const model = this.selectedLLM?.model || '';
      const isClaudeModel = this.isClaudeModel(model);
      const optimizationEnabled = this.isClaudeOptimizationEnabled();
      
      if (!isClaudeModel || !optimizationEnabled) {
        // For non-Claude models, use the original method
        if (apiType === 'puter') {
          observer.next(this.buildPuterConversationHistory(currentUserMessage));
        } else {
          observer.next(this.buildAnthropicConversationHistory(currentUserMessage));
        }
        observer.complete();
        return;
      }

      const currentMessages = this.messagesSubject.value;
      const validMessages = currentMessages.filter(m => !m.isTyping && m.status !== 'error');
      
      // Get user-configured optimization settings
      const optimizationSettings = this.getOptimizationSettings();
      
      // If we have fewer messages than trigger threshold, send all
      if (validMessages.length <= optimizationSettings.trigger) {
        if (apiType === 'puter') {
          observer.next(this.buildPuterConversationHistory(currentUserMessage));
        } else {
          observer.next(this.buildAnthropicConversationHistory(currentUserMessage));
        }
        observer.complete();
        return;
      }

      // Use sophisticated summary management
      this.buildIntelligentConversationHistory(validMessages, currentUserMessage, optimizationSettings, apiType).subscribe({
        next: (optimizedHistory) => {
          observer.next(optimizedHistory);
          observer.complete();
        },
        error: (error) => {
          console.error('Intelligent summarization failed, using fallback:', error);
          // Fallback to full history
          if (apiType === 'puter') {
            observer.next(this.buildPuterConversationHistory(currentUserMessage));
          } else {
            observer.next(this.buildAnthropicConversationHistory(currentUserMessage));
          }
          observer.complete();
        }
      });
    });
  }

  private buildAnthropicConversationHistory(currentUserMessage: string): any[] {
    const currentMessages = this.messagesSubject.value;
    const conversationHistory: any[] = [];
    
    // Add previous messages to conversation history (excluding the current user message)
    for (const message of currentMessages) {
      // Skip typing indicators and messages with errors
      if (message.isTyping || message.status === 'error') {
        continue;
      }
      
      conversationHistory.push({
        role: message.isUser ? 'user' : 'assistant',
        content: message.content
      });
    }
    
    // Add the current user message
    conversationHistory.push({
      role: 'user',
      content: currentUserMessage
    });
    
    return conversationHistory;
  }

  private buildIntelligentConversationHistory(
    validMessages: Message[], 
    currentUserMessage: string, 
    optimizationSettings: { trigger: number, keep: number },
    apiType: 'puter' | 'anthropic'
  ): Observable<any[]> {
    return new Observable(observer => {
      const currentSession = this.getCurrentSession();
      const summaryState = currentSession?.summaryState || this.initializeSummaryState();
      
      // Analyze what needs to be summarized
      const analysis = this.analyzeSummarizationNeeds(validMessages, summaryState, optimizationSettings);
      
      if (analysis.needsNewSummary) {
        this.createIncrementalSummary(analysis, apiType).subscribe({
          next: (newSummaryMessage) => {
            // Update the session with the new summary
            this.updateSessionWithSummary(newSummaryMessage, analysis);
            
            // Build the optimized history
            const optimizedHistory = this.buildHistoryWithSummary(
              newSummaryMessage, 
              analysis.recentMessages, 
              currentUserMessage, 
              apiType
            );
            
            observer.next(optimizedHistory);
            observer.complete();
          },
          error: (error) => {
            console.error('Incremental summarization failed:', error);
            observer.error(error);
          }
        });
      } else {
        // Use existing summary if available
        const optimizedHistory = this.buildHistoryWithExistingSummary(
          validMessages,
          currentUserMessage,
          optimizationSettings,
          apiType
        );
        
        observer.next(optimizedHistory);
        observer.complete();
      }
    });
  }

  private getCurrentSession(): ChatSession | null {
    const sessions = this.sessionsSubject.value;
    return sessions.find(s => s.id === this.currentSessionId) || null;
  }

  private initializeSummaryState(): SessionSummaryState {
    return {
      lastSummarizedMessageId: null,
      totalSummarizedMessages: 0,
      summaryVersion: 0,
      lastOptimizationAt: null
    };
  }

  private analyzeSummarizationNeeds(
    validMessages: Message[], 
    summaryState: SessionSummaryState,
    optimizationSettings: { trigger: number, keep: number }
  ): SummarizationAnalysis {
    const totalCount = validMessages.length;
    const recentMessages = validMessages.slice(-optimizationSettings.keep);
    
    // Use cached summary instead of looking in display messages
    const existingSummary = summaryState.cachedSummary || null;
    
    // Determine if we need a new summary
    let needsNewSummary = false;
    let messagesToSummarize: Message[] = [];
    
    if (!existingSummary) {
      // No existing summary, need to create one
      const messagesToSummarizeCount = totalCount - optimizationSettings.keep;
      if (messagesToSummarizeCount > 0) {
        needsNewSummary = true;
        messagesToSummarize = validMessages.slice(0, messagesToSummarizeCount);
      }
    } else {
      // Check if we have enough new messages since last summary to warrant a new one
      const lastSummarizedId = summaryState.lastSummarizedMessageId;
      const lastSummarizedIndex = lastSummarizedId ? 
        validMessages.findIndex(m => m.id === lastSummarizedId) : -1;
      
      const messagesSinceSummary = lastSummarizedIndex >= 0 ? 
        validMessages.slice(lastSummarizedIndex + 1) : validMessages;
      const nonRecentMessagesSinceSummary = messagesSinceSummary.slice(0, -optimizationSettings.keep);
      
      // Create new summary if we have enough non-recent messages since last summary
      if (nonRecentMessagesSinceSummary.length >= optimizationSettings.trigger / 2) {
        needsNewSummary = true;
        // Include the content that was previously summarized plus new messages to summarize
        const previouslySummarizedIds = existingSummary.summaryMetadata?.originalMessageIds || [];
        messagesToSummarize = [
          ...validMessages.filter(m => previouslySummarizedIds.includes(m.id)),
          ...nonRecentMessagesSinceSummary
        ];
      }
    }
    
    return {
      needsNewSummary,
      existingSummary,
      messagesToSummarize,
      recentMessages,
      totalMessagesCount: totalCount
    };
  }

  private createIncrementalSummary(
    analysis: SummarizationAnalysis,
    apiType: 'puter' | 'anthropic'
  ): Observable<Message> {
    return new Observable(observer => {
      if (analysis.messagesToSummarize.length === 0) {
        observer.error(new Error('No messages to summarize'));
        return;
      }

      // Create enhanced summarization prompt
      const conversationText = analysis.messagesToSummarize
        .filter(m => !m.isSummary) // Don't include existing summaries in the text
        .map(m => `${m.isUser ? 'User' : 'Assistant'}: ${m.content}`)
        .join('\n\n');

      const existingSummaryText = analysis.existingSummary ? 
        `Previous summary: ${analysis.existingSummary.content}\n\n` : '';

      const enhancedPrompt = `${existingSummaryText}Please create a comprehensive summary of the following conversation, incorporating any previous summary context. Focus on:
- Key topics and themes discussed
- Important decisions or conclusions reached
- User preferences or requirements mentioned
- Technical details or specifications
- Any ongoing tasks or follow-ups
- Context that would be valuable for continuing the conversation

Keep the summary concise but comprehensive (under 300 words):

${conversationText}

Summary:`;

      const summaryHistory = [{ role: 'user', content: enhancedPrompt }];
      
      if (this.selectedLLM?.provider === 'Puter.com') {
        puter.ai.chat(summaryHistory, { model: this.selectedLLM.model })
          .then((response: any) => {
            const summaryContent = response?.message?.content?.[0]?.text || '';
            const summaryMessage = this.createSummaryMessage(summaryContent, analysis);
            observer.next(summaryMessage);
            observer.complete();
          })
          .catch((error: any) => {
            console.error('Puter summarization error:', error);
            observer.error(error);
          });
      } else if (this.selectedLLM?.provider === 'Anthropic') {
        fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'x-api-key': this.selectedLLM.apiKey,
            'Content-Type': 'application/json',
            'anthropic-version': '2023-06-01'
          },
          body: JSON.stringify({
            model: this.selectedLLM.model || 'claude-3-haiku-20240307',
            max_tokens: 400,
            messages: summaryHistory
          })
        })
        .then(response => {
          if (!response.ok) {
            throw new Error(`Anthropic summarization failed: ${response.status}`);
          }
          return response.json();
        })
        .then(data => {
          const summaryContent = data.content?.[0]?.text || '';
          const summaryMessage = this.createSummaryMessage(summaryContent, analysis);
          observer.next(summaryMessage);
          observer.complete();
        })
        .catch(error => {
          console.error('Anthropic summarization error:', error);
          observer.error(error);
        });
      } else {
        observer.error(new Error('Unsupported provider for summarization'));
      }
    });
  }

  private createSummaryMessage(summaryContent: string, analysis: SummarizationAnalysis): Message {
    const originalMessageIds = analysis.messagesToSummarize
      .filter((m: Message) => !m.isSummary)
      .map((m: Message) => m.id);
    
    const summaryMetadata: SummaryMetadata = {
      originalMessageIds,
      summaryVersion: (analysis.existingSummary?.summaryMetadata?.summaryVersion || 0) + 1,
      createdAt: new Date(),
      messageCount: originalMessageIds.length,
      tokenEstimate: Math.ceil(summaryContent.length / 4) // Rough token estimate
    };

    return {
      id: `summary_${Date.now()}`,
      content: summaryContent,
      timestamp: new Date(),
      isUser: false,
      status: 'read',
      isSummary: true,
      summaryMetadata
    };
  }

  private updateSessionWithSummary(summaryMessage: Message, analysis: SummarizationAnalysis): void {
    const sessions = this.sessionsSubject.value;
    
    // DON'T modify the display messages - user should see full history
    // Only update the session's summary state for API optimization
    const updatedSessions = sessions.map(session => 
      session.id === this.currentSessionId 
        ? { 
            ...session,
            // Keep original messages for display - don't remove anything
            summaryState: {
              lastSummarizedMessageId: analysis.messagesToSummarize[analysis.messagesToSummarize.length - 1]?.id || null,
              totalSummarizedMessages: (session.summaryState?.totalSummarizedMessages || 0) + analysis.messagesToSummarize.filter((m: Message) => !m.isSummary).length,
              summaryVersion: summaryMessage.summaryMetadata!.summaryVersion,
              lastOptimizationAt: new Date(),
              cachedSummary: summaryMessage // Store summary for API use only
            }
          }
        : session
    );
    
    this.sessionsSubject.next(updatedSessions);
    // DON'T update messagesSubject - keep original messages for display
    this.saveSessionsToStorage();
  }

  private buildHistoryWithSummary(
    summaryMessage: Message,
    recentMessages: Message[],
    currentUserMessage: string,
    apiType: 'puter' | 'anthropic'
  ): any[] {
    const optimizedHistory: any[] = [];
    
    // Add summary as context
    optimizedHistory.push({
      role: 'assistant',
      content: `[Conversation Summary: ${summaryMessage.content}]`
    });
    
    // Add recent messages
    for (const message of recentMessages) {
      if (!message.isSummary) {
        optimizedHistory.push({
          role: message.isUser ? 'user' : 'assistant',
          content: message.content
        });
      }
    }
    
    // Add current user message
    optimizedHistory.push({
      role: 'user',
      content: currentUserMessage
    });
    
    return optimizedHistory;
  }

  private buildHistoryWithExistingSummary(
    validMessages: Message[],
    currentUserMessage: string,
    optimizationSettings: { trigger: number, keep: number },
    apiType: 'puter' | 'anthropic'
  ): any[] {
    const optimizedHistory: any[] = [];
    const currentSession = this.getCurrentSession();
    const cachedSummary = currentSession?.summaryState?.cachedSummary;
    const recentMessages = validMessages.slice(-optimizationSettings.keep);
    
    // Add cached summary if available (not from display messages)
    if (cachedSummary) {
      optimizedHistory.push({
        role: 'assistant',
        content: `[Conversation Summary: ${cachedSummary.content}]`
      });
    }
    
    // Add recent messages (all messages since they're not summaries in display)
    for (const message of recentMessages) {
      optimizedHistory.push({
        role: message.isUser ? 'user' : 'assistant',
        content: message.content
      });
    }
    
    // Add current user message
    optimizedHistory.push({
      role: 'user',
      content: currentUserMessage
    });
    
    return optimizedHistory;
  }

  private isClaudeModel(model: string): boolean {
    return model.includes('claude-sonnet') || model.includes('claude-opus') || 
           model.includes('claude-3-sonnet') || model.includes('claude-3-opus');
  }

  private summarizeMessages(messages: Message[]): Observable<string> {
    return new Observable(observer => {
      if (messages.length === 0) {
        observer.next('');
        observer.complete();
        return;
      }

      // Build conversation text for summarization
      const conversationText = messages.map(m => 
        `${m.isUser ? 'User' : 'Assistant'}: ${m.content}`
      ).join('\n\n');

      const summarizationPrompt = `Please provide a concise summary of the following conversation, focusing on key topics, decisions, and important context that would be relevant for continuing the conversation. Keep it under 200 words:

${conversationText}

Summary:`;

      // Use the same Claude model for summarization
      const summaryHistory = [{ role: 'user', content: summarizationPrompt }];
      
      if (this.selectedLLM?.provider === 'Puter.com') {
        puter.ai.chat(summaryHistory, { model: this.selectedLLM.model })
          .then((response: any) => {
            const summary = response?.message?.content?.[0]?.text || '';
            observer.next(summary);
            observer.complete();
          })
          .catch((error: any) => {
            console.error('Summarization error:', error);
            observer.error(error);
          });
      } else if (this.selectedLLM?.provider === 'Anthropic') {
        // For direct Anthropic API calls, use the same model for summarization
        fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'x-api-key': this.selectedLLM.apiKey,
            'Content-Type': 'application/json',
            'anthropic-version': '2023-06-01'
          },
          body: JSON.stringify({
            model: this.selectedLLM.model || 'claude-3-haiku-20240307',
            max_tokens: 300,
            messages: summaryHistory
          })
        })
        .then(response => {
          if (!response.ok) {
            throw new Error(`Anthropic summarization failed: ${response.status}`);
          }
          return response.json();
        })
        .then(data => {
          const summary = data.content?.[0]?.text || '';
          observer.next(summary);
          observer.complete();
        })
        .catch(error => {
          console.error('Anthropic summarization error:', error);
          observer.error(error);
        });
      } else {
        // For other providers, return empty summary
        observer.next('');
        observer.complete();
      }
    });
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
      isActive: true,
      summaryState: this.initializeSummaryState()
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

  private isClaudeOptimizationEnabled(): boolean {
    const saved = localStorage.getItem('claude-optimization-enabled');
    if (saved !== null) {
      return JSON.parse(saved);
    }
    return true; // Default to enabled
  }

  private getOptimizationSettings(): { trigger: number, keep: number } {
    const savedTrigger = localStorage.getItem('claude-optimization-trigger');
    const savedKeep = localStorage.getItem('claude-optimization-keep');
    
    return {
      trigger: savedTrigger !== null ? JSON.parse(savedTrigger) : 8,
      keep: savedKeep !== null ? JSON.parse(savedKeep) : 6
    };
  }

  // Utility methods for monitoring and managing the sophisticated summary system

  getSummaryStats(): {
    hasSummary: boolean;
    summaryVersion: number;
    totalSummarizedMessages: number;
    lastOptimizationAt: Date | null;
    estimatedTokensSaved: number;
    currentMessageCount: number;
  } {
    const currentSession = this.getCurrentSession();
    const currentMessages = this.messagesSubject.value;
    const cachedSummary = currentSession?.summaryState?.cachedSummary;
    
    const stats = {
      hasSummary: !!cachedSummary,
      summaryVersion: cachedSummary?.summaryMetadata?.summaryVersion || 0,
      totalSummarizedMessages: currentSession?.summaryState?.totalSummarizedMessages || 0,
      lastOptimizationAt: currentSession?.summaryState?.lastOptimizationAt || null,
      estimatedTokensSaved: 0,
      currentMessageCount: currentMessages.filter(m => !m.isTyping && m.status !== 'error').length
    };

    // Estimate tokens saved
    if (cachedSummary && cachedSummary.summaryMetadata) {
      const originalMessageCount = cachedSummary.summaryMetadata.messageCount;
      const summaryTokens = cachedSummary.summaryMetadata.tokenEstimate || 0;
      const estimatedOriginalTokens = originalMessageCount * 50; // Rough estimate
      stats.estimatedTokensSaved = Math.max(0, estimatedOriginalTokens - summaryTokens);
    }

    return stats;
  }

  forceSummaryOptimization(): Observable<boolean> {
    return new Observable(observer => {
      const currentMessages = this.messagesSubject.value;
      const validMessages = currentMessages.filter(m => !m.isTyping && m.status !== 'error');
      const optimizationSettings = this.getOptimizationSettings();

      if (validMessages.length <= optimizationSettings.trigger) {
        observer.next(false);
        observer.complete();
        return;
      }

      this.buildIntelligentConversationHistory(validMessages, '', optimizationSettings, 'anthropic').subscribe({
        next: () => {
          observer.next(true);
          observer.complete();
        },
        error: (error) => {
          console.error('Force optimization failed:', error);
          observer.next(false);
          observer.complete();
        }
      });
    });
  }

  clearSummaryOptimization(): void {
    const sessions = this.sessionsSubject.value;
    
    // Reset summary state only (messages remain unchanged for display)
    const updatedSessions = sessions.map(session => 
      session.id === this.currentSessionId 
        ? { 
            ...session,
            summaryState: this.initializeSummaryState()
          }
        : session
    );
    
    this.sessionsSubject.next(updatedSessions);
    // Don't modify messagesSubject - keep full conversation visible
    this.saveSessionsToStorage();
  }

  updateOptimizationSettings(trigger: number, keep: number): void {
    localStorage.setItem('claude-optimization-trigger', JSON.stringify(trigger));
    localStorage.setItem('claude-optimization-keep', JSON.stringify(keep));
  }

  toggleClaudeOptimization(enabled: boolean): void {
    localStorage.setItem('claude-optimization-enabled', JSON.stringify(enabled));
  }

  // Debug method to inspect summarization state
  debugSummaryState(): any {
    const currentSession = this.getCurrentSession();
    const currentMessages = this.messagesSubject.value;
    const cachedSummary = currentSession?.summaryState?.cachedSummary;
    
    return {
      sessionSummaryState: currentSession?.summaryState,
      cachedSummary: cachedSummary ? {
        id: cachedSummary.id,
        content: cachedSummary.content.substring(0, 100) + '...',
        metadata: cachedSummary.summaryMetadata
      } : null,
      displayMessages: {
        total: currentMessages.length,
        valid: currentMessages.filter(m => !m.isTyping && m.status !== 'error').length,
        hasSummaryInDisplay: currentMessages.some(m => m.isSummary) // Should be false
      },
      optimizationSettings: this.getOptimizationSettings(),
      isClaudeModel: this.isClaudeModel(this.selectedLLM?.model || ''),
      optimizationEnabled: this.isClaudeOptimizationEnabled()
    };
  }
}