// ============================================================================
// SPRINTHUB - Workspaces Page Component
// Workspace list with inline sprints
// ============================================================================

import { Component, inject, signal, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import {
  featherPlus,
  featherSearch,
  featherFolder,
  featherTrello,
  featherMoreVertical,
  featherEdit2,
  featherTrash2,
  featherChevronDown,
  featherChevronRight,
} from '@ng-icons/feather-icons';
import { WorkspacesService, SprintsService } from '../../core/services';
import { Workspace, CreateWorkspaceDto, Sprint } from '../../core/models';
import { ModalComponent } from '../../shared/components/modal/modal.component';
import { InputComponent } from '../../shared/components/input/input.component';
import { ButtonComponent } from '../../shared/components/button/button.component';
import { WORKSPACE_COLORS } from '../../shared/constants/colors';

@Component({
  selector: 'app-projects',
  standalone: true,
  imports: [FormsModule, NgIconComponent, ModalComponent, InputComponent, ButtonComponent],
  viewProviders: [
    provideIcons({
      featherPlus,
      featherSearch,
      featherFolder,
      featherTrello,
      featherMoreVertical,
      featherEdit2,
      featherTrash2,
      featherChevronDown,
      featherChevronRight,
    }),
  ],
  template: `
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <!-- Header -->
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 class="text-2xl font-bold text-gray-900">My Workspaces</h1>
          <p class="text-gray-600">Manage your workspaces and sprints</p>
        </div>
        <app-button (click)="openCreateModal()">
          <ng-icon name="featherPlus" class="text-lg" />
          New Workspace
        </app-button>
      </div>

      <!-- Search -->
      <div class="relative mb-6">
        <ng-icon name="featherSearch" class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input type="text"
               [(ngModel)]="searchQuery"
               (ngModelChange)="onSearch()"
               placeholder="Search workspaces..."
               class="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg
                      focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" />
      </div>

      <!-- Loading -->
      @if (workspacesService.loading()) {
        <div class="flex items-center justify-center py-12">
          <div class="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      } @else {
        <!-- Workspaces List -->
        @if (workspacesService.workspaces().length === 0) {
          <div class="text-center py-12 bg-gray-50 rounded-xl">
            <ng-icon name="featherFolder" class="text-5xl text-gray-300 mx-auto mb-4" />
            <h3 class="text-lg font-medium text-gray-900 mb-2">No workspaces</h3>
            <p class="text-gray-600 mb-4">Create your first workspace to get started</p>
            <app-button (click)="openCreateModal()">
              <ng-icon name="featherPlus" class="text-lg" />
              New Workspace
            </app-button>
          </div>
        } @else {
          <div class="space-y-4">
            @for (workspace of workspacesService.workspaces(); track workspace.id) {
              <div class="bg-white rounded-xl border border-gray-200">
                <!-- Workspace Header -->
                <div class="flex items-center gap-4 p-4 cursor-pointer hover:bg-gray-50"
                     (click)="toggleWorkspace(workspace.id)">
                  <!-- Icon dot -->
                  <div class="w-3 h-3 rounded-full flex-shrink-0"
                       [style.background-color]="workspace.icon"></div>

                  <!-- Expand icon -->
                  <ng-icon [name]="expandedWorkspaces().has(workspace.id) ? 'featherChevronDown' : 'featherChevronRight'"
                           class="text-gray-400" />

                  <!-- Workspace name -->
                  <div class="flex-1 min-w-0">
                    <h3 class="font-semibold text-gray-900 truncate">{{ workspace.name }}</h3>
                    @if (workspace.description) {
                      <p class="text-sm text-gray-500 truncate">{{ workspace.description }}</p>
                    }
                  </div>

                  <!-- Sprints count -->
                  <div class="flex items-center gap-1 text-sm text-gray-500">
                    <ng-icon name="featherTrello" />
                    <span>{{ workspace._count?.sprints || 0 }}</span>
                  </div>

                  <!-- Actions menu -->
                  <div class="relative">
                    <button (click)="toggleMenu($event, workspace.id)"
                            class="p-2 text-gray-400 hover:text-gray-600 rounded hover:bg-gray-100">
                      <ng-icon name="featherMoreVertical" />
                    </button>
                    @if (activeMenu() === workspace.id) {
                      <div class="absolute right-0 mt-1 w-40 bg-white rounded-lg shadow-lg border
                                  border-gray-200 py-1 z-10">
                        <button (click)="openEditModal(workspace)"
                                class="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-700
                                       hover:bg-gray-50">
                          <ng-icon name="featherEdit2" />
                          Edit
                        </button>
                        <button (click)="deleteWorkspace(workspace)"
                                class="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-600
                                       hover:bg-red-50">
                          <ng-icon name="featherTrash2" />
                          Delete
                        </button>
                      </div>
                    }
                  </div>
                </div>

                <!-- Expanded Sprints -->
                @if (expandedWorkspaces().has(workspace.id)) {
                  <div class="border-t border-gray-100 bg-gray-50 px-4 py-3">
                    <!-- Loading sprints -->
                    @if (loadingSprints().has(workspace.id)) {
                      <div class="flex items-center gap-2 text-sm text-gray-500 py-2">
                        <div class="w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                        Loading sprints...
                      </div>
                    } @else {
                      @if (workspaceSprints()[workspace.id]?.length === 0) {
                        <div class="text-sm text-gray-500 py-2">No sprints in this workspace</div>
                      } @else {
                        <div class="space-y-2">
                          @for (sprint of workspaceSprints()[workspace.id]; track sprint.id) {
                            <button (click)="openSprint(sprint.id)"
                                    class="flex items-center gap-3 w-full p-3 bg-white rounded-lg border
                                           border-gray-200 hover:border-indigo-300 hover:shadow-sm
                                           transition-all text-left">
                              <ng-icon name="featherTrello" class="text-indigo-500" />
                              <span class="font-medium text-gray-700 flex-1">{{ sprint.name }}</span>
                              <span class="text-xs px-2 py-0.5 rounded-full"
                                    [class.bg-yellow-100]="sprint.status === 'PLANNING'"
                                    [class.text-yellow-700]="sprint.status === 'PLANNING'"
                                    [class.bg-green-100]="sprint.status === 'ACTIVE'"
                                    [class.text-green-700]="sprint.status === 'ACTIVE'"
                                    [class.bg-blue-100]="sprint.status === 'COMPLETED'"
                                    [class.text-blue-700]="sprint.status === 'COMPLETED'">
                                {{ getStatusLabel(sprint.status) }}
                              </span>
                            </button>
                          }
                        </div>
                      }

                      <!-- Create Sprint Button -->
                      <button (click)="openCreateSprintModal(workspace)"
                              class="flex items-center gap-2 w-full mt-3 p-2 text-sm text-indigo-600
                                     hover:bg-indigo-50 rounded-lg transition-colors">
                        <ng-icon name="featherPlus" />
                        New Sprint
                      </button>
                    }
                  </div>
                }
              </div>
            }
          </div>

          <!-- Pagination -->
          @if (workspacesService.pagination().totalPages > 1) {
            <div class="flex items-center justify-center gap-2 mt-8">
              @for (page of pages(); track page) {
                <button (click)="goToPage(page)"
                        [class.bg-indigo-600]="page === workspacesService.pagination().page"
                        [class.text-white]="page === workspacesService.pagination().page"
                        [class.bg-white]="page !== workspacesService.pagination().page"
                        [class.text-gray-700]="page !== workspacesService.pagination().page"
                        class="w-10 h-10 rounded-lg border border-gray-300 hover:bg-gray-50
                               transition-colors font-medium">
                  {{ page }}
                </button>
              }
            </div>
          }
        }
      }
    </div>

    <!-- Create/Edit Workspace Modal -->
    @if (showModal()) {
      <app-modal [title]="editingWorkspace() ? 'Edit Workspace' : 'New Workspace'" (closed)="closeModal()">
        <form (ngSubmit)="saveWorkspace()" class="p-4 space-y-4">
          <app-input label="Workspace Name" [(value)]="formData.name" [required]="true" />
          <app-input label="Description (optional)" [(value)]="formData.description" [rows]="3" />

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Icon (color)</label>
            <div class="flex gap-2">
              @for (color of colors; track color) {
                <button type="button"
                        (click)="formData.icon = color"
                        [class.ring-2]="formData.icon === color"
                        [class.ring-offset-2]="formData.icon === color"
                        class="w-8 h-8 rounded-full ring-gray-400"
                        [style.background-color]="color">
                </button>
              }
            </div>
          </div>

          <div class="flex gap-3 pt-4">
            <app-button variant="secondary" class="flex-1" (click)="closeModal()">Cancel</app-button>
            <app-button type="submit" class="flex-1" [disabled]="!formData.name">
              {{ editingWorkspace() ? 'Save' : 'Create' }}
            </app-button>
          </div>
        </form>
      </app-modal>
    }

    <!-- Create Sprint Modal -->
    @if (showSprintModal()) {
      <app-modal title="New Sprint" (closed)="closeSprintModal()">
        <form (ngSubmit)="createSprint()" class="p-4 space-y-4">
          <app-input label="Sprint Name" [(value)]="sprintName" [required]="true" />

          <div class="flex gap-3 pt-4">
            <app-button variant="secondary" class="flex-1" (click)="closeSprintModal()">Cancel</app-button>
            <app-button type="submit" class="flex-1" [disabled]="!sprintName">Create</app-button>
          </div>
        </form>
      </app-modal>
    }

    <!-- Delete Confirmation Modal -->
    @if (workspaceToDelete()) {
      <app-modal title="Delete Workspace" (closed)="cancelDelete()" maxWidth="max-w-sm">
        <div class="p-4">
          @if (deleteError()) {
            <div class="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p class="text-sm text-red-700 text-center">{{ deleteError() }}</p>
            </div>
          }
          <p class="text-center text-gray-700 mb-4">
            Are you sure you want to delete workspace <strong>{{ workspaceToDelete()?.name }}</strong>?
          </p>
          <div class="flex gap-2">
            <app-button variant="secondary" class="flex-1" (click)="cancelDelete()">Cancel</app-button>
            <app-button variant="danger" class="flex-1" (click)="confirmDelete()" [loading]="deleting()" loadingText="Deleting...">Delete</app-button>
          </div>
        </div>
      </app-modal>
    }
  `,
})
export class ProjectsComponent implements OnInit, OnDestroy {
  workspacesService = inject(WorkspacesService);
  sprintsService = inject(SprintsService);
  router = inject(Router);

  searchQuery = '';
  showModal = signal(false);
  showSprintModal = signal(false);
  editingWorkspace = signal<Workspace | null>(null);
  activeMenu = signal<number | null>(null);
  workspaceToDelete = signal<Workspace | null>(null);
  deleteError = signal<string | null>(null);
  deleting = signal(false);
  expandedWorkspaces = signal<Set<number>>(new Set());
  loadingSprints = signal<Set<number>>(new Set());
  workspaceSprints = signal<Record<number, Sprint[]>>({});
  selectedWorkspaceForSprint = signal<Workspace | null>(null);
  sprintName = '';
  private searchTimeout: ReturnType<typeof setTimeout> | null = null;
  private clickHandler = () => this.activeMenu.set(null);

  formData: CreateWorkspaceDto = {
    name: '',
    description: '',
    icon: '#6366f1',
  };

  colors = WORKSPACE_COLORS;

  ngOnInit() {
    this.loadWorkspaces();
    document.addEventListener('click', this.clickHandler);
  }

  ngOnDestroy() {
    document.removeEventListener('click', this.clickHandler);
    if (this.searchTimeout) clearTimeout(this.searchTimeout);
  }

  loadWorkspaces() {
    this.workspacesService.list({ q: this.searchQuery }).subscribe();
  }

  onSearch() {
    if (this.searchTimeout) clearTimeout(this.searchTimeout);
    this.searchTimeout = setTimeout(() => this.loadWorkspaces(), 350);
  }

  pages() {
    const { page, totalPages } = this.workspacesService.pagination();
    const pages: number[] = [];
    for (let i = 1; i <= totalPages; i++) {
      pages.push(i);
    }
    return pages;
  }

  goToPage(page: number) {
    this.workspacesService.list({ q: this.searchQuery, page }).subscribe();
  }

  toggleWorkspace(workspaceId: number) {
    const expanded = new Set(this.expandedWorkspaces());
    if (expanded.has(workspaceId)) {
      expanded.delete(workspaceId);
    } else {
      expanded.add(workspaceId);
      this.loadSprintsForWorkspace(workspaceId);
    }
    this.expandedWorkspaces.set(expanded);
  }

  loadSprintsForWorkspace(workspaceId: number) {
    if (this.workspaceSprints()[workspaceId]) return;

    const loading = new Set(this.loadingSprints());
    loading.add(workspaceId);
    this.loadingSprints.set(loading);

    this.sprintsService.list(workspaceId).subscribe({
      next: (sprints: Sprint[]) => {
        const allSprints = { ...this.workspaceSprints() };
        allSprints[workspaceId] = sprints;
        this.workspaceSprints.set(allSprints);

        const loadingSet = new Set(this.loadingSprints());
        loadingSet.delete(workspaceId);
        this.loadingSprints.set(loadingSet);
      },
      error: () => {
        const loadingSet = new Set(this.loadingSprints());
        loadingSet.delete(workspaceId);
        this.loadingSprints.set(loadingSet);
      },
    });
  }

  openSprint(sprintId: number) {
    this.router.navigate(['/sprints', sprintId]);
  }

  getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      PLANNING: 'Planning',
      ACTIVE: 'Active',
      COMPLETED: 'Completed',
    };
    return labels[status] || status;
  }

  toggleMenu(event: Event, workspaceId: number) {
    event.stopPropagation();
    this.activeMenu.update((id) => (id === workspaceId ? null : workspaceId));
  }

  openCreateModal() {
    this.editingWorkspace.set(null);
    this.formData = { name: '', description: '', icon: '#6366f1' };
    this.showModal.set(true);
  }

  openEditModal(workspace: Workspace) {
    this.editingWorkspace.set(workspace);
    this.formData = {
      name: workspace.name,
      description: workspace.description || '',
      icon: workspace.icon,
    };
    this.activeMenu.set(null);
    this.showModal.set(true);
  }

  closeModal() {
    this.showModal.set(false);
    this.editingWorkspace.set(null);
  }

  saveWorkspace() {
    const editing = this.editingWorkspace();
    if (editing) {
      this.workspacesService.update(editing.id, this.formData).subscribe(() => {
        this.closeModal();
      });
    } else {
      this.workspacesService.create(this.formData).subscribe(() => {
        this.closeModal();
      });
    }
  }

  openCreateSprintModal(workspace: Workspace) {
    this.selectedWorkspaceForSprint.set(workspace);
    this.sprintName = '';
    this.showSprintModal.set(true);
  }

  closeSprintModal() {
    this.showSprintModal.set(false);
    this.selectedWorkspaceForSprint.set(null);
    this.sprintName = '';
  }

  createSprint() {
    const workspace = this.selectedWorkspaceForSprint();
    if (!workspace || !this.sprintName.trim()) return;

    this.sprintsService.create(workspace.id, { name: this.sprintName.trim() }).subscribe({
      next: (sprint) => {
        const allSprints = { ...this.workspaceSprints() };
        allSprints[workspace.id] = [...(allSprints[workspace.id] || []), sprint];
        this.workspaceSprints.set(allSprints);

        this.closeSprintModal();
        this.loadWorkspaces();
      },
    });
  }

  deleteWorkspace(workspace: Workspace) {
    this.activeMenu.set(null);
    this.workspaceToDelete.set(workspace);
  }

  cancelDelete() {
    this.workspaceToDelete.set(null);
    this.deleteError.set(null);
    this.deleting.set(false);
  }

  confirmDelete() {
    const workspace = this.workspaceToDelete();
    if (workspace) {
      this.deleting.set(true);
      this.deleteError.set(null);

      this.workspacesService.delete(workspace.id).subscribe({
        next: () => {
          this.workspaceToDelete.set(null);
          this.deleting.set(false);
        },
        error: (err) => {
          this.deleting.set(false);
          const msg = err?.error?.message || '';
          if (msg.includes('owner')) {
            this.deleteError.set('Only the workspace creator can delete it.');
          } else {
            this.deleteError.set('Error deleting workspace. Please try again.');
          }
        },
      });
    }
  }
}
