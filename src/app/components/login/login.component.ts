import { Component, EventEmitter, Output } from '@angular/core';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  template: `
    <div class="loginwrap">
      <form class="logincard" (ngSubmit)="submit()">
        <div class="brand loginbrand">
          <img src="assets/clinic-icon.svg" alt="Clinic Logo" />
          <div>
            <b>Simran</b>
            <span>Physiotherapy</span>
          </div>
        </div>

        <h1>Sign in</h1>
        <p>Enter your clinic credentials to open the workspace.</p>

        <div class="fields">
          <label>
            Username
            <input
              name="username"
              [(ngModel)]="username"
              autoFocus
              autocomplete="username"
              required
            />
          </label>
          <label>
            Password
            <span class="pwrow">
              <input
                name="password"
                [(ngModel)]="password"
                [type]="showPassword ? 'text' : 'password'"
                autocomplete="current-password"
                required
              />
              <button
                type="button"
                [attr.aria-label]="showPassword ? 'Hide password' : 'Show password'"
                (click)="toggleShowPassword()"
              >
                <app-icon [name]="showPassword ? 'EyeOff' : 'Eye'" [size]="17"></app-icon>
              </button>
            </span>
          </label>
        </div>

        <div *ngIf="errorMessage" role="alert" class="formerr">
          {{ errorMessage }}
        </div>

        <button class="primary formend" [disabled]="busy">
          <app-icon name="LogIn" [size]="16"></app-icon>
          {{ busy ? 'Checking…' : 'Sign in' }}
        </button>
      </form>
    </div>
  `
})
export class LoginComponent {
  @Output() loginSuccess = new EventEmitter<void>();

  username = '';
  password = '';
  showPassword = false;
  errorMessage = '';
  busy = false;

  constructor(private authService: AuthService) {}

  toggleShowPassword(): void {
    this.showPassword = !this.showPassword;
  }

  async submit(): Promise<void> {
    if (!this.username.trim() || !this.password) {
      this.errorMessage = 'Please enter username and password.';
      return;
    }

    this.busy = true;
    this.errorMessage = '';

    const res = await this.authService.login(this.username, this.password);
    this.busy = false;

    if (res.success) {
      this.loginSuccess.emit();
    } else {
      this.errorMessage = res.error || 'Authentication failed.';
    }
  }
}

