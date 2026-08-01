import { Component, inject, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { LayoutComponent } from './layout/layout.component';
import { AuthService } from './core/services/auth.service';
import { GlobalLoadingOverlayComponent } from './shared/components/global-loading-overlay/global-loading-overlay.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, LayoutComponent, GlobalLoadingOverlayComponent],
  template: `
    <app-global-loading-overlay />
    <app-layout>
      <router-outlet />
    </app-layout>
  `
})
export class App implements OnInit {
  auth = inject(AuthService);

  ngOnInit(): void {
    if (this.auth.isAuthenticated()) {
      this.auth.refresh().subscribe();
    }
  }
}
