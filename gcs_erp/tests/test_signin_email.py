"""Tests for sign-in email notifications and email validation on login."""
import pytest
from unittest import mock
from django.core import mail
from rest_framework import status
from rest_framework.test import APIClient

from apps.core.models import User, Role, UserRole


@pytest.fixture
def test_user(db):
    user = User.objects.create_user(
        email='validuser@example.com',
        password='TestPassword123!',
        full_name='Test User',
        phone='9876543210',
        approval_status='APPROVED',
    )
    role, _ = Role.objects.get_or_create(code='STUDENT', defaults={'name': 'Student'})
    UserRole.objects.create(user=user, role=role)
    return user


@pytest.fixture(autouse=True)
def setup_mail(settings):
    settings.CELERY_TASK_ALWAYS_EAGER = True
    settings.CELERY_TASK_EAGER_PROPAGATES = False
    settings.FRONTEND_URL = 'http://13.232.187.23'
    mail.outbox = []


@pytest.mark.django_db
def test_successful_login_sends_signin_notification_email(test_user):
    client = APIClient()
    response = client.post('/api/v1/auth/login/', {
        'email': 'validuser@example.com',
        'password': 'TestPassword123!'
    }, format='json', HTTP_USER_AGENT='Mozilla/5.0 (Windows NT 10.0; Win64; x64)', REMOTE_ADDR='192.168.1.100')

    assert response.status_code == status.HTTP_200_OK
    assert 'access' in response.data

    # Email notification check
    assert len(mail.outbox) == 1
    sent_mail = mail.outbox[0]
    assert sent_mail.to == ['validuser@example.com']
    assert 'Security Alert: New Sign-in' in sent_mail.subject
    assert 'Test User' in sent_mail.body
    assert '192.168.1.100' in sent_mail.body
    assert 'Mozilla/5.0' in sent_mail.body

    # Check HTML email version
    assert len(sent_mail.alternatives) == 1
    html_content, content_type = sent_mail.alternatives[0]
    assert content_type == 'text/html'
    assert 'Sign-In Notification' in html_content
    assert 'validuser@example.com' in html_content


@pytest.mark.django_db
def test_login_with_invalid_email_format_fails(test_user):
    client = APIClient()

    invalid_emails = [
        'invalid-email',
        'missing-domain@',
        '@nodomain.com',
        'user@domain',
        'user@.com',
        'spaces in@email.com'
    ]

    for bad_email in invalid_emails:
        response = client.post('/api/v1/auth/login/', {
            'email': bad_email,
            'password': 'TestPassword123!'
        }, format='json')

        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert response.data['success'] is False
        assert len(mail.outbox) == 0


@pytest.mark.django_db
def test_login_with_wrong_password_does_not_send_email(test_user):
    client = APIClient()
    response = client.post('/api/v1/auth/login/', {
        'email': 'validuser@example.com',
        'password': 'WrongPassword123!'
    }, format='json')

    assert response.status_code == status.HTTP_401_UNAUTHORIZED
    assert len(mail.outbox) == 0


@pytest.mark.django_db
def test_login_with_unapproved_account_does_not_send_email():
    User.objects.create_user(
        email='pendinguser@example.com',
        password='TestPassword123!',
        full_name='Pending User',
        approval_status='PENDING',
    )

    client = APIClient()
    response = client.post('/api/v1/auth/login/', {
        'email': 'pendinguser@example.com',
        'password': 'TestPassword123!'
    }, format='json')

    assert response.status_code == status.HTTP_403_FORBIDDEN
    assert len(mail.outbox) == 0


@pytest.mark.django_db
def test_login_succeeds_even_if_email_fails(test_user):
    client = APIClient()

    with mock.patch('apps.core.tasks.send_mail', side_effect=Exception('SMTP connection error')):
        response = client.post('/api/v1/auth/login/', {
            'email': 'validuser@example.com',
            'password': 'TestPassword123!'
        }, format='json')

        assert response.status_code == status.HTTP_200_OK
        assert 'access' in response.data
