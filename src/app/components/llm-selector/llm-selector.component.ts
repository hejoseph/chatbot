import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LLMApiKey } from '../settings-modal/settings-modal.component';

@Component({
  selector: 'app-llm-selector',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="llm-selector" [class.disabled]="disabled">
      <button 
        class="selector-button"
        (click)="toggleDropdown()"
        [disabled]="disabled"
        aria-label="Select LLM">
        <div class="selected-llm">
          @if (selectedApiKey) {
            <div class="llm-info">
              <span class="llm-name">{{ selectedApiKey.name }}</span>
              <span class="llm-provider">{{ selectedApiKey.provider }}</span>
            </div>
          } @else {
            <div class="llm-info">
              <span class="llm-name">No LLM Selected</span>
              <span class="llm-provider">Configure in settings</span>
            </div>
          }
        </div>
        <svg 
          class="dropdown-icon" 
          [class.rotated]="isDropdownOpen"
          width="16" 
          height="16" 
          viewBox="0 0 16 16" 
          fill="none">
          <path d="M4 6l4 4 4-4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </button>
      
      @if (isDropdownOpen) {
        <div class="dropdown-menu">
          @if (availableApiKeys.length === 0) {
            <div class="empty-state">
              <span>No API keys configured</span>
              <button class="configure-button" (click)="openSettings.emit()">
                Configure in Settings
              </button>
            </div>
          } @else {
            @for (apiKey of availableApiKeys; track apiKey.id) {
              <button 
                class="dropdown-item"
                [class.active]="selectedApiKey?.id === apiKey.id"
                [class.tested]="apiKey.testStatus === 'success'"
                [class.error]="apiKey.testStatus === 'error'"
                (click)="selectApiKey(apiKey)">
                <div class="api-key-info">
                  <span class="api-key-name">{{ apiKey.name }}</span>
                  <span class="api-key-provider">{{ apiKey.provider }}</span>
                </div>
                <div class="api-key-status">
                  @if (apiKey.testStatus === 'success') {
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" class="status-icon success">
                      <circle cx="8" cy="8" r="8" fill="var(--apple-green)"/>
                      <path d="M5 8l2 2 4-4" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                  } @else if (apiKey.testStatus === 'error') {
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" class="status-icon error">
                      <circle cx="8" cy="8" r="8" fill="var(--apple-red)"/>
                      <path d="M6 6l4 4M10 6l-4 4" stroke="white" stroke-width="2" stroke-linecap="round"/>
                    </svg>
                  } @else {
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" class="status-icon untested">
                      <circle cx="8" cy="8" r="8" fill="var(--apple-gray)"/>
                      <path d="M8 5v3M8 11h.01" stroke="white" stroke-width="2" stroke-linecap="round"/>
                    </svg>
                  }
                </div>
              </button>
            }
          }
        </div>
      }
      
      @if (isDropdownOpen) {
        <div class="dropdown-overlay" (click)="closeDropdown()"></div>
      }
    </div>
  `,
  styles: [`
    .llm-selector {
      position: relative;
      min-width: 200px;
    }

    .llm-selector.disabled {
      opacity: 0.6;
      pointer-events: none;
    }

    .selector-button {
      display: flex;
      align-items: center;
      justify-content: space-between;
      width: 100%;
      padding: var(--spacing-xs) var(--spacing-sm);
      background: var(--background-secondary);
      border: 1px solid var(--separator);
      border-radius: var(--radius-sm);
      color: var(--text-primary);
      transition: all 0.2s ease;
      gap: var(--spacing-sm);
    }

    .selector-button:hover:not(:disabled) {
      background: var(--background-tertiary);
      border-color: var(--apple-blue);
    }

    .selector-button:disabled {
      cursor: not-allowed;
    }

    .selected-llm {
      flex: 1;
      min-width: 0;
    }

    .llm-info {
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      gap: 2px;
    }

    .llm-name {
      font-size: var(--font-size-subhead);
      font-weight: 600;
      color: var(--text-primary);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      max-width: 150px;
    }

    .llm-provider {
      font-size: var(--font-size-caption);
      color: var(--text-tertiary);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      max-width: 150px;
    }

    .dropdown-icon {
      transition: transform 0.2s ease;
      color: var(--text-secondary);
      flex-shrink: 0;
    }

    .dropdown-icon.rotated {
      transform: rotate(180deg);
    }

    .dropdown-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      z-index: 998;
    }

    .dropdown-menu {
      position: absolute;
      top: 100%;
      left: 0;
      right: 0;
      background: var(--background-primary);
      border: 1px solid var(--separator);
      border-radius: var(--radius-md);
      box-shadow: var(--shadow-lg);
      z-index: 999;
      margin-top: var(--spacing-xs);
      max-height: 300px;
      overflow-y: auto;
    }

    .empty-state {
      padding: var(--spacing-lg);
      text-align: center;
      color: var(--text-tertiary);
    }

    .configure-button {
      margin-top: var(--spacing-sm);
      padding: var(--spacing-xs) var(--spacing-sm);
      background: var(--apple-blue);
      color: white;
      border-radius: var(--radius-sm);
      font-size: var(--font-size-footnote);
      transition: all 0.2s ease;
    }

    .configure-button:hover {
      background: var(--apple-blue-dark);
    }

    .dropdown-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      width: 100%;
      padding: var(--spacing-sm) var(--spacing-md);
      text-align: left;
      transition: all 0.2s ease;
      border-bottom: 1px solid var(--separator);
      gap: var(--spacing-sm);
    }

    .dropdown-item:last-child {
      border-bottom: none;
    }

    .dropdown-item:hover {
      background: var(--background-secondary);
    }

    .dropdown-item.active {
      background: var(--apple-blue);
      color: white;
    }

    .dropdown-item.active .llm-name,
    .dropdown-item.active .llm-provider {
      color: white;
    }

    .api-key-info {
      flex: 1;
      min-width: 0;
    }

    .api-key-name {
      display: block;
      font-size: var(--font-size-subhead);
      font-weight: 600;
      color: var(--text-primary);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .api-key-provider {
      display: block;
      font-size: var(--font-size-caption);
      color: var(--text-tertiary);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .api-key-status {
      flex-shrink: 0;
    }

    .status-icon {
      width: 16px;
      height: 16px;
    }

    /* Custom scrollbar */
    .dropdown-menu::-webkit-scrollbar {
      width: 6px;
    }

    .dropdown-menu::-webkit-scrollbar-track {
      background: transparent;
    }

    .dropdown-menu::-webkit-scrollbar-thumb {
      background: var(--apple-gray);
      border-radius: 3px;
    }

    @media (max-width: 768px) {
      .llm-selector {
        min-width: 150px;
      }

      .llm-name {
        max-width: 100px;
      }

      .llm-provider {
        max-width: 100px;
      }
    }
  `]
})
export class LLMSelectorComponent implements OnInit {
  @Input() disabled = false;
  @Output() llmSelected = new EventEmitter<LLMApiKey>();
  @Output() openSettings = new EventEmitter<void>();

  availableApiKeys: LLMApiKey[] = [];
  selectedApiKey: LLMApiKey | null = null;
  isDropdownOpen = false;

  ngOnInit() {
    this.loadApiKeys();
  }

  loadApiKeys() {
    const saved = localStorage.getItem('llm-api-keys');
    if (saved) {
      this.availableApiKeys = JSON.parse(saved);
      // Set the active key as selected
      this.selectedApiKey = this.availableApiKeys.find(key => key.isActive) || null;
      if (this.selectedApiKey) {
        this.llmSelected.emit(this.selectedApiKey);
      }
    }
  }

  toggleDropdown() {
    if (!this.disabled) {
      this.isDropdownOpen = !this.isDropdownOpen;
      // Reload API keys when opening dropdown to get latest changes
      if (this.isDropdownOpen) {
        this.loadApiKeys();
      }
    }
  }

  closeDropdown() {
    this.isDropdownOpen = false;
  }

  selectApiKey(apiKey: LLMApiKey) {
    this.selectedApiKey = apiKey;
    this.llmSelected.emit(apiKey);
    this.closeDropdown();
    
    // Update the active key in storage
    this.availableApiKeys.forEach(key => key.isActive = false);
    apiKey.isActive = true;
    localStorage.setItem('llm-api-keys', JSON.stringify(this.availableApiKeys));
  }

  // Method to refresh the component when settings are saved
  refreshApiKeys() {
    this.loadApiKeys();
  }
}