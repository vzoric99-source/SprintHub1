// ============================================================================
// SPRINTHUB - Tickets Service
// ============================================================================

import { Injectable, inject, signal } from '@angular/core';
import { ApiService } from './api.service';
import {
  Ticket,
  TicketFilters,
  CreateTicketDto,
  UpdateTicketDto,
  MoveTicketDto,
} from '../models';
import { tap } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class TicketsService {
  private api = inject(ApiService);

  private _currentTicket = signal<Ticket | null>(null);
  private _loading = signal(false);

  readonly currentTicket = this._currentTicket.asReadonly();
  readonly loading = this._loading.asReadonly();

  // ========== TICKETS ==========

  list(filters?: TicketFilters) {
    return this.api.get<Ticket[]>('/tickets', filters);
  }

  get(id: number) {
    this._loading.set(true);
    return this.api.get<Ticket>(`/tickets/${id}`).pipe(
      tap((ticket) => {
        this._currentTicket.set(ticket);
        this._loading.set(false);
      })
    );
  }

  create(dto: CreateTicketDto) {
    return this.api.post<Ticket>('/tickets', dto);
  }

  update(id: number, dto: UpdateTicketDto) {
    return this.api.put<Ticket>(`/tickets/${id}`, dto).pipe(
      tap((updated) => {
        if (this._currentTicket()?.id === id) {
          this._currentTicket.set(updated);
        }
      })
    );
  }

  delete(id: number) {
    return this.api.delete<{ message: string }>(`/tickets/${id}`).pipe(
      tap(() => {
        if (this._currentTicket()?.id === id) {
          this._currentTicket.set(null);
        }
      })
    );
  }

  move(id: number, dto: MoveTicketDto) {
    return this.api.patch<Ticket>(`/tickets/${id}/move`, dto);
  }

  // ========== HELPERS ==========

  clearCurrent() {
    this._currentTicket.set(null);
  }
}
