import { Component, Input, AfterViewInit, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MarkdownModule } from 'ngx-markdown';
import { Message } from '../../models/message.model';
import { PrismService } from '../../services/prism.service';

@Component({
  selector: 'app-message-bubble',
  standalone: true,
  imports: [CommonModule, MarkdownModule],
  template: `
    <div class="message-wrapper" [class.user-message]="message.isUser">
      <div class="message-bubble" [class.user-bubble]="message.isUser" [class.ai-bubble]="!message.isUser">
        <div class="message-content" #messageContent>
          @if (message.isUser) {
            {{ message.content }}
          } @else {
            <markdown [data]="message.content" (ready)="onMarkdownReady()"></markdown>
          }
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

    /* Markdown styling for AI messages */
    .message-content ::ng-deep {
      h1, h2, h3, h4, h5, h6 {
        margin: 0.5em 0 0.3em 0;
        font-weight: 600;
        line-height: 1.3;
      }
      
      h1 { font-size: 1.4em; }
      h2 { font-size: 1.3em; }
      h3 { font-size: 1.2em; }
      h4 { font-size: 1.1em; }
      h5, h6 { font-size: 1em; }
      
      p {
        margin: 0.5em 0;
        line-height: 1.5;
      }
      
      p:first-child {
        margin-top: 0;
      }
      
      p:last-child {
        margin-bottom: 0;
      }
      
      code {
        background: rgba(0, 0, 0, 0.1);
        padding: 0.2em 0.4em;
        border-radius: 4px;
        font-family: 'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', monospace;
        font-size: 0.9em;
        color: #d73a49;
        font-weight: 500;
      }
      
      pre {
        background: rgba(0, 0, 0, 0.05);
        border: 1px solid rgba(0, 0, 0, 0.1);
        padding: 1em;
        border-radius: 8px;
        overflow-x: auto;
        margin: 0.8em 0;
        position: relative;
      }
      
      pre code {
        background: none;
        padding: 0;
        color: inherit;
        font-weight: normal;
        border-radius: 0;
      }
      
      ul, ol {
        margin: 0.5em 0;
        padding-left: 1.5em;
      }
      
      li {
        margin: 0.2em 0;
      }
      
      blockquote {
        border-left: 4px solid var(--apple-blue);
        margin: 0.8em 0;
        padding: 0.5em 0 0.5em 1em;
        background: rgba(0, 0, 0, 0.02);
        border-radius: 0 4px 4px 0;
        font-style: italic;
      }
      
      table {
        border-collapse: collapse;
        margin: 0.8em 0;
        width: 100%;
      }
      
      th, td {
        border: 1px solid rgba(0, 0, 0, 0.1);
        padding: 0.5em;
        text-align: left;
      }
      
      th {
        background: rgba(0, 0, 0, 0.05);
        font-weight: 600;
      }
      
      a {
        color: var(--apple-blue);
        text-decoration: none;
      }
      
      a:hover {
        text-decoration: underline;
      }
      
      strong {
        font-weight: 600;
      }
      
      em {
        font-style: italic;
      }
    }

    /* Dark theme adjustments for markdown */
    .ai-bubble .message-content ::ng-deep {
      code {
        background: rgba(255, 255, 255, 0.1);
        color: #ff7b72;
      }
      
      pre {
        background: rgba(255, 255, 255, 0.05);
        border-color: rgba(255, 255, 255, 0.1);
      }
      
      blockquote {
        background: rgba(255, 255, 255, 0.02);
      }
      
      th {
        background: rgba(255, 255, 255, 0.05);
      }
      
      th, td {
        border-color: rgba(255, 255, 255, 0.1);
      }
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
export class MessageBubbleComponent implements AfterViewInit {
  @Input() message!: Message;
  @ViewChild('messageContent') messageContent!: ElementRef;

  constructor(private prismService: PrismService) {}

  ngAfterViewInit(): void {
    // Highlight syntax for any existing code blocks
    this.highlightCode();
  }

  onMarkdownReady(): void {
    // Highlight syntax after markdown is rendered
    setTimeout(() => this.highlightCode(), 0);
  }

  private async highlightCode(): Promise<void> {
    if (this.messageContent && !this.message.isUser) {
      const codeBlocks = this.messageContent.nativeElement.querySelectorAll('pre code');
      for (const block of codeBlocks) {
        await this.prismService.highlightElement(block as HTMLElement);
      }
    }
  }

  formatTime(timestamp: Date): string {
    return timestamp.toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false 
    });
  }
}