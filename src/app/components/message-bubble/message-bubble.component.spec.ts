import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MessageBubbleComponent } from './message-bubble.component';
import { Message } from '../../models/message.model';

describe('MessageBubbleComponent', () => {
  let component: MessageBubbleComponent;
  let fixture: ComponentFixture<MessageBubbleComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MessageBubbleComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(MessageBubbleComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should display user message correctly', () => {
    const userMessage: Message = {
      id: '1',
      content: 'Hello, AI!',
      timestamp: new Date(),
      isUser: true,
      status: 'sent'
    };

    component.message = userMessage;
    fixture.detectChanges();

    const messageWrapper = fixture.nativeElement.querySelector('.message-wrapper');
    const messageBubble = fixture.nativeElement.querySelector('.message-bubble');
    const messageContent = fixture.nativeElement.querySelector('.message-content');

    expect(messageWrapper.classList.contains('user-message')).toBe(true);
    expect(messageBubble.classList.contains('user-bubble')).toBe(true);
    expect(messageContent.textContent.trim()).toBe('Hello, AI!');
  });

  it('should display AI message correctly', () => {
    const aiMessage: Message = {
      id: '2',
      content: 'Hello, human!',
      timestamp: new Date(),
      isUser: false
    };

    component.message = aiMessage;
    fixture.detectChanges();

    const messageWrapper = fixture.nativeElement.querySelector('.message-wrapper');
    const messageBubble = fixture.nativeElement.querySelector('.message-bubble');
    const messageContent = fixture.nativeElement.querySelector('.message-content');

    expect(messageWrapper.classList.contains('user-message')).toBe(false);
    expect(messageBubble.classList.contains('ai-bubble')).toBe(true);
    expect(messageContent.textContent.trim()).toBe('Hello, human!');
  });

  it('should format time correctly', () => {
    const testDate = new Date('2024-01-01T14:30:00');
    const formattedTime = component.formatTime(testDate);
    
    expect(formattedTime).toBe('14:30');
  });

  it('should display message status for user messages', () => {
    const userMessage: Message = {
      id: '1',
      content: 'Test message',
      timestamp: new Date(),
      isUser: true,
      status: 'sent'
    };

    component.message = userMessage;
    fixture.detectChanges();

    const statusElement = fixture.nativeElement.querySelector('.message-status');
    expect(statusElement).toBeTruthy();
    expect(statusElement.classList.contains('status-sent')).toBe(true);
  });

  it('should not display status for AI messages', () => {
    const aiMessage: Message = {
      id: '2',
      content: 'AI response',
      timestamp: new Date(),
      isUser: false
    };

    component.message = aiMessage;
    fixture.detectChanges();

    const statusElement = fixture.nativeElement.querySelector('.message-status');
    expect(statusElement).toBeFalsy();
  });

  it('should handle different message statuses', () => {
    const statuses: Array<Message['status']> = ['sending', 'sent', 'delivered', 'read', 'error'];
    
    statuses.forEach(status => {
      const message: Message = {
        id: '1',
        content: 'Test',
        timestamp: new Date(),
        isUser: true,
        status: status
      };

      component.message = message;
      fixture.detectChanges();

      const statusElement = fixture.nativeElement.querySelector('.message-status');
      expect(statusElement.classList.contains(`status-${status}`)).toBe(true);
    });
  });

  it('should preserve line breaks in message content', () => {
    const messageWithLineBreaks: Message = {
      id: '1',
      content: 'Line 1\nLine 2\nLine 3',
      timestamp: new Date(),
      isUser: true
    };

    component.message = messageWithLineBreaks;
    fixture.detectChanges();

    const messageContent = fixture.nativeElement.querySelector('.message-content');
    expect(messageContent.style.whiteSpace).toBe('pre-wrap');
  });
});