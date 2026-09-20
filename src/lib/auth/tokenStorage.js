// JWT access/refresh tokens, held in localStorage. This is a plain SPA with
// no server-rendering, so there's no httpOnly-cookie option without adding a
// backend session layer the spec doesn't call for — access tokens are
// short-lived (30 min, config/settings.py JWT_ACCESS_MINUTES) and refresh
// rotates + blacklists on every use, which bounds the exposure.
const ACCESS_KEY = 'gcs_erp_access_token';
const REFRESH_KEY = 'gcs_erp_refresh_token';

export function getAccessToken() {
  try {
    return localStorage.getItem(ACCESS_KEY);
  } catch {
    return null;
  }
}

export function getRefreshToken() {
  try {
    return localStorage.getItem(REFRESH_KEY);
  } catch {
    return null;
  }
}

export function setTokens({ access, refresh }) {
  try {
    if (access) localStorage.setItem(ACCESS_KEY, access);
    if (refresh) localStorage.setItem(REFRESH_KEY, refresh);
  } catch {
    // Private browsing / storage disabled — session just won't persist
    // across a reload, which is a degraded-but-safe fallback.
  }
}

export function clearTokens() {
  try {
    localStorage.removeItem(ACCESS_KEY);
    localStorage.removeItem(REFRESH_KEY);
  } catch {
    // no-op
  }
}
