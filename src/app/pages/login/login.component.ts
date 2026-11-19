import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {
  username = '';
  password = '';
  showPassword = false;
  errorMessage = '';
  busy = false;

  constructor(private authService: AuthService, private router: Router) {}

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
      this.router.navigate(['/dashboard']);
    } else {
      this.errorMessage = res.error || 'Authentication failed.';
    }
  }
}
