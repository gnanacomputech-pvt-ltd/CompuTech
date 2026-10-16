import { apiClient } from './client';
import { setTokens, clearTokens, getRefreshToken } from '../auth/tokenStorage';

// See gcs_erp/apps/core/serializers.py CustomTokenObtainPairSerializer —
// login returns { access, refresh, user: {...}, _message } (envelope-wrapped
// to { access, refresh, user } by the client interceptor).
export async function login(email, password) {
  const data = await apiClient.post('/auth/login/', { email, password }, { _skipAuth: true });
  setTokens({ access: data.access, refresh: data.refresh });
  return data.user;
}

// Public self-registration lives in ./signup.js — all three kinds (student,
// staff, institution) create a PENDING account that a reviewer has to
// approve, so none of them set tokens or return a signed-in user.

export async function logout() {
  const refresh = getRefreshToken();
  try {
    if (refresh) await apiClient.post('/auth/logout/', { refresh });
  } finally {
    clearTokens();
  }
}

export function fetchCurrentUser() {
  return apiClient.get('/auth/me/');
}

export function changePassword(old_password, new_password) {
  return apiClient.post('/auth/change-password/', { old_password, new_password });
}

export function requestPasswordReset(email) {
  return apiClient.post('/auth/forgot-password/', { email }, { _skipAuth: true });
}

export function confirmPasswordReset(uid, token, new_password) {
  return apiClient.post('/auth/reset-password/', { uid, token, new_password }, { _skipAuth: true });
}
