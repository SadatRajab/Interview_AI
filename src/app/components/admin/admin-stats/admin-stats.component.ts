import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AdminService, StatsData } from '../../../services/admin.service';
import { LanguageService } from '../../../services/language.service';

@Component({
  selector: 'app-admin-stats',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './admin-stats.component.html',
  styleUrl: './admin-stats.component.css'
})
export class AdminStatsComponent implements OnInit {
  stats = signal<StatsData | null>(null);
  isLoading = signal<boolean>(true);
  errorMessage = signal<string>('');

  constructor(
    private adminService: AdminService,
    private router: Router,
    public lang: LanguageService
  ) {}

  ngOnInit() {
    this.loadStats();
  }

  loadStats() {
    this.isLoading.set(true);
    this.errorMessage.set('');

    this.adminService.getStatistics().subscribe({
      next: (res) => {
        this.isLoading.set(false);
        if (res.success) {
          this.stats.set(res.data);
        } else {
          this.errorMessage.set('Failed to calculate stats.');
        }
      },
      error: (err) => {
        this.isLoading.set(false);
        this.errorMessage.set('Failed to fetch system statistics.');
        console.error(err);
      }
    });
  }

  navigateToCandidates(statusFilter?: string) {
    if (statusFilter) {
      this.router.navigate(['/admin/candidates'], { queryParams: { status: statusFilter } });
    } else {
      this.router.navigate(['/admin/candidates']);
    }
  }
}
