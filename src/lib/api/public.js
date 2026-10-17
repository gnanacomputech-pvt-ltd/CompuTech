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

export function submitEnquiry({
  full_name, email, phone, college, interest, training_mode, message,
}) {
  return apiClient.post(
    '/public/enquire/',
    { full_name, email, phone, college, interest, training_mode, message },
    { _skipAuth: true }
  );
}

export function submitProjectRegistration(payload) {
  return apiClient.post(
    '/public/register-project/',
    payload,
    { _skipAuth: true }
  );
}

export function submitInternshipRegistration(payload) {
  return apiClient.post(
    '/public/register-internship/',
    payload,
    { _skipAuth: true }
  );
}

export function submitEventRegistration(payload) {
  return apiClient.post(
    '/public/register-event/',
    payload,
    { _skipAuth: true }
  );
}

export const staffInquiriesApi = {
  listContactInquiries: (params) => apiClient.get('/staff/contact-inquiries/', { params }),
  updateContactInquiry: (id, data) => apiClient.patch(`/staff/contact-inquiries/${id}/`, data),
  listRegistrationInquiries: (params) => apiClient.get('/staff/registration-inquiries/', { params }),
  updateRegistrationInquiry: (id, data) => apiClient.patch(`/staff/registration-inquiries/${id}/`, data),
  listProjectRegistrations: (params) => apiClient.get('/staff/project-registrations/', { params }),
  updateProjectRegistration: (id, data) => apiClient.patch(`/staff/project-registrations/${id}/`, data),
  listInternshipRegistrations: (params) => apiClient.get('/staff/internship-registrations/', { params }),
  updateInternshipRegistration: (id, data) => apiClient.patch(`/staff/internship-registrations/${id}/`, data),
  listEventRegistrations: (params) => apiClient.get('/staff/event-registrations/', { params }),
  updateEventRegistration: (id, data) => apiClient.patch(`/staff/event-registrations/${id}/`, data),
};



