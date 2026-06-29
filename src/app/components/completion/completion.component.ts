/**
 * ============================================
 * Completion Component (Modified)
 * ============================================
 * No longer shows scores, evaluations, or
 * question breakdowns. Displays only a
 * confirmation message or disqualification notice.
 */

import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { InterviewService } from '../../services/interview.service';
import { ProctorService } from '../../services/proctor.service';
import { LanguageService } from '../../services/language.service';

@Component({
  selector: 'app-completion',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './completion.component.html',
  styleUrl: './completion.component.css'
})
export class CompletionComponent {
  constructor(
    public interviewService: InterviewService,
    private proctorService: ProctorService,
    public lang: LanguageService
  ) {}

  /** Whether the interview was disqualified */
  get isDisqualified(): boolean {
    return this.interviewService.interviewStatus() === 'disqualified';
  }

  restart() {
    this.proctorService.reset();
    this.interviewService.reset();
  }
}
