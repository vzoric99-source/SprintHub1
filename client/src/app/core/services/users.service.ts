// ============================================================================
// SPRINTHUB - Users Service
// Fetching user list for assignee dropdown
// ============================================================================

import { Injectable, inject, signal } from '@angular/core';
import { ApiService } from './api.service';
import { tap } from 'rxjs';

export interface UserBasic {
  id: number;
  name: string;
  email: string;
}

export interface UserFull extends UserBasic {
  role: string;
  createdAt: string;
  _count?: {
    workspaces: number;
    createdTickets: number;
    assignedTickets: number;
  };
}

export interface UsersResponse {
  items: UserFull[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

@Injectable({ providedIn: 'root' })
export class UsersService {
  private api = inject(ApiService);

  private _users = signal<UserBasic[]>([]);
  private _loading = signal(false);

  readonly users = this._users.asReadonly();
  readonly loading = this._loading.asReadonly();

  // User list for dropdown (available to all logged-in users)
  listForDropdown() {
    this._loading.set(true);
    return this.api.get<UserBasic[]>('/users/list').pipe(
      tap((users) => {
        this._users.set(users);
        this._loading.set(false);
      })
    );
  }

  // Full user list (ADMIN only)
  list(page = 1, pageSize = 20, q?: string) {
    const params: any = { page, pageSize };
    if (q) params.q = q;
    return this.api.get<UsersResponse>('/users', params);
  }

  // Get user by ID (ADMIN only)
  get(id: number) {
    return this.api.get<UserFull>(`/users/${id}`);
  }

  // Change user role (ADMIN only)
  updateRole(id: number, role: string) {
    return this.api.patch<UserBasic>(`/users/${id}/role`, { role });
  }

  // Delete user (ADMIN only)
  delete(id: number) {
    return this.api.delete<{ message: string }>(`/users/${id}`);
  }

  // Clear list
  clear() {
    this._users.set([]);
  }
}
