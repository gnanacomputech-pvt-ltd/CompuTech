from rest_framework import viewsets, status, permissions
from rest_framework.views import APIView
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError
from apps.core.tasks import queue_signin_email
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
from django.contrib.auth.tokens import default_token_generator
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.utils.encoding import force_bytes, force_str
from django.template.loader import render_to_string
from django.core.mail import send_mail
from django.conf import settings
from django.db import connection, transaction
from django.db.models import Sum, Count, Q

from apps.common.permissions import (
    IsSuperAdmin, IsERPStaff, IsFullAccessStaff, ModuleAccess, StaffWriteAccess,
    ProgramAccess,
)
from apps.core.models import (
    User, Institution, Department, Program, Batch, Student, Employee, Enrollment,
    Role, UserRole, SignupRequest,
)
from apps.core.serializers import (
    CustomTokenObtainPairSerializer, ChangePasswordSerializer,
    PasswordResetSerializer, PasswordResetConfirmSerializer,
    UserRegistrationSerializer, StaffSignupSerializer, InstitutionSignupSerializer,
    SignupRequestSerializer, SignupApprovalSerializer, SignupRejectionSerializer,
    UserSerializer, InstitutionSerializer, DepartmentSerializer, ProgramSerializer,
    BatchSerializer, StudentSerializer, EmployeeSerializer, EmployeeCreateSerializer,
    EnrollmentSerializer
)
from apps.core import signup as signup_service


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
    Sends security sign-in notification email upon successful authentication.
    """
    serializer_class = CustomTokenObtainPairSerializer

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        try:
            serializer.is_valid(raise_exception=True)
        except TokenError as e:
            raise InvalidToken(e.args[0])

        user = serializer.user

        # Extract client details for sign-in notification
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip_address = x_forwarded_for.split(',')[0].strip()
        else:
            ip_address = request.META.get('REMOTE_ADDR', '')
        user_agent = request.META.get('HTTP_USER_AGENT', '')

        # Dispatch sign-in notification email safely
        try:
            queue_signin_email(user, ip_address=ip_address, user_agent=user_agent)
        except Exception:
            pass

        return Response(serializer.validated_data, status=status.HTTP_200_OK)


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
    # No domain owner — any ERP staff can read, only Full-access roles write.
    permission_classes = [ModuleAccess]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    search_fields = ['name', 'code', 'city']
    ordering_fields = ['name', 'created_at']


class DepartmentViewSet(viewsets.ModelViewSet):
    queryset = Department.objects.all()
    serializer_class = DepartmentSerializer
    permission_classes = [ModuleAccess]
    filter_backends = [DjangoFilterBackend, SearchFilter]
    filterset_fields = ['institution']
    search_fields = ['name', 'code']


class ProgramViewSet(viewsets.ModelViewSet):
    # enrollment_total / enrollment_active feed ProgramSerializer's counts —
    # the admin Programs screen shows how many students each program has,
    # and annotating here keeps it one query instead of one per row.
    # order_by is explicit because annotate() adds a GROUP BY, which makes
    # Django report the queryset as unordered — DRF then paginates it
    # without a stable sort (UnorderedObjectListWarning).
    queryset = Program.objects.annotate(
        enrollment_total=Count('enrollments', distinct=True),
        enrollment_active=Count(
            'enrollments', filter=Q(enrollments__status='ACTIVE'), distinct=True
        ),
    ).order_by('title')
    serializer_class = ProgramSerializer
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['program_type', 'is_published']
    search_fields = ['title', 'code']
    ordering_fields = ['title', 'created_at', 'base_fee', 'duration_weeks']

    def get_throttles(self):
        if self.action in ('list', 'retrieve'):
            return []
        return super().get_throttles()

    def get_permissions(self):
        # Public Courses/Internships pages read this directly. Writes are
        # Full-access staff or the Content Manager, whose domain covers the
        # public course catalog (apps/common/permissions.py DOMAIN_ROLES).
        if self.action in ('list', 'retrieve'):
            return [permissions.AllowAny()]
        return [ProgramAccess()]

    def get_queryset(self):
        user = self.request.user
        if self.action in ('list', 'retrieve') and not (user and user.is_authenticated):
            return self.queryset.filter(is_published=True)
        return self.queryset

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)


class BatchViewSet(viewsets.ModelViewSet):
    queryset = Batch.objects.all()
    serializer_class = BatchSerializer
    permission_classes = [ModuleAccess]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['program', 'institution', 'status']
    search_fields = ['name', 'business_id']


class StudentViewSet(viewsets.ModelViewSet):
    # prefetch_related('enrollments__…') powers the nested course details on
    # StudentSerializer (personal + professional + course data in one payload).
    queryset = Student.objects.select_related('user', 'institution').prefetch_related(
        'enrollments__program', 'enrollments__batch', 'enrollments__academic_progress'
    ).all()
    serializer_class = StudentSerializer
    # Read: IsAuthenticated + get_queryset below (a student only ever sees
    # their own profile, a coordinator only their institution's students).
    # Write: Full-access staff only — editing a student's academic record
    # isn't any Medium-access role's domain.
    permission_classes = [StaffWriteAccess]
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
    # Personnel records are Full-access-tier only — Medium-access staff
    # (Trainer, Mentor, Accounts, ...) don't browse the employee directory.
    permission_classes = [IsFullAccessStaff]
    filter_backends = [DjangoFilterBackend, SearchFilter]
    filterset_fields = ['department']
    search_fields = ['user__full_name', 'employee_id']

    @action(detail=False, methods=['post'], url_path='create-with-user', permission_classes=[IsSuperAdmin])
    def create_with_user(self, request):
        """
        Employee.user is a required OneToOneField — a plain POST /employees/
        can only link an *existing* user. This endpoint creates the login
        account and the employee profile together in one atomic step.
        Super-Admin-only: this is the one place a new person gets an ERP
        role granted, so it stays outside the Full-access tier.
        """
        serializer = EmployeeCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        with transaction.atomic():
            user = User.objects.create_user(
                email=data['email'],
                password=data['password'],
                full_name=data['full_name'],
                phone=data.get('phone', ''),
                is_staff=True,
                is_active=True,
                is_verified=True,
            )
            role, _ = Role.objects.get_or_create(
                code=data['role'],
                defaults={'name': data['role'].replace('_', ' ').title()}
            )
            UserRole.objects.get_or_create(user=user, role=role)

            employee = Employee.objects.create(
                user=user,
                employee_id=data['employee_id'],
                designation=data['designation'],
                department=data.get('department'),
                joining_date=data.get('joining_date'),
                created_by=request.user,
            )

        return Response(
            EmployeeSerializer(employee).data,
            status=status.HTTP_201_CREATED,
        )


class EnrollmentViewSet(viewsets.ModelViewSet):
    """
    Section 4.1: Core integration entity.
    Only core writes to this table; all other modules link to it.
    """
    queryset = Enrollment.objects.select_related('student__user', 'program', 'batch', 'institution').all()
    serializer_class = EnrollmentSerializer
    # Read: IsAuthenticated + get_queryset below (self/institution scoping).
    # Write (create/approve/etc.): Full-access staff only — enrollment
    # approval is coordinator-level, not any Medium-access role's domain.
    permission_classes = [StaffWriteAccess]
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

class PublicInstitutionListView(APIView):
    """
    GET /api/v1/public/institutions/
    The partner-college picker on the public signup page. Deliberately
    narrower than InstitutionViewSet (which is staff-only and returns
    contact details and coordinators) — an anonymous visitor only needs
    enough to recognise their own college in a dropdown.
    """
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        rows = Institution.objects.filter(is_active=True).order_by('name').values('id', 'name', 'city')
        return Response([
            {'id': str(row['id']), 'name': row['name'], 'city': row['city']}
            for row in rows
        ])


class BaseSignupView(APIView):
    """
    Shared body for the three public self-registration endpoints.

    None of them return tokens: a self-registered account is created PENDING
    and inactive, and only becomes usable once a reviewer approves it
    (apps/core/signup.py). Returning a token pair here would hand out a
    session for an account that cannot do anything yet — the exact behaviour
    the approval queue exists to prevent.
    """
    permission_classes = [permissions.AllowAny]
    throttle_scope = 'signup'
    kind = None
    serializer_class = None
    success_message = "Registration received. Our team will review it shortly."

    def post(self, request):
        serializer = self.serializer_class(data=request.data)
        serializer.is_valid(raise_exception=True)

        signup_request = signup_service.create_signup_request(
            self.kind, serializer.validated_data
        )
        user = signup_request.user

        # Acknowledgement email. Dispatched after the account exists so it is
        # only ever sent for a real pending registration. queue_welcome_email
        # swallows its own failures: a signup must not be rejected because
        # SES, SMTP or the Celery broker is having a bad day.
        from apps.core.tasks import queue_welcome_email
        queue_welcome_email(user)

        return Response(
            {
                "request_id": str(signup_request.id),
                "user": {
                    "id": str(user.id),
                    "email": user.email,
                    "full_name": user.full_name,
                    "phone": user.phone,
                    "approval_status": user.approval_status,
                },
                "approval_status": user.approval_status,
                "_message": self.success_message,
            },
            status=status.HTTP_201_CREATED,
        )


class UserRegistrationView(BaseSignupView):
    """
    POST /api/v1/auth/register/
    Public student self-registration from the /signup page. Creates a PENDING
    account; the STUDENT role and Student profile are created on approval.
    """
    kind = 'STUDENT'
    serializer_class = UserRegistrationSerializer
    success_message = (
        "Account created. A Gnana Computech staff member will review and approve it — "
        "you will be emailed as soon as you can sign in."
    )


class StaffRegistrationView(BaseSignupView):
    """
    POST /api/v1/auth/register-staff/
    Public staff self-registration from the /staff-signup page. Approval is
    admin-only, because approving one grants an ERP role.
    """
    kind = 'STAFF'
    serializer_class = StaffSignupSerializer
    success_message = (
        "Staff account request submitted. An administrator will review it and "
        "you will be emailed once your access has been approved."
    )


class InstitutionRegistrationView(BaseSignupView):
    """
    POST /api/v1/auth/register-institution/
    Public partner-college self-registration from the /signup page's
    Institution tab. Approval creates the Institution and makes this user
    its coordinator.
    """
    kind = 'INSTITUTION'
    serializer_class = InstitutionSignupSerializer
    success_message = (
        "Institution partnership request submitted. Our team will review it and "
        "email you once your coordinator account has been approved."
    )


class SignupRequestViewSet(viewsets.ReadOnlyModelViewSet):
    """
    The accept / reject queue behind both dashboards.

    GET    /api/v1/signup-requests/?kind=STUDENT&status=PENDING
    POST   /api/v1/signup-requests/{id}/approve/
    POST   /api/v1/signup-requests/{id}/reject/

    Who may decide depends on what the request would grant:
    a STUDENT account is any staff member's call (the staff dashboard's
    "Students" screen), while STAFF and INSTITUTION requests grant ERP or
    coordinator access and stay with the Full-access/admin tier.
    """
    queryset = SignupRequest.objects.select_related(
        'user', 'institution', 'department', 'reviewed_by'
    ).all()
    serializer_class = SignupRequestSerializer
    permission_classes = [IsERPStaff]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['kind', 'status']
    search_fields = [
        'user__full_name', 'user__email', 'college_name', 'organization_name', 'designation',
    ]
    ordering_fields = ['created_at', 'status', 'kind']

    # Kinds a Medium-access staff member may not see or decide on, because
    # approving them grants ERP or partner-coordinator access.
    FULL_ACCESS_KINDS = frozenset({'STAFF', 'INSTITUTION'})

    def get_queryset(self):
        qs = super().get_queryset()
        if IsFullAccessStaff().has_permission(self.request, self):
            return qs
        return qs.exclude(kind__in=self.FULL_ACCESS_KINDS)

    def _check_can_decide(self, signup_request):
        """Returns an error Response if this user may not decide this request."""
        if signup_request.kind in self.FULL_ACCESS_KINDS and not IsFullAccessStaff().has_permission(self.request, self):
            return Response(
                {"error": {
                    "code": "PERMISSION_DENIED",
                    "message": "Only an administrator can approve or reject this request.",
                }},
                status=status.HTTP_403_FORBIDDEN,
            )
        if signup_request.status != 'PENDING':
            return Response(
                {"error": {
                    "code": "ALREADY_REVIEWED",
                    "message": f"This request has already been {signup_request.status.lower()}.",
                }},
                status=status.HTTP_400_BAD_REQUEST,
            )
        return None

    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        signup_request = self.get_object()
        denied = self._check_can_decide(signup_request)
        if denied:
            return denied

        serializer = SignupApprovalSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        signup_request = signup_service.approve_signup_request(
            signup_request, request.user, serializer.validated_data
        )

        from apps.core.tasks import notify_signup_decision
        notify_signup_decision(signup_request.user, approved=True)

        return Response({
            **SignupRequestSerializer(signup_request).data,
            "_message": f"{signup_request.user.full_name} can now sign in.",
        })

    @action(detail=True, methods=['post'])
    def reject(self, request, pk=None):
        signup_request = self.get_object()
        denied = self._check_can_decide(signup_request)
        if denied:
            return denied

        serializer = SignupRejectionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        notes = serializer.validated_data.get('review_notes', '')

        signup_request = signup_service.reject_signup_request(
            signup_request, request.user, notes
        )

        from apps.core.tasks import notify_signup_decision
        notify_signup_decision(signup_request.user, approved=False, reason=notes)

        return Response({
            **SignupRequestSerializer(signup_request).data,
            "_message": f"Request from {signup_request.user.full_name} was rejected.",
        })

    @action(detail=False, methods=['get'], url_path='pending-counts')
    def pending_counts(self, request):
        """Badge counts for the dashboard sidebars, in one request."""
        rows = self.get_queryset().filter(status='PENDING').values('kind').annotate(total=Count('id'))
        counts = {row['kind']: row['total'] for row in rows}
        return Response({
            'student': counts.get('STUDENT', 0),
            'staff': counts.get('STAFF', 0),
            'institution': counts.get('INSTITUTION', 0),
            'total': sum(counts.values()),
        })


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
