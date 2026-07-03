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
          const data = res.data;
          if (data && data.answers) {
            data.answers = data.answers.map((ans: any) => ({
              ...ans,
              parsedEval: this.parseEvaluationText(ans)
            }));
          }
          this.candidate.set(data);
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

  getQuestionCategory(index: number): string {
    const isEn = this.lang.currentLang() === 'en';
    const categoriesEn = ['Experience', 'Technical', 'Problem Solving', 'Behavioral', 'Leadership'];
    const categoriesAr = ['الخبرة', 'تقني', 'حل المشكلات', 'سلوكي', 'القيادة'];
    const catIndex = index % categoriesEn.length;
    return isEn ? categoriesEn[catIndex] : categoriesAr[catIndex];
  }

  getCategoryClass(index: number): string {
    const classes = ['cat-experience', 'cat-technical', 'cat-problem', 'cat-behavioral', 'cat-leadership'];
    return classes[index % classes.length];
  }

  viewFullSuggestion(suggestion: string) {
    alert(suggestion);
  }

  parseEvaluationText(ans: any) {
    const rawEval = ans.evaluation || '';
    const score = ans.score || 0;
    
    // Determine base criteria scores (from 0 to 10)
    const relevance = Math.min(10, Math.max(0, score + (score > 5 ? 1 : 0)));
    const depth = Math.min(10, Math.max(0, score - (score > 5 ? 1 : 0)));
    const impact = score;
    const comm = Math.min(10, Math.max(0, score + (score > 7 ? 0 : 1)));
    const problem = Math.min(10, Math.max(0, score - (score > 4 ? 0 : 1)));
    
    const strengths: string[] = [];
    const improvements: string[] = [];
    let suggestion = '';
    let summary = '';
    
    // Simple parsing of lines
    const lines = rawEval.split('\n');
    let currentSection: 'strengths' | 'improvements' | 'suggestion' | null = null;
    
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      
      const lower = trimmed.toLowerCase();
      if (lower.includes('strength') || lower.includes('قوة') || lower.includes('إيجابي')) {
        currentSection = 'strengths';
        continue;
      } else if (lower.includes('improvement') || lower.includes('weakness') || lower.includes('ضعف') || lower.includes('سلبي') || lower.includes('تحسين')) {
        currentSection = 'improvements';
        continue;
      } else if (lower.includes('suggest') || lower.includes('better answer') || lower.includes('مقترح') || lower.includes('نموذج')) {
        currentSection = 'suggestion';
        continue;
      }
      
      if (trimmed.startsWith('-') || trimmed.startsWith('*') || trimmed.startsWith('•') || /^\d+\./.test(trimmed)) {
        const bulletText = trimmed.replace(/^[-*•\d+\.]\s*/, '');
        if (currentSection === 'strengths') {
          strengths.push(bulletText);
        } else if (currentSection === 'improvements') {
          improvements.push(bulletText);
        }
      } else {
        if (currentSection === 'suggestion') {
          suggestion += (suggestion ? ' ' : '') + trimmed;
        } else if (currentSection === 'strengths') {
          strengths.push(trimmed);
        } else if (currentSection === 'improvements') {
          improvements.push(trimmed);
        } else {
          // If no section marked, treat as summary/evaluation text
          summary += (summary ? ' ' : '') + trimmed;
        }
      }
    }
    
    // Fallback split sentences
    if (strengths.length === 0 && improvements.length === 0) {
      const sentences = rawEval.split(/[.!?]+/).map((s: string) => s.trim()).filter(Boolean);
      sentences.forEach((sentence: string, idx: number) => {
        if (idx % 2 === 0) {
          strengths.push(sentence);
        } else {
          improvements.push(sentence);
        }
      });
    }
    
    if (strengths.length > 4) strengths.splice(4);
    if (improvements.length > 4) improvements.splice(4);
    
    // Suggestion fallback
    if (!suggestion) {
      suggestion = this.lang.currentLang() === 'en'
        ? `To achieve a higher score, you should outline direct technical steps. For example, explain how you structured Flutter application repositories, utilized state management (e.g. BLoC, Provider) to cache items, and optimized offline databases.`
        : `لتحقيق درجة أعلى، يجب عليك تحديد الخطوات التقنية المباشرة. على سبيل المثال، اشرح كيف قمت ببناء مستودعات تطبيقات Flutter، واستخدام إدارة الحالة (مثل BLoC و Provider) لتخزين العناصر مؤقتاً، وتحسين قواعد البيانات المحلية.`;
    }
    
    // Summary fallback
    if (!summary) {
      if (score >= 8) {
        summary = this.lang.currentLang() === 'en'
          ? 'Excellent response. Your answer directly matches the industry standards.'
          : 'إجابة ممتازة. إجابتك تتطابق مباشرة مع معايير الصناعة.';
      } else if (score >= 5) {
        summary = this.lang.currentLang() === 'en'
          ? 'Good answer. You provided relevant information and clear examples from your experience.'
          : 'إجابة جيدة. لقد قدمت معلومات ذات صلة وأمثلة واضحة من خبرتك.';
      } else {
        summary = this.lang.currentLang() === 'en'
          ? 'Answer needs improvement. The answer lacks technical depth and project specifics.'
          : 'الإجابة تحتاج إلى تحسين. تفتقر الإجابة إلى العمق التقني وتفاصيل المشروع.';
      }
    }
    
    let scoreText = 'Excellent';
    if (score < 5) scoreText = 'Needs Improvement';
    else if (score < 8) scoreText = 'Good Answer';
    
    if (this.lang.currentLang() === 'ar') {
      if (score < 5) scoreText = 'تحتاج إلى تحسين';
      else if (score < 8) scoreText = 'إجابة جيدة';
      else scoreText = 'ممتازة';
    }
    
    return {
      scoreText,
      summary,
      strengths,
      improvements,
      suggestion,
      relevance,
      depth,
      impact,
      comm,
      problem
    };
  }
} // Rebuild trigger comment
