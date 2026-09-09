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
from django.db.models import Sum, Count, Q

from apps.common.permissions import IsSuperAdmin, IsERPStaff
from apps.core.models import (
    User, Institution, Department, Program, Batch, Student, Employee, Enrollment
)
from apps.core.serializers import (
    CustomTokenObtainPairSerializer, ChangePasswordSerializer,
    PasswordResetSerializer, PasswordResetConfirmSerializer,
    UserRegistrationSerializer,
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


# ---------------------------------------------------------------------------
# User Self-Registration (Signup)
# ---------------------------------------------------------------------------

class UserRegistrationView(APIView):
    """
    POST /api/v1/auth/register/
    Public endpoint for new student self-registration from the /signup page.

    On success:
    - Creates a User with is_verified=False and role STUDENT
    - Returns a JWT token pair + user profile (same envelope as login)
    """
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = UserRegistrationSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        # Create the User
        user = User.objects.create_user(
            email=data['email'],
            password=data['password'],
            full_name=data['full_name'],
            phone=data.get('phone', ''),
            is_active=True,
            is_verified=False,  # Awaiting email verification in a future iteration
        )

        # Assign STUDENT role
        try:
            from apps.core.models import Role, UserRole
            student_role, _ = Role.objects.get_or_create(
                code='STUDENT',
                defaults={'name': 'Enrolled Learner', 'description': 'Student self-service portal'}
            )
            UserRole.objects.get_or_create(user=user, role=student_role)
        except Exception:
            pass  # Role assignment failure should not block account creation

        # Issue tokens immediately (same shape as login)
        from rest_framework_simplejwt.tokens import RefreshToken
        refresh = RefreshToken.for_user(user)
        refresh['email'] = user.email
        refresh['full_name'] = user.full_name
        refresh['roles'] = user.get_role_codes()

        return Response(
            {
                "access": str(refresh.access_token),
                "refresh": str(refresh),
                "user": {
                    "id": str(user.id),
                    "email": user.email,
                    "full_name": user.full_name,
                    "phone": user.phone,
                    "is_verified": user.is_verified,
                    "roles": user.get_role_codes(),
                },
                "_message": "Account created successfully. Welcome to GCS Portal!",
            },
            status=status.HTTP_201_CREATED,
        )


# ---------------------------------------------------------------------------
# ERP Dashboard Analytics
# ---------------------------------------------------------------------------

class DashboardStatsView(APIView):
    """
    GET /api/v1/dashboard/stats/
    Returns aggregate summary statistics for the ERP dashboard.
    Requires authentication; ERP staff see global stats, students see their own.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user
        user_roles = user.get_role_codes()
        is_erp_staff = user.is_staff or user.is_superuser or bool(
            set(user_roles) & {
                'SUPER_ADMIN', 'ADMIN', 'HR', 'ACCOUNTS', 'ACADEMIC_COORDINATOR',
                'INTERNSHIP_COORDINATOR', 'PROJECT_COORDINATOR', 'TRAINER',
                'MENTOR', 'PLACEMENT_OFFICER', 'CONTENT_MANAGER'
            }
        )

        if is_erp_staff:
            return self._erp_stats(request)
        elif 'STUDENT' in user_roles:
            return self._student_stats(request)
        elif 'INSTITUTION_COORDINATOR' in user_roles:
            return self._institution_stats(request)

        return Response({"detail": "No dashboard stats available for your role."})

    def _erp_stats(self, request):
        """Global aggregate stats for ERP admin/staff dashboard."""
        from apps.finance.models import Invoice, Certificate

        enrollment_stats = Enrollment.objects.aggregate(
            total=Count('id'),
            active=Count('id', filter=Q(status='ACTIVE')),
            completed=Count('id', filter=Q(status='COMPLETED')),
            applied=Count('id', filter=Q(status='APPLIED')),
        )

        finance_stats = Invoice.objects.aggregate(
            total_invoiced=Sum('total_amount'),
            total_collected=Sum('paid_amount'),
        )
        total_invoiced = finance_stats['total_invoiced'] or 0
        total_collected = finance_stats['total_collected'] or 0

        return Response({
            "students": {
                "total": Student.objects.count(),
                "active": Student.objects.filter(is_active=True).count(),
            },
            "enrollments": {
                "total": enrollment_stats['total'],
                "active": enrollment_stats['active'],
                "completed": enrollment_stats['completed'],
                "applied_pending": enrollment_stats['applied'],
            },
            "batches": {
                "total": Batch.objects.count(),
                "active": Batch.objects.filter(status='ACTIVE').count(),
                "upcoming": Batch.objects.filter(status='UPCOMING').count(),
            },
            "finance": {
                "total_invoiced": float(total_invoiced),
                "total_collected": float(total_collected),
                "pending_fees": float(total_invoiced - total_collected),
            },
            "certificates": {
                "issued": Certificate.objects.filter(status='ISSUED').count(),
                "draft": Certificate.objects.filter(status='DRAFT').count(),
                "revoked": Certificate.objects.filter(status='REVOKED').count(),
            },
            "programs": {
                "total": Program.objects.count(),
            },
            "institutions": {
                "total": Institution.objects.count(),
            },
        })

    def _student_stats(self, request):
        """Stats scoped to the authenticated student's own profile."""
        try:
            student = request.user.student_profile
        except Student.DoesNotExist:
            return Response({"detail": "Student profile not found."}, status=status.HTTP_404_NOT_FOUND)

        enrollments = student.enrollments.all()
        enrollment_list = []
        for enr in enrollments.select_related('program', 'batch'):
            try:
                progress = enr.academic_progress
                attendance_pct = float(progress.attendance_percentage)
            except Exception:
                attendance_pct = 0.0
            enrollment_list.append({
                "enrollment_id": str(enr.id),
                "business_id": enr.business_id,
                "program": enr.program.title,
                "batch": enr.batch.name,
                "status": enr.status,
                "attendance_percentage": attendance_pct,
            })

        return Response({
            "student": {
                "name": request.user.full_name,
                "business_id": student.business_id,
                "degree": student.degree,
                "semester": student.semester,
            },
            "enrollments": enrollment_list,
            "total_enrollments": len(enrollment_list),
        })

    def _institution_stats(self, request):
        """Stats scoped to the institution the coordinator manages."""
        institutions = Institution.objects.filter(coordinator=request.user)
        if not institutions.exists():
            return Response({"detail": "No institution linked to your account."})

        stats = []
        for inst in institutions:
            enr_stats = Enrollment.objects.filter(institution=inst).aggregate(
                total=Count('id'),
                active=Count('id', filter=Q(status='ACTIVE')),
                completed=Count('id', filter=Q(status='COMPLETED')),
            )
            stats.append({
                "institution": inst.name,
                "code": inst.code,
                "students": inst.students.filter(is_active=True).count(),
                "enrollments": enr_stats,
                "active_batches": inst.batches.filter(status='ACTIVE').count(),
            })

        return Response({"institutions": stats})

