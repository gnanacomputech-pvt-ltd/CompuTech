"""
Self-registration and approval workflow.

Every public signup form (student, staff, institution) lands here. The User
row is created immediately -- with ``is_active=False`` and
``approval_status='PENDING'`` -- so password hashing, email uniqueness and
validation behave exactly as they do for a staff-created account, and so the
applicant has one identity from the moment they apply. Everything the form
collected that has nowhere to live yet is parked on the SignupRequest row
until a reviewer approves it, which is the point at which the real profile
(Student / Employee / Institution) gets created.

Keeping the provisioning here rather than in the viewset means the three
kinds' rules sit side by side and the viewset stays a thin permission +
serialization layer.
"""
import re

from django.db import transaction
from django.utils import timezone
from django.utils.text import slugify

from apps.core.models import (
    User, Role, UserRole, Institution, Student, Employee, SignupRequest,
)

# Which role each approved signup kind is granted. STAFF is the exception:
# the applicant requests a role and the approver can override it, so it is
# resolved per-request rather than fixed here.
ROLE_BY_KIND = {
    'STUDENT': ('STUDENT', 'Enrolled Learner', 'Student self-service portal'),
    'INSTITUTION': (
        'INSTITUTION_COORDINATOR', 'Institution Coordinator',
        'Partner college coordinator portal',
    ),
}


def _assign_role(user, code, name='', description=''):
    role, _ = Role.objects.get_or_create(
        code=code,
        defaults={'name': name or code.replace('_', ' ').title(), 'description': description},
    )
    UserRole.objects.get_or_create(user=user, role=role)
    return role


def _unique_code(model, field, base, fallback_prefix):
    """
    Build a unique slug-ish code for a model with a unique code column.

    Institutions and departments are created from a free-text name typed by
    an applicant, so the obvious code ("ACHARYA") can easily already exist;
    suffix until it does not.
    """
    base = (slugify(base) or fallback_prefix.lower()).upper().replace('-', '_')[:40]
    candidate = base
    suffix = 2
    while model.objects.filter(**{field: candidate}).exists():
        candidate = f"{base}_{suffix}"[:50]
        suffix += 1
    return candidate


def _next_employee_id():
    """
    Next sequential EMP-#### id.

    Derived from the highest existing numeric suffix rather than a row count,
    so deleting an employee can never hand out an id that is already taken.
    """
    highest = 0
    for existing in Employee.objects.values_list('employee_id', flat=True):
        match = re.search(r'(\d+)$', existing or '')
        if match:
            highest = max(highest, int(match.group(1)))
    return f"EMP-{highest + 1:04d}"


@transaction.atomic
def create_signup_request(kind, data):
    """
    Create the pending account and its SignupRequest from a validated
    signup serializer's data. Returns the SignupRequest.
    """
    user = User.objects.create_user(
        email=data['email'],
        password=data['password'],
        full_name=data['full_name'],
        phone=data.get('phone', ''),
        # The whole point of the approval queue: no sign-in until reviewed.
        is_active=False,
        is_verified=False,
        approval_status='PENDING',
    )

    request_fields = {
        'STUDENT': ('institution', 'college_name', 'degree', 'semester', 'branch', 'usn'),
        'STAFF': ('requested_role', 'designation', 'department'),
        'INSTITUTION': ('organization_name', 'address', 'city', 'state', 'contact_phone'),
    }[kind]

    kwargs = {}
    for field in request_fields:
        if field in data and data[field] not in (None, ''):
            kwargs[field] = data[field]

    return SignupRequest.objects.create(
        user=user,
        kind=kind,
        status='PENDING',
        message=data.get('message', ''),
        **kwargs,
    )


def _provision_student(signup_request, overrides):
    """Create the Student profile an approved student account needs."""
    institution = (
        overrides.get('institution')
        or signup_request.institution
        or _institution_from_name(signup_request.college_name, signup_request)
    )

    student, _ = Student.objects.get_or_create(
        user=signup_request.user,
        defaults={
            'institution': institution,
            'usn': signup_request.usn or None,
            'degree': signup_request.degree or '',
            'semester': signup_request.semester or 1,
            'branch': signup_request.branch or '',
            'created_by': signup_request.reviewed_by,
        },
    )
    # Remember which institution the student ended up attached to, so the
    # reviewed request reads back the way it was actually approved.
    if signup_request.institution_id != institution.id:
        signup_request.institution = institution
    return student


def _institution_from_name(name, signup_request):
    """
    Match the typed college name to an existing institution, or create a
    minimal record for it.

    A student signing up names their college free-text; approving them has to
    attach them to *some* Institution because Student.institution is
    required. Reusing a case-insensitive name match keeps a college from
    being duplicated every time one of its students is approved.
    """
    name = (name or '').strip() or 'Unaffiliated'
    existing = Institution.objects.filter(name__iexact=name).first()
    if existing:
        return existing
    return Institution.objects.create(
        code=_unique_code(Institution, 'code', name, 'INST'),
        name=name,
        created_by=signup_request.reviewed_by,
    )


def _provision_staff(signup_request, overrides):
    """Create the Employee profile and grant the ERP role."""
    user = signup_request.user
    role_code = overrides.get('role') or signup_request.requested_role or 'CONTENT_MANAGER'
    employee_id = (overrides.get('employee_id') or '').strip() or _next_employee_id()

    employee, _ = Employee.objects.get_or_create(
        user=user,
        defaults={
            'employee_id': employee_id,
            'designation': signup_request.designation or role_code.replace('_', ' ').title(),
            'department': signup_request.department,
            'joining_date': timezone.now().date(),
            'created_by': signup_request.reviewed_by,
        },
    )
    # is_staff is what routes them to the staff dashboard and what
    # DashboardStatsView reads; the role grants the actual permissions.
    user.is_staff = True
    _assign_role(user, role_code)
    if role_code != signup_request.requested_role:
        signup_request.requested_role = role_code
    return employee


def _provision_institution(signup_request, overrides):
    """Create the partner Institution with this user as its coordinator."""
    user = signup_request.user
    name = (signup_request.organization_name or user.full_name).strip()

    institution = Institution.objects.filter(name__iexact=name).first()
    if institution is None:
        institution = Institution.objects.create(
            code=_unique_code(Institution, 'code', name, 'INST'),
            name=name,
            address=signup_request.address or '',
            city=signup_request.city or '',
            state=signup_request.state or 'Karnataka',
            contact_email=user.email,
            contact_phone=signup_request.contact_phone or user.phone or '',
            coordinator=user,
            created_by=signup_request.reviewed_by,
        )
    elif institution.coordinator_id is None:
        # The college already exists in the ERP (a student named it, or staff
        # added it) -- adopt it rather than creating a duplicate.
        institution.coordinator = user
        institution.save(update_fields=['coordinator', 'updated_at'])

    signup_request.institution = institution
    return institution


PROVISIONERS = {
    'STUDENT': _provision_student,
    'STAFF': _provision_staff,
    'INSTITUTION': _provision_institution,
}


@transaction.atomic
def approve_signup_request(signup_request, reviewer, overrides=None):
    """
    Approve a pending request: build the profile its kind needs, grant the
    role, and activate the login. Idempotent -- re-approving an already
    approved request is a no-op rather than a second profile.
    """
    overrides = overrides or {}
    if signup_request.status == 'APPROVED':
        return signup_request

    signup_request.reviewed_by = reviewer
    signup_request.reviewed_at = timezone.now()
    signup_request.status = 'APPROVED'
    if overrides.get('review_notes'):
        signup_request.review_notes = overrides['review_notes']

    PROVISIONERS[signup_request.kind](signup_request, overrides)

    if signup_request.kind in ROLE_BY_KIND:
        _assign_role(signup_request.user, *ROLE_BY_KIND[signup_request.kind])

    user = signup_request.user
    user.is_active = True
    user.is_verified = True
    user.approval_status = 'APPROVED'
    user.save()

    signup_request.save()
    return signup_request


@transaction.atomic
def reject_signup_request(signup_request, reviewer, review_notes=''):
    """
    Reject a request. The User row is kept (inactive, REJECTED) rather than
    deleted: it is the audit trail of who applied, and it stops the same
    address silently re-applying into a second pending row.
    """
    signup_request.status = 'REJECTED'
    signup_request.reviewed_by = reviewer
    signup_request.reviewed_at = timezone.now()
    if review_notes:
        signup_request.review_notes = review_notes
    signup_request.save()

    user = signup_request.user
    user.is_active = False
    user.approval_status = 'REJECTED'
    user.save(update_fields=['is_active', 'approval_status', 'updated_at'])
    return signup_request
