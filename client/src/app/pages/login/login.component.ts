import { Component, inject, OnInit } from '@angular/core';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';
import { InputComponent } from '../../shared/components/input/input.component';
import { ButtonComponent } from '../../shared/components/button/button.component';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, RouterLink, InputComponent, ButtonComponent],
  template: `
    <div class="min-h-[80vh] flex items-center justify-center px-4">
      <div class="w-full max-w-md">
        <div class="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          <h1 class="text-2xl font-bold text-gray-900 text-center mb-8">Welcome back</h1>

          @if (auth.error()) {
            <div class="bg-red-50 text-red-600 p-4 rounded-lg mb-6 text-sm">
              {{ auth.error() }}
            </div>
          }

          <form (ngSubmit)="onSubmit()">
            <div class="space-y-4">
              <app-input label="Email" type="email" [(value)]="credentials.email" [required]="true" />
              <app-input label="Password" type="password" [(value)]="credentials.password" [required]="true" />
            </div>

            <div class="mt-6">
              <app-button type="submit" [fullWidth]="true" [loading]="auth.isLoading()"
                          loadingText="Signing in...">
                Sign In
              </app-button>
            </div>
          </form>

          <p class="text-center text-gray-600 mt-6">
            Don't have an account?
            <a routerLink="/register" class="text-indigo-600 hover:text-indigo-700 ml-1">Sign up</a>
          </p>
        </div>
      </div>
    </div>
  `
})
export class LoginComponent implements OnInit {
  auth = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  credentials = {
    email: '',
    password: ''
  };

  ngOnInit(): void {
    this.auth.clearError();
  }

  onSubmit(): void {
    this.auth.login(this.credentials).subscribe({
      next: () => {
        const returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/';
        this.router.navigateByUrl(returnUrl);
      }
    });
  }
}
