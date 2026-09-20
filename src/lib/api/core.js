// apps/core/urls.py — master data. Every list endpoint is automatically
// scoped server-side by role (StudentViewSet/EnrollmentViewSet.get_queryset):
// students see only themselves, institution coordinators see only their
// college, ERP staff see everything. The frontend calls the same endpoint
// regardless of role and just renders whatever comes back.
import { createResource } from './resource';

export const institutions = createResource('institutions');
export const departments = createResource('departments');
export const programs = createResource('programs');
export const batches = createResource('batches');
export const students = createResource('students');
export const employees = createResource('employees');
export const enrollments = createResource('enrollments');
