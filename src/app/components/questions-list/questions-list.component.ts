import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { InterviewService } from '../../services/interview.service';
import { LanguageService } from '../../services/language.service';

@Component({
  selector: 'app-questions-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './questions-list.component.html',
  styleUrl: './questions-list.component.css'
})
export class QuestionsListComponent {
  constructor(
    public interviewService: InterviewService,
    public lang: LanguageService
  ) {}

  startInterview() {
    this.interviewService.currentQuestionIndex.set(0);
    this.interviewService.currentStep.set(3);
  }

  jumpToQuestion(index: number) {
    this.interviewService.currentQuestionIndex.set(index);
    this.interviewService.currentStep.set(3);
  }
}
