/**
 * ============================================
 * Interview Session Component (Modified)
 * ============================================
 * Now integrates with ProctorService for
 * anti-cheating monitoring. Submits answers
 * without showing evaluation results.
 */

import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { InterviewService } from '../../services/interview.service';
import { ProctorService } from '../../services/proctor.service';
import { LanguageService } from '../../services/language.service';

@Component({
  selector: 'app-interview-session',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './interview-session.component.html',
  styleUrl: './interview-session.component.css'
})
export class InterviewSessionComponent implements OnInit, OnDestroy {
  charLimit = 2000;

  constructor(
    public interviewService: InterviewService,
    public proctorService: ProctorService,
    public lang: LanguageService
  ) {}

  ngOnInit(): void {
    // Start proctoring when interview session begins
    const interviewId = this.interviewService.interviewId();
    if (interviewId) {
      this.proctorService.startMonitoring(interviewId);
    }
  }

  ngOnDestroy(): void {
    // Don't stop monitoring here — it will be stopped when interview completes
  }

  onAnswerChange(value: string) {
    if (value.length <= this.charLimit) {
      this.interviewService.updateCurrentAnswer(value);
    } else {
      this.interviewService.updateCurrentAnswer(value.substring(0, this.charLimit));
    }
  }

  /**
   * Submit answer to the backend (no evaluation shown).
   */
  async submitAnswer() {
    // Don't allow submission if paused or disqualified
    if (this.proctorService.isPaused() || this.proctorService.isDisqualified()) {
      return;
    }

    const success = await this.interviewService.submitCurrentAnswer();
    
    // Check if disqualified during submission
    if (this.proctorService.isDisqualified()) {
      this.handleDisqualification();
    }
  }

  next() {
    this.interviewService.nextQuestion();
  }

  prev() {
    this.interviewService.prevQuestion();
  }

  skip() {
    this.interviewService.nextQuestion();
  }

  /**
   * Finish the interview normally.
   */
  async finish() {
    this.proctorService.stopMonitoring();
    await this.interviewService.finishInterview();
  }

  /**
   * Resume after a fullscreen violation.
   */
  async resumeFromPause() {
    await this.proctorService.resumeInterview();
  }

  /**
   * Handle disqualification — navigate to completion.
   */
  private handleDisqualification() {
    this.proctorService.stopMonitoring();
    this.interviewService.interviewStatus.set('disqualified');
    this.interviewService.completionMessage.set(
      'The interview has been cancelled due to a violation of the exam rules.'
    );
    this.interviewService.currentStep.set(4);
  }
}
