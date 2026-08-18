// ============================================================================
// SPRINTHUB - Timeline Page Component
// ============================================================================

import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import {
  featherChevronLeft,
  featherChevronRight,
  featherCalendar,
  featherClock,
  featherUser,
} from '@ng-icons/feather-icons';
import { ApiService } from '../../core/services';
import { Ticket, Priority, PaginatedResponse } from '../../core/models';
import { PriorityBadgeDirective } from '../../shared/directives/priority-badge.directive';

interface CalendarDay {
  date: Date;
  dayNumber: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  tickets: Ticket[];
}

@Component({
  selector: 'app-calendar',
  standalone: true,
  imports: [RouterLink, NgIconComponent, PriorityBadgeDirective],
  viewProviders: [
    provideIcons({
      featherChevronLeft,
      featherChevronRight,
      featherCalendar,
      featherClock,
      featherUser,
    }),
  ],
  template: `
    <div class="min-h-[calc(100vh-64px)] bg-gray-100 p-6">
      <div class="max-w-7xl mx-auto">
        <!-- Header -->
        <div class="flex items-center justify-between mb-6">
          <div class="flex items-center gap-3">
            <ng-icon name="featherCalendar" class="text-2xl text-indigo-600" />
            <h1 class="text-2xl font-bold text-gray-900">Timeline</h1>
          </div>
          <div class="flex items-center gap-2">
            <button (click)="previousMonth()"
                    class="p-2 text-gray-600 hover:text-gray-900 hover:bg-white rounded-lg transition-colors">
              <ng-icon name="featherChevronLeft" class="text-xl" />
            </button>
            <span class="text-lg font-semibold text-gray-900 min-w-[200px] text-center">
              {{ monthYearLabel() }}
            </span>
            <button (click)="nextMonth()"
                    class="p-2 text-gray-600 hover:text-gray-900 hover:bg-white rounded-lg transition-colors">
              <ng-icon name="featherChevronRight" class="text-xl" />
            </button>
            <button (click)="goToToday()"
                    class="ml-2 px-3 py-1.5 text-sm font-medium text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors">
              Today
            </button>
          </div>
        </div>

        <div class="flex gap-6">
          <!-- Calendar Grid -->
          <div class="flex-1 bg-white rounded-xl shadow-sm overflow-hidden">
            <!-- Day Headers -->
            <div class="grid grid-cols-7 bg-gray-50 border-b border-gray-200">
              @for (day of weekDays; track day) {
                <div class="py-3 text-center text-sm font-semibold text-gray-600">
                  {{ day }}
                </div>
              }
            </div>

            <!-- Calendar Days -->
            @if (loading()) {
              <div class="flex items-center justify-center h-96">
                <div class="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
              </div>
            } @else {
              <div class="grid grid-cols-7">
                @for (day of calendarDays(); track day.date.toISOString()) {
                  <button (click)="selectDay(day)"
                          class="min-h-[100px] p-2 border-b border-r border-gray-100 text-left
                                 hover:bg-gray-50 transition-colors relative"
                          [class.bg-gray-50]="!day.isCurrentMonth"
                          [class.bg-indigo-50]="isSelectedDay(day)"
                          [class.ring-2]="day.isToday"
                          [class.ring-indigo-500]="day.isToday"
                          [class.ring-inset]="day.isToday">
                    <span class="text-sm font-medium"
                          [class.text-gray-400]="!day.isCurrentMonth"
                          [class.text-gray-900]="day.isCurrentMonth && !day.isToday"
                          [class.text-indigo-600]="day.isToday">
                      {{ day.dayNumber }}
                    </span>

                    <!-- Ticket Indicators -->
                    @if (day.tickets.length > 0) {
                      <div class="mt-1 flex flex-wrap gap-1">
                        @for (ticket of day.tickets.slice(0, 3); track ticket.id) {
                          <div class="w-2 h-2 rounded-full"
                               [class.bg-red-500]="isOverdue(ticket.dueDate!)"
                               [class.bg-orange-500]="!isOverdue(ticket.dueDate!) && isDueSoon(ticket.dueDate!)"
                               [class.bg-blue-500]="!isOverdue(ticket.dueDate!) && !isDueSoon(ticket.dueDate!)">
                          </div>
                        }
                        @if (day.tickets.length > 3) {
                          <span class="text-xs text-gray-500">+{{ day.tickets.length - 3 }}</span>
                        }
                      </div>
                    }
                  </button>
                }
              </div>
            }
          </div>

          <!-- Selected Day Tickets Panel -->
          <div class="w-96 bg-white rounded-xl shadow-sm p-4">
            <h2 class="text-lg font-semibold text-gray-900 mb-4">
              Tickets for {{ selectedDateLabel() }}
            </h2>

            @if (selectedDayTickets().length === 0) {
              <div class="text-center py-8 text-gray-500">
                <ng-icon name="featherCalendar" class="text-4xl mb-2 opacity-50" />
                <p>No tickets for this day</p>
              </div>
            } @else {
              <div class="space-y-3">
                @for (ticket of selectedDayTickets(); track ticket.id) {
                  <a [routerLink]="['/sprints', ticket.stage?.sprintId]"
                     class="block p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors
                            border-l-4"
                     [class.border-red-500]="isOverdue(ticket.dueDate!)"
                     [class.border-orange-500]="!isOverdue(ticket.dueDate!) && isDueSoon(ticket.dueDate!)"
                     [class.border-blue-500]="!isOverdue(ticket.dueDate!) && !isDueSoon(ticket.dueDate!)">
                    <!-- Title & Priority -->
                    <div class="flex items-start gap-2">
                      @if (ticket.code) {
                        <span class="text-xs text-indigo-500 font-mono font-medium shrink-0">{{ ticket.code }}</span>
                      }
                      <h3 class="font-medium text-gray-900 flex-1">
                        {{ ticket.title }}
                      </h3>
                      <span [appPriorityBadge]="ticket.priority" class="shrink-0"></span>
                    </div>

                    <!-- Meta info -->
                    <div class="mt-2 flex items-center gap-4 text-xs text-gray-500">
                      @if (ticket.dueDate) {
                        <span class="flex items-center gap-1"
                              [class.text-red-500]="isOverdue(ticket.dueDate)"
                              [class.text-orange-500]="!isOverdue(ticket.dueDate) && isDueSoon(ticket.dueDate)">
                          <ng-icon name="featherClock" />
                          {{ formatTime(ticket.dueDate) }}
                        </span>
                      }
                      @if (ticket.assignee) {
                        <span class="flex items-center gap-1">
                          <ng-icon name="featherUser" />
                          {{ ticket.assignee.name }}
                        </span>
                      }
                    </div>

                    <!-- Stage badge -->
                    @if (ticket.stage) {
                      <div class="mt-2">
                        <span class="inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded-full bg-gray-200 text-gray-600">
                          <span class="w-2 h-2 rounded-full" [style.background-color]="ticket.stage.color"></span>
                          {{ ticket.stage.name }}
                        </span>
                      </div>
                    }
                  </a>
                }
              </div>
            }
          </div>
        </div>

        <!-- Legend -->
        <div class="mt-4 flex items-center gap-6 text-sm text-gray-600">
          <div class="flex items-center gap-2">
            <div class="w-3 h-3 rounded-full bg-red-500"></div>
            <span>Overdue</span>
          </div>
          <div class="flex items-center gap-2">
            <div class="w-3 h-3 rounded-full bg-orange-500"></div>
            <span>Due soon</span>
          </div>
          <div class="flex items-center gap-2">
            <div class="w-3 h-3 rounded-full bg-blue-500"></div>
            <span>In progress</span>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class CalendarComponent implements OnInit {
  private api = inject(ApiService);

  currentDate = signal(new Date());
  selectedDate = signal(new Date());
  tickets = signal<Ticket[]>([]);
  loading = signal(false);

  weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  private monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  monthYearLabel = computed(() => {
    const date = this.currentDate();
    return `${this.monthNames[date.getMonth()]} ${date.getFullYear()}`;
  });

  selectedDateLabel = computed(() => {
    const date = this.selectedDate();
    return `${this.monthNames[date.getMonth()]} ${date.getDate()}`;
  });

  calendarDays = computed(() => {
    const date = this.currentDate();
    const year = date.getFullYear();
    const month = date.getMonth();
    const allTickets = this.tickets();

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const days: CalendarDay[] = [];

    let startDayOfWeek = firstDay.getDay() - 1;
    if (startDayOfWeek < 0) startDayOfWeek = 6;

    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      const dayDate = new Date(year, month - 1, prevMonthLastDay - i);
      days.push({
        date: dayDate,
        dayNumber: prevMonthLastDay - i,
        isCurrentMonth: false,
        isToday: this.isSameDay(dayDate, today),
        tickets: this.getTicketsForDate(allTickets, dayDate),
      });
    }

    for (let day = 1; day <= lastDay.getDate(); day++) {
      const dayDate = new Date(year, month, day);
      days.push({
        date: dayDate,
        dayNumber: day,
        isCurrentMonth: true,
        isToday: this.isSameDay(dayDate, today),
        tickets: this.getTicketsForDate(allTickets, dayDate),
      });
    }

    const remainingDays = 42 - days.length;
    for (let day = 1; day <= remainingDays; day++) {
      const dayDate = new Date(year, month + 1, day);
      days.push({
        date: dayDate,
        dayNumber: day,
        isCurrentMonth: false,
        isToday: this.isSameDay(dayDate, today),
        tickets: this.getTicketsForDate(allTickets, dayDate),
      });
    }

    return days;
  });

  selectedDayTickets = computed(() => {
    const selectedDate = this.selectedDate();
    const allTickets = this.tickets();
    return this.getTicketsForDate(allTickets, selectedDate);
  });

  ngOnInit() {
    this.loadTickets();
  }

  loadTickets() {
    this.loading.set(true);
    this.api.get<PaginatedResponse<Ticket>>('/tickets', { hasDueDate: true, pageSize: 50 }).subscribe({
      next: (res) => {
        this.tickets.set(res.items);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      }
    });
  }

  previousMonth() {
    const current = this.currentDate();
    this.currentDate.set(new Date(current.getFullYear(), current.getMonth() - 1, 1));
  }

  nextMonth() {
    const current = this.currentDate();
    this.currentDate.set(new Date(current.getFullYear(), current.getMonth() + 1, 1));
  }

  goToToday() {
    const today = new Date();
    this.currentDate.set(new Date(today.getFullYear(), today.getMonth(), 1));
    this.selectedDate.set(today);
  }

  selectDay(day: CalendarDay) {
    this.selectedDate.set(day.date);
  }

  isSelectedDay(day: CalendarDay): boolean {
    return this.isSameDay(day.date, this.selectedDate());
  }

  // ===== HELPERS =====

  private isSameDay(date1: Date, date2: Date): boolean {
    return date1.getFullYear() === date2.getFullYear() &&
           date1.getMonth() === date2.getMonth() &&
           date1.getDate() === date2.getDate();
  }

  private getTicketsForDate(tickets: Ticket[], date: Date): Ticket[] {
    return tickets.filter(ticket => {
      if (!ticket.dueDate) return false;
      const ticketDate = new Date(ticket.dueDate);
      return this.isSameDay(ticketDate, date);
    });
  }

  isOverdue(dateStr: string): boolean {
    const date = new Date(dateStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    date.setHours(0, 0, 0, 0);
    return date < today;
  }

  isDueSoon(dateStr: string): boolean {
    const date = new Date(dateStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    date.setHours(0, 0, 0, 0);
    const diff = date.getTime() - today.getTime();
    const days = diff / (1000 * 60 * 60 * 24);
    return days <= 2 && days >= 0;
  }

  formatTime(dateStr: string): string {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
  }

}
