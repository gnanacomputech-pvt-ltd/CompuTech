// apps/core/urls.py — the self-registration endpoints and the accept/reject
// queue behind them (gcs_erp/apps/core/signup.py).
//
// None of the three registration calls log the applicant in: a self-created
// account is PENDING and inactive until a reviewer approves it, so there is
// no session to hand out yet.
import { apiClient } from './client';
import { createResource } from './resource';

export function registerStudent(payload) {
  return apiClient.post('auth/register/', payload, { _skipAuth: true });
}

export function registerStaff(payload) {
  return apiClient.post('auth/register-staff/', payload, { _skipAuth: true });
}

export function registerInstitution(payload) {
  return apiClient.post('auth/register-institution/', payload, { _skipAuth: true });
}

// Partner-college picker on the public signup form — a deliberately narrow
// public projection of Institution (id/name/city only).
export function fetchPublicInstitutions() {
  return apiClient.get('public/institutions/', { _skipAuth: true });
}

const base = createResource('signup-requests');

export const signupRequests = {
  ...base,
  // The backend already hides STAFF and INSTITUTION requests from
  // Medium-access staff, so both dashboards can call the same endpoint.
  byKind: (kind, params) => base.list({ kind, page_size: 100, ...params }),
  approve: (id, payload = {}) => apiClient.post(`signup-requests/${id}/approve/`, payload),
  reject: (id, payload = {}) => apiClient.post(`signup-requests/${id}/reject/`, payload),
  pendingCounts: () => apiClient.get('signup-requests/pending-counts/'),
};

export const SIGNUP_KINDS = [
  { value: 'STUDENT', label: 'Students' },
  { value: 'STAFF', label: 'Staff / Employees' },
  { value: 'INSTITUTION', label: 'Institutions' },
];

export const SIGNUP_STATUSES = [
  { value: 'PENDING', label: 'Pending Review' },
  { value: 'APPROVED', label: 'Approved' },
  { value: 'REJECTED', label: 'Rejected' },
];
