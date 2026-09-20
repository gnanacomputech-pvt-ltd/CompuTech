import axios from 'axios';
import { getAccessToken, getRefreshToken, setTokens, clearTokens } from '../auth/tokenStorage';

// Django serves the API at /api/v1 (see gcs_erp/config/urls.py). In dev this
// points at the local Django server; in production it's the ALB/CloudFront
// hostname set at build time (see .env.example, infra/aws/terraform.tfvars).
const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000').replace(/\/+$/, '');

export class ApiError extends Error {
  constructor(code, message, fieldErrors) {
    super(typeof message === 'string' ? message : 'Request failed');
    this.name = 'ApiError';
    this.code = code || 'UNKNOWN_ERROR';
    // DRF validation errors arrive as { field: ["msg"] } — surfaced separately
    // from `message` so forms can show per-field errors when present.
    this.fieldErrors = typeof message === 'object' && message !== null ? message : fieldErrors;
  }
}

export const apiClient = axios.create({
  baseURL: `${API_BASE_URL}/api/v1`,
  headers: { 'Content-Type': 'application/json' },
});

apiClient.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token && !config._skipAuth) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Every DRF response on this backend is enveloped as either
// { success: true, data, message } or { success: false, error: { code, message } }
// (apps/common/renderers.py + apps/common/exceptions.py) — unwrap it here so
// the rest of the app just deals in plain data / thrown ApiError.
function unwrapEnvelope(data) {
  if (data && typeof data === 'object' && 'success' in data) {
    if (data.success) return data.data;
    const err = data.error || {};
    throw new ApiError(err.code, err.message);
  }
  return data;
}

let refreshPromise = null;

async function refreshAccessToken() {
  const refresh = getRefreshToken();
  if (!refresh) throw new ApiError('NO_REFRESH_TOKEN', 'Not authenticated.');

  // simplejwt ROTATE_REFRESH_TOKENS + BLACKLIST_AFTER_ROTATION are both on
  // (config/settings.py) — every refresh call returns (and requires storing)
  // a brand new refresh token too, not just a new access token.
  const response = await axios.post(
    `${API_BASE_URL}/api/v1/auth/refresh/`,
    { refresh },
    { headers: { 'Content-Type': 'application/json' } }
  );
  const data = unwrapEnvelope(response.data);
  setTokens({ access: data.access, refresh: data.refresh || refresh });
  return data.access;
}

apiClient.interceptors.response.use(
  (response) => unwrapEnvelope(response.data),
  async (error) => {
    const original = error.config;

    if (error.response?.status === 401 && !original._retry && !original._skipAuth) {
      original._retry = true;
      try {
        // Concurrent 401s share one in-flight refresh instead of each
        // firing their own (and each rotating the refresh token, which
        // would invalidate the other's request).
        refreshPromise = refreshPromise || refreshAccessToken();
        const newAccess = await refreshPromise;
        refreshPromise = null;
        original.headers.Authorization = `Bearer ${newAccess}`;
        return apiClient(original);
      } catch (refreshError) {
        refreshPromise = null;
        clearTokens();
        if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/login')) {
          window.location.assign('/login');
        }
        return Promise.reject(refreshError);
      }
    }

    if (error.response) {
      const envelope = error.response.data;
      if (envelope && typeof envelope === 'object' && envelope.error) {
        return Promise.reject(new ApiError(envelope.error.code, envelope.error.message));
      }
      return Promise.reject(new ApiError(`HTTP_${error.response.status}`, envelope));
    }
    return Promise.reject(new ApiError('NETWORK_ERROR', 'Could not reach the server. Check your connection and try again.'));
  }
);
