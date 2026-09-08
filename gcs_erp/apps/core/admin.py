from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from apps.core.models import (
    User, Role, Permission, UserRole, RolePermission,
    Institution, Department, Program, Batch,
    Student, Employee, Enrollment
)


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display = ['email', 'full_name', 'is_staff', 'is_active', 'is_verified', 'created_at']
    list_filter = ['is_staff', 'is_active', 'is_verified', 'is_superuser']
    search_fields = ['email', 'full_name', 'phone']
    ordering = ['-created_at']
    fieldsets = (
        (None, {'fields': ('email', 'password')}),
        ('Personal Info', {'fields': ('full_name', 'phone', 'avatar')}),
        ('Permissions', {'fields': ('is_active', 'is_staff', 'is_superuser', 'is_verified', 'groups', 'user_permissions')}),
        ('Important dates', {'fields': ('last_login',)}),
    )
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('email', 'full_name', 'password1', 'password2'),
        }),
    )


@admin.register(Role)
class RoleAdmin(admin.ModelAdmin):
    list_display = ['code', 'name', 'description', 'created_at']
    search_fields = ['code', 'name']
    ordering = ['name']


@admin.register(Permission)
class PermissionAdmin(admin.ModelAdmin):
    list_display = ['code', 'name', 'module', 'created_at']
    list_filter = ['module']
    search_fields = ['code', 'name']
    ordering = ['module', 'name']


@admin.register(UserRole)
class UserRoleAdmin(admin.ModelAdmin):
    list_display = ['user', 'role', 'created_at']
    list_filter = ['role']
    search_fields = ['user__email', 'user__full_name', 'role__code']
    raw_id_fields = ['user', 'role']


@admin.register(RolePermission)
class RolePermissionAdmin(admin.ModelAdmin):
    list_display = ['role', 'permission', 'created_at']
    list_filter = ['role']
    search_fields = ['role__code', 'permission__code']
    raw_id_fields = ['role', 'permission']


@admin.register(Institution)
class InstitutionAdmin(admin.ModelAdmin):
    list_display = ['code', 'name', 'city', 'state', 'coordinator', 'is_active', 'created_at']
    list_filter = ['state', 'city']
    search_fields = ['code', 'name', 'city', 'contact_email']
    ordering = ['name']
    raw_id_fields = ['coordinator']


@admin.register(Department)
class DepartmentAdmin(admin.ModelAdmin):
    list_display = ['code', 'name', 'institution', 'created_at']
    list_filter = ['institution']
    search_fields = ['code', 'name']
    ordering = ['name']


@admin.register(Program)
class ProgramAdmin(admin.ModelAdmin):
    list_display = ['code', 'title', 'program_type', 'duration_weeks', 'base_fee', 'created_at']
    list_filter = ['program_type']
    search_fields = ['code', 'title', 'description']
    ordering = ['title']


@admin.register(Batch)
class BatchAdmin(admin.ModelAdmin):
    list_display = ['business_id', 'name', 'program', 'institution', 'start_date', 'end_date', 'status', 'created_at']
    list_filter = ['status', 'program', 'institution']
    search_fields = ['business_id', 'name', 'program__title']
    ordering = ['-start_date']
    raw_id_fields = ['program', 'institution']


@admin.register(Student)
class StudentAdmin(admin.ModelAdmin):
    list_display = ['business_id', 'user', 'institution', 'usn', 'degree', 'semester', 'is_active', 'created_at']
    list_filter = ['institution', 'degree', 'semester']
    search_fields = ['business_id', 'usn', 'user__full_name', 'user__email']
    ordering = ['user__full_name']
    raw_id_fields = ['user', 'institution']


@admin.register(Employee)
class EmployeeAdmin(admin.ModelAdmin):
    list_display = ['employee_id', 'user', 'designation', 'department', 'joining_date', 'created_at']
    list_filter = ['designation', 'department']
    search_fields = ['employee_id', 'user__full_name', 'user__email']
    ordering = ['user__full_name']
    raw_id_fields = ['user', 'department']


@admin.register(Enrollment)
class EnrollmentAdmin(admin.ModelAdmin):
    list_display = ['business_id', 'student', 'program', 'batch', 'institution', 'status', 'coordinator_approval', 'enrolled_at']
    list_filter = ['status', 'coordinator_approval', 'institution', 'program']
    search_fields = ['business_id', 'student__user__full_name', 'student__usn']
    ordering = ['-enrolled_at']
    raw_id_fields = ['student', 'program', 'batch', 'institution', 'approved_by']
    readonly_fields = ['business_id', 'enrolled_at', 'created_at', 'updated_at']
