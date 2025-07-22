import { Component, Input, Output, EventEmitter, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ChatSession } from '../../models/message.model';
import { LLMSelectorComponent } from '../llm-selector/llm-selector.component';
import { LLMApiKey } from '../settings-modal/settings-modal.component';

@Component({
  selector: 'app-chat-header',
  standalone: true,
  imports: [CommonModule, LLMSelectorComponent],
  template: `
    <header class="chat-header">
      <div class="header-left">
        <button 
          class="menu-button"
          (click)="menuToggle.emit()"
          aria-label="Toggle menu">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M3 6h14M3 12h14M3 18h14" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
          </svg>
        </button>
        
        <div class="session-info">
          <h1 class="session-title">{{ currentSession?.title || 'Chat' }}</h1>
          <span class="session-subtitle">AI Assistant</span>
        </div>
      </div>
      
      <div class="header-center">
        <app-llm-selector
          #llmSelector
          [disabled]="false"
          (llmSelected)="onLLMSelected($event)"
          (openSettings)="openSettings.emit()">
        </app-llm-selector>
      </div>
      
      <div class="header-right">
        <button 
          class="action-button"
          (click)="clearChat.emit()"
          aria-label="Clear chat">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M4 7h12m0 0l-1.5 9a2 2 0 01-2 1.5h-5a2 2 0 01-2-1.5L4 7m4-3V2a1 1 0 011-1h2a1 1 0 011 1v2m-4 0h4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </button>
      </div>
    </header>
  `,
  styles: [`
    .chat-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: var(--spacing-md) var(--spacing-lg);
      background: var(--background-primary);
      border-bottom: 1px solid var(--separator);
      backdrop-filter: blur(20px);
      -webkit-backdrop-filter: blur(20px);
      position: sticky;
      top: 0;
      z-index: 100;
      min-height: 64px;
    }

    .header-left {
      display: flex;
      align-items: center;
      gap: var(--spacing-md);
      flex: 1;
      min-width: 0;
    }

    .header-center {
      display: flex;
      align-items: center;
      justify-content: center;
      flex: 0 0 auto;
      margin: 0 var(--spacing-md);
    }

    .header-right {
      display: flex;
      align-items: center;
      gap: var(--spacing-sm);
    }

    .menu-button {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 40px;
      height: 40px;
      border-radius: var(--radius-sm);
      color: var(--text-secondary);
      transition: all 0.2s ease;
      background: transparent;
    }

    .menu-button:hover {
      background: var(--background-secondary);
      color: var(--text-primary);
    }

    .menu-button:active {
      transform: scale(0.95);
    }

    .session-info {
      flex: 1;
      min-width: 0;
    }

    .session-title {
      font-size: var(--font-size-headline);
      font-weight: 600;
      color: var(--text-primary);
      margin: 0;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      line-height: 1.2;
    }

    .session-subtitle {
      font-size: var(--font-size-footnote);
      color: var(--text-tertiary);
      font-weight: 400;
    }

    .action-button {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 40px;
      height: 40px;
      border-radius: var(--radius-sm);
      color: var(--text-secondary);
      transition: all 0.2s ease;
      background: transparent;
    }

    .action-button:hover {
      background: var(--background-secondary);
      color: var(--apple-red);
    }

    .action-button:active {
      transform: scale(0.95);
    }

    @media (max-width: 768px) {
      .chat-header {
        padding: var(--spacing-sm) var(--spacing-md);
      }
      
      .session-title {
        font-size: var(--font-size-body);
      }
    }
  `]
})
export class ChatHeaderComponent {
  @Input() currentSession: ChatSession | null = null;
  @Output() menuToggle = new EventEmitter<void>();
  @Output() clearChat = new EventEmitter<void>();
  @Output() llmSelected = new EventEmitter<LLMApiKey>();
  @Output() openSettings = new EventEmitter<void>();
  @ViewChild('llmSelector') llmSelector!: LLMSelectorComponent;

  onLLMSelected(apiKey: LLMApiKey) {
    this.llmSelected.emit(apiKey);
  }

  refreshLLMSelector() {
    this.llmSelector?.refreshApiKeys();
  }
}