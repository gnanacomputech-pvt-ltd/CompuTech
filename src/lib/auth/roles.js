// Which dashboard a signed-in user belongs in.
//
// ERP staff are split in two: the admin dashboard (people who manage the
// organisation — students, institutions, staff access, programs and
// enrollments) and the staff dashboard (people who run day-to-day student
// approvals and edit the public website). The split mirrors the backend's
// own access tiers in apps/common/permissions.py, so neither dashboard shows
// a screen its user's role would be refused on.
const ADMIN_ROLES = new Set(['SUPER_ADMIN', 'ADMIN']);

const STAFF_ROLES = new Set([
  'HR', 'ACCOUNTS', 'ACADEMIC_COORDINATOR', 'INTERNSHIP_COORDINATOR',
  'PROJECT_COORDINATOR', 'TRAINER', 'MENTOR', 'PLACEMENT_OFFICER',
  'CONTENT_MANAGER',
]);

export function portalForUser(user) {
  if (!user) return null;
  const roles = user.roles || [];
  if (user.is_superuser || roles.some((r) => ADMIN_ROLES.has(r))) return 'admin';
  if (roles.some((r) => STAFF_ROLES.has(r))) return 'staff';
  if (roles.includes('INSTITUTION_COORDINATOR')) return 'institution';
  if (roles.includes('STUDENT')) return 'student';
  // A staff account with no role code yet (created straight in Django admin)
  // would otherwise have nowhere to land.
  if (user.is_staff) return 'staff';
  return null;
}

export function portalHomePath(user) {
  const portal = portalForUser(user);
  return portal ? `/${portal}/dashboard` : '/login';
}

export function userHasPortalAccess(user, portal) {
  return portalForUser(user) === portal;
}
