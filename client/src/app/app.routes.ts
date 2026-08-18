// ============================================================================
// SPRINTHUB - Application Routes
// ============================================================================

import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { guestGuard } from './core/guards/guest.guard';
import { adminGuard } from './core/guards/admin.guard';

export const routes: Routes = [
  // Root redirect
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'dashboard',
  },

  // Auth routes (guest only)
  {
    path: 'login',
    canActivate: [guestGuard],
    loadComponent: () => import('./pages/login/login.component').then((m) => m.LoginComponent),
  },
  {
    path: 'register',
    canActivate: [guestGuard],
    loadComponent: () => import('./pages/register/register.component').then((m) => m.RegisterComponent),
  },

  // Protected routes (authenticated users)
  {
    path: 'dashboard',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/dashboard/dashboard.component').then((m) => m.DashboardComponent),
  },
  {
    path: 'workspaces',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/projects/projects.component').then((m) => m.ProjectsComponent),
  },
  {
    path: 'sprints/:id',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/board/board.component').then((m) => m.BoardComponent),
  },
  {
    path: 'timeline',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/calendar/calendar.component').then((m) => m.CalendarComponent),
  },

  // Admin routes (ADMIN only)
  {
    path: 'admin',
    canActivate: [adminGuard],
    loadComponent: () => import('./pages/admin/admin.component').then((m) => m.AdminComponent),
  },

  // 404
  {
    path: '**',
    loadComponent: () => import('./pages/not-found/not-found.component').then((m) => m.NotFoundComponent),
  },
];
