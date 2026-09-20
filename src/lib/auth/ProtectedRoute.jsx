import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { userHasPortalAccess } from './roles';

// Wraps a portal's routes (/erp/*, /student/*, /institution/*): unauthenticated
// visitors bounce to /login (remembering where they were headed), and an
// authenticated user whose role doesn't match this portal bounces to their
// own portal rather than seeing someone else's data.
export const ProtectedRoute = ({ portal, children }) => {
  const { user, isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAFAF7]">
        <div className="text-sm text-[#6B6B6B] font-semibold">Loading…</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (!userHasPortalAccess(user, portal)) {
    return <Navigate to="/login" replace />;
  }

  return children;
};
