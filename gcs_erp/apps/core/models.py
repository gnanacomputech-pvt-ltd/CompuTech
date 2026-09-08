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
    email = models.EmailField(unique=True, db_index=True)
    full_name = models.CharField(max_length=255)
    phone = models.CharField(max_length=20, blank=True, null=True)
    is_active = models.BooleanField(default=True, db_index=True)
    is_staff = models.BooleanField(default=False)
    is_verified = models.BooleanField(default=False)
    avatar = models.ImageField(upload_to='avatars/', blank=True, null=True)

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
        return RolePermission.objects.filter(
            role__user_roles__user=self,
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
    degree = models.CharField(max_length=100, blank=True) # BCA, MCA, BE etc.
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
