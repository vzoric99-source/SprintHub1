// ============================================================================
// SPRINTHUB - Global Loading Overlay Component
// ============================================================================

import { Component, inject, computed } from '@angular/core';
import { AuthService, WorkspacesService, SprintsService } from '../../../core/services';
import { LoadingOverlayComponent } from '../loading-overlay/loading-overlay.component';

@Component({
  selector: 'app-global-loading-overlay',
  standalone: true,
  imports: [LoadingOverlayComponent],
  template: `
    @if (isLoading()) {
      <app-loading-overlay />
    }
  `,
})
export class GlobalLoadingOverlayComponent {
  private auth = inject(AuthService);
  private workspaces = inject(WorkspacesService);
  private sprints = inject(SprintsService);

  isLoading = computed(() => {
    return (
      this.auth.status() === 'loading' ||
      this.workspaces.loading() ||
      this.sprints.loading()
    );
  });
}
