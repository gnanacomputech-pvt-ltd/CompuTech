from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView
from apps.core.views import (
    HealthCheckView, LoginView, LogoutView, CurrentUserView, ChangePasswordView,
    PasswordResetRequestView, PasswordResetConfirmView, UserRegistrationView,
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

urlpatterns = [
    # Public Health Check
    path('health/', HealthCheckView.as_view(), name='health_check'),

    # Auth Endpoints (Section 5.2)
    path('auth/login/', LoginView.as_view(), name='auth_login'),
    path('auth/register/', UserRegistrationView.as_view(), name='auth_register'),
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
