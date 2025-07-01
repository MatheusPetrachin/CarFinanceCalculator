import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app.component';
import { provideHttpClient } from '@angular/common/http';
import { provideAnimations } from '@angular/platform-browser/animations';

const bootstrap = () => bootstrapApplication(AppComponent, {
  providers: [
    provideHttpClient(),
    provideAnimations()
  ]
});

export default bootstrap; 