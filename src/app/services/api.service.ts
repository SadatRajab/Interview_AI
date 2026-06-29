/**
 * ============================================
 * API Service
 * ============================================
 * Communicates with the backend API.
 * Replaces direct HuggingFace API calls.
 * All sensitive data (scores, evaluations) stays
 * on the backend — this service only receives
 * safe responses.
 */

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

/** Response from CV upload endpoint */
export interface UploadCVResponse {
  success: boolean;
  interviewId: string;
  text: string;
}

/** Response from start interview endpoint */
export interface StartInterviewResponse {
  success: boolean;
  interviewId: string;
  questions: string[];
}

/** Response from submit answer endpoint */
export interface SubmitAnswerResponse {
  success: boolean;
  questionIndex: number;
}

/** Response from record violation endpoint */
export interface RecordViolationResponse {
  success: boolean;
  violationCount: number;
  maxViolations: number;
  disqualified: boolean;
  message: string;
}

/** Response from finish interview endpoint */
export interface FinishInterviewResponse {
  success: boolean;
  message: string;
}

/** Response from interview status endpoint */
export interface InterviewStatusResponse {
  success: boolean;
  status: string;
  violationCount: number;
}

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  /** Backend API base URL */
  private readonly API_BASE = 'http://localhost:3000/api';

  constructor(private http: HttpClient) {}

  /**
   * Upload a CV file to the backend.
   * Backend extracts text via AI API and creates interview session.
   */
  uploadCV(file: File): Observable<UploadCVResponse> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<UploadCVResponse>(
      `${this.API_BASE}/interview/upload-cv`,
      formData
    );
  }

  /**
   * Start the interview — generates questions.
   * Requires agreement to terms.
   */
  startInterview(interviewId: string, agreedToTerms: boolean): Observable<StartInterviewResponse> {
    return this.http.post<StartInterviewResponse>(
      `${this.API_BASE}/interview/start`,
      { interviewId, agreedToTerms }
    );
  }

  /**
   * Submit an answer for a specific question.
   * Backend evaluates and scores it — but NEVER returns scores.
   */
  submitAnswer(interviewId: string, questionIndex: number, answerText: string): Observable<SubmitAnswerResponse> {
    return this.http.post<SubmitAnswerResponse>(
      `${this.API_BASE}/interview/${interviewId}/answer`,
      { questionIndex, answerText }
    );
  }

  /**
   * Record a violation (tab switch, fullscreen exit, etc.)
   * Backend tracks it and may auto-disqualify.
   */
  recordViolation(interviewId: string, type: string, description?: string): Observable<RecordViolationResponse> {
    return this.http.post<RecordViolationResponse>(
      `${this.API_BASE}/violation/${interviewId}/record`,
      { type, description }
    );
  }

  /**
   * Finish the interview.
   * Backend calculates final score — returns only a message.
   */
  finishInterview(interviewId: string): Observable<FinishInterviewResponse> {
    return this.http.post<FinishInterviewResponse>(
      `${this.API_BASE}/interview/${interviewId}/finish`,
      {}
    );
  }

  /**
   * Get the current interview status.
   */
  getInterviewStatus(interviewId: string): Observable<InterviewStatusResponse> {
    return this.http.get<InterviewStatusResponse>(
      `${this.API_BASE}/interview/${interviewId}/status`
    );
  }
}
