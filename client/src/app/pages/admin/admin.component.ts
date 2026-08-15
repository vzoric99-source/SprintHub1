// ============================================================================
// SPRINTHUB - Admin Panel Component
// User management (ADMIN only)
// ============================================================================

import { Component, inject, signal, OnInit, OnDestroy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import {
  featherUsers,
  featherSearch,
  featherEdit2,
  featherTrash2,
  featherShield,
  featherUser,
  featherAlertCircle,
  featherChevronLeft,
  featherChevronRight,
} from '@ng-icons/feather-icons';
import { UsersService, UserFull, UsersResponse, AuthService } from '../../core/services';
import { ModalComponent } from '../../shared/components/modal/modal.component';
import { ButtonComponent } from '../../shared/components/button/button.component';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [FormsModule, NgIconComponent, ModalComponent, ButtonComponent],
  viewProviders: [
    provideIcons({
      featherUsers,
      featherSearch,
      featherEdit2,
      featherTrash2,
      featherShield,
      featherUser,
      featherAlertCircle,
      featherChevronLeft,
      featherChevronRight,
    }),
  ],
  template: `
    <div class="min-h-[calc(100vh-64px)] bg-gray-100 py-8">
      <div class="max-w-6xl mx-auto px-4">
        <!-- Header -->
        <div class="flex items-center justify-between mb-6">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center">
              <ng-icon name="featherUsers" class="text-white text-xl" />
            </div>
            <div>
              <h1 class="text-2xl font-bold text-gray-900">Admin Panel</h1>
              <p class="text-sm text-gray-500">User Management</p>
            </div>
          </div>
        </div>

        <!-- Search -->
        <div class="bg-white rounded-xl border border-gray-200 shadow-sm p-4 mb-6">
          <div class="relative">
            <ng-icon name="featherSearch" class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              [(ngModel)]="searchQuery"
              (ngModelChange)="onSearch()"
              placeholder="Search users by name or email..."
              class="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
        </div>

        <!-- Users Table -->
        <div class="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          @if (loading()) {
            <div class="flex items-center justify-center py-12">
              <div class="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
          } @else if (users().length === 0) {
            <div class="text-center py-12 text-gray-500">
              <ng-icon name="featherUsers" class="text-4xl mb-2" />
              <p>No users</p>
            </div>
          } @else {
            <table class="w-full">
              <thead class="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th class="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                  <th class="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                  <th class="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Stats</th>
                  <th class="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Registered</th>
                  <th class="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-200">
                @for (user of users(); track user.id) {
                  <tr class="hover:bg-gray-50">
                    <!-- User Info -->
                    <td class="px-6 py-4">
                      <div class="flex items-center gap-3">
                        <div class="w-10 h-10 rounded-full flex items-center justify-center"
                             [class.bg-purple-100]="user.role === 'ADMIN'"
                             [class.bg-blue-100]="user.role === 'MODERATOR'"
                             [class.bg-gray-100]="user.role === 'USER'">
                          <span class="font-medium"
                                [class.text-purple-600]="user.role === 'ADMIN'"
                                [class.text-blue-600]="user.role === 'MODERATOR'"
                                [class.text-gray-600]="user.role === 'USER'">
                            {{ user.name.charAt(0).toUpperCase() }}
                          </span>
                        </div>
                        <div>
                          <p class="font-medium text-gray-900">{{ user.name }}</p>
                          <p class="text-sm text-gray-500">{{ user.email }}</p>
                        </div>
                      </div>
                    </td>

                    <!-- Role -->
                    <td class="px-6 py-4">
                      <span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium"
                            [class.bg-purple-100]="user.role === 'ADMIN'"
                            [class.text-purple-700]="user.role === 'ADMIN'"
                            [class.bg-blue-100]="user.role === 'MODERATOR'"
                            [class.text-blue-700]="user.role === 'MODERATOR'"
                            [class.bg-gray-100]="user.role === 'USER'"
                            [class.text-gray-700]="user.role === 'USER'">
                        <ng-icon [name]="user.role === 'ADMIN' ? 'featherShield' : 'featherUser'" class="text-xs" />
                        {{ getRoleLabel(user.role) }}
                      </span>
                    </td>

                    <!-- Stats -->
                    <td class="px-6 py-4 text-sm text-gray-500">
                      <div class="flex gap-4">
                        <span title="Workspaces">{{ user._count?.workspaces || 0 }} ws</span>
                        <span title="Created tickets">{{ user._count?.createdTickets || 0 }} tkt</span>
                      </div>
                    </td>

                    <!-- Created At -->
                    <td class="px-6 py-4 text-sm text-gray-500">
                      {{ formatDate(user.createdAt) }}
                    </td>

                    <!-- Actions -->
                    <td class="px-6 py-4 text-right">
                      <div class="flex items-center justify-end gap-2">
                        @if (user.id !== currentUserId()) {
                          <button (click)="openRoleModal(user)"
                                  class="p-2 text-gray-400 hover:text-indigo-600 rounded-lg hover:bg-indigo-50"
                                  title="Change role">
                            <ng-icon name="featherEdit2" />
                          </button>
                          <button (click)="openDeleteModal(user)"
                                  class="p-2 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50"
                                  title="Delete user">
                            <ng-icon name="featherTrash2" />
                          </button>
                        } @else {
                          <span class="text-xs text-gray-400 italic">You</span>
                        }
                      </div>
                    </td>
                  </tr>
                }
              </tbody>
            </table>

            <!-- Pagination -->
            @if (totalPages() > 1) {
              <div class="flex items-center justify-between px-6 py-4 border-t border-gray-200 bg-gray-50">
                <p class="text-sm text-gray-500">
                  Showing {{ users().length }} of {{ total() }} users
                </p>
                <div class="flex items-center gap-2">
                  <button (click)="prevPage()"
                          [disabled]="page() === 1"
                          class="p-2 rounded-lg border border-gray-300 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed">
                    <ng-icon name="featherChevronLeft" />
                  </button>
                  <span class="text-sm text-gray-600">{{ page() }} / {{ totalPages() }}</span>
                  <button (click)="nextPage()"
                          [disabled]="page() === totalPages()"
                          class="p-2 rounded-lg border border-gray-300 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed">
                    <ng-icon name="featherChevronRight" />
                  </button>
                </div>
              </div>
            }
          }
        </div>
      </div>

      <!-- Change Role Modal -->
      @if (userToEdit()) {
        <app-modal title="Change Role" (closed)="closeRoleModal()" maxWidth="max-w-sm">
          <div class="p-4">
            <p class="text-gray-700 mb-4">
              Change role for <strong>{{ userToEdit()?.name }}</strong>
            </p>

            <div class="space-y-2 mb-6">
              @for (role of availableRoles; track role.value) {
                <label class="flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors"
                       [class.border-indigo-500]="selectedRole() === role.value"
                       [class.bg-indigo-50]="selectedRole() === role.value"
                       [class.border-gray-200]="selectedRole() !== role.value"
                       [class.hover:bg-gray-50]="selectedRole() !== role.value">
                  <input type="radio"
                         [value]="role.value"
                         [checked]="selectedRole() === role.value"
                         (change)="selectedRole.set(role.value)"
                         class="text-indigo-600 focus:ring-indigo-500" />
                  <div>
                    <p class="font-medium text-gray-900">{{ role.label }}</p>
                    <p class="text-xs text-gray-500">{{ role.description }}</p>
                  </div>
                </label>
              }
            </div>

            <div class="flex gap-3">
              <app-button variant="secondary" class="flex-1" (click)="closeRoleModal()">
                Cancel
              </app-button>
              <app-button class="flex-1" (click)="saveRole()" [disabled]="saving()">
                {{ saving() ? 'Saving...' : 'Save' }}
              </app-button>
            </div>
          </div>
        </app-modal>
      }

      <!-- Delete User Modal -->
      @if (userToDelete()) {
        <app-modal title="Delete User" (closed)="closeDeleteModal()" maxWidth="max-w-sm">
          <div class="p-4 text-center">
            <div class="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <ng-icon name="featherAlertCircle" class="text-red-600 text-2xl" />
            </div>
            <p class="text-gray-700 mb-2">
              Are you sure you want to delete user
            </p>
            <p class="font-medium text-gray-900 mb-4">{{ userToDelete()?.name }}?</p>
            <p class="text-sm text-gray-500 mb-6">This action cannot be undone.</p>

            <div class="flex gap-3">
              <app-button variant="secondary" class="flex-1" (click)="closeDeleteModal()">
                Cancel
              </app-button>
              <app-button variant="danger" class="flex-1" (click)="confirmDelete()" [disabled]="saving()">
                {{ saving() ? 'Deleting...' : 'Delete' }}
              </app-button>
            </div>
          </div>
        </app-modal>
      }

      <!-- Error Modal -->
      @if (errorMessage()) {
        <app-modal title="Error" (closed)="errorMessage.set(null)" maxWidth="max-w-sm">
          <div class="p-4 text-center">
            <div class="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <ng-icon name="featherAlertCircle" class="text-red-600 text-2xl" />
            </div>
            <p class="text-gray-700 mb-4">{{ errorMessage() }}</p>
            <app-button class="w-full" (click)="errorMessage.set(null)">OK</app-button>
          </div>
        </app-modal>
      }
    </div>
  `,
})
export class AdminComponent implements OnInit, OnDestroy {
  private usersService = inject(UsersService);
  private authService = inject(AuthService);

  users = signal<UserFull[]>([]);
  loading = signal(false);
  saving = signal(false);
  page = signal(1);
  total = signal(0);
  totalPages = signal(0);
  searchQuery = '';
  private searchTimeout: ReturnType<typeof setTimeout> | null = null;

  userToEdit = signal<UserFull | null>(null);
  userToDelete = signal<UserFull | null>(null);
  selectedRole = signal<string>('USER');
  errorMessage = signal<string | null>(null);

  currentUserId = () => this.authService.user()?.id;

  availableRoles = [
    { value: 'USER', label: 'User', description: 'Can only manage their own workspaces' },
    { value: 'MODERATOR', label: 'Moderator', description: 'Can view and edit all workspaces' },
    { value: 'ADMIN', label: 'Admin', description: 'Full access, including user management' },
  ];

  ngOnInit() {
    this.loadUsers();
  }

  ngOnDestroy() {
    if (this.searchTimeout) clearTimeout(this.searchTimeout);
  }

  loadUsers() {
    this.loading.set(true);
    this.usersService.list(this.page(), 20, this.searchQuery || undefined).subscribe({
      next: (response: UsersResponse) => {
        this.users.set(response.items);
        this.total.set(response.total);
        this.totalPages.set(response.totalPages);
        this.loading.set(false);
      },
      error: (err) => {
        this.errorMessage.set(err.error?.message || 'Error loading users');
        this.loading.set(false);
      },
    });
  }

  onSearch() {
    if (this.searchTimeout) clearTimeout(this.searchTimeout);
    this.searchTimeout = setTimeout(() => {
      this.page.set(1);
      this.loadUsers();
    }, 350);
  }

  prevPage() {
    if (this.page() > 1) {
      this.page.update(p => p - 1);
      this.loadUsers();
    }
  }

  nextPage() {
    if (this.page() < this.totalPages()) {
      this.page.update(p => p + 1);
      this.loadUsers();
    }
  }

  // ===== Role Management =====

  openRoleModal(user: UserFull) {
    this.userToEdit.set(user);
    this.selectedRole.set(user.role);
  }

  closeRoleModal() {
    this.userToEdit.set(null);
  }

  saveRole() {
    const user = this.userToEdit();
    if (!user) return;

    this.saving.set(true);
    this.usersService.updateRole(user.id, this.selectedRole()).subscribe({
      next: () => {
        this.saving.set(false);
        this.closeRoleModal();
        this.loadUsers();
      },
      error: (err) => {
        this.saving.set(false);
        this.errorMessage.set(err.error?.message || 'Error changing role');
      },
    });
  }

  // ===== Delete User =====

  openDeleteModal(user: UserFull) {
    this.userToDelete.set(user);
  }

  closeDeleteModal() {
    this.userToDelete.set(null);
  }

  confirmDelete() {
    const user = this.userToDelete();
    if (!user) return;

    this.saving.set(true);
    this.usersService.delete(user.id).subscribe({
      next: () => {
        this.saving.set(false);
        this.closeDeleteModal();
        this.loadUsers();
      },
      error: (err) => {
        this.saving.set(false);
        this.errorMessage.set(err.error?.message || 'Error deleting user');
      },
    });
  }

  // ===== Helpers =====

  getRoleLabel(role: string): string {
    const labels: Record<string, string> = {
      ADMIN: 'Admin',
      MODERATOR: 'Moderator',
      USER: 'User',
    };
    return labels[role] || role;
  }

  formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString('en-US', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  }
}
