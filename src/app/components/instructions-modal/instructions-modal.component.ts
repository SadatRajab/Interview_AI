/**
 * ============================================
 * Instructions Modal Component
 * ============================================
 * Displays interview rules and terms before
 * the interview begins. The user must check the
 * agreement checkbox before proceeding.
 * 
 * Shown after CV upload, before questions start.
 */

import { Component, EventEmitter, Output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LanguageService } from '../../services/language.service';

@Component({
  selector: 'app-instructions-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './instructions-modal.component.html',
  styleUrl: './instructions-modal.component.css'
})
export class InstructionsModalComponent {
  /** Emitted when user agrees and clicks "Start Interview" */
  @Output() confirmed = new EventEmitter<void>();

  /** Emitted when user clicks "Cancel" */
  @Output() cancelled = new EventEmitter<void>();

  /** Whether the agreement checkbox is checked */
  agreed = signal<boolean>(false);

  constructor(public lang: LanguageService) {}

  onConfirm(): void {
    if (this.agreed()) {
      this.confirmed.emit();
    }
  }

  onCancel(): void {
    this.cancelled.emit();
  }
}
