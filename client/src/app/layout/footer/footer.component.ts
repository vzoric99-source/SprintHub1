// ============================================================================
// SPRINTHUB - Footer Component
// ============================================================================

import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [RouterLink],
  template: `
    <footer class="bg-gray-900 text-gray-300">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div class="flex flex-col md:flex-row items-center justify-between gap-4">
          <!-- Brand -->
          <div class="flex items-center gap-2">
            <div class="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
              <span class="text-white font-bold text-lg">S</span>
            </div>
            <span class="text-white font-bold">SprintHub</span>
          </div>

          <!-- Links -->
          <div class="flex items-center gap-6 text-sm">
            <a routerLink="/" class="hover:text-white transition-colors">Home</a>
            <a href="#" class="hover:text-white transition-colors">Help</a>
            <a href="#" class="hover:text-white transition-colors">Privacy</a>
            <a href="#" class="hover:text-white transition-colors">Terms</a>
          </div>

          <!-- Copyright -->
          <p class="text-sm">&copy; {{ currentYear }} SprintHub</p>
        </div>
      </div>
    </footer>
  `,
})
export class FooterComponent {
  currentYear = new Date().getFullYear();
}
