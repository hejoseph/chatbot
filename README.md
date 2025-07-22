# Apple-Inspired Chat Interface

A modern, responsive chat interface built with Angular 17+ that follows Apple's design principles and provides an excellent user experience for AI conversations.

## Design Features

- **Apple-inspired Design**: Clean, minimalist interface following Apple's design language
- **Professional Color Palette**: Uses Apple's signature colors with proper contrast ratios
- **Responsive Layout**: Optimized for both desktop and mobile devices
- **Smooth Animations**: Fluid transitions and micro-interactions
- **Dark/Light Mode Support**: Automatic theme switching based on system preferences
- **Accessibility**: WCAG compliant with proper focus management and screen reader support

## Key Features

### Chat Interface
- Real-time messaging with typing indicators
- Message status indicators (sending, sent, delivered, read, error)
- Auto-scrolling to latest messages
- Character count with warnings
- Multi-line message support with Shift+Enter
- Message timestamps

### Session Management
- Multiple chat sessions
- Session switching with preserved history
- Auto-generated session titles from first user message
- Session deletion with confirmation
- Persistent chat history

### User Experience
- Collapsible sidebar for session management
- Smooth animations and transitions
- Touch-friendly mobile interface
- Keyboard shortcuts (Enter to send, Shift+Enter for new line)
- Auto-resizing text input
- Loading states and error handling

## 🛠 Technical Stack

- **Framework**: Angular 17+ (Standalone Components)
- **Styling**: SCSS with CSS Custom Properties
- **State Management**: RxJS with BehaviorSubjects
- **Testing**: Jasmine + Karma
- **Build Tool**: Angular CLI
- **TypeScript**: Strict mode enabled

## Project Structure

```
src/
├── app/
│   ├── components/
│   │   ├── chat-interface/          # Main chat container
│   │   ├── chat-header/             # Header with session info
│   │   ├── message-list/            # Message display area
│   │   ├── message-bubble/          # Individual message component
│   │   ├── message-input/           # Message input with send button
│   │   ├── sidebar/                 # Session management sidebar
│   │   └── typing-indicator/        # AI typing animation
│   ├── models/
│   │   └── message.model.ts         # TypeScript interfaces
│   ├── services/
│   │   └── chat.service.ts          # Chat logic and state management
│   └── app.component.ts             # Root component
├── styles.scss                     # Global styles and design tokens
└── index.html                      # Main HTML file
```

## Getting Started

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn
- Angular CLI (optional, for development)

### Installation

1. **Clone or download the project files**

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npm start
   # or
   ng serve
   ```

4. **Open your browser**
   Navigate to `http://localhost:4200`

### Building for Production

```bash
npm run build
# or
ng build --configuration production
```

## Testing

### Run Unit Tests
```bash
npm test
# or
ng test
```

### Run Tests with Coverage
```bash
ng test --code-coverage
```

### Test Coverage
The project maintains high test coverage with tests for:
- Service logic and state management
- Component behavior and user interactions
- Message handling and validation
- Session management
- Error scenarios and edge cases

## Usage Examples

### Basic Chat Interaction
```typescript
// Send a message
chatService.sendMessage('Hello, AI!');

// Listen to messages
chatService.messages$.subscribe(messages => {
  console.log('Current messages:', messages);
});

// Check typing status
chatService.isTyping$.subscribe(isTyping => {
  console.log('AI is typing:', isTyping);
});
```

### Session Management
```typescript
// Create new session
const sessionId = chatService.createNewSession();

// Switch to session
chatService.switchToSession(sessionId);

// Delete session
chatService.deleteSession(sessionId);
```

## Customization

### Colors
Modify the CSS custom properties in `src/styles.scss`:

```scss
:root {
  --apple-blue: #007AFF;
  --apple-gray: #8E8E93;
  --background-primary: #FFFFFF;
  --text-primary: #000000;
  /* ... more variables */
}
```

### Typography
Update font settings in the design tokens:

```scss
:root {
  --font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', sans-serif;
  --font-size-body: 17px;
  --font-size-title: 28px;
  /* ... more font sizes */
}
```

### Animations
Adjust animation timing in component styles:

```scss
.transition {
  transition: all 0.2s cubic-bezier(0.4, 0.0, 0.2, 1);
}
```

## Responsive Design

The interface is fully responsive with breakpoints:
- **Mobile**: < 768px (single column, overlay sidebar)
- **Desktop**: ≥ 768px (side-by-side layout)

Key responsive features:
- Touch-friendly button sizes (44px minimum)
- Optimized text sizes for mobile
- Swipe gestures for sidebar on mobile
- Adaptive spacing and padding

## Accessibility

- **Keyboard Navigation**: Full keyboard support
- **Screen Readers**: Proper ARIA labels and roles
- **Focus Management**: Visible focus indicators
- **Color Contrast**: WCAG AA compliant ratios
- **Semantic HTML**: Proper heading hierarchy and landmarks

## Configuration

### Environment Variables
Create environment files for different configurations:

```typescript
// src/environments/environment.ts
export const environment = {
  production: false,
  apiUrl: 'http://localhost:3000',
  aiResponseDelay: 2000
};
```

### Service Configuration
Customize AI response behavior in `chat.service.ts`:

```typescript
private generateAIResponse(userMessage: string): Observable<string> {
  // Customize response logic
  const processingTime = Math.random() * 2000 + 1000; // 1-3 seconds
  return of(response).pipe(delay(processingTime));
}
```

## Deployment

### Build for Production
```bash
ng build --configuration production
```

### Deploy to Static Hosting
The built files in `dist/` can be deployed to:
- Netlify
- Vercel
- GitHub Pages
- AWS S3 + CloudFront
- Any static hosting service

## Contributing

1. Follow the existing code style and patterns
2. Write tests for new features
3. Update documentation for changes
4. Ensure accessibility compliance
5. Test on multiple devices and browsers

## License

This project is open source and available under the [MIT License](LICENSE).

## Acknowledgments

- Apple Human Interface Guidelines for design inspiration
- Angular team for the excellent framework
- Community contributors and feedback

