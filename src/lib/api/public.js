// apps/website/urls.py — unauthenticated marketing-site form submissions.
import { apiClient } from './client';

export function submitContactInquiry({ name, email, phone, subject, message }) {
  return apiClient.post(
    '/public/contact/',
    { name, email, phone, subject, message },
    { _skipAuth: true }
  );
}

export function submitStudentRegistrationInquiry({
  full_name, email, phone, college, course, program, preferred_date, message,
}) {
  return apiClient.post(
    '/public/register/',
    { full_name, email, phone, college, course, program, preferred_date, message },
    { _skipAuth: true }
  );
}
