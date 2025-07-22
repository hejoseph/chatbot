import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { ChatService } from '../../services/chat.service';
import { Message, ChatSession } from '../../models/message.model';
import { MessageListComponent } from '../message-list/message-list.component';
import { MessageInputComponent } from '../message-input/message-input.component';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { SettingsModalComponent, LLMApiKey } from '../settings-modal/settings-modal.component';
import { ChatHeaderComponent } from '../chat-header/chat-header.component';

@Component({
  selector: 'app-chat-interface',
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule, 
    ChatHeaderComponent, 
    MessageListComponent, 
    MessageInputComponent,
    SidebarComponent,
    SettingsModalComponent
  ],
  template: `
    <div class="chat-interface">
      <app-sidebar 
        [sessions]="sessions"
        [isVisible]="sidebarVisible"
        (sessionSelected)="onSessionSelected($event)"
        (newChat)="onNewChat()"
        (sessionDeleted)="onSessionDeleted($event)"
        (closeSidebar)="toggleSidebar()"
        (openSettings)="openSettingsModal()">
      </app-sidebar>
      
      <div class="main-chat" [class.sidebar-open]="sidebarVisible">
        <app-chat-header 
          #chatHeader
          [currentSession]="currentSession"
          (menuToggle)="toggleSidebar()"
          (clearChat)="onClearChat()"
          (llmSelected)="onLLMSelected($event)"
          (openSettings)="openSettingsModal()">
        </app-chat-header>
        
        <app-message-list 
          [messages]="messages"
          [isTyping]="isTyping">
        </app-message-list>
        
        <app-message-input 
          [disabled]="isTyping"
          (messageSent)="onMessageSent($event)">
        </app-message-input>
      </div>
      
      <div 
        class="sidebar-overlay" 
        [class.visible]="sidebarVisible"
        (click)="toggleSidebar()">
      </div>
      
      <app-settings-modal
        [isVisible]="settingsModalVisible"
        (closeModal)="closeSettingsModal()"
        (settingsSaved)="onSettingsSaved($event)">
      </app-settings-modal>
    </div>
  `,
  styles: [`
    .chat-interface {
      display: flex;
      height: 100vh;
      background: var(--background-primary);
      position: relative;
      overflow: hidden;
    }

    .main-chat {
      flex: 1;
      display: flex;
      flex-direction: column;
      min-width: 0;
      transition: margin-left 0.3s cubic-bezier(0.4, 0.0, 0.2, 1);
    }

    .sidebar-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: var(--overlay);
      opacity: 0;
      visibility: hidden;
      transition: all 0.3s cubic-bezier(0.4, 0.0, 0.2, 1);
      z-index: 998;
    }

    .sidebar-overlay.visible {
      opacity: 1;
      visibility: visible;
    }

    @media (max-width: 768px) {
      .main-chat.sidebar-open {
        margin-left: 0;
      }
    }

    @media (min-width: 769px) {
      .main-chat.sidebar-open {
        margin-left: 280px;
      }
      
      .sidebar-overlay {
        display: none;
      }
    }
  `]
})
export class ChatInterfaceComponent implements OnInit, OnDestroy {
  messages: Message[] = [];
  sessions: ChatSession[] = [];
  currentSession: ChatSession | null = null;
  isTyping = false;
  sidebarVisible = false;
  settingsModalVisible = false;
  
  @ViewChild('chatHeader') chatHeader!: ChatHeaderComponent;
  
  private destroy$ = new Subject<void>();

  constructor(private chatService: ChatService) {}

  ngOnInit(): void {
    this.chatService.messages$
      .pipe(takeUntil(this.destroy$))
      .subscribe(messages => {
        this.messages = messages;
      });

    this.chatService.isTyping$
      .pipe(takeUntil(this.destroy$))
      .subscribe(isTyping => {
        this.isTyping = isTyping;
      });

    this.chatService.sessions$
      .pipe(takeUntil(this.destroy$))
      .subscribe(sessions => {
        this.sessions = sessions;
        this.currentSession = sessions.find(s => s.isActive) || null;
      });

    // Load and set the active LLM on startup
    this.loadActiveLLM();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onMessageSent(content: string): void {
    if (content.trim()) {
      this.chatService.sendMessage(content);
    }
  }

  onSessionSelected(sessionId: string): void {
    this.chatService.switchToSession(sessionId);
    this.sidebarVisible = false;
  }

  onNewChat(): void {
    this.chatService.createNewSession();
    this.sidebarVisible = false;
  }

  async onSessionDeleted(sessionId: string): Promise<void> {
    await this.chatService.deleteSession(sessionId);
  }

  onClearChat(): void {
    this.chatService.clearCurrentChat();
  }

  toggleSidebar(): void {
    this.sidebarVisible = !this.sidebarVisible;
  }

  openSettingsModal(): void {
    this.settingsModalVisible = true;
  }

  closeSettingsModal(): void {
    this.settingsModalVisible = false;
  }

  onSettingsSaved(apiKeys: LLMApiKey[]): void {
    console.log('API keys saved:', apiKeys);
    
    // Update the chat service with the active API key
    const activeKey = apiKeys.find(key => key.isActive);
    if (activeKey) {
      this.chatService.setSelectedLLM(activeKey);
      console.log('Active API key set:', activeKey);
    }
    
    // Refresh the LLM selector in the header
    this.chatHeader?.refreshLLMSelector();
  }

  onLLMSelected(apiKey: LLMApiKey): void {
    this.chatService.setSelectedLLM(apiKey);
    console.log('LLM selected:', apiKey.name, apiKey.provider);
  }

  private loadActiveLLM(): void {
    // Load the active LLM from localStorage on app startup
    const saved = localStorage.getItem('llm-api-keys');
    if (saved) {
      const apiKeys: LLMApiKey[] = JSON.parse(saved);
      const activeKey = apiKeys.find(key => key.isActive);
      if (activeKey) {
        this.chatService.setSelectedLLM(activeKey);
      }
    }
  }
}