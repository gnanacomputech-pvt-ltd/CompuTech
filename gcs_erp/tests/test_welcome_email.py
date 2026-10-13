"""Welcome email sent when a student registers at /signup.

The behaviour that matters most here is the negative one: registration must
succeed even when the email system is completely broken. An account is worth
more than a notification about it.
"""
import pytest
from unittest import mock

from django.core import mail
from rest_framework.test import APIClient

from apps.core.models import User
from apps.core.tasks import queue_welcome_email, send_welcome_email


REGISTRATION = {
    'email': 'newstudent@example.com',
    'password': 'StrongPassw0rd!2026',
    'confirm_password': 'StrongPassw0rd!2026',
    'full_name': 'New Student',
    'phone': '9876543210',
}


@pytest.fixture(autouse=True)
def _eager_celery(settings):
    """Run Celery tasks inline so tests don't need a broker."""
    settings.CELERY_TASK_ALWAYS_EAGER = True
    settings.FRONTEND_URL = 'http://13.232.187.23'
    mail.outbox = []


@pytest.mark.django_db
def test_registration_sends_welcome_email():
    response = APIClient().post('/api/v1/auth/register/', REGISTRATION, format='json')
    assert response.status_code == 201

    assert len(mail.outbox) == 1
    message = mail.outbox[0]
    assert message.to == ['newstudent@example.com']
    assert 'Welcome' in message.subject
    assert 'New Student' in message.body
    # The portal link must point at the configured frontend, not localhost
    assert 'http://13.232.187.23/login' in message.body


@pytest.mark.django_db
def test_welcome_email_has_html_alternative():
    APIClient().post('/api/v1/auth/register/', REGISTRATION, format='json')

    html, content_type = mail.outbox[0].alternatives[0]
    assert content_type == 'text/html'
    assert 'Welcome, New Student' in html
    assert 'http://13.232.187.23/login' in html


@pytest.mark.django_db
def test_registration_succeeds_when_email_sending_fails():
    """A dead SMTP/SES host must not cost the user their account."""
    with mock.patch('apps.core.tasks.send_mail', side_effect=OSError('SMTP unreachable')):
        response = APIClient().post('/api/v1/auth/register/', REGISTRATION, format='json')

    assert response.status_code == 201
    assert User.objects.filter(email='newstudent@example.com').exists()
    assert mail.outbox == []


@pytest.mark.django_db
def test_registration_succeeds_when_celery_broker_is_down():
    """With no broker reachable, the email falls back to an inline send."""
    with mock.patch.object(send_welcome_email, 'delay', side_effect=OSError('broker down')):
        response = APIClient().post('/api/v1/auth/register/', REGISTRATION, format='json')

    assert response.status_code == 201
    # Still delivered, just synchronously
    assert len(mail.outbox) == 1
    assert mail.outbox[0].to == ['newstudent@example.com']


@pytest.mark.django_db
def test_queue_returns_failed_rather_than_raising():
    """Both paths broken: the helper reports failure instead of propagating."""
    user = User.objects.create_user(
        email='x@example.com', password='StrongPassw0rd!2026', full_name='X',
    )
    with mock.patch.object(send_welcome_email, 'delay', side_effect=OSError('broker down')), \
            mock.patch('apps.core.tasks.send_mail', side_effect=OSError('smtp down')):
        assert queue_welcome_email(user) == 'failed'


@pytest.mark.django_db
def test_task_handles_deleted_user():
    """A user removed between enqueue and execution is a no-op, not a crash."""
    result = send_welcome_email.apply(args=['00000000-0000-0000-0000-000000000000']).get()
    assert result['sent'] is False
    assert result['reason'] == 'user_not_found'
    assert mail.outbox == []
