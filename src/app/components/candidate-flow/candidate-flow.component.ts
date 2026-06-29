import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { InterviewService } from '../../services/interview.service';
import { LanguageService } from '../../services/language.service';
import { CvUploadComponent } from '../cv-upload/cv-upload.component';
import { QuestionsListComponent } from '../questions-list/questions-list.component';
import { InterviewSessionComponent } from '../interview-session/interview-session.component';
import { CompletionComponent } from '../completion/completion.component';

@Component({
  selector: 'app-candidate-flow',
  standalone: true,
  imports: [
    CommonModule,
    CvUploadComponent,
    QuestionsListComponent,
    InterviewSessionComponent,
    CompletionComponent
  ],
  templateUrl: './candidate-flow.component.html',
  styles: [`
    /* Reused main content spacing constraints */
    :host {
      display: block;
      width: 100%;
    }
  `]
})
export class CandidateFlowComponent {
  constructor(
    public interviewService: InterviewService,
    public lang: LanguageService
  ) {}
}
