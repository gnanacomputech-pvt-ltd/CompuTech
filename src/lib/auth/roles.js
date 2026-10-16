// Which dashboard a signed-in user belongs in.
//
// ERP staff are split in two: the admin console (people who manage the
// organisation — students, institutions, staff access, programs and
// enrollments) and the staff console (people who run day-to-day student
// approvals and edit the public website). The split mirrors the backend's
// own access tiers in apps/common/permissions.py, so neither console shows
// a screen its user's role would be refused on.
const ADMIN_ROLES = new Set(['SUPER_ADMIN', 'ADMIN']);

const STAFF_ROLES = new Set([
  'HR', 'ACCOUNTS', 'ACADEMIC_COORDINATOR', 'INTERNSHIP_COORDINATOR',
  'PROJECT_COORDINATOR', 'TRAINER', 'MENTOR', 'PLACEMENT_OFFICER',
  'CONTENT_MANAGER',
]);

export function isAdminUser(user) {
  if (!user) return false;
  return !!user.is_superuser || (user.roles || []).some((r) => ADMIN_ROLES.has(r));
}

// The console a user lands on after signing in.
export function portalForUser(user) {
  if (!user) return null;
  const roles = user.roles || [];
  if (isAdminUser(user)) return 'admin';
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

// Which consoles a user may open, as opposed to which one they land on.
//
// An admin can also open the staff console: ADMIN and SUPER_ADMIN are
// Full-access roles on the backend, so every staff screen (student
// approvals and all the website editing) already accepts their writes.
// Without this, the person who owns the site could see the staff console
// existed but never open it.
export function userHasPortalAccess(user, portal) {
  if (!user) return false;
  if (portal === 'staff' && isAdminUser(user)) return true;
  return portalForUser(user) === portal;
}
