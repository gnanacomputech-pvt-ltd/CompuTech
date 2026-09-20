import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import * as authApi from '../api/auth';
import { getAccessToken, clearTokens } from './tokenStorage';
import { ApiError } from '../api/client';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  // Starts true whenever a token exists — we don't know the user is real
  // until /auth/me/ confirms it, so routes must not render as "logged out"
  // during that first check (that would bounce a valid session to /login).
  const [loading, setLoading] = useState(!!getAccessToken());

  useEffect(() => {
    let cancelled = false;
    if (!getAccessToken()) {
      setLoading(false);
      return undefined;
    }
    authApi
      .fetchCurrentUser()
      .then((data) => {
        if (!cancelled) setUser(data);
      })
      .catch(() => {
        if (!cancelled) clearTokens();
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(async (email, password) => {
    const loggedInUser = await authApi.login(email, password);
    setUser(loggedInUser);
    return loggedInUser;
  }, []);

  const registerStudent = useCallback(async (payload) => {
    const registeredUser = await authApi.registerStudent(payload);
    setUser(registeredUser);
    return registeredUser;
  }, []);

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch {
      // Token may already be expired/blacklisted — clear local state
      // regardless, since the user's intent (leave) still has to happen.
    } finally {
      setUser(null);
    }
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const data = await authApi.fetchCurrentUser();
      setUser(data);
      return data;
    } catch (err) {
      if (err instanceof ApiError && err.code === 'AUTHENTICATION_FAILED') {
        setUser(null);
      }
      throw err;
    }
  }, []);

  const value = {
    user,
    isAuthenticated: !!user,
    loading,
    login,
    registerStudent,
    logout,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
