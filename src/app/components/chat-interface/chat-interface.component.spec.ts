import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ChatInterfaceComponent } from './chat-interface.component';
import { ChatService } from '../../services/chat.service';
import { BehaviorSubject } from 'rxjs';
import { Message, ChatSession } from '../../models/message.model';

describe('ChatInterfaceComponent', () => {
  let component: ChatInterfaceComponent;
  let fixture: ComponentFixture<ChatInterfaceComponent>;
  let mockChatService: jasmine.SpyObj<ChatService>;

  const mockMessages: Message[] = [
    {
      id: '1',
      content: 'Hello!',
      timestamp: new Date(),
      isUser: false,
      status: 'read'
    }
  ];

  const mockSessions: ChatSession[] = [
    {
      id: 'test-session',
      title: 'Test Chat',
      messages: mockMessages,
      lastActivity: new Date(),
      isActive: true
    }
  ];

  beforeEach(async () => {
    const chatServiceSpy = jasmine.createSpyObj('ChatService', [
      'sendMessage',
      'switchToSession',
      'createNewSession',
      'deleteSession',
      'clearCurrentChat'
    ]);

    chatServiceSpy.messages$ = new BehaviorSubject(mockMessages);
    chatServiceSpy.isTyping$ = new BehaviorSubject(false);
    chatServiceSpy.sessions$ = new BehaviorSubject(mockSessions);

    await TestBed.configureTestingModule({
      imports: [ChatInterfaceComponent],
      providers: [
        { provide: ChatService, useValue: chatServiceSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ChatInterfaceComponent);
    component = fixture.componentInstance;
    mockChatService = TestBed.inject(ChatService) as jasmine.SpyObj<ChatService>;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with messages and sessions from service', () => {
    expect(component.messages).toEqual(mockMessages);
    expect(component.sessions).toEqual(mockSessions);
    expect(component.currentSession).toEqual(mockSessions[0]);
  });

  it('should send message when onMessageSent is called', () => {
    const testMessage = 'Test message';
    
    component.onMessageSent(testMessage);
    
    expect(mockChatService.sendMessage).toHaveBeenCalledWith(testMessage);
  });

  it('should not send empty message', () => {
    component.onMessageSent('   ');
    
    expect(mockChatService.sendMessage).not.toHaveBeenCalled();
  });

  it('should switch session when onSessionSelected is called', () => {
    const sessionId = 'test-session-id';
    
    component.onSessionSelected(sessionId);
    
    expect(mockChatService.switchToSession).toHaveBeenCalledWith(sessionId);
    expect(component.sidebarVisible).toBe(false);
  });

  it('should create new chat when onNewChat is called', () => {
    component.onNewChat();
    
    expect(mockChatService.createNewSession).toHaveBeenCalled();
    expect(component.sidebarVisible).toBe(false);
  });

  it('should delete session when onSessionDeleted is called', () => {
    const sessionId = 'test-session-id';
    
    component.onSessionDeleted(sessionId);
    
    expect(mockChatService.deleteSession).toHaveBeenCalledWith(sessionId);
  });

  it('should clear chat when onClearChat is called', () => {
    component.onClearChat();
    
    expect(mockChatService.clearCurrentChat).toHaveBeenCalled();
  });

  it('should toggle sidebar visibility', () => {
    expect(component.sidebarVisible).toBe(false);
    
    component.toggleSidebar();
    expect(component.sidebarVisible).toBe(true);
    
    component.toggleSidebar();
    expect(component.sidebarVisible).toBe(false);
  });

  it('should update typing state from service', () => {
    const typingSubject = mockChatService.isTyping$ as BehaviorSubject<boolean>;
    
    typingSubject.next(true);
    expect(component.isTyping).toBe(true);
    
    typingSubject.next(false);
    expect(component.isTyping).toBe(false);
  });
});