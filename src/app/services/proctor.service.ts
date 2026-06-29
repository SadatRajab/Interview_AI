/**
 * ============================================
 * Proctor Service — Anti-Cheating Monitor
 * ============================================
 * Monitors the user during the interview for:
 * - Tab switching / visibility changes
 * - Fullscreen exit
 * - Window blur (app switching)
 * - Page refresh / navigation
 * - Developer tools shortcuts
 * - Right-click context menu
 * 
 * Every violation is recorded to the backend
 * and the user is warned / disqualified.
 */

import { Injectable, signal, NgZone } from '@angular/core';
import { ApiService } from './api.service';
import { firstValueFrom } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ProctorService {
  // ---- Public Signals ----
  /** Whether the browser is in fullscreen mode */
  readonly isFullscreen = signal<boolean>(false);

  /** Whether the interview is paused due to a violation */
  readonly isPaused = signal<boolean>(false);

  /** Current violation count */
  readonly violationCount = signal<number>(0);

  /** Maximum violations before disqualification */
  readonly maxViolations = signal<number>(3);

  /** Whether the user has been disqualified */
  readonly isDisqualified = signal<boolean>(false);

  /** Warning message to display */
  readonly showWarning = signal<string>('');

  /** Whether monitoring is active */
  readonly isMonitoring = signal<boolean>(false);

  // ---- Private State ----
  private interviewId: string = '';
  private boundHandlers: { [key: string]: EventListener } = {};

  constructor(
    private apiService: ApiService,
    private ngZone: NgZone
  ) {}

  /**
   * Start monitoring for anti-cheating violations.
   * Called when the interview session begins.
   */
  startMonitoring(interviewId: string): void {
    this.interviewId = interviewId;
    this.isMonitoring.set(true);
    this.isPaused.set(false);
    this.isDisqualified.set(false);
    this.violationCount.set(0);
    this.showWarning.set('');

    // Bind all event listeners
    this.bindEventListeners();
  }

  /**
   * Stop monitoring.
   * Called when the interview ends normally.
   */
  stopMonitoring(): void {
    this.isMonitoring.set(false);
    this.unbindEventListeners();
    this.exitFullscreen();
  }

  /**
   * Request fullscreen mode.
   * Returns true if successful.
   */
  async requestFullscreen(): Promise<boolean> {
    try {
      const docEl = document.documentElement;

      if (docEl.requestFullscreen) {
        await docEl.requestFullscreen();
      } else if ((docEl as any).webkitRequestFullscreen) {
        await (docEl as any).webkitRequestFullscreen();
      } else if ((docEl as any).msRequestFullscreen) {
        await (docEl as any).msRequestFullscreen();
      }

      this.isFullscreen.set(true);
      return true;
    } catch (error) {
      console.error('Failed to enter fullscreen:', error);
      this.isFullscreen.set(false);
      return false;
    }
  }

  /**
   * Exit fullscreen mode.
   */
  exitFullscreen(): void {
    try {
      if (document.fullscreenElement) {
        document.exitFullscreen();
      } else if ((document as any).webkitExitFullscreen) {
        (document as any).webkitExitFullscreen();
      } else if ((document as any).msExitFullscreen) {
        (document as any).msExitFullscreen();
      }
    } catch (error) {
      // Ignore exit errors
    }
    this.isFullscreen.set(false);
  }

  /**
   * Resume the interview after a pause.
   * Requires fullscreen to be re-entered.
   */
  async resumeInterview(): Promise<boolean> {
    const entered = await this.requestFullscreen();
    if (entered) {
      this.isPaused.set(false);
      this.showWarning.set('');
      return true;
    }
    return false;
  }

  /**
   * Reset all proctor state.
   */
  reset(): void {
    this.stopMonitoring();
    this.interviewId = '';
    this.isFullscreen.set(false);
    this.isPaused.set(false);
    this.violationCount.set(0);
    this.isDisqualified.set(false);
    this.showWarning.set('');
    this.isMonitoring.set(false);
  }

  // ====================================================
  // PRIVATE: Event Listener Management
  // ====================================================

  private bindEventListeners(): void {
    // Fullscreen change
    this.boundHandlers['fullscreenchange'] = this.onFullscreenChange.bind(this);
    document.addEventListener('fullscreenchange', this.boundHandlers['fullscreenchange']);
    document.addEventListener('webkitfullscreenchange', this.boundHandlers['fullscreenchange']);

    // Visibility change (tab switch / minimize)
    this.boundHandlers['visibilitychange'] = this.onVisibilityChange.bind(this);
    document.addEventListener('visibilitychange', this.boundHandlers['visibilitychange']);

    // Window blur (app switch)
    this.boundHandlers['blur'] = this.onWindowBlur.bind(this);
    window.addEventListener('blur', this.boundHandlers['blur']);

    // Before unload (page refresh / close)
    this.boundHandlers['beforeunload'] = this.onBeforeUnload.bind(this) as EventListener;
    window.addEventListener('beforeunload', this.boundHandlers['beforeunload']);

    // Keyboard shortcuts for dev tools
    this.boundHandlers['keydown'] = this.onKeyDown.bind(this) as EventListener;
    document.addEventListener('keydown', this.boundHandlers['keydown']);

    // Right-click context menu
    this.boundHandlers['contextmenu'] = this.onContextMenu.bind(this);
    document.addEventListener('contextmenu', this.boundHandlers['contextmenu']);
  }

  private unbindEventListeners(): void {
    document.removeEventListener('fullscreenchange', this.boundHandlers['fullscreenchange']);
    document.removeEventListener('webkitfullscreenchange', this.boundHandlers['fullscreenchange']);
    document.removeEventListener('visibilitychange', this.boundHandlers['visibilitychange']);
    window.removeEventListener('blur', this.boundHandlers['blur']);
    window.removeEventListener('beforeunload', this.boundHandlers['beforeunload']);
    document.removeEventListener('keydown', this.boundHandlers['keydown']);
    document.removeEventListener('contextmenu', this.boundHandlers['contextmenu']);

    this.boundHandlers = {};
  }

  // ====================================================
  // PRIVATE: Event Handlers
  // ====================================================

  private onFullscreenChange(): void {
    this.ngZone.run(() => {
      const isFS = !!document.fullscreenElement || !!(document as any).webkitFullscreenElement;
      this.isFullscreen.set(isFS);

      if (!isFS && this.isMonitoring() && !this.isDisqualified()) {
        this.handleViolation('fullscreen_exit', 'User exited fullscreen mode');
        this.isPaused.set(true);
        this.showWarning.set('You have exited fullscreen mode. Please return to fullscreen to continue the interview.');
      }
    });
  }

  private onVisibilityChange(): void {
    this.ngZone.run(() => {
      if (document.hidden && this.isMonitoring() && !this.isDisqualified()) {
        this.handleViolation('tab_switch', 'User switched tabs or minimized browser');
      }
    });
  }

  private onWindowBlur(): void {
    this.ngZone.run(() => {
      if (this.isMonitoring() && !this.isDisqualified()) {
        this.handleViolation('window_blur', 'Browser window lost focus');
      }
    });
  }

  private onBeforeUnload(event: BeforeUnloadEvent): void {
    if (this.isMonitoring() && !this.isDisqualified()) {
      // Record violation attempt (may not reach backend before page unloads)
      this.handleViolation('page_refresh', 'User attempted to refresh or leave the page');

      // Show browser confirmation dialog
      event.preventDefault();
      event.returnValue = 'Your interview is in progress. Are you sure you want to leave?';
    }
  }

  private onKeyDown(event: KeyboardEvent): void {
    if (!this.isMonitoring() || this.isDisqualified()) return;

    // Detect developer tools shortcuts
    const isDevToolsShortcut =
      event.key === 'F12' ||
      (event.ctrlKey && event.shiftKey && event.key === 'I') ||  // Ctrl+Shift+I
      (event.ctrlKey && event.shiftKey && event.key === 'J') ||  // Ctrl+Shift+J
      (event.ctrlKey && event.shiftKey && event.key === 'C') ||  // Ctrl+Shift+C
      (event.ctrlKey && event.key === 'u') ||                     // Ctrl+U (view source)
      (event.ctrlKey && event.key === 'U');

    if (isDevToolsShortcut) {
      event.preventDefault();
      event.stopPropagation();
      this.ngZone.run(() => {
        this.handleViolation('devtools_open', 'User attempted to open developer tools');
      });
    }
  }

  private onContextMenu(event: Event): void {
    if (this.isMonitoring() && !this.isDisqualified()) {
      event.preventDefault();
      this.ngZone.run(() => {
        this.handleViolation('context_menu', 'User attempted to open context menu');
      });
    }
  }

  // ====================================================
  // PRIVATE: Violation Recording
  // ====================================================

  /**
   * Handle a violation: record to backend, update local state.
   * Auto-disqualifies if max violations reached.
   */
  private async handleViolation(type: string, description: string): Promise<void> {
    if (!this.interviewId || this.isDisqualified()) return;

    // Update local violation count immediately for responsive UI
    this.violationCount.update(c => c + 1);

    try {
      const response = await firstValueFrom(
        this.apiService.recordViolation(this.interviewId, type, description)
      );

      // Sync with backend count
      this.violationCount.set(response.violationCount);
      this.maxViolations.set(response.maxViolations);

      if (response.disqualified) {
        this.isDisqualified.set(true);
        this.isPaused.set(false);
        this.showWarning.set('The interview has been cancelled due to a violation of the exam rules.');
        this.unbindEventListeners();
      } else if (type !== 'fullscreen_exit') {
        // Show temporary warning for non-fullscreen violations
        this.showWarning.set(
          `Warning: ${description}. Violation ${response.violationCount} of ${response.maxViolations}.`
        );
        setTimeout(() => {
          if (!this.isPaused()) {
            this.showWarning.set('');
          }
        }, 5000);
      }
    } catch (error) {
      console.error('Failed to record violation:', error);
      // Even if backend fails, keep local count
    }
  }
}
