import uuid
from django.db import models
from django.contrib.auth.models import AbstractBaseUser, PermissionsMixin, BaseUserManager
from django.utils import timezone
from apps.common.models import TimeStampedModel, SoftDeletableModel, AuditModel, generate_business_id


class UserManager(BaseUserManager):
    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError('The Email field must be set')
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        if password:
            user.set_password(password)
        else:
            user.set_unusable_password()
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('is_active', True)

        if extra_fields.get('is_staff') is not True:
            raise ValueError('Superuser must have is_staff=True.')
        if extra_fields.get('is_superuser') is not True:
            raise ValueError('Superuser must have is_superuser=True.')

        user = self.create_user(email, password, **extra_fields)

        # Assign SUPER_ADMIN role if exists
        try:
            role, _ = Role.objects.get_or_create(
                code='SUPER_ADMIN',
                defaults={'name': 'Super Administrator', 'description': 'Full system control'}
            )
            UserRole.objects.get_or_create(user=user, role=role)
        except Exception:
            pass

        return user


class User(AbstractBaseUser, PermissionsMixin, TimeStampedModel):
    """
    Core User model using UUID primary key and email as login identifier.
    """
    APPROVAL_STATUS = (
        ('PENDING', 'Awaiting Staff Approval'),
        ('APPROVED', 'Approved'),
        ('REJECTED', 'Rejected'),
    )

    email = models.EmailField(unique=True, db_index=True)
    full_name = models.CharField(max_length=255)
    phone = models.CharField(max_length=20, blank=True, null=True)
    is_active = models.BooleanField(default=True, db_index=True)
    is_staff = models.BooleanField(default=False)
    is_verified = models.BooleanField(default=False)
    avatar = models.ImageField(upload_to='avatars/', blank=True, null=True)
    # Self-registered accounts (student / staff / institution signup pages)
    # start PENDING with is_active=False and cannot log in until an admin or
    # staff member approves them -- see SignupRequest and
    # CustomTokenObtainPairSerializer.validate. Accounts created *by* staff
    # (createsuperuser, EmployeeViewSet.create_with_user, a signup approval)
    # are approved by definition, which is why APPROVED is the default.
    approval_status = models.CharField(
        max_length=20, choices=APPROVAL_STATUS, default='APPROVED', db_index=True
    )

    objects = UserManager()

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['full_name']

    class Meta:
        db_table = 'core_users'
        verbose_name = 'User'
        verbose_name_plural = 'Users'

    def __str__(self):
        return f"{self.full_name} ({self.email})"

    def get_role_codes(self):
        return list(self.user_roles.values_list('role__code', flat=True))

    def has_perm_code(self, perm_code):
        if self.is_superuser:
            return True
        role_ids = self.user_roles.values_list('role_id', flat=True)
        return RolePermission.objects.filter(
            role_id__in=role_ids,
            permission__code=perm_code
        ).exists()


class Role(TimeStampedModel):
    """
    Initial roles from section 6:
    SUPER_ADMIN, ADMIN, HR, ACCOUNTS, ACADEMIC_COORDINATOR, INTERNSHIP_COORDINATOR,
    PROJECT_COORDINATOR, TRAINER, MENTOR, INSTITUTION_COORDINATOR, STUDENT,
    PLACEMENT_OFFICER, CONTENT_MANAGER
    """
    code = models.CharField(max_length=50, unique=True, db_index=True)
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True)

    class Meta:
        db_table = 'core_roles'
        ordering = ['name']

    def __str__(self):
        return self.name


class Permission(TimeStampedModel):
    code = models.CharField(max_length=100, unique=True, db_index=True)
    name = models.CharField(max_length=150)
    module = models.CharField(max_length=50, db_index=True)

    class Meta:
        db_table = 'core_permissions'
        ordering = ['module', 'code']

    def __str__(self):
        return f"{self.module}:{self.code}"


class UserRole(TimeStampedModel):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='user_roles')
    role = models.ForeignKey(Role, on_delete=models.CASCADE, related_name='role_users')

    class Meta:
        db_table = 'core_user_roles'
        unique_together = ('user', 'role')

    def __str__(self):
        return f"{self.user.email} -> {self.role.code}"


class RolePermission(TimeStampedModel):
    role = models.ForeignKey(Role, on_delete=models.CASCADE, related_name='role_permissions')
    permission = models.ForeignKey(Permission, on_delete=models.CASCADE, related_name='perm_roles')

    class Meta:
        db_table = 'core_role_permissions'
        unique_together = ('role', 'permission')

    def __str__(self):
        return f"{self.role.code} -> {self.permission.code}"


class Institution(AuditModel):
    """
    Partner colleges, universities, and institutions.
    """
    code = models.CharField(max_length=50, unique=True, db_index=True)
    name = models.CharField(max_length=255)
    address = models.TextField(blank=True)
    city = models.CharField(max_length=100, blank=True)
    state = models.CharField(max_length=100, default='Karnataka')
    contact_email = models.EmailField(blank=True)
    contact_phone = models.CharField(max_length=20, blank=True)
    coordinator = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='coordinated_institutions'
    )

    class Meta:
        db_table = 'core_institutions'
        ordering = ['name']

    def __str__(self):
        return f"{self.name} ({self.code})"


class Department(AuditModel):
    code = models.CharField(max_length=50, unique=True)
    name = models.CharField(max_length=150)
    institution = models.ForeignKey(
        Institution,
        on_delete=models.CASCADE,
        related_name='departments',
        null=True,
        blank=True
    )

    class Meta:
        db_table = 'core_departments'
        ordering = ['name']

    def __str__(self):
        return f"{self.name} ({self.code})"


class Program(AuditModel):
    PROGRAM_TYPES = (
        ('INTERNSHIP', 'Software Internship'),
        ('ACADEMIC_PROJECT', 'Academic Project (BCA/MCA/BE)'),
        ('COURSE', 'Professional Training Course'),
        ('WORKSHOP', 'Technical Workshop / Seminar'),
    )

    code = models.CharField(max_length=50, unique=True, db_index=True)
    title = models.CharField(max_length=255)
    program_type = models.CharField(max_length=30, choices=PROGRAM_TYPES, db_index=True)
    description = models.TextField(blank=True)
    duration_weeks = models.PositiveIntegerField(default=4)
    base_fee = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    is_published = models.BooleanField(
        default=True, db_index=True,
        help_text="Shown on the public Courses/Internships pages when true."
    )
    # Free-form marketing fields the public site needs but that don't apply
    # to every program_type (topics/highlights for a COURSE, skills/
    # learnings/eligibility/stipend for an INTERNSHIP) — one JSON bucket
    # instead of a pile of mostly-null columns. Same pattern as
    # apps/website/models.py SiteContent.extra.
    extra = models.JSONField(default=dict, blank=True)

    class Meta:
        db_table = 'core_programs'
        ordering = ['title']

    def __str__(self):
        return f"{self.title} ({self.code})"


class Batch(AuditModel):
    BATCH_STATUS = (
        ('UPCOMING', 'Upcoming'),
        ('ACTIVE', 'Active'),
        ('COMPLETED', 'Completed'),
        ('ARCHIVED', 'Archived'),
    )

    business_id = models.CharField(max_length=50, unique=True, db_index=True)
    name = models.CharField(max_length=150)
    program = models.ForeignKey(Program, on_delete=models.CASCADE, related_name='batches')
    institution = models.ForeignKey(Institution, on_delete=models.CASCADE, null=True, blank=True, related_name='batches')
    start_date = models.DateField()
    end_date = models.DateField(null=True, blank=True)
    status = models.CharField(max_length=20, choices=BATCH_STATUS, default='UPCOMING', db_index=True)

    class Meta:
        db_table = 'core_batches'
        ordering = ['-start_date']

    def __str__(self):
        return f"{self.name} [{self.business_id}]"

    def save(self, *args, **kwargs):
        if not self.business_id:
            count = Batch.objects.count() + 1
            self.business_id = generate_business_id('BAT', count)
        super().save(*args, **kwargs)


class Student(AuditModel):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='student_profile')
    business_id = models.CharField(max_length=50, unique=True, db_index=True)
    institution = models.ForeignKey(Institution, on_delete=models.PROTECT, related_name='students')
    usn = models.CharField(max_length=50, blank=True, null=True, db_index=True)
    degree = models.CharField(max_length=100, blank=True)  # BCA, MCA, BE etc.
    semester = models.IntegerField(default=1)
    branch = models.CharField(max_length=100, blank=True)

    class Meta:
        db_table = 'core_students'
        ordering = ['user__full_name']

    def __str__(self):
        return f"{self.user.full_name} ({self.business_id})"

    def save(self, *args, **kwargs):
        if not self.business_id:
            count = Student.objects.count() + 1
            self.business_id = generate_business_id('STU', count)
        super().save(*args, **kwargs)


class Employee(AuditModel):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='employee_profile')
    employee_id = models.CharField(max_length=50, unique=True, db_index=True)
    designation = models.CharField(max_length=100)
    department = models.ForeignKey(Department, null=True, blank=True, on_delete=models.SET_NULL)
    joining_date = models.DateField(null=True, blank=True)

    class Meta:
        db_table = 'core_employees'
        ordering = ['user__full_name']

    def __str__(self):
        return f"{self.user.full_name} [{self.employee_id}]"


class Enrollment(AuditModel):
    """
    Section 4.1 Core Integration Entity:
    ENROLLMENT is the single transaction record connecting the entire ERP.
    It links Student, Program, Batch, and Institution, and every downstream
    record — attendance, assessment, project, payment, certificate — traces back to it.
    This is the one table every module reads but only core writes to.
    """
    ENROLLMENT_STATUS = (
        ('APPLIED', 'Applied'),
        ('ACTIVE', 'Active'),
        ('COMPLETED', 'Completed'),
        ('DROPPED', 'Dropped'),
        ('SUSPENDED', 'Suspended'),
    )

    business_id = models.CharField(max_length=50, unique=True, db_index=True)
    student = models.ForeignKey(Student, on_delete=models.PROTECT, related_name='enrollments')
    program = models.ForeignKey(Program, on_delete=models.PROTECT, related_name='enrollments')
    batch = models.ForeignKey(Batch, on_delete=models.PROTECT, related_name='enrollments')
    institution = models.ForeignKey(Institution, on_delete=models.PROTECT, related_name='enrollments')
    status = models.CharField(max_length=20, choices=ENROLLMENT_STATUS, default='APPLIED', db_index=True)
    enrolled_at = models.DateTimeField(default=timezone.now)
    completed_at = models.DateTimeField(null=True, blank=True)
    coordinator_approval = models.BooleanField(default=False)
    approved_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='approved_enrollments'
    )

    class Meta:
        db_table = 'core_enrollments'
        unique_together = ('student', 'batch')
        ordering = ['-enrolled_at']

    def __str__(self):
        return f"{self.business_id}: {self.student.user.full_name} -> {self.batch.name}"

    def save(self, *args, **kwargs):
        if not self.business_id:
            count = Enrollment.objects.count() + 1
            self.business_id = generate_business_id('ENR', count)
        super().save(*args, **kwargs)


class SignupRequest(TimeStampedModel):
    """
    One pending self-registration awaiting staff approval.

    The User row is created up front (so password hashing, email uniqueness
    and validation all work exactly as they do for any other account) but
    with is_active=False and approval_status='PENDING'. This model carries
    the extra, kind-specific details the signup form collected that have
    nowhere to live until the request is approved and the real profile
    (Student / Employee / Institution) is created from them.

    Which fields apply depends on `kind`; the rest stay blank. One table
    instead of three near-identical ones, since the review workflow
    (list pending -> approve/reject) is identical for all three.
    """
    KIND_CHOICES = (
        ('STUDENT', 'Student Account'),
        ('STAFF', 'Staff / Employee Account'),
        ('INSTITUTION', 'Institution Partner Account'),
    )

    STATUS_CHOICES = (
        ('PENDING', 'Pending Review'),
        ('APPROVED', 'Approved'),
        ('REJECTED', 'Rejected'),
    )

    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='signup_request')
    kind = models.CharField(max_length=20, choices=KIND_CHOICES, db_index=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PENDING', db_index=True)

    # --- kind='STUDENT' ---
    institution = models.ForeignKey(
        Institution, on_delete=models.SET_NULL, null=True, blank=True,
        related_name='signup_requests',
        help_text="Set when the applicant picked an existing partner college.",
    )
    college_name = models.CharField(
        max_length=255, blank=True,
        help_text="Free-text college name when it is not an existing partner institution.",
    )
    degree = models.CharField(max_length=100, blank=True)
    semester = models.PositiveIntegerField(null=True, blank=True)
    branch = models.CharField(max_length=100, blank=True)
    usn = models.CharField(max_length=50, blank=True)

    # --- kind='STAFF' ---
    requested_role = models.CharField(
        max_length=50, blank=True,
        help_text="Role code the applicant asked for; the approver can override it.",
    )
    designation = models.CharField(max_length=100, blank=True)
    department = models.ForeignKey(
        Department, on_delete=models.SET_NULL, null=True, blank=True, related_name='signup_requests'
    )

    # --- kind='INSTITUTION' ---
    organization_name = models.CharField(max_length=255, blank=True)
    address = models.TextField(blank=True)
    city = models.CharField(max_length=100, blank=True)
    state = models.CharField(max_length=100, blank=True)
    contact_phone = models.CharField(max_length=20, blank=True)

    message = models.TextField(blank=True, help_text="Anything the applicant wanted the reviewer to know.")

    reviewed_by = models.ForeignKey(
        User, on_delete=models.SET_NULL, null=True, blank=True, related_name='reviewed_signup_requests'
    )
    reviewed_at = models.DateTimeField(null=True, blank=True)
    review_notes = models.TextField(blank=True, help_text="Internal note / reason, shown only to staff.")

    class Meta:
        db_table = 'core_signup_requests'
        ordering = ['-created_at']
        verbose_name = 'Signup Request'
        verbose_name_plural = 'Signup Requests'

    def __str__(self):
        return f"[{self.status}] {self.kind}: {self.user.full_name} ({self.user.email})"
