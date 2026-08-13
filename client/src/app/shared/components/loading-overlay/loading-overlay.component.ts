import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-loading-overlay',
  standalone: true,
  template: `
    <div class="fixed inset-0 bg-white/80 backdrop-blur-sm z-50 flex items-center justify-center">
      <div class="text-center">
        <div class="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto"></div>
        @if (label) {
          <p class="mt-4 text-gray-600">{{ label }}</p>
        }
      </div>
    </div>
  `
})
export class LoadingOverlayComponent {
  @Input() label?: string;
}
