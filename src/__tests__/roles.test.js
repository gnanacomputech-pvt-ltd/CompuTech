import { describe, it, expect } from 'vitest';
import {
  portalForUser, portalHomePath, userHasPortalAccess, isAdminUser,
} from '../lib/auth/roles';

const user = (overrides) => ({ roles: [], is_staff: false, is_superuser: false, ...overrides });

describe('which console each account lands on', () => {
  it('sends super admins and admins to the admin console', () => {
    expect(portalForUser(user({ is_superuser: true, roles: ['SUPER_ADMIN'] }))).toBe('admin');
    expect(portalForUser(user({ roles: ['ADMIN'], is_staff: true }))).toBe('admin');
    // A superuser with no role codes at all still has somewhere to go.
    expect(portalForUser(user({ is_superuser: true }))).toBe('admin');
  });

  it('sends every other ERP staff role to the staff console', () => {
    for (const role of [
      'HR', 'ACCOUNTS', 'ACADEMIC_COORDINATOR', 'INTERNSHIP_COORDINATOR',
      'PROJECT_COORDINATOR', 'TRAINER', 'MENTOR', 'PLACEMENT_OFFICER',
      'CONTENT_MANAGER',
    ]) {
      expect(portalForUser(user({ roles: [role], is_staff: true }))).toBe('staff');
    }
  });

  it('sends students and institution coordinators to their own portals', () => {
    expect(portalForUser(user({ roles: ['STUDENT'] }))).toBe('student');
    expect(portalForUser(user({ roles: ['INSTITUTION_COORDINATOR'] }))).toBe('institution');
  });

  it('falls back to the staff console for a staff account with no role yet', () => {
    expect(portalForUser(user({ is_staff: true }))).toBe('staff');
  });

  it('has nowhere to send an account with no roles at all', () => {
    expect(portalForUser(user())).toBeNull();
    expect(portalHomePath(user())).toBe('/login');
    expect(portalForUser(null)).toBeNull();
  });

  it('builds the right home path', () => {
    expect(portalHomePath(user({ roles: ['ADMIN'] }))).toBe('/admin/dashboard');
    expect(portalHomePath(user({ roles: ['TRAINER'] }))).toBe('/staff/dashboard');
    expect(portalHomePath(user({ roles: ['STUDENT'] }))).toBe('/student/dashboard');
  });
});

describe('which consoles an account may open', () => {
  // The reported bug: the owner's SUPER_ADMIN account landed on /admin and
  // could not open /staff at all, so the staff dashboard appeared not to
  // exist. An admin must be able to open both.
  it('lets an admin open the staff console as well as their own', () => {
    const admin = user({ is_superuser: true, roles: ['SUPER_ADMIN'] });
    expect(userHasPortalAccess(admin, 'admin')).toBe(true);
    expect(userHasPortalAccess(admin, 'staff')).toBe(true);
  });

  it('lets a plain ADMIN role open the staff console too', () => {
    const admin = user({ roles: ['ADMIN'], is_staff: true });
    expect(userHasPortalAccess(admin, 'staff')).toBe(true);
  });

  it('does not let staff into the admin console', () => {
    const staff = user({ roles: ['CONTENT_MANAGER'], is_staff: true });
    expect(userHasPortalAccess(staff, 'staff')).toBe(true);
    expect(userHasPortalAccess(staff, 'admin')).toBe(false);
  });

  it('keeps students and institutions out of both ERP consoles', () => {
    const student = user({ roles: ['STUDENT'] });
    const institution = user({ roles: ['INSTITUTION_COORDINATOR'] });
    for (const portal of ['admin', 'staff']) {
      expect(userHasPortalAccess(student, portal)).toBe(false);
      expect(userHasPortalAccess(institution, portal)).toBe(false);
    }
    expect(userHasPortalAccess(student, 'student')).toBe(true);
    expect(userHasPortalAccess(institution, 'institution')).toBe(true);
  });

  it('grants a signed-out visitor nothing', () => {
    for (const portal of ['admin', 'staff', 'student', 'institution']) {
      expect(userHasPortalAccess(null, portal)).toBe(false);
    }
  });

  it('identifies admins', () => {
    expect(isAdminUser(user({ roles: ['SUPER_ADMIN'] }))).toBe(true);
    expect(isAdminUser(user({ roles: ['ADMIN'] }))).toBe(true);
    expect(isAdminUser(user({ is_superuser: true }))).toBe(true);
    expect(isAdminUser(user({ roles: ['TRAINER'] }))).toBe(false);
    expect(isAdminUser(null)).toBe(false);
  });
});
