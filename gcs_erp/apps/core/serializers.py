from rest_framework import serializers
from rest_framework.exceptions import PermissionDenied
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from django.contrib.auth import authenticate
from apps.core.models import (
    User, Role, Permission, UserRole, Institution,
    Department, Program, Batch, Student, Employee, Enrollment, SignupRequest
)


# Role codes a self-registering staff member may ask for. Mirrors
# EmployeeCreateSerializer.ASSIGNABLE_ROLES (SUPER_ADMIN is never
# self-requestable); CONTENT_MANAGER is the default because that is the role
# whose domain covers the staff dashboard's website-editing screens.
ASSIGNABLE_STAFF_ROLE_CODES = (
    'ADMIN', 'HR', 'ACCOUNTS', 'ACADEMIC_COORDINATOR', 'INTERNSHIP_COORDINATOR',
    'PROJECT_COORDINATOR', 'TRAINER', 'MENTOR', 'PLACEMENT_OFFICER', 'CONTENT_MANAGER',
)


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    """
    Custom JWT serializer enriching token response with roles and user profile.
    """
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token['email'] = user.email
        token['full_name'] = user.full_name
        token['roles'] = user.get_role_codes()
        return token

    # Messages for accounts that exist and have the right password but are
    # not cleared to sign in yet. Without this, simplejwt's generic
    # "No active account found with the given credentials" would make a
    # correctly-registered student think they typed the wrong password.
    APPROVAL_MESSAGES = {
        'PENDING': (
            "Your account is awaiting approval from the Gnana Computech team. "
            "You will be able to sign in once it has been approved."
        ),
        'REJECTED': (
            "Your account request was not approved. "
            "Please contact the Gnana Computech team if you believe this is a mistake."
        ),
    }

    def validate(self, attrs):
        self._reject_unapproved(attrs)
        data = super().validate(attrs)
        user = self.user
        roles = user.get_role_codes()

        # Gather all permissions across roles
        role_ids = user.user_roles.values_list('role_id', flat=True)
        permissions = list(
            Permission.objects.filter(
                perm_roles__role_id__in=role_ids
            ).values_list('code', flat=True).distinct()
        )

        data['user'] = {
            'id': str(user.id),
            'email': user.email,
            'full_name': user.full_name,
            'phone': user.phone,
            'is_staff': user.is_staff,
            'is_superuser': user.is_superuser,
            'roles': roles,
            'permissions': permissions
        }

        # Include linked student or employee ID if present
        if hasattr(user, 'student_profile'):
            data['user']['student_id'] = user.student_profile.business_id
            data['user']['institution_id'] = str(user.student_profile.institution_id)
        if hasattr(user, 'employee_profile'):
            data['user']['employee_id'] = user.employee_profile.employee_id

        data['_message'] = "Login successful"
        return data

    def _reject_unapproved(self, attrs):
        """Explain an unapproved login instead of letting it look like a
        wrong password.

        Only runs for a correct email+password pair, so it never reveals
        whether an address is registered.
        """
        email = (attrs.get('email') or '').strip().lower()
        password = attrs.get('password') or ''
        if not email or not password:
            return

        user = User.objects.filter(email__iexact=email).first()
        if user is None or not user.check_password(password):
            return

        message = self.APPROVAL_MESSAGES.get(user.approval_status)
        if message:
            # PermissionDenied rather than ValidationError: the credentials
            # were right, the account just isn't cleared to sign in. It also
            # makes the reason reach the client as a plain string
            # (custom_exception_handler maps 403 detail -> error.message),
            # where a field-keyed validation error would arrive as a list
            # and show up as a generic "Request failed".
            raise PermissionDenied(message)


class ChangePasswordSerializer(serializers.Serializer):
    old_password = serializers.CharField(required=True)
    new_password = serializers.CharField(required=True, min_length=8)

    def validate_old_password(self, value):
        user = self.context['request'].user
        if not user.check_password(value):
            raise serializers.ValidationError("Incorrect existing password.")
        return value


class PasswordResetSerializer(serializers.Serializer):
    """Request password reset — just needs a valid email format."""
    email = serializers.EmailField(required=True)


class PasswordResetConfirmSerializer(serializers.Serializer):
    """Confirm password reset with token, uid, and the new password."""
    uid = serializers.CharField(required=True)
    token = serializers.CharField(required=True)
    new_password = serializers.CharField(required=True, min_length=8)


class BaseSignupSerializer(serializers.Serializer):
    """
    Credentials every self-registration form collects. Subclasses add the
    details their own approval step needs (a Student profile needs a college
    and degree, an Employee needs a designation, an Institution needs an
    address) -- see SignupRequest for where those are parked until approval.
    """
    email = serializers.EmailField(required=True)
    full_name = serializers.CharField(required=True, max_length=255)
    phone = serializers.CharField(required=False, allow_blank=True, max_length=20)
    password = serializers.CharField(required=True, min_length=8, write_only=True)
    confirm_password = serializers.CharField(required=True, write_only=True)
    message = serializers.CharField(required=False, allow_blank=True)

    def validate_email(self, value):
        value = value.lower().strip()
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError(
                "An account with this email address already exists."
            )
        return value

    def validate(self, attrs):
        if attrs['password'] != attrs['confirm_password']:
            raise serializers.ValidationError(
                {"confirm_password": "Passwords do not match."}
            )
        return attrs


class UserRegistrationSerializer(BaseSignupSerializer):
    """
    Self-registration serializer for the public /signup page (student tab).
    Creates a PENDING User plus a SignupRequest; the account only becomes
    usable once staff approve it, which is also when the Student profile and
    the STUDENT role are created.
    """
    institution = serializers.PrimaryKeyRelatedField(
        queryset=Institution.objects.all(), required=False, allow_null=True
    )
    college_name = serializers.CharField(required=False, allow_blank=True, max_length=255)
    degree = serializers.CharField(required=False, allow_blank=True, max_length=100)
    semester = serializers.IntegerField(required=False, allow_null=True, min_value=1, max_value=12)
    branch = serializers.CharField(required=False, allow_blank=True, max_length=100)
    usn = serializers.CharField(required=False, allow_blank=True, max_length=50)

    def validate(self, attrs):
        attrs = super().validate(attrs)
        if not attrs.get('institution') and not (attrs.get('college_name') or '').strip():
            raise serializers.ValidationError(
                {"college_name": "Select your college, or type its name if it is not listed."}
            )
        return attrs


class StaffSignupSerializer(BaseSignupSerializer):
    """
    Self-registration for the public /staff-signup page. Approving one of
    these grants an ERP role, so it is admin-only -- the same reason
    EmployeeViewSet.create_with_user stays Super-Admin-only.
    """
    requested_role = serializers.ChoiceField(
        choices=ASSIGNABLE_STAFF_ROLE_CODES, required=False, default='CONTENT_MANAGER'
    )
    designation = serializers.CharField(required=True, max_length=100)
    department = serializers.PrimaryKeyRelatedField(
        queryset=Department.objects.all(), required=False, allow_null=True
    )


class InstitutionSignupSerializer(BaseSignupSerializer):
    """
    Self-registration for a partner college (the /signup page's Institution
    tab). Approval creates the Institution record with this user as its
    coordinator and grants the INSTITUTION_COORDINATOR role.
    """
    organization_name = serializers.CharField(required=True, max_length=255)
    address = serializers.CharField(required=False, allow_blank=True)
    city = serializers.CharField(required=False, allow_blank=True, max_length=100)
    state = serializers.CharField(required=False, allow_blank=True, max_length=100)
    contact_phone = serializers.CharField(required=False, allow_blank=True, max_length=20)


class UserSerializer(serializers.ModelSerializer):
    roles = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ['id', 'email', 'full_name', 'phone', 'is_active', 'is_staff', 'is_verified', 'avatar', 'roles', 'created_at']
        read_only_fields = ['id', 'created_at', 'roles']

    def get_roles(self, obj):
        return obj.get_role_codes()


class InstitutionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Institution
        fields = '__all__'
        read_only_fields = ['id', 'created_at', 'updated_at']


class DepartmentSerializer(serializers.ModelSerializer):
    institution_name = serializers.ReadOnlyField(source='institution.name')

    class Meta:
        model = Department
        fields = '__all__'
        read_only_fields = ['id', 'created_at', 'updated_at']


class ProgramSerializer(serializers.ModelSerializer):
    # Annotated by ProgramViewSet.get_queryset; falls back to a direct count
    # so a Program serialized outside that viewset still reports correctly.
    enrollment_count = serializers.SerializerMethodField()
    active_enrollment_count = serializers.SerializerMethodField()

    class Meta:
        model = Program
        fields = '__all__'
        read_only_fields = ['id', 'created_at', 'updated_at']

    def get_enrollment_count(self, obj):
        annotated = getattr(obj, 'enrollment_total', None)
        return annotated if annotated is not None else obj.enrollments.count()

    def get_active_enrollment_count(self, obj):
        annotated = getattr(obj, 'enrollment_active', None)
        if annotated is not None:
            return annotated
        return obj.enrollments.filter(status='ACTIVE').count()


class BatchSerializer(serializers.ModelSerializer):
    program_title = serializers.ReadOnlyField(source='program.title')
    institution_name = serializers.ReadOnlyField(source='institution.name')

    class Meta:
        model = Batch
        fields = '__all__'
        read_only_fields = ['id', 'business_id', 'created_at', 'updated_at']


class EmployeeSerializer(serializers.ModelSerializer):
    user_details = UserSerializer(source='user', read_only=True)
    department_name = serializers.ReadOnlyField(source='department.name')

    class Meta:
        model = Employee
        fields = '__all__'
        read_only_fields = ['id', 'created_at', 'updated_at']


class EmployeeCreateSerializer(serializers.Serializer):
    """
    Employee.user is a required OneToOneField, so adding a staff member means
    creating the login account and the employee profile together. Mirrors
    UserRegistrationSerializer's validation style, plus the employee fields
    and the ERP role to grant (IsERPStaff.STAFF_ROLES, minus SUPER_ADMIN —
    that one stays reserved for createsuperuser).
    """
    ASSIGNABLE_ROLES = (
        'ADMIN', 'HR', 'ACCOUNTS', 'ACADEMIC_COORDINATOR', 'INTERNSHIP_COORDINATOR',
        'PROJECT_COORDINATOR', 'TRAINER', 'MENTOR', 'PLACEMENT_OFFICER', 'CONTENT_MANAGER',
    )

    full_name = serializers.CharField(required=True, max_length=255)
    email = serializers.EmailField(required=True)
    phone = serializers.CharField(required=False, allow_blank=True, max_length=20)
    password = serializers.CharField(required=True, min_length=8, write_only=True)
    role = serializers.ChoiceField(choices=ASSIGNABLE_ROLES, required=True)
    employee_id = serializers.CharField(required=True, max_length=50)
    designation = serializers.CharField(required=True, max_length=100)
    department = serializers.PrimaryKeyRelatedField(
        queryset=Department.objects.all(), required=False, allow_null=True
    )
    joining_date = serializers.DateField(required=False, allow_null=True)

    def validate_email(self, value):
        value = value.lower().strip()
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("An account with this email address already exists.")
        return value

    def validate_employee_id(self, value):
        if Employee.objects.filter(employee_id=value).exists():
            raise serializers.ValidationError("An employee with this ID already exists.")
        return value


class EnrollmentSerializer(serializers.ModelSerializer):
    student_name = serializers.ReadOnlyField(source='student.user.full_name')
    student_usn = serializers.ReadOnlyField(source='student.usn')
    program_title = serializers.ReadOnlyField(source='program.title')
    batch_name = serializers.ReadOnlyField(source='batch.name')
    institution_name = serializers.ReadOnlyField(source='institution.name')
    attendance_percentage = serializers.SerializerMethodField()

    class Meta:
        model = Enrollment
        fields = '__all__'
        read_only_fields = ['id', 'business_id', 'enrolled_at', 'created_at', 'updated_at']

    def get_attendance_percentage(self, obj):
        try:
            return float(obj.academic_progress.attendance_percentage)
        except Exception:
            return 0.0


class StudentSerializer(serializers.ModelSerializer):
    """
    Full student record for ERP staff/admin:
    - Personal data    -> user_details (name, email, phone, account status)
    - Professional data-> business_id, USN, degree, branch, semester, institution
    - Course details   -> nested enrollments (program, batch, status, dates,
                          coordinator approval, attendance percentage)
    """
    user_details = UserSerializer(source='user', read_only=True)
    institution_name = serializers.ReadOnlyField(source='institution.name')
    enrollments = EnrollmentSerializer(many=True, read_only=True)

    class Meta:
        model = Student
        fields = '__all__'
        read_only_fields = ['id', 'business_id', 'created_at', 'updated_at']


class SignupRequestSerializer(serializers.ModelSerializer):
    """
    Read-only view of a pending/reviewed signup request for the admin and
    staff dashboards. Everything a reviewer needs in order to decide is
    flattened in here so the queue renders from one list call.
    """
    full_name = serializers.ReadOnlyField(source='user.full_name')
    email = serializers.ReadOnlyField(source='user.email')
    phone = serializers.ReadOnlyField(source='user.phone')
    user_is_active = serializers.ReadOnlyField(source='user.is_active')
    approval_status = serializers.ReadOnlyField(source='user.approval_status')
    institution_name = serializers.ReadOnlyField(source='institution.name')
    department_name = serializers.ReadOnlyField(source='department.name')
    reviewed_by_name = serializers.ReadOnlyField(source='reviewed_by.full_name')
    college = serializers.SerializerMethodField()

    class Meta:
        model = SignupRequest
        fields = [
            'id', 'kind', 'status', 'created_at', 'updated_at',
            'full_name', 'email', 'phone', 'user_is_active', 'approval_status',
            'institution', 'institution_name', 'college_name', 'college',
            'degree', 'semester', 'branch', 'usn',
            'requested_role', 'designation', 'department', 'department_name',
            'organization_name', 'address', 'city', 'state', 'contact_phone',
            'message', 'reviewed_by', 'reviewed_by_name', 'reviewed_at', 'review_notes',
        ]
        read_only_fields = fields

    def get_college(self, obj):
        """Whichever of the two college fields the applicant actually filled in."""
        return obj.institution.name if obj.institution_id else obj.college_name


class SignupApprovalSerializer(serializers.Serializer):
    """Optional overrides a reviewer can apply while approving a request."""
    review_notes = serializers.CharField(required=False, allow_blank=True)
    # STAFF requests only -- the approver can grant a different role than the
    # one the applicant asked for.
    role = serializers.ChoiceField(choices=ASSIGNABLE_STAFF_ROLE_CODES, required=False)
    employee_id = serializers.CharField(required=False, allow_blank=True, max_length=50)
    # STUDENT requests only -- attach the student to an existing partner
    # institution instead of creating one from the typed college name.
    institution = serializers.PrimaryKeyRelatedField(
        queryset=Institution.objects.all(), required=False, allow_null=True
    )


class SignupRejectionSerializer(serializers.Serializer):
    review_notes = serializers.CharField(required=False, allow_blank=True)
