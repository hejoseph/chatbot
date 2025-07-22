import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Message } from '../../models/message.model';

@Component({
  selector: 'app-message-bubble',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="message-wrapper" [class.user-message]="message.isUser">
      <div class="message-bubble" [class.user-bubble]="message.isUser" [class.ai-bubble]="!message.isUser">
        <div class="message-content">
          {{ message.content }}
        </div>
        
        <div class="message-meta">
          <span class="message-time">{{ formatTime(message.timestamp) }}</span>
          @if (message.isUser && message.status) {
            <span class="message-status" [class]="'status-' + message.status">
              @switch (message.status) {
                @case ('sending') {
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <circle cx="6" cy="6" r="1" fill="currentColor">
                      <animate attributeName="opacity" values="1;0;1" dur="1s" repeatCount="indefinite"/>
                    </circle>
                  </svg>
                }
                @case ('sent') {
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <path d="M2 6l3 3 5-6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                }
                @case ('delivered') {
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <path d="M1 6l2 2 4-4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                    <path d="M5 6l2 2 4-4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                }
                @case ('read') {
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <path d="M1 6l2 2 4-4" stroke="var(--apple-blue)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                    <path d="M5 6l2 2 4-4" stroke="var(--apple-blue)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                }
                @case ('error') {
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <circle cx="6" cy="6" r="5" stroke="var(--apple-red)" stroke-width="1.5" fill="none"/>
                    <path d="M6 3v3M6 8h.01" stroke="var(--apple-red)" stroke-width="1.5" stroke-linecap="round"/>
                  </svg>
                }
              }
            </span>
          }
        </div>
      </div>
    </div>
  `,
  styles: [`
    .message-wrapper {
      display: flex;
      margin-bottom: var(--spacing-md);
      animation: messageSlideIn 0.3s cubic-bezier(0.4, 0.0, 0.2, 1);
    }

    .message-wrapper.user-message {
      justify-content: flex-end;
    }

    .message-bubble {
      max-width: 70%;
      min-width: 120px;
      padding: var(--spacing-md) var(--spacing-md);
      border-radius: var(--radius-lg);
      position: relative;
      word-wrap: break-word;
      box-shadow: var(--shadow-sm);
    }

    .user-bubble {
      background: var(--apple-blue);
      color: white;
      border-bottom-right-radius: var(--radius-sm);
    }

    .ai-bubble {
      background: var(--background-secondary);
      color: var(--text-primary);
      border-bottom-left-radius: var(--radius-sm);
      border: 1px solid var(--separator);
    }

    .message-content {
      font-size: var(--font-size-body);
      line-height: 1.4;
      margin-bottom: var(--spacing-xs);
      white-space: pre-wrap;
    }

    .message-meta {
      display: flex;
      align-items: center;
      justify-content: flex-end;
      gap: var(--spacing-xs);
      margin-top: var(--spacing-xs);
    }

    .message-time {
      font-size: var(--font-size-caption);
      opacity: 0.7;
      font-weight: 400;
    }

    .user-bubble .message-time {
      color: rgba(255, 255, 255, 0.8);
    }

    .ai-bubble .message-time {
      color: var(--text-tertiary);
    }

    .message-status {
      display: flex;
      align-items: center;
      opacity: 0.8;
    }

    .status-sending {
      color: rgba(255, 255, 255, 0.6);
    }

    .status-sent {
      color: rgba(255, 255, 255, 0.8);
    }

    .status-delivered {
      color: rgba(255, 255, 255, 0.8);
    }

    .status-read {
      color: var(--apple-blue-light);
    }

    .status-error {
      color: var(--apple-red);
    }

    @keyframes messageSlideIn {
      from {
        opacity: 0;
        transform: translateY(10px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    @media (max-width: 768px) {
      .message-bubble {
        max-width: 85%;
        padding: var(--spacing-sm) var(--spacing-md);
      }
      
      .message-content {
        font-size: var(--font-size-callout);
      }
    }
  `]
})
export class MessageBubbleComponent {
  @Input() message!: Message;

  formatTime(timestamp: Date): string {
    return timestamp.toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false 
    });
  }
}