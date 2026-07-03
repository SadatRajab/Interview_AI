/**
 * ============================================
 * Interview Service (Refactored)
 * ============================================
 * Central state management for the interview flow.
 * Now uses ApiService to communicate with the backend
 * instead of calling the HuggingFace API directly.
 * 
 * IMPORTANT: Scores and evaluations are NO LONGER
 * stored or displayed on the frontend. All scoring
 * happens server-side in the backend.
 */

import { Injectable, signal, computed } from '@angular/core';
import { ApiService } from './api.service';
import { LanguageService } from './language.service';
import { firstValueFrom } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class InterviewService {
  // ---- State Signals ----
  
  /** Current step in the flow: 1=Upload, 2=Questions, 3=Interview, 4=Completion */
  readonly currentStep = signal<number>(1);
  
  /** Interview session ID from the backend */
  readonly interviewId = signal<string>('');
  
  /** Extracted CV text (safe to show) */
  readonly cvText = signal<string>('');
  
  /** Generated questions (safe to show) */
  readonly questions = signal<string[]>([]);
  
  /** Current question index */
  readonly currentQuestionIndex = signal<number>(0);
  
  /** User's answers (local copy for the textarea) */
  readonly answers = signal<string[]>([]);
  
  /** Tracks which questions have been submitted to the backend */
  readonly submittedAnswers = signal<boolean[]>([]);
  
  /** Interview status */
  readonly interviewStatus = signal<'pending' | 'in_progress' | 'completed' | 'disqualified'>('pending');
  
  /** Whether user agreed to terms */
  readonly agreedToTerms = signal<boolean>(false);
  
  /** Whether to show the instructions modal */
  readonly showInstructionsModal = signal<boolean>(false);

  // ---- Schedule / Availability State ----
  readonly isAvailable = signal<boolean>(true);
  readonly scheduleStatus = signal<string>('open');
  readonly scheduleStart = signal<Date | null>(null);
  readonly scheduleEnd = signal<Date | null>(null);

  // ---- UI State ----
  readonly isLoading = signal<boolean>(false);
  readonly loadingMessage = signal<string>('');
  readonly errorMessage = signal<string>('');
  readonly successMessage = signal<string>('');
  
  /** Completion message from backend */
  readonly completionMessage = signal<string>('');

  // ---- Computed Values ----
  readonly currentQuestion = computed(() => {
    const qs = this.questions();
    const idx = this.currentQuestionIndex();
    return qs[idx] || '';
  });

  readonly currentAnswer = computed(() => {
    const ans = this.answers();
    const idx = this.currentQuestionIndex();
    return ans[idx] || '';
  });

  readonly isCurrentAnswerSubmitted = computed(() => {
    const submitted = this.submittedAnswers();
    const idx = this.currentQuestionIndex();
    return submitted[idx] || false;
  });

  readonly progressPercentage = computed(() => {
    const total = this.questions().length;
    if (total === 0) return 0;
    return ((this.currentQuestionIndex() + 1) / total) * 100;
  });

  readonly isFirstQuestion = computed(() => this.currentQuestionIndex() === 0);
  readonly isLastQuestion = computed(() => {
    const total = this.questions().length;
    return total > 0 && this.currentQuestionIndex() === total - 1;
  });

  constructor(
    private apiService: ApiService,
    private langService: LanguageService
  ) {
    this.checkAvailability();
  }

  async checkAvailability(): Promise<void> {
    try {
      const res = await firstValueFrom(this.apiService.getInterviewAvailability());
      if (res.success) {
        this.isAvailable.set(res.isAvailable);
        this.scheduleStatus.set(res.status);
        this.scheduleStart.set(res.startDate ? new Date(res.startDate) : null);
        this.scheduleEnd.set(res.endDate ? new Date(res.endDate) : null);
      }
    } catch (err) {
      console.error('Failed to fetch interview availability:', err);
    }
  }

  // ---- Alert Helpers ----
  showError(message: string) {
    this.errorMessage.set(message);
    setTimeout(() => this.errorMessage.set(''), 5000);
  }

  showSuccess(message: string) {
    this.successMessage.set(message);
    setTimeout(() => this.successMessage.set(''), 5000);
  }

  // ====================================================
  // API Methods — All go through the backend
  // ====================================================

  /**
   * Upload CV file to the backend.
   * Backend extracts text and creates interview session.
   */
  async extractCV(file: File): Promise<string> {
    this.isLoading.set(true);
    this.loadingMessage.set('Extracting CV text...');
    this.errorMessage.set('');

    try {
      const response = await firstValueFrom(
        this.apiService.uploadCV(file)
      );

      if (!response || !response.text) {
        throw new Error('Invalid response from server');
      }

      this.interviewId.set(response.interviewId);
      this.cvText.set(response.text);
      this.showSuccess('CV extracted successfully!');
      return response.text;
    } catch (err: any) {
      const errMsg = err?.error?.error || err.message || 'Failed to extract CV. Please try again.';
      this.showError(errMsg);
      throw err;
    } finally {
      this.isLoading.set(false);
    }
  }

  /**
   * Start the interview by generating questions via the backend.
   * Requires interviewId and terms agreement.
   */
  async startInterview(): Promise<string[]> {
    const id = this.interviewId();
    if (!id) {
      this.showError('No interview session found. Please upload a CV first.');
      return [];
    }

    this.isLoading.set(true);
    this.loadingMessage.set('Generating interview questions...');
    this.errorMessage.set('');

    const lang = this.langService.currentLang();

    try {
      const response = await firstValueFrom(
        this.apiService.startInterview(id, true, lang)
      );

      const questions = response.questions;
      if (!questions || questions.length === 0) {
        throw new Error('No questions generated.');
      }

      this.questions.set(questions);
      this.answers.set(new Array(questions.length).fill(''));
      this.submittedAnswers.set(new Array(questions.length).fill(false));
      this.currentQuestionIndex.set(0);
      this.interviewStatus.set('in_progress');
      this.currentStep.set(2);

      this.showSuccess(`Generated ${questions.length} interview questions!`);
      return questions;
    } catch (err: any) {
      const errMsg = err?.error?.error || err.message || 'Failed to generate questions. Please try again.';
      this.showError(errMsg);
      throw err;
    } finally {
      this.isLoading.set(false);
    }
  }

  /**
   * Submit the current answer to the backend.
   * The backend evaluates and scores it — but we NEVER see the score.
   */
  async submitCurrentAnswer(): Promise<boolean> {
    const idx = this.currentQuestionIndex();
    const answer = this.currentAnswer().trim();

    if (!answer) {
      this.showError('Please provide an answer before submitting.');
      return false;
    }

    this.isLoading.set(true);
    this.loadingMessage.set('Submitting your answer...');
    this.errorMessage.set('');

    const lang = this.langService.currentLang();

    try {
      await firstValueFrom(
        this.apiService.submitAnswer(this.interviewId(), idx, answer, lang)
      );

      // Mark this question as submitted
      this.submittedAnswers.update(subs => {
        const copy = [...subs];
        copy[idx] = true;
        return copy;
      });

      this.showSuccess('Answer submitted successfully!');
      return true;
    } catch (err: any) {
      // Check if disqualified
      if (err?.error?.status === 'disqualified') {
        this.interviewStatus.set('disqualified');
        this.currentStep.set(4);
        this.completionMessage.set('The interview has been cancelled due to a violation of the exam rules.');
        return false;
      }
      const errMsg = err?.error?.error || err.message || 'Failed to submit answer. Please try again.';
      this.showError(errMsg);
      return false;
    } finally {
      this.isLoading.set(false);
    }
  }

  /**
   * Finish the interview.
   * Backend calculates final score — we only get a message.
   */
  async finishInterview(): Promise<void> {
    this.isLoading.set(true);
    this.loadingMessage.set('Completing interview...');

    try {
      const response = await firstValueFrom(
        this.apiService.finishInterview(this.interviewId())
      );

      this.interviewStatus.set('completed');
      this.completionMessage.set(response.message);
      this.currentStep.set(4);
    } catch (err: any) {
      if (err?.error?.status === 'disqualified') {
        this.interviewStatus.set('disqualified');
        this.completionMessage.set('The interview has been cancelled due to a violation of the exam rules.');
        this.currentStep.set(4);
      } else {
        const errMsg = err?.error?.error || err.message || 'Failed to complete interview.';
        this.showError(errMsg);
      }
    } finally {
      this.isLoading.set(false);
    }
  }

  // ---- State Navigation ----
  
  updateCurrentAnswer(value: string) {
    this.answers.update(ans => {
      const copy = [...ans];
      copy[this.currentQuestionIndex()] = value;
      return copy;
    });
  }

  nextQuestion() {
    if (this.currentQuestionIndex() < this.questions().length - 1) {
      this.currentQuestionIndex.update(idx => idx + 1);
    }
  }

  prevQuestion() {
    if (this.currentQuestionIndex() > 0) {
      this.currentQuestionIndex.update(idx => idx - 1);
    }
  }

  reset() {
    this.currentStep.set(1);
    this.interviewId.set('');
    this.cvText.set('');
    this.questions.set([]);
    this.currentQuestionIndex.set(0);
    this.answers.set([]);
    this.submittedAnswers.set([]);
    this.interviewStatus.set('pending');
    this.agreedToTerms.set(false);
    this.showInstructionsModal.set(false);
    this.completionMessage.set('');
    this.isLoading.set(false);
    this.loadingMessage.set('');
    this.errorMessage.set('');
    this.successMessage.set('');
  }
}
