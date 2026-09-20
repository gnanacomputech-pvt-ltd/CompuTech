import { apiClient } from './client';

// Shape varies by role — see gcs_erp/apps/core/views.py DashboardStatsView:
// ERP staff get { students, enrollments, batches, finance, certificates,
// programs, institutions }; students get { student, enrollments,
// total_enrollments }; institution coordinators get { institutions: [...] }.
export function fetchDashboardStats() {
  return apiClient.get('/dashboard/stats/');
}
