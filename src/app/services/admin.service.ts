/**
 * ============================================
 * Admin Service
 * ============================================
 * Handles authentication, statistics, candidate listing,
 * candidate details, and CV file operations.
 * Stores JWT tokens securely in localStorage.
 */

import { Injectable, signal } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, tap } from 'rxjs';

export interface AdminLoginResponse {
  success: boolean;
  token: string;
  expiresIn: string;
}

export interface StatsData {
  totalCandidates: number;
  completedInterviews: number;
  ongoingInterviews: number;
  cancelledInterviews: number;
  disqualifiedInterviews: number;
  totalViolations: number;
  averageScore: number;
  duplicateCandidates: number;
}

export interface ApplicantSummary {
  _id: string;
  applicantName: string;
  email: string;
  phone: string;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled' | 'disqualified';
  cvOriginalName: string;
  currentScore: number;
  finalScore: number;
  maxPossibleScore: number;
  violationCount: number;
  createdAt: string;
  isDuplicate: boolean;
}

export interface ApplicantsListResponse {
  success: boolean;
  total: number;
  page: number;
  limit: number;
  data: ApplicantSummary[];
}

export interface ApplicantDetail {
  _id: string;
  applicantName: string;
  email: string;
  phone: string;
  cvFilePath: string;
  cvOriginalName: string;
  cvText: string;
  questions: string[];
  answers: Array<{
    questionIndex: number;
    questionText: string;
    answerText: string;
    evaluation: string;
    score: number;
    answeredAt: string;
  }>;
  currentScore: number;
  finalScore: number;
  maxPossibleScore: number;
  violationCount: number;
  violations: Array<{
    type: string;
    timestamp: string;
    description: string;
    pointsDeducted: number;
  }>;
  status: string;
  agreedToTerms: boolean;
  startedAt: string;
  completedAt: string;
  createdAt: string;
  isDuplicate: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class AdminService {
  private readonly API_BASE = 'http://localhost:3000/api/admin';
  private readonly TOKEN_KEY = 'admin_jwt_token';

  readonly isAuthenticated = signal<boolean>(this.hasToken());

  constructor(private http: HttpClient) {}

  private hasToken(): boolean {
    return !!localStorage.getItem(this.TOKEN_KEY);
  }

  getToken(): string {
    return localStorage.getItem(this.TOKEN_KEY) || '';
  }

  getAuthHeaders(): HttpHeaders {
    return new HttpHeaders({
      'Authorization': `Bearer ${this.getToken()}`
    });
  }

  login(username: string, password: string): Observable<AdminLoginResponse> {
    return this.http.post<AdminLoginResponse>(`${this.API_BASE}/login`, { username, password })
      .pipe(
        tap(res => {
          if (res && res.token) {
            localStorage.setItem(this.TOKEN_KEY, res.token);
            this.isAuthenticated.set(true);
          }
        })
      );
  }

  logout() {
    localStorage.removeItem(this.TOKEN_KEY);
    this.isAuthenticated.set(false);
  }

  getStatistics(): Observable<{ success: boolean; data: StatsData }> {
    return this.http.get<{ success: boolean; data: StatsData }>(`${this.API_BASE}/statistics`, {
      headers: this.getAuthHeaders()
    });
  }

  getApplicants(params?: {
    search?: string;
    status?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    page?: number;
    limit?: number;
  }): Observable<ApplicantsListResponse> {
    let httpParams = new HttpParams();
    if (params) {
      if (params.search) httpParams = httpParams.set('search', params.search);
      if (params.status) httpParams = httpParams.set('status', params.status);
      if (params.sortBy) httpParams = httpParams.set('sortBy', params.sortBy);
      if (params.sortOrder) httpParams = httpParams.set('sortOrder', params.sortOrder);
      if (params.page) httpParams = httpParams.set('page', params.page.toString());
      if (params.limit) httpParams = httpParams.set('limit', params.limit.toString());
    }

    return this.http.get<ApplicantsListResponse>(`${this.API_BASE}/applicants`, {
      headers: this.getAuthHeaders(),
      params: httpParams
    });
  }

  getApplicantDetail(id: string): Observable<{ success: boolean; data: ApplicantDetail }> {
    return this.http.get<{ success: boolean; data: ApplicantDetail }>(`${this.API_BASE}/applicants/${id}`, {
      headers: this.getAuthHeaders()
    });
  }

  downloadCV(id: string): Observable<Blob> {
    return this.http.get(`${this.API_BASE}/applicants/${id}/download`, {
      headers: this.getAuthHeaders(),
      responseType: 'blob'
    });
  }

  deleteApplicant(id: string): Observable<{ success: boolean; message: string }> {
    return this.http.delete<{ success: boolean; message: string }>(`${this.API_BASE}/applicants/${id}`, {
      headers: this.getAuthHeaders()
    });
  }

  updateStatus(id: string, status: string): Observable<{ success: boolean; data: any }> {
    return this.http.put<{ success: boolean; data: any }>(`${this.API_BASE}/applicants/${id}/status`, { status }, {
      headers: this.getAuthHeaders()
    });
  }
}
