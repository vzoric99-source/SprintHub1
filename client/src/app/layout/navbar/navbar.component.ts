// ============================================================================
// SPRINTHUB - Navbar Component
// ============================================================================

import { Component, inject, signal, OnInit, OnDestroy, effect } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import {
  featherMenu,
  featherX,
  featherUser,
  featherLogOut,
  featherFolder,
  featherBell,
  featherCalendar,
  featherCheck,
  featherTrash2,
  featherShield,
  featherHome,
} from '@ng-icons/feather-icons';
import { AuthService, NotificationsService } from '../../core/services';
import { Notification } from '../../core/models';
import { RelativeTimePipe } from '../../shared/pipes/relative-time.pipe';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, NgIconComponent, RelativeTimePipe],
  viewProviders: [
    provideIcons({
      featherMenu,
      featherX,
      featherUser,
      featherLogOut,
      featherFolder,
      featherBell,
      featherCalendar,
      featherCheck,
      featherTrash2,
      featherShield,
      featherHome,
    }),
  ],
  template: `
    <header class="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
      <nav class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex items-center justify-between h-16">
          <!-- Logo -->
          <a routerLink="/dashboard" class="flex items-center gap-2">
            <div class="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
              <span class="text-white font-bold text-lg">S</span>
            </div>
            <span class="text-xl font-bold text-gray-900">SprintHub</span>
          </a>

          <!-- Desktop Navigation -->
          <div class="hidden md:flex items-center gap-4">
            @if (auth.isAuthenticated()) {
              <a routerLink="/dashboard"
                 routerLinkActive="text-indigo-600"
                 [routerLinkActiveOptions]="{exact: true}"
                 class="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors">
                <ng-icon name="featherHome" class="text-lg" />
                <span>Home</span>
              </a>

              <a routerLink="/workspaces"
                 routerLinkActive="text-indigo-600"
                 [routerLinkActiveOptions]="{exact: false}"
                 class="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors">
                <ng-icon name="featherFolder" class="text-lg" />
                <span>Workspaces</span>
              </a>

              <a routerLink="/timeline"
                 routerLinkActive="text-indigo-600"
                 class="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors">
                <ng-icon name="featherCalendar" class="text-lg" />
                <span>Timeline</span>
              </a>

              <!-- Admin link (only for ADMIN) -->
              @if (auth.user()?.role === 'ADMIN') {
                <a routerLink="/admin"
                   routerLinkActive="text-indigo-600"
                   class="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors">
                  <ng-icon name="featherShield" class="text-lg" />
                  <span>Admin</span>
                </a>
              }

              <!-- Notifications -->
              <div class="relative">
                <button (click)="toggleNotifications()"
                        class="relative p-2 text-gray-600 hover:text-gray-900 transition-colors flex items-center">
                  <ng-icon name="featherBell" class="text-lg" />
                  @if (notificationsService.unreadCount() > 0) {
                    <span class="absolute -top-0.5 -right-0.5 w-5 h-5 bg-red-500 text-white text-xs
                                 rounded-full flex items-center justify-center font-medium">
                      {{ notificationsService.unreadCount() > 9 ? '9+' : notificationsService.unreadCount() }}
                    </span>
                  }
                </button>

                @if (showNotifications()) {
                  <div class="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200
                              max-h-96 overflow-hidden flex flex-col z-50">
                    <div class="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                      <h3 class="font-semibold text-gray-900">Notifications</h3>
                      @if (notificationsService.unreadCount() > 0) {
                        <button (click)="markAllRead()"
                                class="text-xs text-indigo-600 hover:text-indigo-700">
                          Mark all as read
                        </button>
                      }
                    </div>

                    <div class="overflow-y-auto flex-1">
                      @if (notificationsService.notifications().length === 0) {
                        <div class="px-4 py-8 text-center text-gray-500 text-sm">
                          No notifications
                        </div>
                      } @else {
                        @for (notification of notificationsService.notifications(); track notification.id) {
                          <div class="px-4 py-3 border-b border-gray-50 hover:bg-gray-50 transition-colors"
                               [class.bg-indigo-50]="!notification.isRead"
                               [class.hover:bg-indigo-100]="!notification.isRead">
                            <div class="flex items-start gap-2">
                              <div class="flex-1 min-w-0">
                                <p class="text-sm font-medium text-gray-900">{{ notification.title }}</p>
                                <p class="text-xs text-gray-600 mt-0.5">{{ notification.message }}</p>
                                <p class="text-xs text-gray-400 mt-1">{{ notification.createdAt | relativeTime }}</p>
                              </div>
                              <div class="flex items-center gap-1">
                                @if (!notification.isRead) {
                                  <button (click)="markRead(notification); $event.stopPropagation()"
                                          class="p-1 text-gray-400 hover:text-green-600 rounded"
                                          title="Mark as read">
                                    <ng-icon name="featherCheck" class="text-sm" />
                                  </button>
                                }
                                <button (click)="deleteNotification(notification); $event.stopPropagation()"
                                        class="p-1 text-gray-400 hover:text-red-600 rounded"
                                        title="Delete">
                                  <ng-icon name="featherTrash2" class="text-sm" />
                                </button>
                              </div>
                            </div>
                          </div>
                        }
                      }
                    </div>
                  </div>
                }
              </div>

              <!-- User Menu -->
              <div class="relative">
                <button (click)="toggleUserMenu()"
                        class="flex items-center gap-2 p-2 text-gray-600 hover:text-gray-900 transition-colors">
                  <div class="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center">
                    <span class="text-indigo-600 font-medium">
                      {{ auth.user()?.name?.charAt(0)?.toUpperCase() }}
                    </span>
                  </div>
                </button>

                @if (showUserMenu()) {
                  <div class="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200">
                    <div class="p-3 border-b border-gray-100">
                      <p class="font-medium text-gray-900">{{ auth.user()?.name }}</p>
                      <p class="text-sm text-gray-500">{{ auth.user()?.email }}</p>
                      <p class="text-xs text-gray-400 mt-1">{{ getRoleLabel() }}</p>
                    </div>
                    <button (click)="logout()"
                            class="flex items-center gap-2 px-3 py-2 w-full text-left text-red-600 hover:bg-red-50">
                      <ng-icon name="featherLogOut" class="text-lg" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                }
              </div>
            } @else {
              <a routerLink="/login"
                 class="text-gray-600 hover:text-gray-900 transition-colors">
                Sign In
              </a>
              <a routerLink="/register"
                 class="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors">
                Sign Up
              </a>
            }
          </div>

          <!-- Mobile menu button -->
          <button (click)="toggleMobileMenu()" class="md:hidden p-2">
            <ng-icon [name]="showMobileMenu() ? 'featherX' : 'featherMenu'" class="text-2xl" />
          </button>
        </div>

        <!-- Mobile Navigation -->
        @if (showMobileMenu()) {
          <div class="md:hidden py-4 border-t border-gray-200">
            @if (auth.isAuthenticated()) {
              <a routerLink="/dashboard"
                 (click)="showMobileMenu.set(false)"
                 class="block py-2 text-gray-600 hover:text-gray-900">
                Home
              </a>
              <a routerLink="/workspaces"
                 (click)="showMobileMenu.set(false)"
                 class="block py-2 text-gray-600 hover:text-gray-900">
                Workspaces
              </a>
              <a routerLink="/timeline"
                 (click)="showMobileMenu.set(false)"
                 class="block py-2 text-gray-600 hover:text-gray-900">
                Timeline
              </a>
              @if (auth.user()?.role === 'ADMIN') {
                <a routerLink="/admin"
                   (click)="showMobileMenu.set(false)"
                   class="block py-2 text-gray-600 hover:text-gray-900">
                  Admin Panel
                </a>
              }
              <button (click)="logout()"
                      class="block py-2 text-red-600 hover:text-red-800 w-full text-left">
                Sign Out
              </button>
            } @else {
              <a routerLink="/login"
                 (click)="showMobileMenu.set(false)"
                 class="block py-2 text-gray-600 hover:text-gray-900">
                Sign In
              </a>
              <a routerLink="/register"
                 (click)="showMobileMenu.set(false)"
                 class="block py-2 text-indigo-600 hover:text-indigo-800">
                Sign Up
              </a>
            }
          </div>
        }
      </nav>
    </header>
  `,
})
export class NavbarComponent implements OnInit, OnDestroy {
  auth = inject(AuthService);
  notificationsService = inject(NotificationsService);
  private router = inject(Router);

  showUserMenu = signal(false);
  showMobileMenu = signal(false);
  showNotifications = signal(false);

  private clickHandler = (e: Event) => {
    const target = e.target as HTMLElement;
    if (!target.closest('.relative')) {
      this.showUserMenu.set(false);
      this.showNotifications.set(false);
    }
  };

  private authEffect = effect(() => {
    if (this.auth.isAuthenticated()) {
      this.notificationsService.list().subscribe();
    }
  });

  ngOnInit() {
    document.addEventListener('click', this.clickHandler);
  }

  ngOnDestroy() {
    document.removeEventListener('click', this.clickHandler);
  }

  toggleUserMenu() {
    this.showNotifications.set(false);
    this.showUserMenu.update((v) => !v);
  }

  toggleMobileMenu() {
    this.showMobileMenu.update((v) => !v);
  }

  toggleNotifications() {
    this.showUserMenu.set(false);
    this.showNotifications.update((v) => !v);
    if (this.showNotifications()) {
      this.notificationsService.list().subscribe();
    }
  }

  markRead(notification: Notification) {
    this.notificationsService.markAsRead(notification.id).subscribe();
  }

  markAllRead() {
    this.notificationsService.markAllAsRead().subscribe();
  }

  deleteNotification(notification: Notification) {
    this.notificationsService.deleteNotification(notification.id).subscribe();
  }

  getRoleLabel(): string {
    const role = this.auth.user()?.role;
    if (role === 'ADMIN') return 'Admin';
    if (role === 'MODERATOR') return 'Moderator';
    return 'User';
  }

  logout() {
    this.showUserMenu.set(false);
    this.showMobileMenu.set(false);
    this.auth.logout().subscribe();
  }
}
