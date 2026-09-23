// Mirrors apps/common/permissions.py's role tiers, so the ERP dashboard can
// hide actions a user's role can't perform instead of showing a button that
// only fails after a round trip. The backend is still the real gate (these
// checks are UI-only) — keep this in sync if the backend tiers change.

const FULL_ACCESS_ROLES = new Set([
  'SUPER_ADMIN', 'ADMIN', 'HR',
  'ACADEMIC_COORDINATOR', 'INTERNSHIP_COORDINATOR', 'PROJECT_COORDINATOR',
]);

const DOMAIN_ROLES = {
  attendance: new Set(['TRAINER', 'MENTOR']),
  assessments: new Set(['TRAINER', 'MENTOR']),
  finance: new Set(['ACCOUNTS']),
  content: new Set(['CONTENT_MANAGER']),
};

function userRoles(user) {
  return user?.roles || [];
}

export function isSuperAdmin(user) {
  return !!user && (user.is_superuser || userRoles(user).includes('SUPER_ADMIN'));
}

export function isFullAccess(user) {
  if (isSuperAdmin(user)) return true;
  return userRoles(user).some((r) => FULL_ACCESS_ROLES.has(r));
}

// Institutions, Programs, Batches, the Project catalog, Enrollments — no
// Medium-access role owns these, so it's Full-access tier only.
export function canWriteFullOnly(user) {
  return isFullAccess(user);
}

// Attendance/Assessments (Trainer, Mentor), Fees/Certificates (Accounts),
// Content (Content Manager) — Full-access tier, or that domain's own role.
export function canWriteDomain(user, domain) {
  if (isFullAccess(user)) return true;
  const domainRoles = DOMAIN_ROLES[domain] || new Set();
  return userRoles(user).some((r) => domainRoles.has(r));
}

// Employee directory: Full-access tier only, for both viewing and editing.
export function canAccessEmployees(user) {
  return isFullAccess(user);
}

// Creating a new employee grants them an ERP role — Super Admin only,
// narrower than the rest of the Full-access tier.
export function canCreateEmployee(user) {
  return isSuperAdmin(user);
}
