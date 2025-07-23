import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

// Import Prism and its components directly
import 'prismjs';
import 'prismjs/components/prism-typescript';
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-css';
import 'prismjs/components/prism-scss';
import 'prismjs/components/prism-json';
import 'prismjs/components/prism-markdown';
import 'prismjs/components/prism-bash';
import 'prismjs/components/prism-python';
import 'prismjs/components/prism-java';
import 'prismjs/components/prism-csharp';
import 'prismjs/components/prism-sql';

declare var Prism: any;

@Injectable({
  providedIn: 'root'
})
export class PrismService {
  private isBrowser: boolean;

  constructor(@Inject(PLATFORM_ID) private platformId: object) {
    this.isBrowser = isPlatformBrowser(this.platformId);
  }

  highlightAll() {
    if (this.isBrowser) {
      Prism.highlightAll();
    }
  }

  highlightElement(element: HTMLElement) {
    if (this.isBrowser) {
      Prism.highlightElement(element);
    }
  }
}
