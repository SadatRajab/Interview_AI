/**
 * ============================================
 * CV Upload Component (Modified)
 * ============================================
 * Now shows the instructions modal after CV
 * extraction, before starting the interview.
 */

import { Component, ElementRef, ViewChild, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { InterviewService } from '../../services/interview.service';
import { ProctorService } from '../../services/proctor.service';
import { LanguageService } from '../../services/language.service';
import { InstructionsModalComponent } from '../instructions-modal/instructions-modal.component';

@Component({
  selector: 'app-cv-upload',
  standalone: true,
  imports: [CommonModule, FormsModule, InstructionsModalComponent],
  templateUrl: './cv-upload.component.html',
  styleUrl: './cv-upload.component.css'
})
export class CvUploadComponent {
  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;
  
  selectedFile = signal<File | null>(null);
  isDragOver = signal<boolean>(false);
  extractedText = signal<string>('');

  constructor(
    public interviewService: InterviewService,
    private proctorService: ProctorService,
    public lang: LanguageService
  ) {
    // Keep internal state in sync with service if service has text
    this.extractedText.set(this.interviewService.cvText());
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.selectedFile.set(input.files[0]);
    }
  }

  triggerFileInput() {
    this.fileInput.nativeElement.click();
  }

  onDragOver(event: DragEvent) {
    event.preventDefault();
    this.isDragOver.set(true);
  }

  onDragLeave() {
    this.isDragOver.set(false);
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    this.isDragOver.set(false);
    if (event.dataTransfer && event.dataTransfer.files.length > 0) {
      const file = event.dataTransfer.files[0];
      const validExtensions = ['.pdf', '.doc', '.docx', '.txt', '.png', '.jpg', '.jpeg'];
      const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
      
      if (validExtensions.includes(fileExtension)) {
        this.selectedFile.set(file);
      } else {
        this.interviewService.showError('Unsupported file format. Please upload PDF, Word, Text, or Image.');
      }
    }
  }

  async extractText() {
    const file = this.selectedFile();
    if (!file) return;

    try {
      const text = await this.interviewService.extractCV(file);
      this.extractedText.set(text);
    } catch (err) {
      // Error is already handled by the service
    }
  }

  /**
   * Show the instructions modal instead of starting directly.
   */
  onStartInterviewClick() {
    // Update the service with the edited text in the textarea
    this.interviewService.cvText.set(this.extractedText());
    // Show the instructions modal
    this.interviewService.showInstructionsModal.set(true);
  }

  /**
   * Called when user confirms the instructions modal.
   * Requests fullscreen then starts the interview.
   */
  async onInstructionsConfirmed() {
    this.interviewService.showInstructionsModal.set(false);
    this.interviewService.agreedToTerms.set(true);

    // Request fullscreen
    const fullscreenOk = await this.proctorService.requestFullscreen();
    if (!fullscreenOk) {
      this.interviewService.showError('Fullscreen mode is required to start the interview. Please allow fullscreen access.');
      return;
    }

    // Start the interview via backend
    try {
      await this.interviewService.startInterview();
      // Proctoring will be started by the interview-session component
    } catch (err) {
      // Exit fullscreen if interview fails to start
      this.proctorService.exitFullscreen();
    }
  }

  /**
   * Called when user cancels the instructions modal.
   */
  onInstructionsCancelled() {
    this.interviewService.showInstructionsModal.set(false);
  }
}
