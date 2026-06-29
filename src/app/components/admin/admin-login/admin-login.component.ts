import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AdminService } from '../../../services/admin.service';
import { LanguageService } from '../../../services/language.service';

@Component({
  selector: 'app-admin-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-login.component.html',
  styleUrl: './admin-login.component.css'
})
export class AdminLoginComponent {
  username = '';
  password = '';
  isLoading = signal<boolean>(false);
  errorMessage = signal<string>('');

  constructor(
    private adminService: AdminService,
    private router: Router,
    public lang: LanguageService
  ) {
    // If already logged in, redirect directly to dashboard
    if (this.adminService.isAuthenticated()) {
      this.router.navigate(['/admin']);
    }
  }

  async onLogin(event: Event) {
    event.preventDefault();
    if (!this.username.trim() || !this.password.trim()) {
      this.errorMessage.set('Please fill in all fields.');
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set('');

    this.adminService.login(this.username, this.password).subscribe({
      next: (res) => {
        this.isLoading.set(false);
        this.router.navigate(['/admin/stats']);
      },
      error: (err) => {
        this.isLoading.set(false);
        const errorText = err?.error?.error || 'Invalid credentials. Please try again.';
        this.errorMessage.set(errorText);
      }
    });
  }
}
