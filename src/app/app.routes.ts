import { Routes } from '@angular/router';
import { CandidateFlowComponent } from './components/candidate-flow/candidate-flow.component';
import { adminGuard } from './guards/admin.guard';

export const routes: Routes = [
  {
    path: '',
    component: CandidateFlowComponent
  },
  {
    path: 'admin/login',
    loadComponent: () => import('./components/admin/admin-login/admin-login.component').then(m => m.AdminLoginComponent)
  },
  {
    path: 'admin',
    loadComponent: () => import('./components/admin/admin-dashboard/admin-dashboard.component').then(m => m.AdminDashboardComponent),
    canActivate: [adminGuard],
    children: [
      {
        path: '',
        redirectTo: 'stats',
        pathMatch: 'full'
      },
      {
        path: 'stats',
        loadComponent: () => import('./components/admin/admin-stats/admin-stats.component').then(m => m.AdminStatsComponent)
      },
      {
        path: 'candidates',
        loadComponent: () => import('./components/admin/admin-candidates/admin-candidates.component').then(m => m.AdminCandidatesComponent)
      },
      {
        path: 'candidates/:id',
        loadComponent: () => import('./components/admin/admin-candidate-detail/admin-candidate-detail.component').then(m => m.AdminCandidateDetailComponent)
      },
      {
        path: 'schedule',
        loadComponent: () => import('./components/admin/admin-schedule/admin-schedule.component').then(m => m.AdminScheduleComponent)
      }
    ]
  },
  {
    path: '**',
    redirectTo: ''
  }
];
