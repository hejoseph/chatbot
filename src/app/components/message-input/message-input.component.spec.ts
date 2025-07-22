import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { MessageInputComponent } from './message-input.component';

describe('MessageInputComponent', () => {
  let component: MessageInputComponent;
  let fixture: ComponentFixture<MessageInputComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MessageInputComponent, FormsModule]
    }).compileComponents();

    fixture = TestBed.createComponent(MessageInputComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should emit message when send button is clicked', () => {
    spyOn(component.messageSent, 'emit');
    
    component.messageText = 'Test message';
    fixture.detectChanges();
    
    const sendButton = fixture.nativeElement.querySelector('.send-button');
    sendButton.click();
    
    expect(component.messageSent.emit).toHaveBeenCalledWith('Test message');
    expect(component.messageText).toBe('');
  });

  it('should emit message when Enter key is pressed', () => {
    spyOn(component.messageSent, 'emit');
    
    component.messageText = 'Test message';
    fixture.detectChanges();
    
    const textarea = fixture.nativeElement.querySelector('.message-textarea');
    const enterEvent = new KeyboardEvent('keydown', { key: 'Enter' });
    
    textarea.dispatchEvent(enterEvent);
    
    expect(component.messageSent.emit).toHaveBeenCalledWith('Test message');
  });

  it('should not emit message when Shift+Enter is pressed', () => {
    spyOn(component.messageSent, 'emit');
    
    component.messageText = 'Test message';
    fixture.detectChanges();
    
    const textarea = fixture.nativeElement.querySelector('.message-textarea');
    const shiftEnterEvent = new KeyboardEvent('keydown', { key: 'Enter', shiftKey: true });
    
    textarea.dispatchEvent(shiftEnterEvent);
    
    expect(component.messageSent.emit).not.toHaveBeenCalled();
  });

  it('should not send empty or whitespace-only messages', () => {
    spyOn(component.messageSent, 'emit');
    
    // Test empty message
    component.messageText = '';
    component.sendMessage();
    expect(component.messageSent.emit).not.toHaveBeenCalled();
    
    // Test whitespace-only message
    component.messageText = '   ';
    component.sendMessage();
    expect(component.messageSent.emit).not.toHaveBeenCalled();
  });

  it('should disable send button when message is empty', () => {
    component.messageText = '';
    fixture.detectChanges();
    
    const sendButton = fixture.nativeElement.querySelector('.send-button');
    expect(sendButton.disabled).toBe(true);
    expect(sendButton.classList.contains('disabled')).toBe(true);
  });

  it('should enable send button when message has content', () => {
    component.messageText = 'Test message';
    fixture.detectChanges();
    
    const sendButton = fixture.nativeElement.querySelector('.send-button');
    expect(sendButton.disabled).toBe(false);
    expect(sendButton.classList.contains('disabled')).toBe(false);
  });

  it('should disable input when disabled prop is true', () => {
    component.disabled = true;
    fixture.detectChanges();
    
    const textarea = fixture.nativeElement.querySelector('.message-textarea');
    const sendButton = fixture.nativeElement.querySelector('.send-button');
    
    expect(textarea.disabled).toBe(true);
    expect(sendButton.disabled).toBe(true);
  });

  it('should show character count', () => {
    component.messageText = 'Hello';
    fixture.detectChanges();
    
    const characterCount = fixture.nativeElement.querySelector('.character-count');
    expect(characterCount.textContent.trim()).toBe('5/5000');
  });

  it('should show warning when approaching character limit', () => {
    component.messageText = 'a'.repeat(4500);
    fixture.detectChanges();
    
    const characterCount = fixture.nativeElement.querySelector('.character-count');
    expect(characterCount.classList.contains('warning')).toBe(true);
  });

  it('should not allow sending messages over character limit', () => {
    component.messageText = 'a'.repeat(5001);
    
    expect(component.canSend).toBe(false);
  });

  it('should trim whitespace from sent messages', () => {
    spyOn(component.messageSent, 'emit');
    
    component.messageText = '  Test message  ';
    component.sendMessage();
    
    expect(component.messageSent.emit).toHaveBeenCalledWith('Test message');
  });
});