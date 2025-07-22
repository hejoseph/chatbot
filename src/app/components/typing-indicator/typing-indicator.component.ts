import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-typing-indicator',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="typing-wrapper">
      <div class="typing-bubble">
        <div class="typing-content">
          <div class="typing-dots">
            <div class="dot"></div>
            <div class="dot"></div>
            <div class="dot"></div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .typing-wrapper {
      display: flex;
      margin-bottom: var(--spacing-md);
      animation: fadeIn 0.3s ease-in-out;
    }

    .typing-bubble {
      max-width: 70%;
      padding: var(--spacing-md);
      border-radius: var(--radius-lg);
      background: var(--background-secondary);
      border: 1px solid var(--separator);
      border-bottom-left-radius: var(--radius-sm);
      box-shadow: var(--shadow-sm);
    }

    .typing-content {
      display: flex;
      align-items: center;
      min-height: 20px;
    }

    .typing-dots {
      display: flex;
      gap: 4px;
      align-items: center;
    }

    .dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: var(--text-tertiary);
      animation: typingDot 1.4s infinite ease-in-out;
    }

    .dot:nth-child(1) {
      animation-delay: 0s;
    }

    .dot:nth-child(2) {
      animation-delay: 0.2s;
    }

    .dot:nth-child(3) {
      animation-delay: 0.4s;
    }

    @keyframes typingDot {
      0%, 60%, 100% {
        transform: scale(1);
        opacity: 0.4;
      }
      30% {
        transform: scale(1.2);
        opacity: 1;
      }
    }

    @keyframes fadeIn {
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
      .typing-bubble {
        max-width: 85%;
        padding: var(--spacing-sm) var(--spacing-md);
      }
    }
  `]
})
export class TypingIndicatorComponent {}