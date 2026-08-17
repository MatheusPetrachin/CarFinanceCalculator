import 'zone.js/node';

import { registerLocaleData } from '@angular/common';
import localePt from '@angular/common/locales/pt';
import { LOCALE_ID } from '@angular/core';
import { BootstrapContext, bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app.component';
import { provideHttpClient, withFetch } from '@angular/common/http';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideServerRendering } from '@angular/ssr';

registerLocaleData(localePt);

const bootstrap = (context: BootstrapContext) => bootstrapApplication(AppComponent, {
  providers: [
    provideHttpClient(withFetch()),
    provideAnimations(),
    provideServerRendering(),
    { provide: LOCALE_ID, useValue: 'pt-BR' }
  ]
}, context);

export default bootstrap;
