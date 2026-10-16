import pytest


@pytest.fixture(autouse=True)
def _plain_http_test_client(settings):
    """The Django test client speaks plain HTTP; production redirects HTTP -> HTTPS by default."""
    settings.SECURE_SSL_REDIRECT = False


@pytest.fixture(autouse=True)
def _celery_eager(settings):
    """Run Celery tasks inline.

    Without this, anything that registers a user queues the welcome email,
    .delay() tries to reach Redis, and the broker retries 20 times before
    giving up - adding minutes to the suite and flooding the log.
    """
    settings.CELERY_TASK_ALWAYS_EAGER = True
    settings.CELERY_TASK_EAGER_PROPAGATES = False
    settings.CELERY_BROKER_URL = 'memory://'


@pytest.fixture(autouse=True)
def _fast_password_hashing(settings):
    """PBKDF2 runs ~600k iterations per hash; every created user paid for it."""
    settings.PASSWORD_HASHERS = ['django.contrib.auth.hashers.MD5PasswordHasher']
