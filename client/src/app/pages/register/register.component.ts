import { Component, inject, signal, OnInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';
import { InputComponent } from '../../shared/components/input/input.component';
import { ButtonComponent } from '../../shared/components/button/button.component';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [FormsModule, RouterLink, InputComponent, ButtonComponent],
  template: `
    <div class="min-h-[80vh] flex items-center justify-center px-4">
      <div class="w-full max-w-md">
        <div class="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          <h1 class="text-2xl font-bold text-gray-900 text-center mb-8">Sign Up</h1>

          @if (auth.error() || validationError()) {
            <div class="bg-red-50 text-red-600 p-4 rounded-lg mb-6 text-sm">
              {{ validationError() || auth.error() }}
            </div>
          }

          <form (ngSubmit)="onSubmit()">
            <div class="space-y-4">
              <app-input label="Name" type="text" [(value)]="form.name" [required]="true" />

              <div>
                <app-input label="Email" type="email" [(value)]="form.email" [required]="true" />
                @if (form.email && !isValidEmail(form.email)) {
                  <p class="text-red-500 text-xs mt-1">Email must contain @</p>
                }
              </div>

              <div>
                <app-input label="Password" type="password" [(value)]="form.password"
                           [required]="true" [minlength]="8" />
                @if (form.password && form.password.length < 8) {
                  <p class="text-red-500 text-xs mt-1">Password must be at least 8 characters</p>
                }
                @if (form.password && form.password.length >= 8 && !hasUppercase(form.password)) {
                  <p class="text-red-500 text-xs mt-1">Password must contain at least one uppercase letter</p>
                }
                @if (form.password && form.password.length >= 8 && hasUppercase(form.password) && !hasNumber(form.password)) {
                  <p class="text-red-500 text-xs mt-1">Password must contain at least one number</p>
                }
              </div>
            </div>

            <div class="mt-6">
              <app-button type="submit" [fullWidth]="true"
                          [loading]="auth.isLoading()"
                          [disabled]="!isFormValid()"
                          loadingText="Creating account...">
                Sign Up
              </app-button>
            </div>
          </form>

          <p class="text-center text-gray-600 mt-6">
            Already have an account?
            <a routerLink="/login" class="text-indigo-600 hover:text-indigo-700 ml-1">Sign in</a>
          </p>
        </div>
      </div>
    </div>
  `
})
export class RegisterComponent implements OnInit {
  auth = inject(AuthService);
  private router = inject(Router);

  validationError = signal<string | null>(null);

  form = {
    name: '',
    email: '',
    password: ''
  };

  ngOnInit(): void {
    this.auth.clearError();
  }

  isValidEmail(email: string): boolean {
    return email.includes('@');
  }

  hasUppercase(password: string): boolean {
    return /[A-Z]/.test(password);
  }

  hasNumber(password: string): boolean {
    return /[0-9]/.test(password);
  }

  isFormValid(): boolean {
    return !!(
      this.form.name.trim() &&
      this.form.email.trim() &&
      this.isValidEmail(this.form.email) &&
      this.form.password.length >= 8 &&
      this.hasUppercase(this.form.password) &&
      this.hasNumber(this.form.password)
    );
  }

  onSubmit(): void {
    this.validationError.set(null);

    if (!this.form.name.trim()) {
      this.validationError.set('Name is required');
      return;
    }

    if (!this.isValidEmail(this.form.email)) {
      this.validationError.set('Please enter a valid email address (must contain @)');
      return;
    }

    if (this.form.password.length < 8) {
      this.validationError.set('Password must be at least 8 characters');
      return;
    }

    if (!this.hasUppercase(this.form.password)) {
      this.validationError.set('Password must contain at least one uppercase letter');
      return;
    }

    if (!this.hasNumber(this.form.password)) {
      this.validationError.set('Password must contain at least one number');
      return;
    }

    this.auth.register(this.form).subscribe({
      next: () => {
        this.router.navigate(['/']);
      }
    });
  }
}
