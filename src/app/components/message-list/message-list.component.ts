import { Component, Input, OnChanges, ViewChild, ElementRef, AfterViewChecked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Message } from '../../models/message.model';
import { MessageBubbleComponent } from '../message-bubble/message-bubble.component';
import { TypingIndicatorComponent } from '../typing-indicator/typing-indicator.component';

@Component({
  selector: 'app-message-list',
  standalone: true,
  imports: [CommonModule, MessageBubbleComponent, TypingIndicatorComponent],
  template: `
    <div class="message-list" #messageContainer>
      <div class="messages-container">
        <div class="messages-content">
          @if (messages.length === 0) {
            <div class="empty-state">
              <div class="empty-icon">
                <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
                  <circle cx="32" cy="32" r="24" stroke="currentColor" stroke-width="2" fill="none"/>
                  <path d="M24 32c0-4.4 3.6-8 8-8s8 3.6 8 8" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                  <circle cx="26" cy="28" r="2" fill="currentColor"/>
                  <circle cx="38" cy="28" r="2" fill="currentColor"/>
                </svg>
              </div>
              <h3 class="empty-title">Start a conversation</h3>
              <p class="empty-description">Send a message to begin chatting with your AI assistant.</p>
            </div>
          } @else {
            @for (message of messages; track message.id) {
              <app-message-bubble [message]="message"></app-message-bubble>
            }
          }
          
          @if (isTyping) {
            <app-typing-indicator></app-typing-indicator>
          }
        </div>
      </div>
    </div>
  `,
  styles: [`
    .message-list {
      flex: 1;
      overflow-y: auto;
      overflow-x: hidden;
      background: var(--background-primary);
      position: relative;
    }

    .messages-container {
      min-height: 100%;
      display: flex;
      flex-direction: column;
      justify-content: flex-end;
    }

    .messages-content {
      padding: var(--spacing-lg) var(--spacing-md);
      display: flex;
      flex-direction: column;
      gap: var(--spacing-md);
      max-width: 800px;
      margin: 0 auto;
      width: 100%;
    }

    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      text-align: center;
      padding: var(--spacing-xxl);
      margin: auto;
      max-width: 400px;
    }

    .empty-icon {
      color: var(--text-tertiary);
      margin-bottom: var(--spacing-lg);
      opacity: 0.6;
    }

    .empty-title {
      font-size: var(--font-size-title);
      font-weight: 600;
      color: var(--text-primary);
      margin: 0 0 var(--spacing-sm) 0;
    }

    .empty-description {
      font-size: var(--font-size-body);
      color: var(--text-secondary);
      margin: 0;
      line-height: 1.5;
    }

    /* Custom scrollbar */
    .message-list::-webkit-scrollbar {
      width: 6px;
    }

    .message-list::-webkit-scrollbar-track {
      background: transparent;
    }

    .message-list::-webkit-scrollbar-thumb {
      background: var(--apple-gray);
      border-radius: 3px;
    }

    .message-list::-webkit-scrollbar-thumb:hover {
      background: var(--apple-gray-dark);
    }

    @media (max-width: 768px) {
      .messages-content {
        padding: var(--spacing-md) var(--spacing-sm);
      }
      
      .empty-state {
        padding: var(--spacing-lg);
      }
      
      .empty-title {
        font-size: var(--font-size-headline);
      }
    }
  `]
})
export class MessageListComponent implements OnChanges, AfterViewChecked {
  @Input() messages: Message[] = [];
  @Input() isTyping = false;
  @ViewChild('messageContainer') private messageContainer!: ElementRef;

  private shouldScrollToBottom = false;

  ngOnChanges(): void {
    this.shouldScrollToBottom = true;
  }

  ngAfterViewChecked(): void {
    if (this.shouldScrollToBottom) {
      this.scrollToBottom();
      this.shouldScrollToBottom = false;
    }
  }

  private scrollToBottom(): void {
    try {
      const element = this.messageContainer.nativeElement;
      element.scrollTop = element.scrollHeight;
    } catch (err) {
      console.error('Error scrolling to bottom:', err);
    }
  }
}