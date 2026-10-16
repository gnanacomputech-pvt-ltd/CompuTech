import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { portalHomePath } from './roles';

// The old single /erp dashboard was split into /admin and /staff. Anyone
// following a stale link or bookmark gets sent to whichever console their
// role actually grants, rather than a dead route.
export const PortalRedirect = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAFAF7]">
        <div className="text-sm text-[#6B6B6B] font-semibold">Loading…</div>
      </div>
    );
  }

  return <Navigate to={portalHomePath(user)} replace />;
};
