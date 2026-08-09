import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-not-found',
  standalone: true,
  imports: [RouterLink],
  template: `
    <div class="min-h-[60vh] flex items-center justify-center px-4">
      <div class="text-center">
        <h1 class="text-6xl font-bold text-gray-900 mb-4">404</h1>
        <p class="text-xl text-gray-600 mb-8">Page not found</p>
        <a routerLink="/"
           class="inline-block bg-indigo-600 text-white px-6 py-3 rounded-lg
                  hover:bg-indigo-700 transition-colors">
          Go Home
        </a>
      </div>
    </div>
  `
})
export class NotFoundComponent {}
