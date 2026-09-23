// apps/core/urls.py — master data. Every list endpoint is automatically
// scoped server-side by role (StudentViewSet/EnrollmentViewSet.get_queryset):
// students see only themselves, institution coordinators see only their
// college, ERP staff see everything. The frontend calls the same endpoint
// regardless of role and just renders whatever comes back.
import { createResource } from './resource';
import { apiClient } from './client';

export const institutions = createResource('institutions');
export const departments = createResource('departments');
export const programs = createResource('programs');
export const batches = createResource('batches');
export const students = createResource('students');
export const employees = createResource('employees');
export const enrollments = createResource('enrollments');

// Employee.user is a required OneToOneField — a plain POST /employees/ can
// only link an *existing* user, so adding a new staff member goes through
// this endpoint instead, which creates the login account and the employee
// profile together (apps/core/views.py EmployeeViewSet.create_with_user).
export function createEmployeeWithUser(payload) {
  return apiClient.post('/employees/create-with-user/', payload);
}

export const ASSIGNABLE_STAFF_ROLES = [
  { value: 'ADMIN', label: 'Admin' },
  { value: 'HR', label: 'HR' },
  { value: 'ACCOUNTS', label: 'Accounts' },
  { value: 'ACADEMIC_COORDINATOR', label: 'Academic Coordinator' },
  { value: 'INTERNSHIP_COORDINATOR', label: 'Internship Coordinator' },
  { value: 'PROJECT_COORDINATOR', label: 'Project Coordinator' },
  { value: 'TRAINER', label: 'Trainer' },
  { value: 'MENTOR', label: 'Mentor' },
  { value: 'PLACEMENT_OFFICER', label: 'Placement Officer' },
  { value: 'CONTENT_MANAGER', label: 'Content Manager' },
];
