from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView
from apps.core.views import (
    HealthCheckView, LoginView, LogoutView, CurrentUserView, ChangePasswordView,
    PasswordResetRequestView, PasswordResetConfirmView, UserRegistrationView,
    StaffRegistrationView, InstitutionRegistrationView, SignupRequestViewSet,
    PublicInstitutionListView,
    DashboardStatsView,
    InstitutionViewSet, DepartmentViewSet, ProgramViewSet,
    BatchViewSet, StudentViewSet, EmployeeViewSet, EnrollmentViewSet
)

router = DefaultRouter()
router.register(r'institutions', InstitutionViewSet, basename='institution')
router.register(r'departments', DepartmentViewSet, basename='department')
router.register(r'programs', ProgramViewSet, basename='program')
router.register(r'batches', BatchViewSet, basename='batch')
router.register(r'students', StudentViewSet, basename='student')
router.register(r'employees', EmployeeViewSet, basename='employee')
router.register(r'enrollments', EnrollmentViewSet, basename='enrollment')
router.register(r'signup-requests', SignupRequestViewSet, basename='signup-request')

urlpatterns = [
    # Public Health Check
    path('health/', HealthCheckView.as_view(), name='health_check'),

    # Public partner-college list for the signup page's college picker
    path('public/institutions/', PublicInstitutionListView.as_view(), name='public_institutions'),

    # Auth Endpoints (Section 5.2)
    path('auth/login/', LoginView.as_view(), name='auth_login'),
    path('auth/register/', UserRegistrationView.as_view(), name='auth_register'),
    # Self-registration for the other two account kinds. All three create a
    # PENDING account that an approver has to clear before it can sign in
    # (apps/core/signup.py).
    path('auth/register-staff/', StaffRegistrationView.as_view(), name='auth_register_staff'),
    path('auth/register-institution/', InstitutionRegistrationView.as_view(), name='auth_register_institution'),
    path('auth/refresh/', TokenRefreshView.as_view(), name='auth_refresh'),
    path('auth/logout/', LogoutView.as_view(), name='auth_logout'),
    path('auth/me/', CurrentUserView.as_view(), name='auth_me'),
    path('auth/change-password/', ChangePasswordView.as_view(), name='auth_change_password'),
    # Password reset flow (Section 5.2)
    path('auth/forgot-password/', PasswordResetRequestView.as_view(), name='auth_forgot_password'),
    path('auth/reset-password/', PasswordResetConfirmView.as_view(), name='auth_reset_password'),

    # Dashboard Analytics
    path('dashboard/stats/', DashboardStatsView.as_view(), name='dashboard_stats'),

    # Master Data ViewSets
    path('', include(router.urls)),
]
