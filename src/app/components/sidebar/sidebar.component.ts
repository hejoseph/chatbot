import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ChatSession } from '../../models/message.model';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule],
  template: `
    <aside class="sidebar" [class.visible]="isVisible">
      <div class="sidebar-header">
        <h2 class="sidebar-title">Chats</h2>
        <button 
          class="new-chat-button"
          (click)="newChat.emit()"
          aria-label="New chat">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M10 4v12M4 10h12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
          </svg>
        </button>
      </div>
      
      <div class="sessions-list">
        @if (sessions.length === 0) {
          <div class="empty-sessions">
            <p>No conversations yet</p>
          </div>
        } @else {
          @for (session of sessions; track session.id) {
            <div 
              class="session-item"
              [class.active]="session.isActive"
              (click)="sessionSelected.emit(session.id)">
              <div class="session-content">
                <h3 class="session-title">{{ session.title }}</h3>
                <p class="session-preview">{{ getLastMessage(session) }}</p>
                <span class="session-time">{{ formatTime(session.lastActivity) }}</span>
              </div>
              
              <button 
                class="delete-session-button"
                (click)="deleteSession($event, session.id)"
                aria-label="Delete session">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M12 4L4 12M4 4l8 8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
                </svg>
              </button>
            </div>
          }
        }
      </div>
      
      <div class="sidebar-footer">
        <div class="user-info">
          <div class="user-avatar">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="8" r="4" stroke="currentColor" stroke-width="2"/>
              <path d="M6 21v-2a4 4 0 014-4h4a4 4 0 014 4v2" stroke="currentColor" stroke-width="2"/>
            </svg>
          </div>
          <div class="user-details">
            <span class="user-name">User</span>
            <span class="user-status">Online</span>
          </div>
          <button 
            class="settings-button"
            (click)="openSettings.emit()"
            aria-label="Open settings">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M10 12.5a2.5 2.5 0 100-5 2.5 2.5 0 000 5z" stroke="currentColor" stroke-width="1.5"/>
              <path d="M10 1v2m0 14v2M4.22 4.22l1.42 1.42m8.72 8.72l1.42 1.42M1 10h2m14 0h2M4.22 15.78l1.42-1.42m8.72-8.72l1.42-1.42" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
            </svg>
          </button>
        </div>
      </div>
      
      <button 
        class="close-sidebar-button"
        (click)="closeSidebar.emit()"
        aria-label="Close sidebar">
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <path d="M15 5L5 15M5 5l10 10" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
        </svg>
      </button>
    </aside>
  `,
  styles: [`
    .sidebar {
      width: 280px;
      height: 100vh;
      background: var(--background-secondary);
      border-right: 1px solid var(--separator);
      display: flex;
      flex-direction: column;
      position: fixed;
      left: -280px;
      top: 0;
      z-index: 999;
      transition: left 0.3s cubic-bezier(0.4, 0.0, 0.2, 1);
      backdrop-filter: blur(20px);
      -webkit-backdrop-filter: blur(20px);
    }

    .sidebar.visible {
      left: 0;
    }

    .sidebar-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: var(--spacing-lg) var(--spacing-md);
      border-bottom: 1px solid var(--separator);
    }

    .sidebar-title {
      font-size: var(--font-size-title);
      font-weight: 700;
      color: var(--text-primary);
      margin: 0;
    }

    .new-chat-button {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 36px;
      height: 36px;
      border-radius: var(--radius-sm);
      background: var(--apple-blue);
      color: white;
      transition: all 0.2s ease;
    }

    .new-chat-button:hover {
      background: var(--apple-blue-dark);
      transform: scale(1.05);
    }

    .new-chat-button:active {
      transform: scale(0.95);
    }

    .sessions-list {
      flex: 1;
      overflow-y: auto;
      padding: var(--spacing-sm) 0;
    }

    .empty-sessions {
      padding: var(--spacing-xl) var(--spacing-md);
      text-align: center;
      color: var(--text-tertiary);
      font-size: var(--font-size-subhead);
    }

    .session-item {
      display: flex;
      align-items: center;
      padding: var(--spacing-md);
      margin: 0 var(--spacing-sm);
      border-radius: var(--radius-md);
      cursor: pointer;
      transition: all 0.2s ease;
      position: relative;
      gap: var(--spacing-sm);
    }

    .session-item:hover {
      background: var(--background-tertiary);
    }

    .session-item.active {
      background: var(--apple-blue);
      color: white;
    }

    .session-content {
      flex: 1;
      min-width: 0;
    }

    .session-title {
      font-size: var(--font-size-callout);
      font-weight: 600;
      margin: 0 0 var(--spacing-xs) 0;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      color: inherit;
    }

    .session-preview {
      font-size: var(--font-size-footnote);
      margin: 0 0 var(--spacing-xs) 0;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      opacity: 0.7;
      color: inherit;
    }

    .session-time {
      font-size: var(--font-size-caption);
      opacity: 0.6;
      color: inherit;
    }

    .delete-session-button {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 24px;
      height: 24px;
      border-radius: var(--radius-sm);
      color: var(--text-tertiary);
      opacity: 0;
      transition: all 0.2s ease;
      flex-shrink: 0;
    }

    .session-item:hover .delete-session-button {
      opacity: 1;
    }

    .delete-session-button:hover {
      background: var(--apple-red);
      color: white;
    }

    .session-item.active .delete-session-button {
      color: rgba(255, 255, 255, 0.7);
    }

    .session-item.active .delete-session-button:hover {
      background: rgba(255, 255, 255, 0.2);
      color: white;
    }

    .sidebar-footer {
      padding: var(--spacing-md);
      border-top: 1px solid var(--separator);
    }

    .user-info {
      display: flex;
      align-items: center;
      gap: var(--spacing-md);
    }

    .user-avatar {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background: var(--apple-blue);
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .user-details {
      flex: 1;
      min-width: 0;
    }

    .user-name {
      display: block;
      font-size: var(--font-size-callout);
      font-weight: 600;
      color: var(--text-primary);
    }

    .user-status {
      display: block;
      font-size: var(--font-size-footnote);
      color: var(--apple-green);
    }

    .settings-button {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 36px;
      height: 36px;
      border-radius: var(--radius-sm);
      color: var(--text-secondary);
      transition: all 0.2s ease;
      flex-shrink: 0;
    }

    .settings-button:hover {
      background: var(--background-tertiary);
      color: var(--text-primary);
    }

    .close-sidebar-button {
      position: absolute;
      top: var(--spacing-md);
      right: var(--spacing-md);
      width: 32px;
      height: 32px;
      border-radius: var(--radius-sm);
      color: var(--text-secondary);
      display: none;
      align-items: center;
      justify-content: center;
      transition: all 0.2s ease;
    }

    .close-sidebar-button:hover {
      background: var(--background-tertiary);
      color: var(--text-primary);
    }

    /* Custom scrollbar */
    .sessions-list::-webkit-scrollbar {
      width: 6px;
    }

    .sessions-list::-webkit-scrollbar-track {
      background: transparent;
    }

    .sessions-list::-webkit-scrollbar-thumb {
      background: var(--apple-gray);
      border-radius: 3px;
    }

    @media (max-width: 768px) {
      .close-sidebar-button {
        display: flex;
      }
      
      .sidebar-header {
        padding-right: 60px;
      }
    }

    @media (min-width: 769px) {
      .sidebar {
        position: fixed;
        left: -280px;
      }
      
      .sidebar.visible {
        left: 0;
      }
    }
  `]
})
export class SidebarComponent {
  @Input() sessions: ChatSession[] = [];
  @Input() isVisible = false;
  @Output() sessionSelected = new EventEmitter<string>();
  @Output() newChat = new EventEmitter<void>();
  @Output() sessionDeleted = new EventEmitter<string>();
  @Output() closeSidebar = new EventEmitter<void>();
  @Output() openSettings = new EventEmitter<void>();

  getLastMessage(session: ChatSession): string {
    if (session.messages.length === 0) {
      return 'No messages yet';
    }
    
    const lastMessage = session.messages[session.messages.length - 1];
    const preview = lastMessage.content.length > 50 
      ? lastMessage.content.substring(0, 50) + '...'
      : lastMessage.content;
    
    return lastMessage.isUser ? `You: ${preview}` : preview;
  }

  formatTime(date: Date): string {
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 1) {
      return 'Just now';
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h ago`;
    } else if (diffInHours < 168) { // 7 days
      return `${Math.floor(diffInHours / 24)}d ago`;
    } else {
      return date.toLocaleDateString();
    }
  }

  deleteSession(event: Event, sessionId: string): void {
    event.stopPropagation();
    this.sessionDeleted.emit(sessionId);
  }
}