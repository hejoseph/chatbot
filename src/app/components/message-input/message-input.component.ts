import { Component, Output, EventEmitter, Input, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-message-input',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="message-input-container">
      <div class="input-wrapper">
        <div class="input-field">
          <textarea
            #messageInput
            [(ngModel)]="messageText"
            (keydown)="onKeyDown($event)"
            (input)="onInput()"
            [disabled]="disabled"
            placeholder="Message..."
            rows="1"
            class="message-textarea"
            [class.disabled]="disabled">
          </textarea>
          
          <button
            type="button"
            class="send-button"
            [disabled]="!canSend"
            [class.disabled]="!canSend"
            (click)="sendMessage()"
            aria-label="Send message">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M2 10l16-8-8 16-2-6-6-2z" fill="currentColor"/>
            </svg>
          </button>
        </div>
        
        <div class="input-actions">
          <span class="character-count" [class.warning]="messageText.length > 4000">
            {{ messageText.length }}/5000
          </span>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .message-input-container {
      padding: var(--spacing-md) var(--spacing-lg);
      background: var(--background-primary);
      border-top: 1px solid var(--separator);
      backdrop-filter: blur(20px);
      -webkit-backdrop-filter: blur(20px);
    }

    .input-wrapper {
      max-width: 800px;
      margin: 0 auto;
      width: 100%;
    }

    .input-field {
      display: flex;
      align-items: flex-end;
      background: var(--background-secondary);
      border: 1px solid var(--separator);
      border-radius: var(--radius-xl);
      padding: var(--spacing-sm);
      gap: var(--spacing-sm);
      transition: all 0.2s ease;
      position: relative;
    }

    .input-field:focus-within {
      border-color: var(--apple-blue);
      box-shadow: 0 0 0 3px rgba(0, 122, 255, 0.1);
    }

    .message-textarea {
      flex: 1;
      background: transparent;
      border: none;
      outline: none;
      resize: none;
      font-size: var(--font-size-body);
      line-height: 1.4;
      padding: var(--spacing-sm) var(--spacing-md);
      color: var(--text-primary);
      min-height: 20px;
      max-height: 120px;
      overflow-y: auto;
      font-family: var(--font-family);
    }

    .message-textarea::placeholder {
      color: var(--text-tertiary);
    }

    .message-textarea.disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .send-button {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 36px;
      height: 36px;
      border-radius: 50%;
      background: var(--apple-blue);
      color: white;
      transition: all 0.2s ease;
      flex-shrink: 0;
    }

    .send-button:hover:not(.disabled) {
      background: var(--apple-blue-dark);
      transform: scale(1.05);
    }

    .send-button:active:not(.disabled) {
      transform: scale(0.95);
    }

    .send-button.disabled {
      background: var(--apple-gray);
      cursor: not-allowed;
      opacity: 0.5;
    }

    .input-actions {
      display: flex;
      justify-content: flex-end;
      margin-top: var(--spacing-xs);
      padding: 0 var(--spacing-sm);
    }

    .character-count {
      font-size: var(--font-size-caption);
      color: var(--text-tertiary);
      font-weight: 400;
    }

    .character-count.warning {
      color: var(--apple-orange);
    }

    /* Custom scrollbar for textarea */
    .message-textarea::-webkit-scrollbar {
      width: 4px;
    }

    .message-textarea::-webkit-scrollbar-track {
      background: transparent;
    }

    .message-textarea::-webkit-scrollbar-thumb {
      background: var(--apple-gray);
      border-radius: 2px;
    }

    @media (max-width: 768px) {
      .message-input-container {
        padding: var(--spacing-sm) var(--spacing-md);
      }
      
      .message-textarea {
        font-size: var(--font-size-callout);
      }
    }
  `]
})
export class MessageInputComponent {
  @Input() disabled = false;
  @Output() messageSent = new EventEmitter<string>();
  @ViewChild('messageInput') messageInput!: ElementRef<HTMLTextAreaElement>;

  messageText = '';

  get canSend(): boolean {
    return this.messageText.trim().length > 0 && 
           this.messageText.length <= 5000 && 
           !this.disabled;
  }

  onKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      if (this.canSend) {
        this.sendMessage();
      }
    }
  }

  onInput(): void {
    this.adjustTextareaHeight();
  }

  sendMessage(): void {
    if (this.canSend) {
      const message = this.messageText.trim();
      this.messageSent.emit(message);
      this.messageText = '';
      this.adjustTextareaHeight();
      this.focusInput();
    }
  }

  private adjustTextareaHeight(): void {
    const textarea = this.messageInput?.nativeElement;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
    }
  }

  private focusInput(): void {
    setTimeout(() => {
      this.messageInput?.nativeElement.focus();
    }, 0);
  }
}