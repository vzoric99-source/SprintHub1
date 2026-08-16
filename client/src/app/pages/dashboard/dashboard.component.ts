// ============================================================================
// SPRINTHUB - Dashboard Page Component
// ============================================================================

import { Component, inject, signal, OnInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import {
  featherFolder,
  featherTrello,
  featherCheckCircle,
  featherClock,
  featherAlertCircle,
  featherPlus,
  featherArrowRight,
} from '@ng-icons/feather-icons';
import { WorkspacesService, SprintsService, ApiService, AuthService } from '../../core/services';
import { Workspace, Ticket, Sprint, PaginatedResponse } from '../../core/models';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [RouterLink, NgIconComponent],
  viewProviders: [
    provideIcons({
      featherFolder,
      featherTrello,
      featherCheckCircle,
      featherClock,
      featherAlertCircle,
      featherPlus,
      featherArrowRight,
    }),
  ],
  template: `
    <div class="min-h-[calc(100vh-64px)] bg-gray-100 py-8">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <!-- Welcome -->
        <div class="mb-8">
          <h1 class="text-2xl font-bold text-gray-900">
            Welcome, {{ (auth.user()?.name ?? '').split(' ')[0] }}!
          </h1>
          <p class="text-gray-600">Your workspace overview</p>
        </div>

        <!-- Stats Cards -->
        <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div class="bg-white rounded-xl border border-gray-200 p-5">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                <ng-icon name="featherFolder" class="text-indigo-600 text-xl" />
              </div>
              <div>
                <p class="text-2xl font-bold text-gray-900">{{ stats().workspaces }}</p>
                <p class="text-sm text-gray-500">Workspaces</p>
              </div>
            </div>
          </div>

          <div class="bg-white rounded-xl border border-gray-200 p-5">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <ng-icon name="featherTrello" class="text-green-600 text-xl" />
              </div>
              <div>
                <p class="text-2xl font-bold text-gray-900">{{ stats().activeSprints }}</p>
                <p class="text-sm text-gray-500">Active Sprints</p>
              </div>
            </div>
          </div>

          <div class="bg-white rounded-xl border border-gray-200 p-5">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <ng-icon name="featherCheckCircle" class="text-blue-600 text-xl" />
              </div>
              <div>
                <p class="text-2xl font-bold text-gray-900">{{ stats().myTickets }}</p>
                <p class="text-sm text-gray-500">My Tickets</p>
              </div>
            </div>
          </div>

          <div class="bg-white rounded-xl border border-gray-200 p-5">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                <ng-icon name="featherAlertCircle" class="text-red-600 text-xl" />
              </div>
              <div>
                <p class="text-2xl font-bold text-gray-900">{{ stats().overdueTickets }}</p>
                <p class="text-sm text-gray-500">Overdue</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Quick Actions + Recent Tickets -->
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <!-- Quick Actions -->
          <div class="bg-white rounded-xl border border-gray-200 p-6">
            <h2 class="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
            <div class="space-y-3">
              <a routerLink="/workspaces"
                 class="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                <div class="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center">
                  <ng-icon name="featherPlus" class="text-indigo-600" />
                </div>
                <span class="text-gray-700 font-medium">New Workspace</span>
                <ng-icon name="featherArrowRight" class="text-gray-400 ml-auto" />
              </a>
              <a routerLink="/timeline"
                 class="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                <div class="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                  <ng-icon name="featherClock" class="text-green-600" />
                </div>
                <span class="text-gray-700 font-medium">Timeline</span>
                <ng-icon name="featherArrowRight" class="text-gray-400 ml-auto" />
              </a>
            </div>
          </div>

          <!-- Recent / Assigned Tickets -->
          <div class="lg:col-span-2 bg-white rounded-xl border border-gray-200 p-6">
            <h2 class="text-lg font-semibold text-gray-900 mb-4">My Tickets</h2>
            @if (loading()) {
              <div class="flex items-center justify-center py-8">
                <div class="w-6 h-6 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
              </div>
            } @else if (myTickets().length === 0) {
              <div class="text-center py-8 text-gray-500">
                <ng-icon name="featherCheckCircle" class="text-4xl mb-2 opacity-50" />
                <p>No tickets assigned</p>
              </div>
            } @else {
              <div class="space-y-2">
                @for (ticket of myTickets().slice(0, 8); track ticket.id) {
                  <a [routerLink]="['/sprints', ticket.stage?.sprintId]"
                     class="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors border border-gray-100">
                    @if (ticket.code) {
                      <span class="text-xs text-indigo-500 font-mono font-medium shrink-0">{{ ticket.code }}</span>
                    }
                    <span class="font-medium text-gray-900 flex-1 truncate">{{ ticket.title }}</span>
                    @if (ticket.type && ticket.type !== 'TASK') {
                      <span class="text-xs px-1.5 py-0.5 rounded font-medium"
                            [class.bg-red-100]="ticket.type === 'BUG'"
                            [class.text-red-700]="ticket.type === 'BUG'"
                            [class.bg-purple-100]="ticket.type === 'FEATURE'"
                            [class.text-purple-700]="ticket.type === 'FEATURE'"
                            [class.bg-cyan-100]="ticket.type === 'IMPROVEMENT'"
                            [class.text-cyan-700]="ticket.type === 'IMPROVEMENT'">
                        {{ ticket.type }}
                      </span>
                    }
                    @if (ticket.dueDate) {
                      <span class="text-xs"
                            [class.text-red-500]="isOverdue(ticket.dueDate)"
                            [class.text-gray-500]="!isOverdue(ticket.dueDate)">
                        {{ formatDate(ticket.dueDate) }}
                      </span>
                    }
                  </a>
                }
              </div>
            }
          </div>
        </div>
      </div>
    </div>
  `,
})
export class DashboardComponent implements OnInit {
  auth = inject(AuthService);
  private api = inject(ApiService);
  private workspacesService = inject(WorkspacesService);

  loading = signal(false);
  myTickets = signal<Ticket[]>([]);
  stats = signal({ workspaces: 0, activeSprints: 0, myTickets: 0, overdueTickets: 0 });

  ngOnInit() {
    this.loadDashboard();
  }

  loadDashboard() {
    this.loading.set(true);

    this.workspacesService.list().subscribe({
      next: (res) => {
        this.stats.update((s) => ({ ...s, workspaces: res.total }));

        const workspaces = res.items;
        let activeSprints = 0;
        let loaded = 0;
        if (workspaces.length === 0) {
          this.stats.update((s) => ({ ...s, activeSprints: 0 }));
        } else {
          workspaces.forEach((ws: Workspace) => {
            this.api.get<Sprint[]>(`/workspaces/${ws.id}/sprints`).subscribe({
              next: (sprints) => {
                activeSprints += sprints.filter((sp) => sp.status === 'ACTIVE').length;
                loaded++;
                if (loaded === workspaces.length) {
                  this.stats.update((s) => ({ ...s, activeSprints }));
                }
              },
              error: () => {
                loaded++;
                if (loaded === workspaces.length) {
                  this.stats.update((s) => ({ ...s, activeSprints }));
                }
              },
            });
          });
        }
      },
    });

    this.api.get<PaginatedResponse<Ticket>>('/tickets', { assignedToMe: true }).subscribe({
      next: (res) => {
        const tickets = res.items;
        this.myTickets.set(tickets);
        const now = new Date();
        now.setHours(0, 0, 0, 0);
        const overdue = tickets.filter((t) => t.dueDate && new Date(t.dueDate) < now).length;
        this.stats.update((s) => ({ ...s, myTickets: tickets.length, overdueTickets: overdue }));
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      },
    });
  }

  isOverdue(dateStr: string): boolean {
    const date = new Date(dateStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    date.setHours(0, 0, 0, 0);
    return date < today;
  }

  formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
  }
}
