import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app.component';
import { importProvidersFrom } from '@angular/core';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { MarkdownModule, MARKED_OPTIONS } from 'ngx-markdown';

bootstrapApplication(AppComponent, {
  providers: [
    importProvidersFrom(
      BrowserAnimationsModule,
      FormsModule,
      ReactiveFormsModule,
      HttpClientModule,
      MarkdownModule.forRoot({
        markedOptions: {
          provide: MARKED_OPTIONS,
          useValue: {
            gfm: true,
            breaks: false,
            pedantic: false,
          },
        },
      })
    )
  ]
}).catch(err => console.error(err));