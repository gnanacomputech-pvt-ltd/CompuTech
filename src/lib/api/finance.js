// apps/finance/urls.py
import { createResource } from './resource';
import { apiClient } from './client';

export const feeStructures = createResource('fee-structures');
export const invoices = createResource('invoices');
export const payments = createResource('payments');
export const receipts = createResource('receipts');
export const certificates = createResource('certificates');

// Unauthenticated — same endpoint the public QR scan hits
// (Section 5.3 / apps/finance/views.py PublicCertificateVerificationView).
export function verifyCertificate(token) {
  return apiClient.get(`/public/certificates/verify/${token}/`, { _skipAuth: true });
}
