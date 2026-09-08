from rest_framework import permissions


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
    Allows coordinators, managers, HR, accounts, admin, super admin.
    """
    STAFF_ROLES = {
        'SUPER_ADMIN', 'ADMIN', 'HR', 'ACCOUNTS', 'ACADEMIC_COORDINATOR',
        'INTERNSHIP_COORDINATOR', 'PROJECT_COORDINATOR', 'TRAINER', 'MENTOR',
        'PLACEMENT_OFFICER', 'CONTENT_MANAGER'
    }

    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        if request.user.is_superuser:
            return True
        user_roles = set(request.user.get_role_codes())
        return bool(user_roles & self.STAFF_ROLES)


class IsStudent(permissions.BasePermission):
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and 'STUDENT' in request.user.get_role_codes())


class IsInstitutionCoordinator(permissions.BasePermission):
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and 'INSTITUTION_COORDINATOR' in request.user.get_role_codes())
