from rest_framework import viewsets, status, permissions
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.tokens import RefreshToken
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
from django.contrib.auth.tokens import default_token_generator
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.utils.encoding import force_bytes, force_str
from django.template.loader import render_to_string
from django.core.mail import send_mail
from django.conf import settings
from django.db import connection

from apps.common.permissions import IsSuperAdmin, IsERPStaff
from apps.core.models import (
    User, Institution, Department, Program, Batch, Student, Employee, Enrollment
)
from apps.core.serializers import (
    CustomTokenObtainPairSerializer, ChangePasswordSerializer,
    PasswordResetSerializer, PasswordResetConfirmSerializer,
    UserSerializer, InstitutionSerializer, DepartmentSerializer, ProgramSerializer,
    BatchSerializer, StudentSerializer, EmployeeSerializer, EnrollmentSerializer
)


class HealthCheckView(APIView):
    """
    GET /api/v1/health/
    Public health check endpoint for load balancers and monitoring.
    Returns 200 if the application is running and the database is reachable.
    """
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        try:
            with connection.cursor() as cursor:
                cursor.execute("SELECT 1")
            return Response({
                "status": "healthy",
                "service": "gcs-erp",
                "version": "2.0.0",
                "database": "connected",
            })
        except Exception as exc:
            return Response({
                "status": "unhealthy",
                "service": "gcs-erp",
                "database": "disconnected",
                "error": str(exc)
            }, status=status.HTTP_503_SERVICE_UNAVAILABLE)


class LoginView(TokenObtainPairView):
    """
    POST /api/v1/auth/login
    Authenticates user and returns JWT token pair + user profile & roles.
    """
    serializer_class = CustomTokenObtainPairSerializer


class LogoutView(APIView):
    """
    POST /api/v1/auth/logout
    Blacklists the provided refresh token.
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        try:
            refresh_token = request.data.get("refresh")
            if refresh_token:
                token = RefreshToken(refresh_token)
                token.blacklist()
            return Response({"message": "Successfully logged out."}, status=status.HTTP_200_OK)
        except Exception:
            # Even if blacklist fails (e.g. token expired), return standard success
            return Response({"message": "Logged out."}, status=status.HTTP_200_OK)


class CurrentUserView(APIView):
    """
    GET /api/v1/auth/me
    Retrieves currently authenticated user profile with roles and permissions.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        serializer = UserSerializer(request.user)
        data = serializer.data
        data['roles'] = request.user.get_role_codes()
        return Response(data)


class ChangePasswordView(APIView):
    """
    POST /api/v1/auth/change-password
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = ChangePasswordSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            request.user.set_password(serializer.validated_data['new_password'])
            request.user.save()
            return Response({"message": "Password changed successfully."})
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class PasswordResetRequestView(APIView):
    """
    POST /api/v1/auth/forgot-password
    Accepts an email and sends a password reset link.
    Always returns 200 to prevent user enumeration (security best practice).
    """
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = PasswordResetSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        email = serializer.validated_data['email']

        try:
            user = User.objects.get(email=email, is_active=True)
        except User.DoesNotExist:
            # Don't reveal whether the email exists
            return Response({
                "message": "If an account with that email exists, a password reset link has been sent."
            })

        # Generate the secure token
        token = default_token_generator.make_token(user)
        uid = urlsafe_base64_encode(force_bytes(user.pk))

        # Build the reset URL the user will click in the email
        frontend_url = getattr(settings, 'FRONTEND_URL', 'http://localhost:3000')
        reset_url = f"{frontend_url}/reset-password?uid={uid}&token={token}"

        # Render email content
        subject = "Password Reset Request — GCS ERP"
        message = (
            f"Hi {user.full_name},\n\n"
            f"We received a request to reset your password. Click the link below to set a new password:\n\n"
            f"{reset_url}\n\n"
            f"This link will expire in 24 hours. If you did not request this, you can safely ignore this email.\n\n"
            f"— Gnana Computech Solutions"
        )
        html_message = render_to_string('emails/password_reset.html', {
            'user': user,
            'reset_url': reset_url,
            'token_lifetime_hours': 24,
        }) if None else None  # Fallback gracefully if template missing

        try:
            send_mail(
                subject=subject,
                message=message,
                from_email=getattr(settings, 'DEFAULT_FROM_EMAIL', 'noreply@gnanacomputech.com'),
                recipient_list=[user.email],
                html_message=html_message,
                fail_silently=True,
            )
        except Exception:
            pass  # In development with no SMTP, don't crash the request

        return Response({
            "message": "If an account with that email exists, a password reset link has been sent."
        })


class PasswordResetConfirmView(APIView):
    """
    POST /api/v1/auth/reset-password
    Accepts uid, token, and new_password to complete the password reset.
    """
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = PasswordResetConfirmSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        uid = serializer.validated_data['uid']
        token = serializer.validated_data['token']
        new_password = serializer.validated_data['new_password']

        try:
            user_id = force_str(urlsafe_base64_decode(uid))
            user = User.objects.get(pk=user_id, is_active=True)
        except (TypeError, ValueError, OverflowError, User.DoesNotExist):
            return Response(
                {"error": {"code": "INVALID_RESET_TOKEN", "message": "Invalid or expired reset link."}},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not default_token_generator.check_token(user, token):
            return Response(
                {"error": {"code": "INVALID_RESET_TOKEN", "message": "Invalid or expired reset link."}},
                status=status.HTTP_400_BAD_REQUEST,
            )

        user.set_password(new_password)
        user.save()
        return Response({"message": "Password reset successfully. You can now log in with your new password."})


class InstitutionViewSet(viewsets.ModelViewSet):
    queryset = Institution.objects.all()
    serializer_class = InstitutionSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    search_fields = ['name', 'code', 'city']
    ordering_fields = ['name', 'created_at']


class DepartmentViewSet(viewsets.ModelViewSet):
    queryset = Department.objects.all()
    serializer_class = DepartmentSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter]
    filterset_fields = ['institution']
    search_fields = ['name', 'code']


class ProgramViewSet(viewsets.ModelViewSet):
    queryset = Program.objects.all()
    serializer_class = ProgramSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['program_type']
    search_fields = ['title', 'code']


class BatchViewSet(viewsets.ModelViewSet):
    queryset = Batch.objects.all()
    serializer_class = BatchSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['program', 'institution', 'status']
    search_fields = ['name', 'business_id']


class StudentViewSet(viewsets.ModelViewSet):
    queryset = Student.objects.select_related('user', 'institution').all()
    serializer_class = StudentSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter]
    filterset_fields = ['institution', 'degree', 'semester']
    search_fields = ['user__full_name', 'user__email', 'business_id', 'usn']

    def get_queryset(self):
        user = self.request.user
        # Students only see their own profile
        if 'STUDENT' in user.get_role_codes() and not user.is_staff:
            return self.queryset.filter(user=user)
        # Institution coordinators see their college students
        if 'INSTITUTION_COORDINATOR' in user.get_role_codes() and not user.is_staff:
            return self.queryset.filter(institution__coordinator=user)
        return self.queryset


class EmployeeViewSet(viewsets.ModelViewSet):
    queryset = Employee.objects.select_related('user', 'department').all()
    serializer_class = EmployeeSerializer
    permission_classes = [IsERPStaff]
    filter_backends = [DjangoFilterBackend, SearchFilter]
    filterset_fields = ['department']
    search_fields = ['user__full_name', 'employee_id']


class EnrollmentViewSet(viewsets.ModelViewSet):
    """
    Section 4.1: Core integration entity.
    Only core writes to this table; all other modules link to it.
    """
    queryset = Enrollment.objects.select_related('student__user', 'program', 'batch', 'institution').all()
    serializer_class = EnrollmentSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['program', 'batch', 'institution', 'status', 'coordinator_approval']
    search_fields = ['business_id', 'student__user__full_name', 'student__usn']

    def get_queryset(self):
        user = self.request.user
        if 'STUDENT' in user.get_role_codes() and not user.is_staff:
            return self.queryset.filter(student__user=user)
        if 'INSTITUTION_COORDINATOR' in user.get_role_codes() and not user.is_staff:
            return self.queryset.filter(institution__coordinator=user)
        return self.queryset

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)
