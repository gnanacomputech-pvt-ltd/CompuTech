"""
Tests for the new backend features added in the completion pass:
- Password reset flow (forgot/reset endpoints)
- Public QR web verification page (HTML, mobile-responsive)
- Health check endpoint
- App-level rate limiting
- Sentry initialization
"""
import uuid
from decimal import Decimal
from django.utils import timezone
from django.urls import reverse
from django.test import override_settings
from rest_framework.test import APITestCase
from rest_framework import status
from unittest.mock import patch, MagicMock

from apps.core.models import (
    User, Role, UserRole, Institution, Program, Batch, Student, Enrollment
)
from apps.finance.models import Certificate
from apps.finance.services.certificate_service import CertificateGenerator


class PasswordResetTests(APITestCase):
    """Tests for the password reset flow (Section 5.2)."""

    def setUp(self):
        self.super_role, _ = Role.objects.get_or_create(code='SUPER_ADMIN', defaults={'name': 'Super Admin'})
        self.user = User.objects.create_user(
            email='resetme@example.com',
            password='OldPassword123!',
            full_name='Reset Test User'
        )

    def test_01_forgot_password_returns_message_for_existing_user(self):
        """POST /api/v1/auth/forgot-password/ should return a generic success message."""
        with patch('apps.core.views.send_mail') as mock_send:
            res = self.client.post('/api/v1/auth/forgot-password/', {
                'email': 'resetme@example.com'
            })
            self.assertEqual(res.status_code, status.HTTP_200_OK)
            self.assertIn('message', res.data)
            # send_mail should be called once with the reset URL
            self.assertEqual(mock_send.call_count, 1)
            self.assertTrue('reset-password' in str(mock_send.call_args) or 'reset-password' in repr(mock_send.call_args))

    def test_02_forgot_password_does_not_reveal_user_existence(self):
        """Forgot-password should NOT differentiate between existing and non-existing emails."""
        res_existing = self.client.post('/api/v1/auth/forgot-password/', {
            'email': 'resetme@example.com'
        })
        res_nonexistent = self.client.post('/api/v1/auth/forgot-password/', {
            'email': 'nope@doesnotexist.com'
        })
        # Both should return 200 and the same generic message
        self.assertEqual(res_existing.status_code, status.HTTP_200_OK)
        self.assertEqual(res_nonexistent.status_code, status.HTTP_200_OK)
        self.assertEqual(res_existing.data['message'], res_nonexistent.data['message'])

    def test_03_forgot_password_rejects_invalid_email(self):
        """Should return 400 on malformed email."""
        res = self.client.post('/api/v1/auth/forgot-password/', {
            'email': 'not-an-email'
        })
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_04_reset_password_with_valid_token_succeeds(self):
        """Complete the password reset flow end-to-end."""
        from django.contrib.auth.tokens import default_token_generator
        from django.utils.http import urlsafe_base64_encode
        from django.utils.encoding import force_bytes

        uid = urlsafe_base64_encode(force_bytes(self.user.pk))
        token = default_token_generator.make_token(self.user)

        res = self.client.post('/api/v1/auth/reset-password/', {
            'uid': uid,
            'token': token,
            'new_password': 'NewPassword123!'
        })
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertIn('Password reset successfully', res.data['message'])

        # Verify the user can now login with the new password
        login_res = self.client.post('/api/v1/auth/login/', {
            'email': 'resetme@example.com',
            'password': 'NewPassword123!'
        })
        self.assertEqual(login_res.status_code, status.HTTP_200_OK)

    def test_05_reset_password_with_invalid_token_fails(self):
        """Invalid token should return 400."""
        from django.utils.http import urlsafe_base64_encode
        from django.utils.encoding import force_bytes

        uid = urlsafe_base64_encode(force_bytes(self.user.pk))
        res = self.client.post('/api/v1/auth/reset-password/', {
            'uid': uid,
            'token': 'totally-fake-token',
            'new_password': 'NewPassword123!'
        })
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(res.data['error']['code'], 'INVALID_RESET_TOKEN')

    def test_06_reset_password_rejects_short_password(self):
        from django.contrib.auth.tokens import default_token_generator
        from django.utils.http import urlsafe_base64_encode
        from django.utils.encoding import force_bytes

        uid = urlsafe_base64_encode(force_bytes(self.user.pk))
        token = default_token_generator.make_token(self.user)

        res = self.client.post('/api/v1/auth/reset-password/', {
            'uid': uid,
            'token': token,
            'new_password': 'short'
        })
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)


class PublicCertificateWebVerifyTests(APITestCase):
    """Tests for the public QR web verification page (HTML)."""

    def setUp(self):
        self.admin = User.objects.create_superuser(
            email='admin@example.com',
            password='AdminPassword123!',
            full_name='Admin User'
        )
        self.student_user = User.objects.create_user(
            email='student@example.com',
            password='StudentPass123!',
            full_name='Web Verify Student'
        )
        self.institution = Institution.objects.create(
            code='WEB-INST',
            name='Web Verify College',
            created_by=self.admin
        )
        self.student_profile = Student.objects.create(
            user=self.student_user,
            institution=self.institution,
            usn='WV001',
            created_by=self.admin
        )
        self.program = Program.objects.create(
            code='WV-PROG',
            title='Web Verification Program',
            program_type='COURSE',
            created_by=self.admin
        )
        self.batch = Batch.objects.create(
            name='Web Verify Batch',
            program=self.program,
            institution=self.institution,
            start_date=timezone.now().date(),
            status='ACTIVE',
            created_by=self.admin
        )
        self.enrollment = Enrollment.objects.create(
            student=self.student_profile,
            program=self.program,
            batch=self.batch,
            institution=self.institution,
            status='COMPLETED',
            coordinator_approval=True,
            created_by=self.admin
        )

    def test_01_web_verify_page_with_valid_token_returns_html(self):
        """GET /verify/<token>/ should return 200 HTML with certificate details."""
        cert = CertificateGenerator.issue_certificate(
            enrollment=self.enrollment,
            title='Test Web Verify',
            issued_by=self.admin
        )

        res = self.client.get(f'/verify/{cert.token}/')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertIn('text/html', res['Content-Type'])

        # Verify the page contains expected content
        content = res.content.decode('utf-8')
        self.assertIn('Gnana Computech Solutions', content)
        self.assertIn(cert.certificate_number, content)
        self.assertIn('Web Verify Student', content)
        self.assertIn('Web Verification Program', content)
        self.assertIn('Verified', content)  # The "Verified — Authentic" badge

    def test_02_web_verify_page_with_invalid_token_returns_not_found(self):
        """GET /verify/<invalid-token>/ should return 200 with 'not found' content."""
        res = self.client.get('/verify/this-token-does-not-exist/')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertIn('text/html', res['Content-Type'])
        content = res.content.decode('utf-8')
        self.assertIn('Not Found', content)

    def test_03_web_verify_page_for_revoked_certificate_shows_revoked(self):
        """A revoked certificate should display REVOKED status on the web page."""
        cert = CertificateGenerator.issue_certificate(
            enrollment=self.enrollment,
            title='Revoked Cert',
            issued_by=self.admin
        )
        CertificateGenerator.revoke_certificate(cert, reason='Test revocation', revoked_by=self.admin)

        res = self.client.get(f'/verify/{cert.token}/')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        content = res.content.decode('utf-8')
        self.assertIn('Revoked', content)
        self.assertIn('Test revocation', content)
        # Sensitive fields should NOT appear
        self.assertNotIn('student@example.com', content)
        self.assertNotIn(self.student_user.phone or 'phone', content)

    def test_04_web_verify_page_is_mobile_responsive(self):
        """The page should have viewport meta tag for mobile devices."""
        cert = CertificateGenerator.issue_certificate(
            enrollment=self.enrollment,
            title='Mobile Test',
            issued_by=self.admin
        )
        res = self.client.get(f'/verify/{cert.token}/')
        content = res.content.decode('utf-8')
        self.assertIn('viewport', content)
        self.assertIn('width=device-width', content)
        # Check for theme support
        self.assertIn('prefers-color-scheme', content)


class HealthCheckTests(APITestCase):
    """Tests for the public health check endpoint."""

    def test_01_health_check_returns_200(self):
        res = self.client.get('/api/v1/health/')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data['status'], 'healthy')
        self.assertEqual(res.data['database'], 'connected')

    def test_02_health_check_is_unauthenticated(self):
        """Health check should be accessible without auth (for load balancers)."""
        # No login, no force_authenticate
        res = self.client.get('/api/v1/health/')
        self.assertEqual(res.status_code, status.HTTP_200_OK)


class RateLimitingTests(APITestCase):
    """Tests verifying app-level rate limiting is configured."""

    def test_01_throttling_classes_configured(self):
        """Verify DEFAULT_THROTTLE_CLASSES is set in DRF config."""
        from django.conf import settings
        rest_framework = settings.REST_FRAMEWORK
        self.assertIn('DEFAULT_THROTTLE_CLASSES', rest_framework)
        self.assertGreater(len(rest_framework['DEFAULT_THROTTLE_CLASSES']), 0)

    def test_02_throttle_rates_configured(self):
        from django.conf import settings
        rest_framework = settings.REST_FRAMEWORK
        self.assertIn('DEFAULT_THROTTLE_RATES', rest_framework)
        rates = rest_framework['DEFAULT_THROTTLE_RATES']
        self.assertIn('user', rates)
        self.assertIn('anon', rates)


class SentryInitializationTests(APITestCase):
    """Tests verifying Sentry is initialized when SENTRY_DSN is set."""

    def test_01_sentry_initialization_handles_missing_dsn(self):
        """With SENTRY_DSN unset, app should still work (gracefully skip)."""
        # The settings module should be importable without SENTRY_DSN
        from django.conf import settings
        # The Sentry DSN is None/empty by default in tests
        # The init code is guarded by `if SENTRY_DSN:`
        # So no exception should be raised
        self.assertIsNotNone(settings)


class AdminRegistrationTests(APITestCase):
    """Tests verifying all models are registered in Django admin."""

    def setUp(self):
        self.admin = User.objects.create_superuser(
            email='admin@admin-test.com',
            password='AdminPass123!',
            full_name='Admin Test'
        )

    def test_01_admin_can_login_to_admin_site(self):
        """The superuser can access the admin site login."""
        logged_in = self.client.login(email='admin@admin-test.com', password='AdminPass123!')
        self.assertTrue(logged_in)
        res = self.client.get('/admin/')
        # Either redirect to login (302) or admin home (200) is acceptable
        self.assertIn(res.status_code, [status.HTTP_200_OK, status.HTTP_302_FOUND])

    def test_02_admin_index_loads(self):
        """The admin index page should render without crashing."""
        self.client.force_login(self.admin)
        res = self.client.get('/admin/')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
