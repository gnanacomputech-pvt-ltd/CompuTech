"""
Soft-deleted rows still occupy their unique ids.

These models soft-delete (apps/common/models.py SoftDeleteManager), so the
default manager hides deleted rows while the database's unique constraints
still cover them. Generating an id from what the default manager can see
therefore hands out an id that is already taken, and the insert fails with
an IntegrityError -- a 500 to the user.

This was found by approving a student signup that named a college which had
been deleted earlier: "UNIQUE constraint failed: core_institutions.code".
"""
import pytest
from django.utils import timezone
from rest_framework.test import APIClient

from apps.core.models import (
    User, Role, UserRole, Institution, Student, Batch, Program, Enrollment, SignupRequest,
)


@pytest.fixture
def admin_client(db):
    user = User.objects.create_user(
        email='collision-admin@example.com', password='AdminPass123!',
        full_name='Collision Admin', is_staff=True, is_active=True,
    )
    role, _ = Role.objects.get_or_create(code='ADMIN', defaults={'name': 'Admin'})
    UserRole.objects.get_or_create(user=user, role=role)
    client = APIClient()
    client.force_authenticate(user=user)
    return client


@pytest.mark.django_db
def test_approving_a_student_whose_college_was_soft_deleted(admin_client):
    """The reported 500: the college's code was still taken by a hidden row."""
    doomed = Institution.objects.create(code='PROBE_COLLEGE', name='Probe College')
    # A queryset delete on a soft-deletable model is a soft delete.
    Institution.objects.filter(pk=doomed.pk).delete()
    assert not Institution.objects.filter(name='Probe College').exists()
    assert Institution.all_objects.filter(code='PROBE_COLLEGE').exists()

    res = APIClient().post('/api/v1/auth/register/', {
        'email': 'collision-student@example.com',
        'full_name': 'Collision Student',
        'password': 'StudentPass123!',
        'confirm_password': 'StudentPass123!',
        'college_name': 'Probe College',
    }, format='json')
    assert res.status_code == 201, res.data

    request_id = SignupRequest.objects.get(user__email='collision-student@example.com').id
    res = admin_client.post(f'/api/v1/signup-requests/{request_id}/approve/', {}, format='json')
    assert res.status_code == 200, res.data

    student = Student.objects.get(user__email='collision-student@example.com')
    # A fresh institution was created with a non-colliding code.
    assert student.institution.code != 'PROBE_COLLEGE'
    assert student.institution.name == 'Probe College'


@pytest.mark.django_db
def test_student_business_id_survives_a_soft_deleted_student():
    institution = Institution.objects.create(code='BIZ_ID_COLLEGE', name='Biz Id College')

    def make_student(email):
        user = User.objects.create_user(email=email, password='x', full_name=email)
        return Student.objects.create(user=user, institution=institution)

    first = make_student('biz-one@example.com')
    second = make_student('biz-two@example.com')
    assert first.business_id != second.business_id

    # Soft-delete the newest: the visible count drops, but its id is taken.
    Student.objects.filter(pk=second.pk).delete()

    third = make_student('biz-three@example.com')
    assert third.business_id not in {first.business_id, second.business_id}


@pytest.mark.django_db
def test_batch_and_enrollment_ids_survive_soft_deletes():
    institution = Institution.objects.create(code='BATCH_COLLEGE', name='Batch College')
    program = Program.objects.create(code='PRG-COLLIDE', title='Collide', program_type='COURSE')

    def make_batch(name):
        return Batch.objects.create(
            name=name, program=program, institution=institution,
            start_date=timezone.now().date(), status='ACTIVE',
        )

    batch_one = make_batch('B1')
    batch_two = make_batch('B2')
    Batch.objects.filter(pk=batch_two.pk).delete()
    batch_three = make_batch('B3')
    assert batch_three.business_id not in {batch_one.business_id, batch_two.business_id}

    def make_enrollment(email, batch):
        user = User.objects.create_user(email=email, password='x', full_name=email)
        student = Student.objects.create(user=user, institution=institution)
        return Enrollment.objects.create(
            student=student, program=program, batch=batch, institution=institution,
        )

    enr_one = make_enrollment('enr-one@example.com', batch_one)
    enr_two = make_enrollment('enr-two@example.com', batch_three)
    Enrollment.objects.filter(pk=enr_two.pk).delete()
    enr_three = make_enrollment('enr-three@example.com', make_batch('B4'))
    assert enr_three.business_id not in {enr_one.business_id, enr_two.business_id}


@pytest.mark.django_db
def test_staff_approval_employee_id_survives_a_soft_deleted_employee(admin_client):
    from apps.core.models import Employee

    # EMP-0001 specifically: with the soft-deleted row hidden, the generator
    # starts from scratch and produces exactly this id again.
    user = User.objects.create_user(email='emp-one@example.com', password='x', full_name='Emp One')
    existing = Employee.objects.create(user=user, employee_id='EMP-0001', designation='Trainer')
    Employee.objects.filter(pk=existing.pk).delete()

    res = APIClient().post('/api/v1/auth/register-staff/', {
        'email': 'emp-two@example.com', 'full_name': 'Emp Two',
        'password': 'StaffPass123!', 'confirm_password': 'StaffPass123!',
        'designation': 'Trainer',
    }, format='json')
    assert res.status_code == 201, res.data

    request_id = SignupRequest.objects.get(user__email='emp-two@example.com').id
    res = admin_client.post(f'/api/v1/signup-requests/{request_id}/approve/', {}, format='json')
    assert res.status_code == 200, res.data

    created = Employee.objects.get(user__email='emp-two@example.com')
    assert created.employee_id != 'EMP-0001'
