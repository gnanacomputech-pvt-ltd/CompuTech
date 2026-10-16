"""Public POST endpoints must work from a browser that also holds an /admin/ session.

DRF's SessionAuthentication calls enforce_csrf() whenever it authenticates a
request from a Django session. The SPA posts JSON with a JWT and no CSRF token,
so while SessionAuthentication was in DEFAULT_AUTHENTICATION_CLASSES, any staff
member who had logged into /admin/ in the same browser got

    CSRF Failed: CSRF token missing.

on signup, the contact form and project registration. Authenticated SPA calls
were never affected, because JWTAuthentication comes first and short-circuits -
session auth is only reached when no token is sent, i.e. on public endpoints.
"""
import pytest
from rest_framework.test import APIClient

from apps.core.models import User


JWT_ONLY = ('rest_framework_simplejwt.authentication.JWTAuthentication',)
JWT_PLUS_SESSION = JWT_ONLY + ('rest_framework.authentication.SessionAuthentication',)

SIGNUP = {
    'email': 'csrf-probe@example.com',
    'password': 'StrongPassw0rd!2026',
    'confirm_password': 'StrongPassw0rd!2026',
    'full_name': 'CSRF Probe',
    'phone': '9876500000',
}


def _set_authenticators(settings, classes):
    settings.REST_FRAMEWORK = {
        **settings.REST_FRAMEWORK,
        'DEFAULT_AUTHENTICATION_CLASSES': classes,
    }


@pytest.fixture
def admin_session_client(db):
    """A CSRF-enforcing client carrying a real Django admin session."""
    admin = User.objects.create_superuser(
        email='csrf-admin@example.com',
        password='StrongPassw0rd!2026',
        full_name='CSRF Admin',
    )
    client = APIClient(enforce_csrf_checks=True)
    client.force_login(admin)
    return client


@pytest.mark.django_db
def test_signup_works_while_logged_into_admin(settings, admin_session_client):
    """The reported bug: signup from a browser with an admin session."""
    _set_authenticators(settings, JWT_ONLY)

    response = admin_session_client.post('/api/v1/auth/register/', SIGNUP, format='json')

    assert response.status_code == 201, response.data
    assert User.objects.filter(email='csrf-probe@example.com').exists()


@pytest.mark.django_db
def test_anonymous_signup_is_unaffected(settings):
    """The ordinary case - no session, no cookies - keeps working."""
    _set_authenticators(settings, JWT_ONLY)

    response = APIClient(enforce_csrf_checks=True).post(
        '/api/v1/auth/register/', SIGNUP, format='json',
    )

    assert response.status_code == 201, response.data


@pytest.mark.django_db
def test_production_settings_exclude_session_authentication():
    """settings.py must not ship SessionAuthentication when DEBUG is off."""
    import os
    import importlib.util

    spec = importlib.util.find_spec('config.settings')
    source = open(spec.origin, encoding='utf-8').read()
    assert "if DEBUG else ()" in source, (
        'SessionAuthentication is expected to be gated on DEBUG in '
        'DEFAULT_AUTHENTICATION_CLASSES'
    )
    assert os.path.exists(spec.origin)
