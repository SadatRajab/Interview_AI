/**
 * ============================================
 * Admin Route Guard
 * ============================================
 * Prevents unauthorized users from accessing admin routes.
 * Redirects to /admin/login if not authenticated.
 */

import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AdminService } from '../services/admin.service';

export const adminGuard: CanActivateFn = (route, state) => {
  const adminService = inject(AdminService);
  const router = inject(Router);

  if (adminService.isAuthenticated()) {
    return true;
  }

  // Redirect to login
  router.navigate(['/admin/login']);
  return false;
};
