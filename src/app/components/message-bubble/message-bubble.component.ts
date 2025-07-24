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
        <button class="copy-message-button" (click)="copyMessageContent()" [attr.data-copied]="copied ? 'true' : 'false'">
          @if (copied) {
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
          } @else {
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
          }
        </button>
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

    .message-bubble:hover .copy-message-button {
      opacity: 1;
    }

    .copy-message-button {
      position: absolute;
      top: 10px;
      right: 10px;
      background-color: rgba(0, 0, 0, 0.1);
      color: var(--text-primary);
      border: 1px solid transparent;
      padding: 4px;
      border-radius: 6px;
      cursor: pointer;
      opacity: 0;
      transition: opacity 0.2s ease-in-out, background-color 0.2s ease;
      z-index: 1;
    }

    .user-bubble .copy-message-button {
      color: white;
      background-color: rgba(255, 255, 255, 0.2);
    }

    .copy-message-button:hover {
      background-color: rgba(0, 0, 0, 0.2);
    }
    
    .user-bubble .copy-message-button:hover {
      background-color: rgba(255, 255, 255, 0.3);
    }

    .copy-message-button[data-copied='true'] {
      opacity: 1;
      background-color: var(--apple-green);
      color: white;
    }

    .copy-message-button svg {
      display: block;
    }

    /* Copy button for code blocks */
    .message-content ::ng-deep .code-block-wrapper {
      position: relative;
      margin: 0.8em 0;
    }

    .message-content ::ng-deep .copy-button {
      position: absolute;
      top: 12px;
      right: 12px;
      background-color: rgba(255, 255, 255, 0.1);
      color: white;
      border: 1px solid rgba(255, 255, 255, 0.2);
      padding: 6px 10px;
      border-radius: 6px;
      font-size: 13px;
      font-weight: 500;
      cursor: pointer;
      opacity: 0;
      transition: opacity 0.2s ease-in-out, background-color 0.2s ease;
    }

    .message-content ::ng-deep .code-block-wrapper:hover .copy-button {
      opacity: 1;
    }

    .message-content ::ng-deep .copy-button:hover {
      background-color: rgba(255, 255, 255, 0.2);
    }

    .message-content ::ng-deep .copy-button:active {
      background-color: rgba(255, 255, 255, 0.3);
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
  copied = false;

  constructor(private prismService: PrismService) {}

  ngAfterViewInit(): void {
    this.highlightCode();
  }

  onMarkdownReady(): void {
    this.highlightCode();
  }

  copyMessageContent(): void {
    const content = this.messageContent.nativeElement.innerText;
    navigator.clipboard.writeText(content).then(() => {
      this.copied = true;
      setTimeout(() => {
        this.copied = false;
      }, 2000);
    }).catch(err => {
      console.error('Failed to copy message: ', err);
    });
  }

  private highlightCode(): void {
    if (this.messageContent && !this.message.isUser) {
      const codeBlocks = this.messageContent.nativeElement.querySelectorAll('pre');
      codeBlocks.forEach((preElement: HTMLElement) => {
        const codeElement = preElement.querySelector('code');
        if (codeElement) {
          this.prismService.highlightElement(codeElement);
          this.addCopyButton(preElement, codeElement);
        }
      });
    }
  }

  private addCopyButton(preElement: HTMLElement, codeElement: HTMLElement): void {
    const wrapper = document.createElement('div');
    wrapper.className = 'code-block-wrapper';

    preElement.parentNode?.insertBefore(wrapper, preElement);
    wrapper.appendChild(preElement);

    const copyButton = document.createElement('button');
    copyButton.className = 'copy-button';
    copyButton.textContent = 'Copy';
    copyButton.addEventListener('click', () => this.copyToClipboard(codeElement, copyButton));
    
    wrapper.appendChild(copyButton);
  }

  private copyToClipboard(codeElement: HTMLElement, button: HTMLButtonElement): void {
    const textToCopy = codeElement.innerText;
    navigator.clipboard.writeText(textToCopy).then(() => {
      button.textContent = 'Copied!';
      setTimeout(() => {
        button.textContent = 'Copy';
      }, 2000);
    }).catch(err => {
      console.error('Failed to copy text: ', err);
      button.textContent = 'Error';
      setTimeout(() => {
        button.textContent = 'Copy';
      }, 2000);
    });
  }

  formatTime(timestamp: Date): string {
    return timestamp.toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false 
    });
  }
}
