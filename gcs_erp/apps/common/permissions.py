from rest_framework import permissions

# ---------------------------------------------------------------------------
# Role tiers (Section 6 roles, grouped by how much of the ERP they can touch)
# ---------------------------------------------------------------------------
# Full access: admin-level roles. Full CRUD across core ERP data (institutions,
# programs, batches, students, enrollments, employees, fees, certificates,
# content). Deliberately does NOT include creating other employee accounts /
# assigning roles or system settings — that stays Super-Admin-only, see
# IsSuperAdmin and EmployeeViewSet.create_with_user's own permission_classes.
FULL_ACCESS_ROLES = frozenset({
    'SUPER_ADMIN', 'ADMIN', 'HR',
    'ACADEMIC_COORDINATOR', 'INTERNSHIP_COORDINATOR', 'PROJECT_COORDINATOR',
})

# Medium access: operational staff roles. Can read broadly across the ERP,
# but can only create/edit/delete within their own domain (DOMAIN_ROLES
# below) — everything else (institutions, programs, batches, employees) is
# read-only for them, same as Full-access roles but no write.
MEDIUM_ACCESS_ROLES = frozenset({
    'ACCOUNTS', 'TRAINER', 'MENTOR', 'PLACEMENT_OFFICER', 'CONTENT_MANAGER',
})

ERP_STAFF_ROLES = FULL_ACCESS_ROLES | MEDIUM_ACCESS_ROLES

# Which Medium-access role(s) own each module's write access. A module not
# listed here (Institutions, Programs, Batches, Employees, AcademicProject
# catalog, Enrollments) is Full-access-only to write; Medium roles can still
# read it via ModuleAccess's SAFE_METHODS carve-out.
DOMAIN_ROLES = {
    'attendance': frozenset({'TRAINER', 'MENTOR'}),
    'assessments': frozenset({'TRAINER', 'MENTOR'}),
    'finance': frozenset({'ACCOUNTS'}),
    'content': frozenset({'CONTENT_MANAGER'}),
}


class RolePermissionCheck(permissions.BasePermission):
    """
    Checks if authenticated user has the required permission via
    USER -> USER_ROLE -> ROLE -> ROLE_PERMISSION -> PERMISSION.
    Superusers bypass RBAC checks.
    """
    required_permission = None

    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False

        if request.user.is_superuser:
            return True

        perm_code = getattr(view, 'required_permission', self.required_permission)
        if not perm_code:
            return True

        return request.user.has_perm_code(perm_code)


class HasAnyRole(permissions.BasePermission):
    """
    Check if user has at least one of the specified roles in `allowed_roles`.
    """
    allowed_roles = []

    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False

        if request.user.is_superuser:
            return True

        roles = getattr(view, 'allowed_roles', self.allowed_roles)
        if not roles:
            return True

        user_roles = request.user.get_role_codes()
        return any(role in user_roles for role in roles)


class IsSuperAdmin(permissions.BasePermission):
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        return request.user.is_superuser or 'SUPER_ADMIN' in request.user.get_role_codes()


class IsERPStaff(permissions.BasePermission):
    """
    Allows any ERP staff role — both access tiers (coordinators, HR, admin
    down to trainers, mentors, accounts, content). For modules that need to
    tell the two tiers apart, use IsFullAccessStaff or ModuleAccess instead.
    """
    STAFF_ROLES = ERP_STAFF_ROLES

    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        if request.user.is_superuser:
            return True
        user_roles = set(request.user.get_role_codes())
        return bool(user_roles & self.STAFF_ROLES)


class IsFullAccessStaff(permissions.BasePermission):
    """
    Full-access tier only (Admin/HR/Coordinators, or Super Admin) — for
    modules Medium-access staff shouldn't even read, like the employee
    directory.
    """
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        if request.user.is_superuser:
            return True
        return bool(set(request.user.get_role_codes()) & FULL_ACCESS_ROLES)


class ModuleAccess(permissions.BasePermission):
    """
    Any ERP staff role (either tier) can read. Writing requires either a
    Full-access role or membership in this module's `domain_roles` — the
    Medium-access role(s) whose job actually owns it (e.g. Trainer/Mentor
    for Attendance & Assessments, Accounts for Fees, Content Manager for
    the site CMS). Modules with no domain owner (Institutions, Programs,
    Batches, the AcademicProject catalog, Enrollments) default to
    `domain_roles = frozenset()`, i.e. Full-access-only writes.
    """
    domain_roles = frozenset()

    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        if request.user.is_superuser:
            return True
        user_roles = set(request.user.get_role_codes())
        if not (user_roles & ERP_STAFF_ROLES):
            return False
        if request.method in permissions.SAFE_METHODS:
            return True
        return bool(user_roles & (FULL_ACCESS_ROLES | self.domain_roles))


class StaffWriteAccess(permissions.BasePermission):
    """
    For modules students/institution coordinators also read their own slice
    of (Students, Enrollments, Attendance, ...): read is left to
    IsAuthenticated + the view's existing get_queryset scoping, since that's
    what already restricts a student to their own records. Writing requires
    Full-access or this module's `domain_roles`, same rule as ModuleAccess.
    """
    domain_roles = frozenset()

    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        if request.method in permissions.SAFE_METHODS:
            return True
        if request.user.is_superuser:
            return True
        user_roles = set(request.user.get_role_codes())
        return bool(user_roles & (FULL_ACCESS_ROLES | self.domain_roles))


# ---------------------------------------------------------------------------
# Ready-made per-module subclasses — DRF instantiates permission_classes
# with no args, so `domain_roles` has to be set on the class, not passed in.
# ---------------------------------------------------------------------------
class AttendanceAccess(StaffWriteAccess):
    domain_roles = DOMAIN_ROLES['attendance']  # Trainer, Mentor


class AssessmentAccess(StaffWriteAccess):
    domain_roles = DOMAIN_ROLES['assessments']  # Trainer, Mentor


class FinanceAccess(ModuleAccess):
    """Staff-only finance master data (fee structures) — no student read."""
    domain_roles = DOMAIN_ROLES['finance']  # Accounts


class FinanceStaffWriteAccess(StaffWriteAccess):
    """Per-student finance records (invoices, payments, certificates) —
    a student reads their own via the view's get_queryset scoping; writing
    (recording a payment, issuing/revoking a certificate) is Accounts or
    Full-access only."""
    domain_roles = DOMAIN_ROLES['finance']  # Accounts


class ContentAccess(ModuleAccess):
    domain_roles = DOMAIN_ROLES['content']  # Content Manager


class IsStudent(permissions.BasePermission):
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and 'STUDENT' in request.user.get_role_codes())


class IsInstitutionCoordinator(permissions.BasePermission):
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and 'INSTITUTION_COORDINATOR' in request.user.get_role_codes())
