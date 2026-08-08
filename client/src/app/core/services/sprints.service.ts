// ============================================================================
// SPRINTHUB - Sprints Service
// ============================================================================

import { Injectable, inject, signal } from '@angular/core';
import { ApiService } from './api.service';
import {
  Sprint,
  Stage,
  SprintStatus,
  CreateSprintDto,
  UpdateSprintDto,
  CreateStageDto,
  UpdateStageDto,
  ReorderStagesDto,
  Tag,
} from '../models';
import { tap } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class SprintsService {
  private api = inject(ApiService);

  private _sprints = signal<Sprint[]>([]);
  private _currentSprint = signal<Sprint | null>(null);
  private _loading = signal(false);

  readonly sprints = this._sprints.asReadonly();
  readonly currentSprint = this._currentSprint.asReadonly();
  readonly loading = this._loading.asReadonly();

  // ========== SPRINTS ==========

  list(workspaceId: number) {
    this._loading.set(true);
    return this.api.get<Sprint[]>(`/workspaces/${workspaceId}/sprints`).pipe(
      tap((sprints) => {
        this._sprints.set(sprints);
        this._loading.set(false);
      })
    );
  }

  get(id: number) {
    this._loading.set(true);
    return this.api.get<Sprint>(`/sprints/${id}`).pipe(
      tap((sprint) => {
        this._currentSprint.set(sprint);
        this._loading.set(false);
      })
    );
  }

  create(workspaceId: number, dto: CreateSprintDto) {
    return this.api.post<Sprint>(`/workspaces/${workspaceId}/sprints`, dto).pipe(
      tap((sprint) => {
        this._sprints.update((list) => [sprint, ...list]);
      })
    );
  }

  update(id: number, dto: UpdateSprintDto) {
    return this.api.put<Sprint>(`/sprints/${id}`, dto).pipe(
      tap((updated) => {
        this._sprints.update((list) =>
          list.map((s) => (s.id === id ? updated : s))
        );
        if (this._currentSprint()?.id === id) {
          this._currentSprint.set(updated);
        }
      })
    );
  }

  updateStatus(id: number, status: SprintStatus) {
    return this.api.patch<Sprint>(`/sprints/${id}/status`, { status }).pipe(
      tap((updated) => {
        this._sprints.update((list) =>
          list.map((s) => (s.id === id ? { ...s, status: updated.status } : s))
        );
        this._currentSprint.update((s) =>
          s && s.id === id ? { ...s, status: updated.status } : s
        );
      })
    );
  }

  delete(id: number) {
    return this.api.delete<{ message: string }>(`/sprints/${id}`).pipe(
      tap(() => {
        this._sprints.update((list) => list.filter((s) => s.id !== id));
        if (this._currentSprint()?.id === id) {
          this._currentSprint.set(null);
        }
      })
    );
  }

  // ========== STAGES ==========

  listStages(sprintId: number) {
    return this.api.get<Stage[]>(`/sprints/${sprintId}/stages`);
  }

  createStage(sprintId: number, dto: CreateStageDto) {
    return this.api.post<Stage>(`/sprints/${sprintId}/stages`, dto).pipe(
      tap((stage) => {
        this._currentSprint.update((s) =>
          s ? { ...s, stages: [...(s.stages || []), stage] } : null
        );
      })
    );
  }

  updateStage(id: number, dto: UpdateStageDto) {
    return this.api.put<Stage>(`/stages/${id}`, dto).pipe(
      tap((updated) => {
        this._currentSprint.update((s) =>
          s
            ? {
                ...s,
                stages: s.stages?.map((st) => (st.id === id ? { ...st, ...updated } : st)),
              }
            : null
        );
      })
    );
  }

  deleteStage(id: number) {
    return this.api.delete<{ message: string }>(`/stages/${id}`).pipe(
      tap(() => {
        this._currentSprint.update((s) =>
          s ? { ...s, stages: s.stages?.filter((st) => st.id !== id) } : null
        );
      })
    );
  }

  reorderStages(sprintId: number, dto: ReorderStagesDto) {
    return this.api.patch<Stage[]>(`/sprints/${sprintId}/stages/reorder`, dto).pipe(
      tap((stages) => {
        this._currentSprint.update((s) => (s ? { ...s, stages } : null));
      })
    );
  }

  // ========== HELPERS ==========

  updateStageTickets(stageId: number, tickets: any[]) {
    this._currentSprint.update((s) => {
      if (!s) return null;
      return {
        ...s,
        stages: s.stages?.map((st) =>
          st.id === stageId ? { ...st, tickets } : st
        ),
      };
    });
  }

  updateTicketTags(tagId: number, updatedTag: Tag) {
    this._currentSprint.update((s) => {
      if (!s) return null;
      return {
        ...s,
        stages: s.stages?.map((stage) => ({
          ...stage,
          tickets: stage.tickets?.map((ticket) =>
            ticket.tagId === tagId
              ? { ...ticket, tag: updatedTag }
              : ticket
          ),
        })),
      };
    });
  }

  removeTicketTags(tagId: number) {
    this._currentSprint.update((s) => {
      if (!s) return null;
      return {
        ...s,
        stages: s.stages?.map((stage) => ({
          ...stage,
          tickets: stage.tickets?.map((ticket) =>
            ticket.tagId === tagId
              ? { ...ticket, tag: undefined, tagId: undefined }
              : ticket
          ),
        })),
      };
    });
  }

  clearCurrent() {
    this._currentSprint.set(null);
  }
}
