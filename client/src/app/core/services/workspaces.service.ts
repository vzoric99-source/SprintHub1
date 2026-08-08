// ============================================================================
// SPRINTHUB - Workspaces Service
// ============================================================================

import { Injectable, inject, signal } from '@angular/core';
import { ApiService } from './api.service';
import {
  Workspace,
  WorkspaceFilters,
  CreateWorkspaceDto,
  UpdateWorkspaceDto,
  PaginatedResponse,
} from '../models';
import { tap } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class WorkspacesService {
  private api = inject(ApiService);

  private _workspaces = signal<Workspace[]>([]);
  private _currentWorkspace = signal<Workspace | null>(null);
  private _loading = signal(false);
  private _pagination = signal({ page: 1, pageSize: 12, total: 0, totalPages: 0 });

  readonly workspaces = this._workspaces.asReadonly();
  readonly currentWorkspace = this._currentWorkspace.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly pagination = this._pagination.asReadonly();

  list(filters?: WorkspaceFilters) {
    this._loading.set(true);
    return this.api.get<PaginatedResponse<Workspace>>('/workspaces', filters).pipe(
      tap((res) => {
        this._workspaces.set(res.items);
        this._pagination.set({
          page: res.page,
          pageSize: res.pageSize,
          total: res.total,
          totalPages: res.totalPages,
        });
        this._loading.set(false);
      })
    );
  }

  get(id: number) {
    this._loading.set(true);
    return this.api.get<Workspace>(`/workspaces/${id}`).pipe(
      tap((workspace) => {
        this._currentWorkspace.set(workspace);
        this._loading.set(false);
      })
    );
  }

  create(dto: CreateWorkspaceDto) {
    return this.api.post<Workspace>('/workspaces', dto).pipe(
      tap((workspace) => {
        this._workspaces.update((list) => [workspace, ...list]);
      })
    );
  }

  update(id: number, dto: UpdateWorkspaceDto) {
    return this.api.put<Workspace>(`/workspaces/${id}`, dto).pipe(
      tap((updated) => {
        this._workspaces.update((list) =>
          list.map((w) => (w.id === id ? updated : w))
        );
        if (this._currentWorkspace()?.id === id) {
          this._currentWorkspace.set(updated);
        }
      })
    );
  }

  delete(id: number) {
    return this.api.delete<{ message: string }>(`/workspaces/${id}`).pipe(
      tap(() => {
        this._workspaces.update((list) => list.filter((w) => w.id !== id));
        if (this._currentWorkspace()?.id === id) {
          this._currentWorkspace.set(null);
        }
      })
    );
  }

  clearCurrent() {
    this._currentWorkspace.set(null);
  }
}
