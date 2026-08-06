// ============================================================================
// SPRINTHUB - Tags Service
// ============================================================================

import { Injectable, inject, signal } from '@angular/core';
import { ApiService } from './api.service';
import { Tag, CreateTagDto, UpdateTagDto } from '../models';
import { tap } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class TagsService {
  private api = inject(ApiService);

  private _tags = signal<Tag[]>([]);
  private _loading = signal(false);

  readonly tags = this._tags.asReadonly();
  readonly loading = this._loading.asReadonly();

  list(workspaceId: number) {
    this._loading.set(true);
    return this.api.get<Tag[]>('/tags', { workspaceId }).pipe(
      tap((tags) => {
        this._tags.set(tags);
        this._loading.set(false);
      })
    );
  }

  create(dto: CreateTagDto) {
    return this.api.post<Tag>('/tags', dto).pipe(
      tap((tag) => {
        this._tags.update((list) => [...list, tag]);
      })
    );
  }

  update(id: number, dto: UpdateTagDto) {
    return this.api.put<Tag>(`/tags/${id}`, dto).pipe(
      tap((updated) => {
        this._tags.update((list) =>
          list.map((t) => (t.id === id ? updated : t))
        );
      })
    );
  }

  delete(id: number, force = false) {
    const url = force ? `/tags/${id}?force=true` : `/tags/${id}`;
    return this.api.delete<{ message: string }>(url).pipe(
      tap(() => {
        this._tags.update((list) => list.filter((t) => t.id !== id));
      })
    );
  }
}
