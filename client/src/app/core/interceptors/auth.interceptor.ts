import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject, Injector } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { catchError, throwError } from 'rxjs';

const STORAGE_KEY = 'sprinthub-auth';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const injector = inject(Injector);

  let token: string | null = null;
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      token = JSON.parse(stored).token;
    }
  } catch {}

  if (token) {
    req = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  }

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401 && !req.url.includes('/auth/login')) {
        const authService = injector.get(AuthService);
        const router = injector.get(Router);
        authService.handleUnauthorized();
        router.navigate(['/login']);
      }
      return throwError(() => error);
    })
  );
};
