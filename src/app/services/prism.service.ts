import { Injectable } from '@angular/core';

declare var Prism: any;

@Injectable({
  providedIn: 'root'
})
export class PrismService {
  private prismLoaded = false;

  async loadPrism(): Promise<any> {
    if (this.prismLoaded) {
      return Promise.resolve(typeof Prism !== 'undefined' ? Prism : null);
    }

    try {
      // Load Prism core
      await import('prismjs');
      
      // Load language components without type checking
      await this.loadLanguageComponents();

      this.prismLoaded = true;
      return typeof Prism !== 'undefined' ? Prism : null;
    } catch (error) {
      console.error('Failed to load Prism:', error);
      return null;
    }
  }

  private async loadLanguageComponents(): Promise<void> {
    const languages = [
      'typescript', 'javascript', 'css', 'scss', 'json', 
      'markdown', 'bash', 'python', 'java', 'csharp', 'sql'
    ];

    // Load languages sequentially to avoid conflicts
    for (const lang of languages) {
      try {
        await import(`prismjs/components/prism-${lang}.js`);
      } catch (error) {
        console.warn(`Failed to load Prism language: ${lang}`, error);
      }
    }
  }

  async highlightElement(element: HTMLElement): Promise<void> {
    const prism = await this.loadPrism();
    if (prism && prism.highlightElement) {
      try {
        prism.highlightElement(element);
      } catch (error) {
        console.warn('Failed to highlight element:', error);
      }
    }
  }

  async highlightAll(container?: HTMLElement): Promise<void> {
    const prism = await this.loadPrism();
    if (prism && prism.highlightAllUnder) {
      try {
        prism.highlightAllUnder(container || document);
      } catch (error) {
        console.warn('Failed to highlight all elements:', error);
      }
    }
  }
}