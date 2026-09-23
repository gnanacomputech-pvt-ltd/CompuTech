// apps/finance/urls.py
import { createResource } from './resource';
import { apiClient } from './client';

export const feeStructures = createResource('fee-structures');
export const invoices = createResource('invoices');
export const payments = createResource('payments');
export const receipts = createResource('receipts');
export const certificates = createResource('certificates');

// Same endpoint the public QR scan hits (Section 5.3 / apps/finance/views.py
// PublicCertificateVerificationView) — works unauthenticated (AllowAny), but
// deliberately NOT _skipAuth: an authenticated ERP staff caller should still
// send their token so the backend's role check returns the fuller payload
// (personal + course details) instead of the public-safe minimal one.
export function verifyCertificate(token) {
  return apiClient.get(`/public/certificates/verify/${token}/`);
}

// Certificates aren't created via plain POST — issuance runs the eligibility
// chain (Section 8) and queues async PDF/QR generation
// (apps/finance/views.py CertificateViewSet custom actions).
export function checkCertificateEligibility(enrollmentId) {
  return apiClient.post('/certificates/check-eligibility/', { enrollment_id: enrollmentId });
}
export function issueCertificate(enrollmentId, title) {
  return apiClient.post('/certificates/issue/', { enrollment_id: enrollmentId, title });
}
export function revokeCertificate(id, reason) {
  return apiClient.post(`/certificates/${id}/revoke/`, { reason });
}
export function reissueCertificate(id, reason) {
  return apiClient.post(`/certificates/${id}/reissue/`, { reason });
}
