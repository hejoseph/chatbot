import { TestBed } from '@angular/core/testing';
import { ChatService } from './chat.service';
import { Message, ChatSession } from '../models/message.model';

describe('ChatService', () => {
  let service: ChatService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ChatService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should initialize with a default session', (done) => {
    service.sessions$.subscribe(sessions => {
      expect(sessions.length).toBe(1);
      expect(sessions[0].id).toBe('default');
      expect(sessions[0].title).toBe('New Chat');
      expect(sessions[0].isActive).toBe(true);
      expect(sessions[0].messages.length).toBe(1);
      expect(sessions[0].messages[0].isUser).toBe(false);
      done();
    });
  });

  it('should send a user message and generate AI response', (done) => {
    const testMessage = 'Hello, AI!';
    let messageCount = 0;

    service.messages$.subscribe(messages => {
      messageCount++;
      
      if (messageCount === 1) {
        // Initial AI greeting
        expect(messages.length).toBe(1);
        expect(messages[0].isUser).toBe(false);
      } else if (messageCount === 2) {
        // After user message is added
        expect(messages.length).toBe(2);
        expect(messages[1].content).toBe(testMessage);
        expect(messages[1].isUser).toBe(true);
        expect(messages[1].status).toBe('sending');
      } else if (messageCount >= 3) {
        // After AI response is added
        if (messages.length === 3) {
          expect(messages[2].isUser).toBe(false);
          expect(messages[2].content).toBeTruthy();
          done();
        }
      }
    });

    service.sendMessage(testMessage);
  });

  it('should handle typing indicator', (done) => {
    let typingStates: boolean[] = [];

    service.isTyping$.subscribe(isTyping => {
      typingStates.push(isTyping);
      
      if (typingStates.length >= 3) {
        expect(typingStates[0]).toBe(false); // Initial state
        expect(typingStates[1]).toBe(true);  // While AI is typing
        expect(typingStates[2]).toBe(false); // After AI responds
        done();
      }
    });

    service.sendMessage('Test message');
  });

  it('should create a new session', () => {
    const newSessionId = service.createNewSession();
    
    expect(newSessionId).toBeTruthy();
    expect(newSessionId).toContain('session_');

    service.sessions$.subscribe(sessions => {
      expect(sessions.length).toBe(2);
      const newSession = sessions.find(s => s.id === newSessionId);
      expect(newSession).toBeTruthy();
      expect(newSession?.isActive).toBe(true);
      expect(newSession?.messages.length).toBe(1);
    });
  });

  it('should switch between sessions', () => {
    const newSessionId = service.createNewSession();
    
    service.switchToSession('default');
    
    service.sessions$.subscribe(sessions => {
      const defaultSession = sessions.find(s => s.id === 'default');
      const newSession = sessions.find(s => s.id === newSessionId);
      
      expect(defaultSession?.isActive).toBe(true);
      expect(newSession?.isActive).toBe(false);
    });
  });

  it('should delete a session', () => {
    const newSessionId = service.createNewSession();
    
    service.deleteSession(newSessionId);
    
    service.sessions$.subscribe(sessions => {
      expect(sessions.length).toBe(1);
      expect(sessions.find(s => s.id === newSessionId)).toBeUndefined();
    });
  });

  it('should clear current chat', () => {
    service.sendMessage('Test message');
    
    setTimeout(() => {
      service.clearCurrentChat();
      
      service.messages$.subscribe(messages => {
        expect(messages.length).toBe(0);
      });
    }, 100);
  });

  it('should trim whitespace from messages', () => {
    const messageWithSpaces = '  Hello World  ';
    
    service.sendMessage(messageWithSpaces);
    
    service.messages$.subscribe(messages => {
      if (messages.length >= 2) {
        const userMessage = messages.find(m => m.isUser);
        expect(userMessage?.content).toBe('Hello World');
      }
    });
  });

  it('should generate session titles from first user message', () => {
    const longMessage = 'This is a very long message that should be truncated when used as a session title';
    
    service.sendMessage(longMessage);
    
    setTimeout(() => {
      service.sessions$.subscribe(sessions => {
        const currentSession = sessions.find(s => s.isActive);
        expect(currentSession?.title).toBe(longMessage.substring(0, 30) + '...');
      });
    }, 100);
  });
});