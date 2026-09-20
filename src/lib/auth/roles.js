// Mirrors the role grouping DashboardStatsView.is_erp_staff uses server-side
// (gcs_erp/apps/core/views.py) so the frontend routes people to the same
// portal the backend would compute stats for.
const ERP_STAFF_ROLES = new Set([
  'SUPER_ADMIN', 'ADMIN', 'HR', 'ACCOUNTS', 'ACADEMIC_COORDINATOR',
  'INTERNSHIP_COORDINATOR', 'PROJECT_COORDINATOR', 'TRAINER',
  'MENTOR', 'PLACEMENT_OFFICER', 'CONTENT_MANAGER',
]);

export function portalForUser(user) {
  if (!user) return null;
  const roles = user.roles || [];
  if (user.is_staff || user.is_superuser || roles.some((r) => ERP_STAFF_ROLES.has(r))) {
    return 'erp';
  }
  if (roles.includes('INSTITUTION_COORDINATOR')) return 'institution';
  if (roles.includes('STUDENT')) return 'student';
  return null;
}

export function portalHomePath(user) {
  const portal = portalForUser(user);
  return portal ? `/${portal}/dashboard` : '/login';
}

export function userHasPortalAccess(user, portal) {
  return portalForUser(user) === portal;
}
