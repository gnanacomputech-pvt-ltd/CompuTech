"""Smoke test: student/staff/institution signup -> blocked login -> approve -> login."""
import pytest
from rest_framework.test import APIClient

from apps.core.models import User, Role, UserRole, Student, Employee, Institution, SignupRequest


def _admin():
    user = User.objects.create_user(
        email='flow-admin@example.com', password='AdminPass123!', full_name='Flow Admin',
        is_staff=True, is_active=True,
    )
    role, _ = Role.objects.get_or_create(code='ADMIN', defaults={'name': 'Admin'})
    UserRole.objects.get_or_create(user=user, role=role)
    return user


def _auth(user):
    client = APIClient()
    client.force_authenticate(user=user)
    return client


@pytest.mark.django_db
def test_student_signup_blocked_then_approved():
    anon = APIClient()
    res = anon.post('/api/v1/auth/register/', {
        'email': 'flow-student@example.com', 'full_name': 'Flow Student',
        'phone': '9845012345', 'password': 'StudentPass123!',
        'confirm_password': 'StudentPass123!', 'college_name': 'Soundarya Institute',
        'degree': 'BCA', 'semester': 5, 'usn': 'SI21BCA001',
    }, format='json')
    assert res.status_code == 201, res.data
    body = res.data.get('data', res.data)
    assert 'access' not in body, 'a pending account must not be handed a token'
    assert body['approval_status'] == 'PENDING'

    user = User.objects.get(email='flow-student@example.com')
    assert user.is_active is False
    assert not Student.objects.filter(user=user).exists()

    # Login is refused, with a reason rather than "wrong credentials".
    login = anon.post('/api/v1/auth/login/', {
        'email': 'flow-student@example.com', 'password': 'StudentPass123!',
    }, format='json')
    assert login.status_code == 403, login.data
    assert 'awaiting approval' in str(login.data).lower(), login.data

    # Any staff member may approve a STUDENT request.
    staff = User.objects.create_user(
        email='flow-trainer@example.com', password='x', full_name='Flow Trainer', is_active=True)
    trainer_role, _ = Role.objects.get_or_create(code='TRAINER', defaults={'name': 'Trainer'})
    UserRole.objects.get_or_create(user=staff, role=trainer_role)

    req = SignupRequest.objects.get(user=user)
    res = _auth(staff).post(f'/api/v1/signup-requests/{req.id}/approve/', {}, format='json')
    assert res.status_code == 200, res.data

    user.refresh_from_db()
    assert user.is_active is True
    assert user.approval_status == 'APPROVED'
    assert 'STUDENT' in user.get_role_codes()
    student = Student.objects.get(user=user)
    assert student.institution.name == 'Soundarya Institute'
    assert student.degree == 'BCA' and student.semester == 5

    login = anon.post('/api/v1/auth/login/', {
        'email': 'flow-student@example.com', 'password': 'StudentPass123!',
    }, format='json')
    assert login.status_code == 200, login.data


@pytest.mark.django_db
def test_staff_signup_requires_admin_and_creates_employee():
    anon = APIClient()
    res = anon.post('/api/v1/auth/register-staff/', {
        'email': 'flow-staff@example.com', 'full_name': 'Flow Staff',
        'phone': '9845099999', 'password': 'StaffPass123!',
        'confirm_password': 'StaffPass123!', 'designation': 'Content Executive',
        'requested_role': 'CONTENT_MANAGER',
    }, format='json')
    assert res.status_code == 201, res.data

    user = User.objects.get(email='flow-staff@example.com')
    req = SignupRequest.objects.get(user=user)
    assert req.kind == 'STAFF'

    # A Medium-access staff member must not be able to grant ERP access.
    trainer = User.objects.create_user(
        email='flow-trainer2@example.com', password='x', full_name='T2', is_active=True)
    role, _ = Role.objects.get_or_create(code='TRAINER', defaults={'name': 'Trainer'})
    UserRole.objects.get_or_create(user=trainer, role=role)
    denied = _auth(trainer).post(f'/api/v1/signup-requests/{req.id}/approve/', {}, format='json')
    assert denied.status_code in (403, 404), denied.data
    # ...and must not even see it in the queue.
    listed = _auth(trainer).get('/api/v1/signup-requests/?kind=STAFF')
    rows = listed.data.get('data', listed.data)
    assert (rows.get('results') if isinstance(rows, dict) else rows) == []

    approved = _auth(_admin()).post(f'/api/v1/signup-requests/{req.id}/approve/', {}, format='json')
    assert approved.status_code == 200, approved.data

    user.refresh_from_db()
    assert user.is_staff is True
    assert 'CONTENT_MANAGER' in user.get_role_codes()
    assert Employee.objects.filter(user=user).exists()


@pytest.mark.django_db
def test_institution_signup_creates_institution_with_coordinator():
    anon = APIClient()
    res = anon.post('/api/v1/auth/register-institution/', {
        'email': 'flow-college@example.com', 'full_name': 'Dr Principal',
        'phone': '9845011111', 'password': 'CollegePass123!',
        'confirm_password': 'CollegePass123!',
        'organization_name': 'Acharya Group of Institutions',
        'city': 'Bangalore', 'contact_phone': '9845022222',
    }, format='json')
    assert res.status_code == 201, res.data

    user = User.objects.get(email='flow-college@example.com')
    req = SignupRequest.objects.get(user=user)
    out = _auth(_admin()).post(f'/api/v1/signup-requests/{req.id}/approve/', {}, format='json')
    assert out.status_code == 200, out.data

    user.refresh_from_db()
    assert 'INSTITUTION_COORDINATOR' in user.get_role_codes()
    inst = Institution.objects.get(name='Acharya Group of Institutions')
    assert inst.coordinator_id == user.id


@pytest.mark.django_db
def test_rejected_account_cannot_log_in():
    anon = APIClient()
    anon.post('/api/v1/auth/register/', {
        'email': 'flow-reject@example.com', 'full_name': 'Rejected One',
        'password': 'RejectPass123!', 'confirm_password': 'RejectPass123!',
        'college_name': 'Some College',
    }, format='json')
    user = User.objects.get(email='flow-reject@example.com')
    req = SignupRequest.objects.get(user=user)

    admin = _auth(_admin())
    res = admin.post(
        f'/api/v1/signup-requests/{req.id}/reject/',
        {'review_notes': 'Not an enrolled student.'}, format='json')
    assert res.status_code == 200, res.data

    login = anon.post('/api/v1/auth/login/', {
        'email': 'flow-reject@example.com', 'password': 'RejectPass123!',
    }, format='json')
    assert login.status_code == 403
    assert 'not approved' in str(login.data).lower(), login.data

    # Re-deciding a reviewed request is refused rather than silently redone.
    again = admin.post(f'/api/v1/signup-requests/{req.id}/approve/', {}, format='json')
    assert again.status_code == 400, again.data


@pytest.mark.django_db
def test_pending_counts_endpoint():
    anon = APIClient()
    anon.post('/api/v1/auth/register/', {
        'email': 'c1@example.com', 'full_name': 'C One', 'password': 'CountPass123!',
        'confirm_password': 'CountPass123!', 'college_name': 'X College',
    }, format='json')
    anon.post('/api/v1/auth/register-staff/', {
        'email': 'c2@example.com', 'full_name': 'C Two', 'password': 'CountPass123!',
        'confirm_password': 'CountPass123!', 'designation': 'Trainer',
    }, format='json')

    res = _auth(_admin()).get('/api/v1/signup-requests/pending-counts/')
    data = res.data.get('data', res.data)
    assert data['student'] == 1 and data['staff'] == 1 and data['total'] == 2
