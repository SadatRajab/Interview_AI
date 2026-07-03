import { Component, OnInit, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { AdminService, ApplicantSummary } from '../../../services/admin.service';
import { LanguageService } from '../../../services/language.service';

@Component({
  selector: 'app-admin-candidates',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './admin-candidates.component.html',
  styleUrl: './admin-candidates.component.css'
})
export class AdminCandidatesComponent implements OnInit {
  candidates = signal<ApplicantSummary[]>([]);
  totalCandidates = signal<number>(0);
  isLoading = signal<boolean>(true);
  errorMessage = signal<string>('');

  // Filters State
  searchQuery = '';
  statusFilter = '';
  sortByField = 'createdAt';
  sortOrder: 'asc' | 'desc' = 'desc';
  currentPage = 1;
  pageSize = 10;

  constructor(
    private adminService: AdminService,
    private route: ActivatedRoute,
    private router: Router,
    public lang: LanguageService
  ) {}

  ngOnInit() {
    // Listen to query parameters for direct filtering (e.g. from notifications or stats cards)
    this.route.queryParams.subscribe(params => {
      if (params['status']) {
        this.statusFilter = params['status'];
      } else {
        this.statusFilter = '';
      }
      this.currentPage = 1;
      this.loadCandidates();
    });
  }

  loadCandidates() {
    this.isLoading.set(true);
    this.errorMessage.set('');

    this.adminService.getApplicants({
      search: this.searchQuery,
      status: this.statusFilter,
      sortBy: this.sortByField,
      sortOrder: this.sortOrder,
      page: this.currentPage,
      limit: this.pageSize
    }).subscribe({
      next: (res) => {
        this.isLoading.set(false);
        if (res.success) {
          this.candidates.set(res.data);
          this.totalCandidates.set(res.total);
        } else {
          this.errorMessage.set(this.lang.currentLang() === 'en' ? 'Failed to load candidates.' : 'فشل تحميل بيانات المتقدمين.');
        }
      },
      error: (err) => {
        this.isLoading.set(false);
        this.errorMessage.set(this.lang.currentLang() === 'en' ? 'Failed to fetch candidates from server.' : 'فشل جلب المتقدمين من الخادم.');
        console.error(err);
      }
    });
  }

  // Filter handlers
  onSearch() {
    this.currentPage = 1;
    this.loadCandidates();
  }

  onFilterChange() {
    this.currentPage = 1;
    // Update route query param implicitly
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { status: this.statusFilter || null },
      queryParamsHandling: 'merge'
    });
  }

  onSort(field: string) {
    if (this.sortByField === field) {
      this.sortOrder = this.sortOrder === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortByField = field;
      this.sortOrder = 'desc';
    }
    this.currentPage = 1;
    this.loadCandidates();
  }

  // Pagination handlers
  prevPage() {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.loadCandidates();
    }
  }

  nextPage() {
    if (this.currentPage * this.pageSize < this.totalCandidates()) {
      this.currentPage++;
      this.loadCandidates();
    }
  }

  get totalPages(): number {
    return Math.ceil(this.totalCandidates() / this.pageSize) || 1;
  }

  // Action handlers
  downloadCV(id: string, name: string) {
    this.adminService.downloadCV(id).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `CV-${name.replace(/\s+/g, '_')}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      },
      error: (err) => {
        const errAlert = this.lang.currentLang() === 'en'
          ? 'Failed to download CV file. Make sure it exists on the server.'
          : 'فشل تحميل ملف السيرة الذاتية. تأكد من وجود الملف على الخادم.';
        alert(errAlert);
      }
    });
  }

  deleteCandidate(id: string, name: string) {
    const confirmDelete = confirm(
      this.lang.currentLang() === 'en'
        ? `Are you sure you want to permanently delete the interview for ${name || 'this candidate'}? This action cannot be undone.`
        : `هل أنت متأكد من رغبتك في حذف المقابلة لـ ${name || 'هذا المتقدم'} بشكل نهائي؟ لا يمكن التراجع عن هذا الإجراء.`
    );

    if (confirmDelete) {
      this.adminService.deleteApplicant(id).subscribe({
        next: (res) => {
          if (res.success) {
            alert(this.lang.currentLang() === 'en' ? 'Interview deleted successfully.' : 'تم حذف المقابلة بنجاح.');
            this.loadCandidates();
          }
        },
        error: (err) => {
          const errAlert = this.lang.currentLang() === 'en'
            ? 'Failed to delete applicant interview: '
            : 'فشل حذف مقابلة المتقدم: ';
          alert(errAlert + (err?.error?.error || err.message));
        }
      });
    }
  }

  deleteAllDuplicates() {
    const confirmMessage = this.lang.text().DELETE_ALL_DUPLICATES_CONFIRM;
    if (confirm(confirmMessage)) {
      this.isLoading.set(true);
      this.adminService.deleteAllDuplicates().subscribe({
        next: (res) => {
          this.isLoading.set(false);
          if (res.success) {
            alert(this.lang.currentLang() === 'en' ? 'All duplicate interviews deleted successfully.' : 'تم حذف كافة المقابلات المكررة بنجاح.');
            this.loadCandidates();
          }
        },
        error: (err) => {
          this.isLoading.set(false);
          const errAlert = this.lang.currentLang() === 'en'
            ? 'Failed to delete duplicate interviews: '
            : 'فشل حذف المقابلات المكررة: ';
          alert(errAlert + (err?.error?.error || err.message));
        }
      });
    }
  }
}
