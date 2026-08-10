import { Component } from '@angular/core';
import { NavbarComponent } from './navbar/navbar.component';
import { FooterComponent } from './footer/footer.component';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [NavbarComponent, FooterComponent],
  template: `
    <div class="min-h-screen flex flex-col bg-gradient-to-b from-white to-gray-50">
      <app-navbar />
      <main class="flex-1">
        <ng-content />
      </main>
      <app-footer />
    </div>
  `
})
export class LayoutComponent {}
