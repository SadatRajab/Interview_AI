import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AdminService, ApplicantDetail } from '../../../services/admin.service';
import { LanguageService } from '../../../services/language.service';

@Component({
  selector: 'app-admin-candidate-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './admin-candidate-detail.component.html',
  styleUrl: './admin-candidate-detail.component.css'
})
export class AdminCandidateDetailComponent implements OnInit {
  candidate = signal<ApplicantDetail | null>(null);
  isLoading = signal<boolean>(true);
  errorMessage = signal<string>('');
  
  // Tabs for switching details view
  activeTab: 'answers' | 'violations' | 'cv' = 'answers';

  constructor(
    private adminService: AdminService,
    private route: ActivatedRoute,
    private router: Router,
    public lang: LanguageService
  ) {}

  ngOnInit() {
    this.loadCandidateDetail();
  }

  loadCandidateDetail() {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.errorMessage.set(this.lang.currentLang() === 'en' ? 'Invalid Candidate ID.' : 'معرف المرشح غير صالح.');
      this.isLoading.set(false);
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set('');

    this.adminService.getApplicantDetail(id).subscribe({
      next: (res) => {
        this.isLoading.set(false);
        if (res.success) {
          this.candidate.set(res.data);
        } else {
          this.errorMessage.set(this.lang.currentLang() === 'en' ? 'Failed to load details.' : 'فشل تحميل التفاصيل.');
        }
      },
      error: (err) => {
        this.isLoading.set(false);
        this.errorMessage.set(this.lang.currentLang() === 'en' ? 'Candidate session not found or server error.' : 'جلسة المرشح غير موجودة أو حدث خطأ في الخادم.');
        console.error(err);
      }
    });
  }

  // Get interview duration in HH:MM:SS
  getInterviewDuration(): string {
    const detail = this.candidate();
    if (!detail || !detail.startedAt || !detail.completedAt) {
      return 'N/A';
    }

    const start = new Date(detail.startedAt).getTime();
    const end = new Date(detail.completedAt).getTime();
    
    if (isNaN(start) || isNaN(end) || end <= start) {
      return 'N/A';
    }

    const diffMs = end - start;
    const diffSecs = Math.floor(diffMs / 1000);
    const hrs = Math.floor(diffSecs / 3600);
    const mins = Math.floor((diffSecs % 3600) / 60);
    const secs = diffSecs % 60;

    return [
      hrs.toString().padStart(2, '0'),
      mins.toString().padStart(2, '0'),
      secs.toString().padStart(2, '0')
    ].join(':');
  }

  downloadCV() {
    const detail = this.candidate();
    if (!detail) return;

    this.adminService.downloadCV(detail._id).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `CV-${detail.applicantName.replace(/\s+/g, '_')}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      },
      error: (err) => {
        alert(this.lang.currentLang() === 'en' ? 'Failed to download CV file.' : 'فشل تحميل ملف السيرة الذاتية.');
      }
    });
  }

  changeStatus(status: string) {
    const detail = this.candidate();
    if (!detail) return;

    this.adminService.updateStatus(detail._id, status).subscribe({
      next: (res) => {
        if (res.success) {
          alert(this.lang.currentLang() === 'en' ? 'Status updated successfully.' : 'تم تحديث الحالة بنجاح.');
          this.loadCandidateDetail();
        }
      },
      error: (err) => {
        alert(this.lang.currentLang() === 'en' ? 'Failed to update status.' : 'فشل تحديث الحالة.');
      }
    });
  }

  deleteCandidate() {
    const detail = this.candidate();
    if (!detail) return;

    const confirmDelete = confirm(
      this.lang.currentLang() === 'en'
        ? `Are you sure you want to permanently delete the interview for ${detail.applicantName}? This action cannot be undone.`
        : `هل أنت متأكد من رغبتك في حذف المقابلة لـ ${detail.applicantName} بشكل نهائي؟ لا يمكن التراجع عن هذا الإجراء.`
    );

    if (confirmDelete) {
      this.adminService.deleteApplicant(detail._id).subscribe({
        next: (res) => {
          if (res.success) {
            alert(this.lang.currentLang() === 'en' ? 'Interview deleted successfully.' : 'تم حذف المقابلة بنجاح.');
            this.router.navigate(['/admin/candidates']);
          }
        },
        error: (err) => {
          alert(this.lang.currentLang() === 'en' ? 'Failed to delete interview session.' : 'فشل حذف جلسة المقابلة.');
        }
      });
    }
  }
}
