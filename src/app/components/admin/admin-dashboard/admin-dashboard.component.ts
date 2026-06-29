import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterLink, RouterLinkActive, Router } from '@angular/router';
import { AdminService } from '../../../services/admin.service';
import { LanguageService } from '../../../services/language.service';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './admin-dashboard.component.html',
  styleUrl: './admin-dashboard.component.css'
})
export class AdminDashboardComponent implements OnInit {
  duplicateCount = signal<number>(0);
  showDuplicateAlert = signal<boolean>(false);
  adminName = 'Administrator';

  constructor(
    private adminService: AdminService,
    private router: Router,
    public lang: LanguageService
  ) {}

  ngOnInit() {
    this.checkDuplicates();
  }

  checkDuplicates() {
    this.adminService.getStatistics().subscribe({
      next: (res) => {
        if (res.success && res.data) {
          const count = res.data.duplicateCandidates;
          this.duplicateCount.set(count);
          this.showDuplicateAlert.set(count > 0);
        }
      },
      error: (err) => {
        console.error('Failed to load initial notifications:', err);
      }
    });
  }

  dismissAlert() {
    this.showDuplicateAlert.set(false);
  }

  navigateToDuplicates() {
    this.router.navigate(['/admin/candidates'], { queryParams: { status: 'duplicate' } });
  }

  logout() {
    this.adminService.logout();
    this.router.navigate(['/admin/login']);
  }
}
