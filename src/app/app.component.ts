import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ChatInterfaceComponent } from './components/chat-interface/chat-interface.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, ChatInterfaceComponent],
  template: `
    <div class="app-container">
      <app-chat-interface></app-chat-interface>
    </div>
  `,
  styles: [`
    .app-container {
      height: 100vh;
      width: 100vw;
      background: var(--background-primary);
      display: flex;
      flex-direction: column;
    }
  `]
})
export class AppComponent {
  title = 'Apple Chat Interface';
}